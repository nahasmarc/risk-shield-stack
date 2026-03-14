import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, BrainCircuit } from "lucide-react";

export function Navigation() {
  const location = useLocation();
  const isBuilder = location.pathname === "/builder";

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-sm bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-mono text-base font-bold tracking-[0.2em] text-foreground group-hover:text-primary transition-colors duration-200">
            NETIRA
          </span>
          <span className="text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase hidden sm:block ml-1 mt-0.5">
            RISK PLATFORM
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className={`text-xs font-mono tracking-wider px-3 py-1.5 rounded-sm transition-all duration-200 ${
              !isBuilder
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            BUNDLES
          </Link>
          <Link
            to="/builder"
            className={`flex items-center gap-1.5 text-xs font-mono tracking-wider px-3 py-1.5 rounded-sm transition-all duration-200 ${
              isBuilder
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <BrainCircuit className="w-3 h-3" />
            AI BUILDER
          </Link>
        </div>

        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-accent"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground/50 uppercase">
            LIVE SIM
          </span>
        </div>
      </div>
    </nav>
  );
}
