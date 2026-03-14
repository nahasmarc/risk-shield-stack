import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, Zap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RiskFeedItem {
  id: string;
  description: string;
  category: string;
  categoryColor: string;
  categoryBg: string;
  probChange: number; // positive = rising, negative = falling
  timestamp: Date;
  builderPrompt: string;
  severity: "critical" | "high" | "medium";
}

const SEVERITY_CONFIG = {
  critical: { color: "hsl(0 72% 51%)", bg: "hsl(0 93% 95%)", label: "Critical" },
  high:     { color: "hsl(24 90% 45%)", bg: "hsl(24 100% 93%)", label: "High" },
  medium:   { color: "hsl(38 90% 45%)", bg: "hsl(38 97% 92%)", label: "Medium" },
};

const BASE_FEED: Omit<RiskFeedItem, "id" | "timestamp">[] = [
  {
    description: "Taiwan conflict probability increasing",
    category: "GEOPOLITICS",
    categoryColor: "hsl(0 72% 51%)",
    categoryBg: "hsl(0 93% 95%)",
    probChange: +3.1,
    severity: "critical",
    builderPrompt: "Protect against a Taiwan strait escalation and semiconductor supply disruption",
  },
  {
    description: "Oil supply disruption risk rising",
    category: "ENERGY",
    categoryColor: "hsl(24 90% 50%)",
    categoryBg: "hsl(38 97% 92%)",
    probChange: +2.4,
    severity: "high",
    builderPrompt: "I'm worried about oil prices spiking due to Middle East conflict",
  },
  {
    description: "EU AI regulation vote approaching",
    category: "TECHNOLOGY",
    categoryColor: "hsl(258 60% 55%)",
    categoryBg: "hsl(258 89% 95%)",
    probChange: +1.8,
    severity: "medium",
    builderPrompt: "Hedge my exposure to AI regulation risk from the EU and US",
  },
  {
    description: "US recession probability increasing",
    category: "MACRO",
    categoryColor: "hsl(142 60% 38%)",
    categoryBg: "hsl(142 77% 93%)",
    probChange: +4.2,
    severity: "high",
    builderPrompt: "I want to hedge against US recession risk and economic slowdown",
  },
  {
    description: "Fed rate hike signals strengthening",
    category: "MACRO",
    categoryColor: "hsl(142 60% 38%)",
    categoryBg: "hsl(142 77% 93%)",
    probChange: +2.9,
    severity: "high",
    builderPrompt: "Hedge my portfolio against a resurgence in inflation and Fed rate hikes",
  },
  {
    description: "China sanctions risk moderating",
    category: "GEOPOLITICS",
    categoryColor: "hsl(0 72% 51%)",
    categoryBg: "hsl(0 93% 95%)",
    probChange: -1.3,
    severity: "medium",
    builderPrompt: "Protect against US China trade war escalation and comprehensive sanctions",
  },
  {
    description: "Nvidia supply chain stress detected",
    category: "TECHNOLOGY",
    categoryColor: "hsl(258 60% 55%)",
    categoryBg: "hsl(258 89% 95%)",
    probChange: +1.6,
    severity: "medium",
    builderPrompt: "Protect against a Taiwan strait escalation and semiconductor supply disruption",
  },
  {
    description: "Dollar weakness accelerating",
    category: "MACRO",
    categoryColor: "hsl(142 60% 38%)",
    categoryBg: "hsl(142 77% 93%)",
    probChange: +3.5,
    severity: "high",
    builderPrompt: "Hedge my portfolio against dollar weakness and inflation surge",
  },
];

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function seedItems(): RiskFeedItem[] {
  return BASE_FEED.slice(0, 5).map((item, i) => ({
    ...item,
    id: crypto.randomUUID(),
    timestamp: new Date(Date.now() - (i * 37 + 12) * 1000),
  }));
}

// Randomly mutate a feed item's probChange slightly to simulate live updates
function mutate(item: RiskFeedItem): RiskFeedItem {
  const delta = (Math.random() - 0.45) * 0.6;
  const newChange = Math.round((item.probChange + delta) * 10) / 10;
  return { ...item, probChange: newChange, timestamp: new Date() };
}

export function AIRiskFeed() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RiskFeedItem[]>(seedItems);
  const [, forceRender] = useState(0); // tick for relative timestamps

  // Inject a new random item every 8–14 seconds
  const injectItem = useCallback(() => {
    const base = BASE_FEED[Math.floor(Math.random() * BASE_FEED.length)];
    const newItem: RiskFeedItem = {
      ...base,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      probChange: base.probChange + (Math.random() - 0.5) * 1.5,
    };
    setItems((prev) => {
      const updated = [newItem, ...prev].slice(0, 7);
      // Also mutate one random existing item to simulate live drift
      const mutIdx = 1 + Math.floor(Math.random() * (updated.length - 1));
      updated[mutIdx] = mutate(updated[mutIdx]);
      return updated;
    });
  }, []);

  useEffect(() => {
    const delay = 8000 + Math.random() * 6000;
    const t = setTimeout(injectItem, delay);
    return () => clearTimeout(t);
  }, [items, injectItem]);

  // Refresh relative timestamps every 30s
  useEffect(() => {
    const t = setInterval(() => forceRender((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const handleGenerate = (prompt: string) => {
    navigate(`/builder?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div
      className="bg-card rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 44%))" }}
          >
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">AI Risk Feed</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Live emerging risks</p>
          </div>
        </div>
        {/* Pulsing live dot */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[10px] font-medium text-green-600">LIVE</span>
        </div>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-border/40">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const sev = SEVERITY_CONFIG[item.severity];
            const rising = item.probChange > 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3.5 space-y-2.5">
                  {/* Top row: icon + description + severity */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: sev.bg }}
                    >
                      <AlertTriangle className="w-3 h-3" style={{ color: sev.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-snug">
                        {item.description}
                      </p>
                      {/* Category + severity chips */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ color: item.categoryColor, backgroundColor: item.categoryBg }}
                        >
                          {item.category}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ color: sev.color, backgroundColor: sev.bg }}
                        >
                          {sev.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Probability change + timestamp */}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: rising ? "hsl(0 72% 51%)" : "hsl(142 60% 38%)" }}
                    >
                      {rising ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {rising ? "+" : ""}{Math.round(item.probChange * 10) / 10}% probability
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {timeAgo(item.timestamp)}
                    </div>
                  </div>

                  {/* Generate Hedge button */}
                  <button
                    onClick={() => handleGenerate(item.builderPrompt)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary hover:text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Zap className="w-3 h-3" />
                    Generate Hedge
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
