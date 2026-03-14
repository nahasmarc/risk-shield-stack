import { Link, useLocation } from "react-router-dom";
import { BrainCircuit, Zap, BarChart3, Database } from "lucide-react";
import { useEffect, useState } from "react";
import { getDataSourceHealth } from "@/lib/api";

type DataSource = "live" | "mock" | "loading";

export function Navigation() {
  const location = useLocation();
  const path = location.pathname;
  const [dataSource, setDataSource] = useState<DataSource>("loading");
  const [marketCount, setMarketCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    getDataSourceHealth()
      .then((h) => {
        if (!cancelled) {
          setDataSource(h.dataSource);
          setMarketCount(h.marketCount);
        }
      })
      .catch(() => {
        if (!cancelled) setDataSource("mock");
      });
    return () => { cancelled = true; };
  }, []);

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

  const isLive = dataSource === "live";
  const isLoading = dataSource === "loading";

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border/60" style={{ boxShadow: "0 1px 0 hsl(var(--border)), 0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
            PolyBumble
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLink("/", "Coverage")}
          {navLink("/indexes", "Event Indexes", <BarChart3 className="w-3.5 h-3.5" />)}
          {navLink("/builder", "AI Builder", <BrainCircuit className="w-3.5 h-3.5" />, "BETA")}
        </div>

        {/* Polymarket data source indicator */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
          isLoading
            ? "bg-muted border-border"
            : isLive
            ? "bg-green-50 border-green-100"
            : "bg-amber-50 border-amber-100"
        }`}>
          <Database className={`w-3 h-3 ${
            isLoading ? "text-muted-foreground" :
            isLive ? "text-green-600" : "text-amber-600"
          }`} />
          <div className={`w-1.5 h-1.5 rounded-full ${
            isLoading ? "bg-muted-foreground animate-pulse" :
            isLive ? "bg-green-500 animate-pulse" : "bg-amber-500"
          }`} />
          <span className={`text-xs font-semibold ${
            isLoading ? "text-muted-foreground" :
            isLive ? "text-green-700" : "text-amber-700"
          }`}>
            {isLoading
              ? "Connecting..."
              : isLive
              ? `Polymarket Live · ${marketCount}m`
              : "Mock Data"}
          </span>
        </div>
      </div>
    </nav>
  );
}
