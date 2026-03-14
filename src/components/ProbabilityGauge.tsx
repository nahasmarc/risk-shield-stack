import { motion } from "framer-motion";

interface ProbabilityGaugeProps {
  value: number; // 0–100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProbabilityGauge({
  value,
  showLabel = true,
  size = "md",
  className = "",
}: ProbabilityGaugeProps) {
  const heights = { sm: "h-0.5", md: "h-1", lg: "h-1.5" };
  const h = heights[size];

  const getColor = (v: number) => {
    if (v >= 70) return "hsl(0 84% 60%)";
    if (v >= 40) return "hsl(43 96% 56%)";
    return "hsl(43 96% 56%)";
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            AGGREGATE PROBABILITY
          </span>
          <span className="text-[10px] font-mono text-accent font-semibold">
            {value}%
          </span>
        </div>
      )}
      <div className={`w-full ${h} bg-accent/10 rounded-full overflow-hidden`}>
        <motion.div
          className={`${h} rounded-full`}
          style={{ backgroundColor: getColor(value) }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
