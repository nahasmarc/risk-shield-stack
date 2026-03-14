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
    <div className="bg-card rounded-2xl border border-border shadow-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Live Event Signals
          </span>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">LIVE</span>
        </span>
      </div>

      {/* Signal rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/50">
        {signals.map((signal) => (
          <SignalRow key={signal.id} signal={signal} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Updating live</span>
          <span className="text-xs tabular-nums text-muted-foreground">
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
          ? { backgroundColor: `${signal.categoryColor}08` }
          : { backgroundColor: "transparent" }
      }
      transition={{ duration: 0.4 }}
      className="px-5 py-3.5 flex flex-col gap-2"
    >
      {/* Category dot + title */}
      <div className="flex items-start gap-2">
        <span
          className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
          style={{ backgroundColor: signal.categoryColor }}
        />
        <span className="text-xs font-medium text-foreground leading-tight flex-1 line-clamp-2">
          {signal.contractTitle}
        </span>
      </div>

      {/* Prob bar + delta */}
      <div className="flex items-center gap-2 pl-4">
        {/* Mini sparkline bar */}
        <div className="flex-1 h-1 rounded-full overflow-hidden bg-muted">
          <motion.div
            className="h-1 rounded-full"
            style={{ backgroundColor: signal.categoryColor }}
            animate={{ width: `${signal.currentProb}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        {/* Probability */}
        <span
          className="text-xs font-bold tabular-nums w-8 text-right"
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
            className="flex items-center gap-0.5 w-14 justify-end"
          >
            {isUp ? (
              <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 text-destructive flex-shrink-0" />
            )}
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ color: isUp ? "hsl(142 71% 40%)" : "hsl(0 72% 51%)" }}
            >
              {isUp ? "+" : ""}
              {signal.currentChange.toFixed(1)}%
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Category label */}
      <div className="pl-4">
        <span
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: `${signal.categoryColor}aa` }}
        >
          {signal.bundleCategory}
        </span>
      </div>
    </motion.div>
  );
}
