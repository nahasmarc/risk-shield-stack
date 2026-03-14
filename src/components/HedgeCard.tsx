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
      whileHover={{ y: -6 }}
      className="group h-full"
    >
      <Link to={`/bundle/${bundle.id}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
        <div
          className="h-full bg-card rounded-2xl overflow-hidden flex flex-col transition-all duration-300 cursor-pointer"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.08), 0 24px 56px ${bundle.categoryColor}18`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)";
          }}
        >
          {/* Gradient header */}
          <div
            className="h-[88px] flex items-end px-6 pb-4 flex-shrink-0 relative overflow-hidden"
            style={{ background: catConfig.gradient }}
          >
            {/* Subtle pattern overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 80% 20%, white 0%, transparent 50%)`,
              }}
            />
            {/* Icon badge */}
            <div className="w-10 h-10 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center relative z-10">
              <CatIcon className="w-5 h-5 text-white" />
            </div>
            {/* Risk pill */}
            <span
              className="ml-auto text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm relative z-10"
            >
              {riskConfig.label}
            </span>
          </div>

          {/* Card body */}
          <div className="px-6 py-5 flex flex-col gap-4 flex-1">
            {/* Category label */}
            <span className="text-xs font-semibold" style={{ color: bundle.categoryColor }}>
              {catConfig.label}
            </span>

            {/* Title & Description */}
            <div className="flex-1">
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
              color={bundle.categoryColor}
            />

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
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
