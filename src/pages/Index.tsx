import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { HedgeCard } from "@/components/HedgeCard";
import { HEDGE_BUNDLES } from "@/data/bundles";
import { Shield } from "lucide-react";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

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
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Status Bar */}
      <div className="border-b border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
              LAST UPDATED:{" "}
              <span className="text-muted-foreground">{now}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-accent">
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse-amber" />
              LIVE DATA SIMULATION
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              RISK HEDGING PLATFORM
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4 leading-tight">
            Hedge real-world risks with
            <br />
            <span className="text-primary">prediction market bundles</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            Pre-built portfolios of Polymarket contracts that together represent
            meaningful exposure to a specific event risk. One click. Complete
            coverage.
          </p>
        </motion.div>
      </div>

      {/* Bundle Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              AVAILABLE HEDGE BUNDLES
            </h2>
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/40">
            {HEDGE_BUNDLES.length} BUNDLES
          </span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {HEDGE_BUNDLES.map((bundle, i) => (
            <HedgeCard key={bundle.id} bundle={bundle} index={i} />
          ))}
        </motion.div>
      </div>

      {/* Footer Strip */}
      <div className="border-t border-border/40 bg-card/20">
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
