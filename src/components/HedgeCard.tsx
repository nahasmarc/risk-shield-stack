import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { HedgeBundle, getAvgProbability, RISK_LEVEL_CONFIG, CATEGORY_CONFIG } from "@/data/bundles";
import { ProbabilityGauge } from "@/components/ProbabilityGauge";

interface HedgeCardProps {
  bundle: HedgeBundle;
  index?: number;
}

export function HedgeCard({ bundle, index = 0 }: HedgeCardProps) {
  const avgProb = getAvgProbability(bundle);
  const riskConfig = RISK_LEVEL_CONFIG[bundle.riskLevel];
  const catConfig = CATEGORY_CONFIG[bundle.category] ?? CATEGORY_CONFIG["MACRO"];
  const CatIcon = catConfig.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4 }}
      className="group h-full glow-card"
    >
      <Link to={`/bundle/${bundle.id}`} className="block h-full focus:outline-none">
        <div
          className="h-full glass-card rounded-sm flex flex-col gap-4 overflow-hidden transition-all duration-300 cursor-pointer hover:border-opacity-60"
          style={
            {
              "--hover-glow": `${bundle.categoryColor}28`,
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${bundle.categoryColor}28, 0 0 0 1px ${bundle.categoryColor}22`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "";
          }}
        >
          {/* Category color top strip */}
          <div
            className="h-0.5 w-full flex-shrink-0"
            style={{ background: catConfig.gradient }}
          />

          <div className="px-5 pb-5 flex flex-col gap-4 flex-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {/* Category icon badge */}
                <div
                  className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${bundle.categoryColor}18`,
                    border: `1px solid ${bundle.categoryColor}30`,
                  }}
                >
                  <CatIcon
                    className="w-4 h-4"
                    style={{ color: bundle.categoryColor }}
                  />
                </div>
                <div>
                  <span
                    className="text-[9px] font-mono tracking-widest uppercase font-semibold"
                    style={{ color: bundle.categoryColor }}
                  >
                    {catConfig.label}
                  </span>
                </div>
              </div>
              {/* Risk pill */}
              <span
                className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-sm border flex-shrink-0"
                style={{
                  color: riskConfig.color,
                  borderColor: `${riskConfig.color}35`,
                  backgroundColor: `${riskConfig.color}12`,
                }}
              >
                {riskConfig.label}
              </span>
            </div>

            {/* Title & Description */}
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors duration-200">
                {bundle.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {bundle.description}
              </p>
            </div>

            {/* Probability Gauge */}
            <div>
              <ProbabilityGauge
                value={avgProb}
                size="md"
                color={bundle.categoryColor}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-muted-foreground/60">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px] font-mono tracking-widest uppercase">
                  {bundle.contracts.length} MARKETS
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono tracking-wider text-muted-foreground group-hover:text-primary transition-colors duration-200">
                VIEW BUNDLE{" "}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
