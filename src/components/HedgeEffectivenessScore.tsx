import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { GitBranch, Droplets, LayoutGrid } from "lucide-react";
import { type HedgeBundle, calculateEffectivenessScore } from "@/data/bundles";

/* ─── helpers ─── */
const CIRCUMFERENCE = 2 * Math.PI * 48; // r = 48

function getScoreColor(score: number): string {
  if (score >= 75) return "hsl(142 60% 38%)";
  if (score >= 55) return "hsl(38 90% 45%)";
  return "hsl(0 72% 51%)";
}
function getScoreBg(score: number): string {
  if (score >= 75) return "hsl(142 77% 93%)";
  if (score >= 55) return "hsl(38 97% 92%)";
  return "hsl(0 93% 95%)";
}
function getScoreLabel(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 55) return "Moderate";
  return "Partial";
}

/* ─── animated bar ─── */
function AnimatedBar({ value, color }: { value: number; color: string }) {
  const motionWidth = useMotionValue(0);
  const width = useTransform(motionWidth, (v) => `${v}%`);

  useEffect(() => {
    const ctrl = animate(motionWidth, value, {
      duration: 1.2,
      delay: 0.3,
      ease: [0.16, 1, 0.3, 1],
    });
    return ctrl.stop;
  }, [value, motionWidth]);

  return (
    <div className="relative h-2 w-full rounded-full overflow-hidden bg-secondary">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width, backgroundColor: color }}
      />
    </div>
  );
}

/* ─── animated ring ─── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const motionScore = useMotionValue(0);
  const dashOffset = useTransform(
    motionScore,
    (v) => CIRCUMFERENCE - (v / 100) * CIRCUMFERENCE
  );
  const displayScore = useRef<SVGTextElement>(null);

  useEffect(() => {
    const ctrl = animate(motionScore, score, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        if (displayScore.current) {
          displayScore.current.textContent = String(Math.round(v));
        }
      },
    });
    return ctrl.stop;
  }, [score, motionScore]);

  return (
    <svg viewBox="0 0 120 120" width={110} height={110} className="mx-auto">
      {/* track */}
      <circle
        cx={60}
        cy={60}
        r={48}
        fill="none"
        stroke="hsl(var(--secondary))"
        strokeWidth={10}
      />
      {/* progress arc */}
      <motion.circle
        cx={60}
        cy={60}
        r={48}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        style={{ strokeDashoffset: dashOffset }}
        transform="rotate(-90 60 60)"
      />
      {/* score number */}
      <text
        ref={displayScore}
        x={60}
        y={55}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={26}
        fontWeight={700}
        fill="currentColor"
        className="fill-foreground font-bold"
      >
        0
      </text>
      {/* /100 */}
      <text
        x={60}
        y={73}
        textAnchor="middle"
        fontSize={11}
        fill="currentColor"
        className="fill-muted-foreground"
      >
        / 100
      </text>
    </svg>
  );
}

/* ─── sub-indicator row ─── */
interface IndicatorRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number;
  color: string;
}
function IndicatorRow({ icon, label, description, value, color }: IndicatorRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ color }}
        >
          {value}%
        </span>
      </div>
      <AnimatedBar value={value} color={color} />
      <p className="text-[10px] text-muted-foreground leading-snug">{description}</p>
    </div>
  );
}

/* ─── main component ─── */
interface Props {
  bundle: HedgeBundle;
}

export function HedgeEffectivenessScore({ bundle }: Props) {
  const { score, correlation, liquidity, scenario } = calculateEffectivenessScore(bundle);
  const color = getScoreColor(score);
  const bgColor = getScoreBg(score);
  const label = getScoreLabel(score);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="bg-card rounded-2xl p-5 space-y-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)" }}
    >
      {/* header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Hedge Effectiveness</h3>
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ color, backgroundColor: bgColor }}
        >
          {label}
        </span>
      </div>

      {/* ring + label */}
      <div className="flex flex-col items-center gap-2">
        <ScoreRing score={score} color={color} />
        <p className="text-xs font-medium text-muted-foreground">Coverage Score</p>
      </div>

      {/* divider */}
      <div className="h-px bg-border" />

      {/* three indicators */}
      <div className="space-y-4">
        <IndicatorRow
          icon={<GitBranch size={12} />}
          label="Correlation Coverage"
          description="Unique risk categories represented across contracts"
          value={correlation}
          color={color}
        />
        <IndicatorRow
          icon={<Droplets size={12} />}
          label="Market Liquidity"
          description="Avg contract liquidity vs $10M benchmark"
          value={liquidity}
          color={color}
        />
        <IndicatorRow
          icon={<LayoutGrid size={12} />}
          label="Scenario Coverage"
          description="Probability spread across hedged scenarios"
          value={scenario}
          color={color}
        />
      </div>
    </motion.div>
  );
}
