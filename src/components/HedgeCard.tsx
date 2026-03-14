import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { HedgeBundle, getAvgProbability, RISK_LEVEL_CONFIG } from "@/data/bundles";
import { ProbabilityGauge } from "@/components/ProbabilityGauge";

interface HedgeCardProps {
  bundle: HedgeBundle;
  index?: number;
}

export function HedgeCard({ bundle, index = 0 }: HedgeCardProps) {
  const avgProb = getAvgProbability(bundle);
  const riskConfig = RISK_LEVEL_CONFIG[bundle.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.07,
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -2 }}
      className="group h-full"
    >
      <Link to={`/bundle/${bundle.id}`} className="block h-full">
        <div className="h-full glass-card rounded-sm p-5 flex flex-col gap-4 hover:border-border/80 transition-all duration-300 cursor-pointer">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl leading-none">{bundle.icon}</span>
              <div>
                <span
                  className="text-[9px] font-mono tracking-widest uppercase font-semibold"
                  style={{ color: bundle.categoryColor }}
                >
                  {bundle.category}
                </span>
              </div>
            </div>
            <span
              className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-sm border"
              style={{
                color: riskConfig.color,
                borderColor: `${riskConfig.color}30`,
                backgroundColor: `${riskConfig.color}10`,
              }}
            >
              {riskConfig.label}
            </span>
          </div>

          {/* Title & Description */}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors duration-200">
              {bundle.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {bundle.description}
            </p>
          </div>

          {/* Probability Gauge */}
          <div>
            <ProbabilityGauge value={avgProb} size="sm" />
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
      </Link>
    </motion.div>
  );
}
