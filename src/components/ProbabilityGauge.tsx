import { motion } from "framer-motion";

interface ProbabilityGaugeProps {
  value: number; // 0–100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: string; // hsl string for custom category color
}

export function ProbabilityGauge({
  value,
  showLabel = true,
  size = "md",
  className = "",
  color,
}: ProbabilityGaugeProps) {
  const heights = { sm: "h-1", md: "h-1.5", lg: "h-2" };
  const h = heights[size];

  const getGradient = (v: number, customColor?: string) => {
    if (customColor) {
      return `linear-gradient(90deg, ${customColor}, ${customColor}cc)`;
    }
    if (v >= 70) return "linear-gradient(90deg, hsl(0 84% 60%), hsl(10 90% 63%))";
    if (v >= 40) return "linear-gradient(90deg, hsl(43 96% 56%), hsl(36 100% 58%))";
    return "linear-gradient(90deg, hsl(43 96% 56%), hsl(43 96% 65%))";
  };

  const getTextColor = (v: number, customColor?: string) => {
    if (customColor) return customColor;
    if (v >= 70) return "hsl(0 84% 60%)";
    return "hsl(43 96% 56%)";
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            AGGREGATE PROBABILITY
          </span>
          <span
            className="text-[11px] font-mono font-semibold tabular-nums"
            style={{ color: getTextColor(value, color) }}
          >
            {value}%
          </span>
        </div>
      )}
      <div
        className={`w-full ${h} rounded-full overflow-hidden`}
        style={{ background: `${color ? `${color}20` : "hsl(43 96% 56% / 0.12)"}` }}
      >
        <motion.div
          className={`${h} rounded-full`}
          style={{ backgroundImage: getGradient(value, color) }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
