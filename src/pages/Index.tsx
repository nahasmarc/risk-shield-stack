import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { HedgeCard } from "@/components/HedgeCard";
import { LiveSignalsPanel } from "@/components/LiveSignalsPanel";
import { HEDGE_BUNDLES, getTotalLiquidity, formatMillions } from "@/data/bundles";
import { Shield, Zap, ArrowRight, Activity } from "lucide-react";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

// Aggregate stats across all bundles
const totalLiquidity = HEDGE_BUNDLES.reduce((acc, b) => acc + getTotalLiquidity(b), 0);
const avgCoverage = Math.round(
  HEDGE_BUNDLES.reduce((acc, b) => {
    const avg = b.contracts.reduce((s, c) => s + c.probability, 0) / b.contracts.length;
    return acc + avg;
  }, 0) / HEDGE_BUNDLES.length
);

const HomePage = () => {
  const now = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Status Bar */}
      <div className="border-b border-border/40" style={{ background: "hsl(232 20% 6% / 0.8)" }}>
        <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
              LAST UPDATED:{" "}
              <span className="text-muted-foreground/70">{now}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest uppercase text-muted-foreground/40">
              <Activity className="w-2.5 h-2.5" />
              POLYMARKET FEED
            </div>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-accent">
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse-amber" />
              LIVE DATA SIMULATION
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10 mesh-hero">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-5 h-5 rounded-sm bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Shield className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              RISK HEDGING PLATFORM
            </span>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight tracking-tight">
            Hedge real-world risks with
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, hsl(var(--primary)), hsl(271 76% 65%))" }}
            >
              prediction market bundles
            </span>
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-7">
            Pre-built portfolios of Polymarket contracts that together represent
            meaningful exposure to a specific event risk. One click. Complete coverage.
          </p>

          <div className="flex items-center gap-3">
            <Link
              to="/builder"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-semibold text-primary-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(211 100% 45%))",
                boxShadow: "0 4px 20px hsl(var(--primary) / 0.3)",
              }}
            >
              <Zap className="w-4 h-4" />
              Build a Hedge
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-medium text-foreground border border-border/60 hover:border-border transition-all duration-200 hover:bg-secondary"
            >
              View Bundles
            </Link>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-6 mt-10 pt-8 border-t border-border/30"
        >
          {[
            { label: "Bundles Active", value: `${HEDGE_BUNDLES.length}` },
            { label: "Total Liquidity", value: formatMillions(totalLiquidity) },
            { label: "Avg Coverage", value: `${avgCoverage}%` },
            { label: "Markets Tracked", value: `${HEDGE_BUNDLES.reduce((a, b) => a + b.contracts.length, 0)}` },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-lg font-bold text-foreground tabular-nums leading-none">
                {stat.value}
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Main content + signals sidebar */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex gap-6 items-start">
          {/* Bundle Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                AVAILABLE HEDGE BUNDLES
              </h2>
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/40">
                {HEDGE_BUNDLES.length} BUNDLES
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4"
            >
              {HEDGE_BUNDLES.map((bundle, i) => (
                <HedgeCard key={bundle.id} bundle={bundle} index={i} />
              ))}
            </motion.div>
          </div>

          {/* Live Signals Panel — sticky sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden xl:block w-72 flex-shrink-0 sticky top-[4.5rem]"
          >
            <div className="mb-3">
              <h2 className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                LIVE EVENT SIGNALS
              </h2>
            </div>
            <LiveSignalsPanel />
          </motion.div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/30">
            NETIRA · RISK INTELLIGENCE PLATFORM · v0.1.0
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/30">
            POWERED BY POLYMARKET
          </span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
