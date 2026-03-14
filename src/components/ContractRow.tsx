import { motion } from "framer-motion";
import { Contract, formatMillions } from "@/data/bundles";

interface ContractRowProps {
  contract: Contract;
  index?: number;
}

export function ContractRow({ contract, index = 0 }: ContractRowProps) {
  const getBarColor = (p: number) => {
    if (p >= 60) return "hsl(0 84% 60%)";
    if (p >= 35) return "hsl(43 96% 56%)";
    return "hsl(43 96% 56%)";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group rounded-sm border border-border p-4 hover:border-border/80 hover:bg-muted/30 transition-all duration-300"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-1 block">
            {contract.category}
          </span>
          <p className="text-sm font-medium text-foreground leading-snug">
            {contract.title}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-lg font-mono font-semibold text-accent">
            {contract.probability}%
          </span>
          <p className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase">
            PROB
          </p>
        </div>
      </div>

      {/* Probability bar */}
      <div className="w-full h-px bg-accent/10 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-px rounded-full"
          style={{ backgroundColor: getBarColor(contract.probability) }}
          initial={{ width: 0 }}
          animate={{ width: `${contract.probability}%` }}
          transition={{
            delay: index * 0.08 + 0.2,
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
        <span>
          LIQ:{" "}
          <span className="text-muted-foreground">
            {formatMillions(contract.liquidity)}
          </span>
        </span>
        <span className="text-border">|</span>
        <span>
          VOL:{" "}
          <span className="text-muted-foreground">
            {formatMillions(contract.volume)}
          </span>
        </span>
        <span className="text-border">|</span>
        <span
          className={`font-semibold ${
            contract.direction === "YES"
              ? "text-accent"
              : "text-destructive"
          }`}
        >
          {contract.direction}
        </span>
      </div>
    </motion.div>
  );
}
