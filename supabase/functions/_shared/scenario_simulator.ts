/**
 * scenario_simulator.ts
 * Simulates event outcomes and calculates potential portfolio payoff
 * for a given hedge bundle and coverage amount.
 */

import { type HedgeBundle, type BundleContract } from "./bundle_engine.ts";

export interface ContractScenario {
  contractId: string;
  contractTitle: string;
  probability: number;
  direction: "YES" | "NO";
  position: number;          // USD allocated to this contract
  yesPayoff: number;         // payoff if YES resolves
  noPayoff: number;          // payoff if NO resolves
  expectedPayoff: number;    // probability-weighted payoff
}

export interface SimulationResult {
  expectedPayoff: number;    // expected $ gain/loss across all contracts
  bestCase: number;          // all YES positions resolve in our favour
  worstCase: number;         // all positions resolve against us
  hedgeCost: number;         // total $ premium paid
  coverageRatio: number;     // expectedPayoff / coverage * 100
  breakEven: number;         // % probability at which hedge breaks even
  scenarios: ContractScenario[];
}

/**
 * Simulates a hedge bundle for a given coverage amount in USD.
 *
 * Position sizing: each contract receives an equal share of the coverage budget.
 * Payoff model:
 *   - YES contract: pays (1 / probability) × position if the event occurs
 *   - NO contract: pays (1 / (1 - probability)) × position if event does NOT occur
 *   - Cost (premium) = position amount
 */
export function simulateBundle(bundle: HedgeBundle, coverage: number): SimulationResult {
  if (!bundle.contracts || bundle.contracts.length === 0) {
    return {
      expectedPayoff: 0,
      bestCase: 0,
      worstCase: -coverage,
      hedgeCost: coverage,
      coverageRatio: 0,
      breakEven: 0,
      scenarios: [],
    };
  }

  const positionPerContract = coverage / bundle.contracts.length;
  const scenarios: ContractScenario[] = [];

  for (const contract of bundle.contracts) {
    const p = Math.max(Math.min(contract.probability / 100, 0.99), 0.01);

    // Premium is the position amount
    const position = positionPerContract;

    let yesPayoff: number;
    let noPayoff: number;

    if (contract.direction === "YES") {
      // We buy YES: payoff if event happens = (1/p - 1) × position
      yesPayoff = ((1 / p) - 1) * position;
      noPayoff = -position; // lose the premium
    } else {
      // We buy NO: payoff if event does NOT happen = (1/(1-p) - 1) × position
      yesPayoff = -position; // lose the premium
      noPayoff = ((1 / (1 - p)) - 1) * position;
    }

    const expectedPayoff = contract.direction === "YES"
      ? p * yesPayoff + (1 - p) * noPayoff
      : (1 - p) * noPayoff + p * yesPayoff;

    scenarios.push({
      contractId: contract.id,
      contractTitle: contract.title,
      probability: contract.probability,
      direction: contract.direction,
      position,
      yesPayoff: Math.round(yesPayoff),
      noPayoff: Math.round(noPayoff),
      expectedPayoff: Math.round(expectedPayoff),
    });
  }

  const expectedPayoff = scenarios.reduce((sum, s) => sum + s.expectedPayoff, 0);

  // Best case: all positions resolve in our favour
  const bestCase = scenarios.reduce((sum, s) =>
    sum + Math.max(s.yesPayoff, s.noPayoff), 0
  );

  // Worst case: all positions resolve against us
  const worstCase = scenarios.reduce((sum, s) =>
    sum + Math.min(s.yesPayoff, s.noPayoff), 0
  );

  const hedgeCost = coverage;
  const coverageRatio = coverage > 0 ? Math.round((expectedPayoff / coverage) * 100) : 0;

  // Break-even: avg probability threshold where expected payoff = 0
  const avgP = bundle.contracts.reduce((s, c) => s + c.probability, 0) / bundle.contracts.length / 100;
  const breakEven = Math.round(avgP * 100);

  return {
    expectedPayoff: Math.round(expectedPayoff),
    bestCase: Math.round(bestCase),
    worstCase: Math.round(worstCase),
    hedgeCost: Math.round(hedgeCost),
    coverageRatio,
    breakEven,
    scenarios,
  };
}
