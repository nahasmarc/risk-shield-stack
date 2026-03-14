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
      className="group h-full"
    >
      <Link to={`/bundle/${bundle.id}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
        <div
          className="h-full bg-card rounded-2xl flex flex-col transition-all duration-300 cursor-pointer overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)";
          }}
        >
          {/* Thin top accent bar */}
          <div
            className="h-1 w-full flex-shrink-0"
            style={{ backgroundColor: catConfig.accentHex }}
          />

          {/* Card body */}
          <div className="px-6 py-5 flex flex-col gap-4 flex-1">
            {/* Icon badge + Risk pill row */}
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: catConfig.pastel }}
              >
                <CatIcon className="w-5 h-5" style={{ color: catConfig.color }} />
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: riskConfig.color, backgroundColor: riskConfig.bg }}
              >
                {riskConfig.label}
              </span>
            </div>

            {/* Category label */}
            <span className="text-xs font-semibold" style={{ color: catConfig.color }}>
              {catConfig.label}
            </span>

            {/* Title & Description */}
            <div className="flex-1 -mt-2">
              <h3 className="text-base font-semibold text-foreground mb-1.5 leading-snug group-hover:text-primary transition-colors duration-200">
                {bundle.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {bundle.description}
              </p>
            </div>

            {/* Probability Gauge */}
            <ProbabilityGauge
              value={avgProb}
              size="md"
              color={catConfig.accentHex}
            />

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{bundle.contracts.length} markets</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-1.5 transition-all duration-200">
                View Bundle
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
