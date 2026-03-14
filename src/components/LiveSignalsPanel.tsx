import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import { LIVE_SIGNALS_BASE, LiveSignal } from "@/data/bundles";

interface SignalState extends LiveSignal {
  currentProb: number;
  currentChange: number;
  isUpdating: boolean;
}

function randomWalk(prev: number): number {
  const delta = (Math.random() - 0.48) * 3.2;
  const next = prev + delta;
  return Math.max(2, Math.min(97, Math.round(next * 10) / 10));
}

export function LiveSignalsPanel() {
  const [signals, setSignals] = useState<SignalState[]>(
    LIVE_SIGNALS_BASE.map((s) => ({
      ...s,
      currentProb: s.probability,
      currentChange: s.change,
      isUpdating: false,
    }))
  );
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      const idxToUpdate = Math.floor(Math.random() * LIVE_SIGNALS_BASE.length);

      setSignals((prev) =>
        prev.map((s, i) => {
          if (i !== idxToUpdate) return { ...s, isUpdating: false };
          const newProb = randomWalk(s.currentProb);
          const change = Math.round((newProb - s.currentProb) * 10) / 10;
          return { ...s, currentProb: newProb, currentChange: change, isUpdating: true };
        })
      );
      setLastUpdate(new Date());

      // Clear updating flag after animation
      setTimeout(() => {
        setSignals((prev) => prev.map((s) => ({ ...s, isUpdating: false })));
      }, 800);
    }, 3500);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="signals-panel-bg rounded-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-foreground font-semibold">
            Live Event Signals
          </span>
        </div>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-amber" />
          <span className="text-[8px] font-mono tracking-widest uppercase text-green-500">LIVE</span>
        </span>
      </div>

      {/* Signal rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {signals.map((signal) => (
          <SignalRow key={signal.id} signal={signal} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-mono tracking-widest uppercase text-muted-foreground/50">
            UPDATING LIVE
          </span>
          <span className="text-[8px] font-mono tabular-nums text-muted-foreground/40">
            {formatTime(lastUpdate)}
          </span>
        </div>
      </div>
    </div>
  );
}

function SignalRow({ signal }: { signal: SignalState }) {
  const isUp = signal.currentChange >= 0;

  return (
    <motion.div
      animate={
        signal.isUpdating
          ? { backgroundColor: `${signal.categoryColor}10` }
          : { backgroundColor: "transparent" }
      }
      transition={{ duration: 0.4 }}
      className="px-4 py-3 flex flex-col gap-1.5"
    >
      {/* Category dot + title */}
      <div className="flex items-start gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
          style={{ backgroundColor: signal.categoryColor }}
        />
        <span className="text-[11px] text-foreground/80 leading-tight flex-1 line-clamp-2">
          {signal.contractTitle}
        </span>
      </div>

      {/* Prob bar + delta */}
      <div className="flex items-center gap-2 pl-3.5">
        {/* Mini sparkline bar */}
        <div className="flex-1 h-0.5 rounded-full overflow-hidden bg-border/50">
          <motion.div
            className="h-0.5 rounded-full"
            style={{ backgroundColor: signal.categoryColor }}
            animate={{ width: `${signal.currentProb}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        {/* Probability */}
        <span
          className="text-[10px] font-mono tabular-nums w-8 text-right"
          style={{ color: signal.categoryColor }}
        >
          {signal.currentProb}%
        </span>
        {/* Delta */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${signal.id}-${signal.currentChange}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-0.5 w-12 justify-end"
          >
            {isUp ? (
              <TrendingUp className="w-2.5 h-2.5 text-green-500 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5 text-destructive flex-shrink-0" />
            )}
            <span
              className="text-[10px] font-mono tabular-nums"
              style={{ color: isUp ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)" }}
            >
              {isUp ? "+" : ""}
              {signal.currentChange.toFixed(1)}%
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Category label */}
      <div className="pl-3.5">
        <span
          className="text-[8px] font-mono tracking-widest uppercase"
          style={{ color: `${signal.categoryColor}99` }}
        >
          {signal.bundleCategory}
        </span>
      </div>
    </motion.div>
  );
}
