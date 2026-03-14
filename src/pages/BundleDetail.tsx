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
  CATEGORY_CONFIG,
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
          <p className="text-muted-foreground mb-4">Bundle not found</p>
          <Link to="/" className="text-primary font-medium text-sm hover:underline">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const avgProb = getAvgProbability(bundle);
  const totalLiq = getTotalLiquidity(bundle);
  const totalVol = getTotalVolume(bundle);
  const riskConfig = RISK_LEVEL_CONFIG[bundle.riskLevel];
  const catConfig = CATEGORY_CONFIG[bundle.category] ?? CATEGORY_CONFIG["MACRO"];
  const CatIcon = catConfig.Icon;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column — 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bundle Header card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl shadow-card border border-border/60 overflow-hidden"
            >
              {/* Gradient top strip */}
              <div
                className="h-[100px] flex items-end px-8 pb-5 relative overflow-hidden"
                style={{ background: catConfig.gradient }}
              >
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />
                <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center relative z-10">
                  <CatIcon className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="px-8 py-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold" style={{ color: bundle.categoryColor }}>
                    {catConfig.label}
                  </span>
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                      color: riskConfig.color,
                      backgroundColor: `${riskConfig.color}15`,
                    }}
                  >
                    {riskConfig.label}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">
                  {bundle.title}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mb-5">
                  {bundle.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {bundle.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Aggregate Stats Strip */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { label: "Avg Probability", value: `${avgProb}%`, color: "text-primary" },
                { label: "Total Liquidity", value: formatMillions(totalLiq), color: "text-foreground" },
                { label: "Total Volume", value: formatMillions(totalVol), color: "text-foreground" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card rounded-2xl p-5 shadow-card border border-border/60"
                >
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Contracts */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  Included Contracts
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({bundle.contracts.length})
                </span>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3"
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
              className="flex gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/15"
            >
              <Info className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Simulated platform — This is a prototype. Probabilities are sourced
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
              className="bg-card rounded-2xl p-5 shadow-card border border-border/60 space-y-4"
            >
              <h3 className="text-sm font-semibold text-foreground">Bundle Info</h3>
              <div className="space-y-3">
                {[
                  { label: "Markets", value: bundle.contracts.length },
                  { label: "Category", value: bundle.category },
                  { label: "Risk Level", value: bundle.riskLevel },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium text-foreground">{value}</span>
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
