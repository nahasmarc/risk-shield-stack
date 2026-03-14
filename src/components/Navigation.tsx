import { Link, useLocation } from "react-router-dom";
import { BrainCircuit, Zap } from "lucide-react";

export function Navigation() {
  const location = useLocation();
  const isBuilder = location.pathname === "/builder";

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-[0_1px_0_hsl(var(--border))]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(221 83% 44%))" }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
            Netira
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
              !isBuilder
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Bundles
          </Link>
          <Link
            to="/builder"
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
              isBuilder
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            AI Builder
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-accent text-white ml-0.5">
              BETA
            </span>
          </Link>
        </div>

        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700">Live Sim</span>
        </div>
      </div>
    </nav>
  );
}
