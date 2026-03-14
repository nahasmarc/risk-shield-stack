import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { HedgeCard } from "@/components/HedgeCard";
import { LiveSignalsPanel } from "@/components/LiveSignalsPanel";
import { EventRiskMap } from "@/components/EventRiskMap";
import { AIRiskFeed } from "@/components/AIRiskFeed";
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
            <span className="text-xs font-semibold text-primary">The Future of Insurance</span>
          </div>

          <h1 className="text-5xl font-bold text-foreground mb-5 leading-tight tracking-tight">
            Insurance Built for{" "}
            <span className="text-primary">
              How the World Actually Works
            </span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto">
            Dynamic coverage backed by real-world event data. PolyBundle replaces
            static policies with intelligent protection that moves with the markets.
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
                placeholder="What do you need to be covered against?"
                className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
              />
              <button
                onClick={handleHeroSubmit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-primary-foreground bg-primary transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
                style={{ boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)" }}
              >
                Get Coverage
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats bar */}
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

          {/* Right sidebar: Live Signals + AI Risk Feed */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden xl:flex xl:flex-col w-72 flex-shrink-0 sticky top-[5rem] gap-5 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4"
          >
            <LiveSignalsPanel />
            <AIRiskFeed />
          </motion.div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            PolyBundle · The Future of Insurance · v0.1.0
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
