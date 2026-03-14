import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { HedgeCard } from "@/components/HedgeCard";
import { LiveSignalsPanel } from "@/components/LiveSignalsPanel";
import { EventRiskMap } from "@/components/EventRiskMap";
import { HEDGE_BUNDLES, getTotalLiquidity, formatMillions } from "@/data/bundles";
import { Shield, ArrowRight, Search } from "lucide-react";
import { useState } from "react";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const totalLiquidity = HEDGE_BUNDLES.reduce((acc, b) => acc + getTotalLiquidity(b), 0);
const avgCoverage = Math.round(
  HEDGE_BUNDLES.reduce((acc, b) => {
    const avg = b.contracts.reduce((s, c) => s + c.probability, 0) / b.contracts.length;
    return acc + avg;
  }, 0) / HEDGE_BUNDLES.length
);

const HomePage = () => {
  const [heroInput, setHeroInput] = useState("");
  const navigate = useNavigate();

  const handleHeroSubmit = () => {
    if (heroInput.trim()) {
      navigate(`/builder?q=${encodeURIComponent(heroInput.trim())}`);
    } else {
      navigate("/builder");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-6">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Risk Hedging Platform</span>
          </div>

          <h1 className="text-5xl font-bold text-foreground mb-5 leading-tight tracking-tight">
            Hedge Real-World Risks with{" "}
            <span
              className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 40%))",
            }}
            >
              AI-Built Event Portfolios
            </span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto">
            Pre-built portfolios of prediction market contracts that provide meaningful
            exposure to real-world event risks. One click. Complete coverage.
          </p>

          {/* Hero search/input bar */}
          <div className="relative max-w-2xl mx-auto">
            <div
              className="flex items-center gap-3 bg-card rounded-2xl px-5 py-4"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={heroInput}
                onChange={(e) => setHeroInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleHeroSubmit()}
                placeholder="Describe a risk you want to hedge..."
                className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
              />
              <button
                onClick={handleHeroSubmit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 44%))",
                  boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)",
                }}
              >
                Build a Hedge
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
        >
          {[
            { label: "Bundles Active", value: `${HEDGE_BUNDLES.length}` },
            { label: "Total Liquidity", value: formatMillions(totalLiquidity) },
            { label: "Avg Coverage", value: `${avgCoverage}%` },
            { label: "Markets Tracked", value: `${HEDGE_BUNDLES.reduce((a, b) => a + b.contracts.length, 0)}` },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl px-5 py-4 text-center shadow-card border border-border/60"
            >
              <span className="text-2xl font-bold text-foreground tabular-nums block leading-none mb-1">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Event Risk Network */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-6 pb-10"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Event Risk Network</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              How global events cascade into downstream risks
            </p>
          </div>
          <span className="text-sm text-muted-foreground hidden sm:block">
            Click a node to see hedge bundles
          </span>
        </div>
        <EventRiskMap />
      </motion.section>

      {/* Main content + signals sidebar */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex gap-8 items-start">
          {/* Bundle Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Available Hedge Bundles
              </h2>
              <span className="text-sm text-muted-foreground">
                {HEDGE_BUNDLES.length} bundles
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
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
            className="hidden xl:block w-72 flex-shrink-0 sticky top-[5rem]"
          >
            <LiveSignalsPanel />
          </motion.div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Netira · Risk Intelligence Platform · v0.1.0
          </span>
          <span className="text-sm text-muted-foreground">
            Powered by Polymarket
          </span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
