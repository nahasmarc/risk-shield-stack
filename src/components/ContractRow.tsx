import { motion } from "framer-motion";
import { Contract, formatMillions } from "@/data/bundles";

interface ContractRowProps {
  contract: Contract;
  index?: number;
}

export function ContractRow({ contract, index = 0 }: ContractRowProps) {
  const getBarColor = (p: number) => {
    if (p >= 60) return "hsl(0 84% 60%)";
    if (p >= 35) return "hsl(221 83% 53%)";
    return "hsl(142 71% 45%)";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group bg-card rounded-xl p-4 border border-border/60 hover:border-primary/20 hover:shadow-card transition-all duration-200"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground mb-1 block">
            {contract.category}
          </span>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {contract.title}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-xl font-bold tabular-nums" style={{ color: getBarColor(contract.probability) }}>
            {contract.probability}%
          </span>
          <p className="text-xs text-muted-foreground">probability</p>
        </div>
      </div>

      {/* Probability bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-1.5 rounded-full"
          style={{ backgroundColor: getBarColor(contract.probability) }}
          initial={{ width: 0 }}
          animate={{ width: `${contract.probability}%` }}
          transition={{
            delay: index * 0.06 + 0.2,
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Liquidity:{" "}
          <span className="font-medium text-foreground">
            {formatMillions(contract.liquidity)}
          </span>
        </span>
        <span className="text-border">·</span>
        <span>
          Volume:{" "}
          <span className="font-medium text-foreground">
            {formatMillions(contract.volume)}
          </span>
        </span>
        <span className="text-border">·</span>
        <span
          className={`font-semibold ${
            contract.direction === "YES"
              ? "text-primary"
              : "text-destructive"
          }`}
        >
          {contract.direction}
        </span>
      </div>
    </motion.div>
  );
}
