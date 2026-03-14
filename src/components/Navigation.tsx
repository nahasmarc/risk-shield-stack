import { Link, useLocation } from "react-router-dom";
import { BrainCircuit, Zap, BarChart3 } from "lucide-react";

export function Navigation() {
  const location = useLocation();
  const path = location.pathname;

  const navLink = (to: string, label: string, icon?: React.ReactNode, badge?: string) => {
    const active = path === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        {icon}
        {label}
        {badge && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary ml-0.5">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border/60" style={{ boxShadow: "0 1px 0 hsl(var(--border)), 0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 48%))" }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
            Netira
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLink("/", "Bundles")}
          {navLink("/indexes", "Event Indexes", <BarChart3 className="w-3.5 h-3.5" />)}
          {navLink("/builder", "AI Builder", <BrainCircuit className="w-3.5 h-3.5" />, "BETA")}
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
