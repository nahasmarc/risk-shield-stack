import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HedgeBundle,
  calculateHedgeCost,
  getAvgProbability,
  getTotalLiquidity,
  getTotalVolume,
  formatMillions,
} from "@/data/bundles";
import { CheckCircle2 } from "lucide-react";

interface CoverageCalculatorProps {
  bundle: HedgeBundle;
}

export function CoverageCalculator({ bundle }: CoverageCalculatorProps) {
  const [coverage, setCoverage] = useState<string>("10000");
  const [executed, setExecuted] = useState(false);

  const coverageNum = parseFloat(coverage.replace(/,/g, "")) || 0;
  const cost = calculateHedgeCost(bundle, coverageNum);
  const avgProb = getAvgProbability(bundle);
  const totalLiq = getTotalLiquidity(bundle);
  const totalVol = getTotalVolume(bundle);

  const handleExecute = () => {
    setExecuted(true);
    setTimeout(() => setExecuted(false), 3000);
  };

  return (
    <div
      className="bg-card rounded-2xl p-6 space-y-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)" }}
    >
      <div>
        <h3 className="text-base font-semibold text-foreground mb-0.5">
          Coverage Calculator
        </h3>
        <p className="text-sm text-muted-foreground">
          Simulate your hedge position
        </p>
      </div>

      {/* Coverage Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Coverage Amount (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
            $
          </span>
          <Input
            type="number"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            className="pl-7 rounded-xl border-border bg-background focus-visible:ring-primary/30 text-sm"
            placeholder="10000"
          />
        </div>
      </div>

      {/* Cost Display */}
      <div className="space-y-3 py-4 border-y border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Cost to hedge</span>
          <span className="text-2xl font-bold text-primary">
            ${cost.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Avg probability</span>
          <span className="text-sm font-semibold" style={{ color: "hsl(38 90% 45%)" }}>{avgProb}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Potential return</span>
          <span className="text-sm font-semibold text-foreground">
            ${coverageNum.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/60 rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Liquidity</p>
          <p className="text-sm font-semibold text-foreground">
            {formatMillions(totalLiq)}
          </p>
        </div>
        <div className="bg-muted/60 rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Volume</p>
          <p className="text-sm font-semibold text-foreground">
            {formatMillions(totalVol)}
          </p>
        </div>
      </div>

      {/* Execute Button */}
      <Button
        className="w-full rounded-full text-sm font-semibold py-5"
        style={{
          background: executed
            ? "hsl(142 60% 38%)"
            : "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 48%))",
          boxShadow: executed ? "none" : "0 4px 16px hsl(var(--primary) / 0.25)",
        }}
        onClick={handleExecute}
        disabled={executed || coverageNum <= 0}
      >
        {executed ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Hedge Executed!
          </motion.div>
        ) : (
          "Execute Hedge →"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Simulated · Not financial advice
      </p>
    </div>
  );
}
