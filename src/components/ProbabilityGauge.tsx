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
  const heights = { sm: "h-1.5", md: "h-2", lg: "h-2.5" };
  const h = heights[size];

  const getGradient = (v: number, customColor?: string) => {
    if (customColor) {
      return `linear-gradient(90deg, ${customColor}cc, ${customColor})`;
    }
    if (v >= 70) return "linear-gradient(90deg, hsl(0 84% 60%), hsl(10 90% 63%))";
    if (v >= 40) return "linear-gradient(90deg, hsl(43 96% 56%), hsl(36 100% 58%))";
    return "linear-gradient(90deg, hsl(142 71% 45%), hsl(142 71% 52%))";
  };

  const getTextColor = (v: number, customColor?: string) => {
    if (customColor) return customColor;
    if (v >= 70) return "hsl(0 84% 60%)";
    return "hsl(43 96% 56%)";
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Aggregate probability
          </span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: getTextColor(value, color) }}
          >
            {value}%
          </span>
        </div>
      )}
      <div
        className={`w-full ${h} rounded-full overflow-hidden bg-muted`}
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
