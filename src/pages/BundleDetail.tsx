import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Info } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { ContractRow } from "@/components/ContractRow";
import { CoverageCalculator } from "@/components/CoverageCalculator";
import {
  getBundleById,
  getAvgProbability,
  getTotalLiquidity,
  getTotalVolume,
  formatMillions,
  RISK_LEVEL_CONFIG,
} from "@/data/bundles";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const BundleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const bundle = getBundleById(id || "");

  if (!bundle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-muted-foreground mb-4">BUNDLE NOT FOUND</p>
          <Link to="/" className="text-primary font-mono text-sm hover:underline">
            ← RETURN TO DASHBOARD
          </Link>
        </div>
      </div>
    );
  }

  const avgProb = getAvgProbability(bundle);
  const totalLiq = getTotalLiquidity(bundle);
  const totalVol = getTotalVolume(bundle);
  const riskConfig = RISK_LEVEL_CONFIG[bundle.riskLevel];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <ArrowLeft className="w-3 h-3" />
            BACK TO DASHBOARD
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column — 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bundle Header */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{bundle.icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] font-mono tracking-widest uppercase font-semibold"
                      style={{ color: bundle.categoryColor }}
                    >
                      {bundle.category}
                    </span>
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
                  <h1 className="text-2xl font-bold text-foreground">
                    {bundle.title}
                  </h1>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                {bundle.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {bundle.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-sm bg-muted/50 border border-border/50 text-muted-foreground/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Aggregate Stats Strip */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { label: "AVG PROB", value: `${avgProb}%`, color: "text-accent" },
                { label: "TOTAL LIQUIDITY", value: formatMillions(totalLiq), color: "text-foreground" },
                { label: "TOTAL VOLUME", value: formatMillions(totalVol), color: "text-foreground" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-card rounded-sm p-3"
                >
                  <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className={`font-mono text-lg font-semibold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Contracts */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                  INCLUDED CONTRACTS
                </h2>
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  ({bundle.contracts.length})
                </span>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {bundle.contracts.map((contract, i) => (
                  <ContractRow key={contract.id} contract={contract} index={i} />
                ))}
              </motion.div>
            </div>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-2.5 p-4 rounded-sm border border-border/40 bg-muted/20"
            >
              <Info className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground/40 font-mono leading-relaxed">
                SIMULATED PLATFORM — This is a prototype. Probabilities are sourced
                from Polymarket mock data. No real financial transactions occur.
                Not financial advice.
              </p>
            </motion.div>
          </div>

          {/* Right Column — 1/3 */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <CoverageCalculator bundle={bundle} />
            </motion.div>

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-sm p-4 space-y-3"
            >
              <h3 className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                BUNDLE INFO
              </h3>
              <div className="space-y-2">
                {[
                  { label: "MARKETS", value: bundle.contracts.length },
                  { label: "CATEGORY", value: bundle.category },
                  { label: "RISK LEVEL", value: bundle.riskLevel },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
                      {label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleDetailPage;
