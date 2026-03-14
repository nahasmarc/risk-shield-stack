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
    <div className="glass-card rounded-sm p-5 space-y-5">
      <div>
        <h3 className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1">
          COVERAGE CALCULATOR
        </h3>
        <p className="text-xs text-muted-foreground/60">
          Simulate your hedge position
        </p>
      </div>

      {/* Coverage Input */}
      <div className="space-y-2">
        <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          COVERAGE AMOUNT (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
            $
          </span>
          <Input
            type="number"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            className="pl-7 font-mono bg-background/50 border-border/60 focus:border-primary/50 text-sm"
            placeholder="10000"
          />
        </div>
      </div>

      {/* Cost Display */}
      <div className="space-y-3 py-4 border-y border-border/50">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            COST TO HEDGE
          </span>
          <span className="font-mono text-xl font-semibold text-primary">
            ${cost.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            AVG PROBABILITY
          </span>
          <span className="font-mono text-sm text-accent">{avgProb}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            POTENTIAL RETURN
          </span>
          <span className="font-mono text-sm text-foreground">
            ${coverageNum.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/30 rounded-sm p-3">
          <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground mb-1">
            TOTAL LIQ
          </p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {formatMillions(totalLiq)}
          </p>
        </div>
        <div className="bg-muted/30 rounded-sm p-3">
          <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground mb-1">
            TOTAL VOL
          </p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {formatMillions(totalVol)}
          </p>
        </div>
      </div>

      {/* Execute Button */}
      <Button
        className="w-full font-mono tracking-wider text-sm"
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
            HEDGE EXECUTED
          </motion.div>
        ) : (
          "EXECUTE HEDGE →"
        )}
      </Button>

      <p className="text-[10px] text-muted-foreground/40 text-center font-mono">
        SIMULATED · NOT FINANCIAL ADVICE
      </p>
    </div>
  );
}
