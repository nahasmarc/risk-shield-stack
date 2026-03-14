import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Droplets, BarChart2, ExternalLink, Wifi, WifiOff } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { EVENT_INDEXES, type EventIndex, type IndexHistoryPoint, type IndexMarket } from "@/data/eventIndexes";
import { useNavigate } from "react-router-dom";
import { usePolymarkets, type Market } from "@/hooks/usePolymarkets";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

/* ─── Sparkline SVG ─── */
function Sparkline({
  data,
  color,
  width = 260,
  height = 64,
}: {
  data: IndexHistoryPoint[];
  color: string;
  width?: number;
  height?: number;
}) {
  const padding = { x: 4, y: 6 };
  const minV = Math.min(...data.map((d) => d.value));
  const maxV = Math.max(...data.map((d) => d.value));
  const range = maxV - minV || 1;

  const points = data.map((d, i) => {
    const x = padding.x + (i / (data.length - 1)) * (width - padding.x * 2);
    const y = padding.y + ((maxV - d.value) / range) * (height - padding.y * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const fillD = `${pathD} L ${width - padding.x},${height} L ${padding.x},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`fill-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <path d={fillD} fill={`url(#fill-${color.replace(/[^a-z0-9]/gi, "")})`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Last-point dot */}
      <circle
        cx={parseFloat(points[points.length - 1].split(",")[0])}
        cy={parseFloat(points[points.length - 1].split(",")[1])}
        r={3}
        fill={color}
      />
    </svg>
  );
}

/* ─── Animated number ─── */
function AnimatedValue({ target, suffix = "%" }: { target: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    start.current = null;
    const animate = (ts: number) => {
      if (!start.current) start.current = ts;
      const progress = Math.min((ts - start.current) / 1200, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * ease * 10) / 10);
      if (progress < 1) frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [target]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

/* ─── Market row inside expanded section ─── */
function MarketRow({ market, indexColor }: { market: EventIndex["markets"][number]; indexColor: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      {/* Probability pill */}
      <div
        className="w-11 h-11 rounded-xl flex-shrink-0 flex flex-col items-center justify-center"
        style={{ backgroundColor: `${indexColor}18` }}
      >
        <span className="text-xs font-bold" style={{ color: indexColor }}>
          {market.probability}%
        </span>
      </div>
      {/* Title + weight */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{market.title}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Droplets className="w-3 h-3" />
            ${market.liquidity.toFixed(1)}M liq
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <BarChart2 className="w-3 h-3" />
            ${market.volume.toFixed(1)}M vol
          </span>
        </div>
      </div>
      {/* Weight bar */}
      <div className="w-20 flex-shrink-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-muted-foreground">Weight</span>
          <span className="text-[10px] font-semibold" style={{ color: indexColor }}>
            {Math.round(market.weight * 100)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${market.weight * 100}%`, backgroundColor: indexColor }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Single Index Card ─── */
function IndexCard({ index, onViewDetail }: { index: EventIndex; onViewDetail: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const rising = index.change7d > 0;
  const Icon = index.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="bg-card rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.06)" }}
    >
      {/* Top accent */}
      <div className="h-1 w-full" style={{ backgroundColor: index.accentHex }} />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: index.pastel }}
            >
              <Icon className="w-5 h-5" style={{ color: index.color }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground leading-tight">{index.title}</h3>
              <span className="text-xs font-medium text-muted-foreground">{index.subtitle}</span>
            </div>
          </div>

          {/* Current value */}
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-bold text-foreground tabular-nums leading-none">
              <AnimatedValue target={index.currentValue} />
            </div>
            <div
              className="flex items-center justify-end gap-1 mt-1 text-xs font-semibold"
              style={{ color: rising ? "hsl(142 60% 38%)" : "hsl(0 72% 51%)" }}
            >
              {rising ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {rising ? "+" : ""}{index.change7d}% / 7d
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {index.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{index.description}</p>

        {/* Sparkline chart */}
        <div className="w-full mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground">30-day movement</span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {index.markets.length} markets
            </span>
          </div>
          <div className="w-full overflow-hidden rounded-xl" style={{ backgroundColor: `${index.accentHex}14` }}>
            <div className="px-3 py-3">
              <Sparkline data={index.history} color={index.color} width={400} height={72} />
            </div>
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between px-1 mt-1">
            <span className="text-[10px] text-muted-foreground">30d ago</span>
            <span className="text-[10px] text-muted-foreground">Today</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary text-foreground"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? "Hide Markets" : `View ${index.markets.length} Markets`}
          </button>
          <button
            onClick={onViewDetail}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            style={{ boxShadow: "0 4px 14px hsl(var(--primary) / 0.3)" }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Hedge
          </button>
        </div>

        {/* Expanded market list */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-5 pt-5 border-t border-border/60">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Included Markets
                </p>
                {index.markets.map((market) => (
                  <MarketRow key={market.id} market={market} indexColor={index.color} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Page ─── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const EventIndexesPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const categories = ["ALL", ...Array.from(new Set(EVENT_INDEXES.map((i) => i.category)))];
  const filtered =
    activeCategory === "ALL" ? EVENT_INDEXES : EVENT_INDEXES.filter((i) => i.category === activeCategory);

  const handleHedge = (index: EventIndex) => {
    navigate(`/builder?q=${encodeURIComponent(index.description)}`);
  };

  // Aggregate stats
  const avgValue = Math.round(EVENT_INDEXES.reduce((a, b) => a + b.currentValue, 0) / EVENT_INDEXES.length);
  const rising = EVENT_INDEXES.filter((i) => i.change7d > 0).length;
  const totalMarkets = EVENT_INDEXES.reduce((a, b) => a + b.markets.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Page hero */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/8 border border-primary/15 text-primary">
              Live Indexes
            </span>
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-3">
            Event Indexes
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Composite probability indexes tracking clusters of correlated prediction markets.
            Each index aggregates multiple markets into a single risk signal.
          </p>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
        >
          {[
            { label: "Active Indexes", value: EVENT_INDEXES.length.toString() },
            { label: "Tracked Markets", value: totalMarkets.toString() },
            { label: "Avg Index Value", value: `${avgValue}%` },
            { label: "Rising Indexes", value: `${rising} / ${EVENT_INDEXES.length}` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-2xl px-5 py-4 border border-border/60 text-center"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <span className="text-2xl font-bold text-foreground block leading-none mb-1">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Category filter chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-wrap gap-2 mt-6"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {cat === "ALL" ? "All Indexes" : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Index grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <motion.div
          key={activeCategory}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {filtered.map((index) => (
              <IndexCard key={index.id} index={index} onViewDetail={() => handleHedge(index)} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer */}
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

export default EventIndexesPage;
