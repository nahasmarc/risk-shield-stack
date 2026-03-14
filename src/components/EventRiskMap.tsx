import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { RISK_NODES, RISK_EDGES, type RiskNode } from "@/data/riskGraph";
import { HEDGE_BUNDLES, CATEGORY_CONFIG } from "@/data/bundles";

// ─── Node dimensions ───────────────────────────────────────────────────────────
const NODE_W = 148;
const NODE_H = 72;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getCategoryStyle(category: RiskNode["category"]) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["MACRO"];
  return cfg;
}

/** Build a cubic-bezier SVG path between two node centre-edges */
function buildPath(from: RiskNode, to: RiskNode): string {
  const x1 = from.x + NODE_W;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x;
  const y2 = to.y + NODE_H / 2;
  const cx1 = x1 + (x2 - x1) * 0.45;
  const cy1 = y1;
  const cx2 = x1 + (x2 - x1) * 0.55;
  const cy2 = y2;
  return `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
}

/** Estimate SVG viewBox height from node positions */
const VIEW_H = Math.max(...RISK_NODES.map((n) => n.y + NODE_H)) + 32;
const VIEW_W = Math.max(...RISK_NODES.map((n) => n.x + NODE_W)) + 32;

// ─── Sub-components ────────────────────────────────────────────────────────────

interface NodeCardProps {
  node: RiskNode;
  isSelected: boolean;
  onClick: (node: RiskNode) => void;
}

function NodeCard({ node, isSelected, onClick }: NodeCardProps) {
  const cfg = getCategoryStyle(node.category);
  const CatIcon = cfg.Icon;

  return (
    <foreignObject
      x={node.x}
      y={node.y}
      width={NODE_W}
      height={NODE_H}
      style={{ overflow: "visible" }}
    >
      <motion.div
        className="w-full h-full cursor-pointer select-none"
        whileHover={{ scale: 1.05, zIndex: 10 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onClick(node)}
        style={{ position: "relative" }}
      >
        {/* Glow ring when selected */}
        {isSelected && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: `0 0 0 2.5px ${cfg.color}, 0 4px 18px ${cfg.color}40`,
              borderRadius: 16,
            }}
          />
        )}

        <div
          className="w-full h-full bg-card rounded-2xl flex flex-col justify-center gap-1.5 px-3 overflow-hidden"
          style={{
            borderLeft: `4px solid ${cfg.accentHex}`,
            boxShadow: isSelected
              ? `0 4px 20px ${cfg.color}30`
              : "0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          {/* Icon + label row */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: cfg.pastel }}
            >
              <CatIcon className="w-3 h-3" style={{ color: cfg.color }} />
            </div>
            <span
              className="text-[11px] font-bold text-foreground leading-tight line-clamp-2"
              style={{ maxWidth: 100 }}
            >
              {node.label}
            </span>
          </div>

          {/* Probability pill */}
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: cfg.pastel, color: cfg.color }}
            >
              {node.probability}%
            </span>
            <span className="text-[10px] text-muted-foreground">probability</span>
          </div>
        </div>
      </motion.div>
    </foreignObject>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function EventRiskMap() {
  const [selectedNode, setSelectedNode] = useState<RiskNode | null>(null);
  const markerId = useId().replace(/:/g, "");

  const handleNodeClick = (node: RiskNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  };

  const relatedBundles = selectedNode
    ? HEDGE_BUNDLES.filter((b) => selectedNode.bundleIds.includes(b.id))
    : [];

  return (
    <div className="bg-card rounded-3xl border border-border/50 overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)" }}
    >
      {/* ── SVG Graph ── */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ minWidth: 560, maxHeight: 460 }}
        >
          <defs>
            {/* Arrowhead marker */}
            <marker
              id={`arrow-${markerId}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 2 L 9 5 L 0 8 Z" fill="hsl(var(--border))" />
            </marker>
          </defs>

          {/* Background chain labels */}
          {[
            { y: 22, label: "Chain 1: Energy & Inflation" },
            { y: 162, label: "Chain 2: Taiwan & Tech" },
            { y: 302, label: "Chain 3: Political & Macro" },
          ].map(({ y, label }) => (
            <text
              key={label}
              x={16}
              y={y}
              className="fill-muted-foreground"
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", opacity: 0.5 }}
            >
              {label.toUpperCase()}
            </text>
          ))}

          {/* Horizontal chain lane separators */}
          {[140, 280].map((y) => (
            <line
              key={y}
              x1={16}
              y1={y}
              x2={VIEW_W - 16}
              y2={y}
              stroke="hsl(var(--border))"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.4}
            />
          ))}

          {/* ── Edges ── */}
          {RISK_EDGES.map((edge) => {
            const fromNode = RISK_NODES.find((n) => n.id === edge.from);
            const toNode = RISK_NODES.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const isCrossChain = Math.abs(fromNode.y - toNode.y) > 80;
            const pathD = buildPath(fromNode, toNode);
            const pathLen = 300; // approximate for dash animation

            return (
              <motion.path
                key={`${edge.from}-${edge.to}`}
                d={pathD}
                fill="none"
                stroke={isCrossChain ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border))"}
                strokeWidth={isCrossChain ? 1.5 : 1.5}
                strokeDasharray={isCrossChain ? "5 3" : "none"}
                markerEnd={`url(#arrow-${markerId})`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              />
            );
          })}

          {/* ── Nodes ── */}
          {RISK_NODES.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              onClick={handleNodeClick}
            />
          ))}
        </svg>
      </div>

      {/* ── Selected Node Detail Panel ── */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            key={selectedNode.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60 px-6 py-5">
              {/* Header row */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {(() => {
                      const cfg = getCategoryStyle(selectedNode.category);
                      const CatIcon = cfg.Icon;
                      return (
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: cfg.pastel }}
                        >
                          <CatIcon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                        </div>
                      );
                    })()}
                    <h3 className="text-sm font-semibold text-foreground">
                      {selectedNode.label}
                    </h3>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
                      style={{
                        backgroundColor: getCategoryStyle(selectedNode.category).pastel,
                        color: getCategoryStyle(selectedNode.category).color,
                      }}
                    >
                      {selectedNode.probability}% probability
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-8">
                    {relatedBundles.length > 0
                      ? `${relatedBundles.length} hedge bundle${relatedBundles.length > 1 ? "s" : ""} protect against this risk`
                      : "No direct hedge bundles mapped"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Related bundles */}
              {relatedBundles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedBundles.slice(0, 3).map((bundle) => {
                    const cfg = CATEGORY_CONFIG[bundle.category] ?? CATEGORY_CONFIG["MACRO"];
                    const CatIcon = cfg.Icon;
                    const avgProb = Math.round(
                      bundle.contracts.reduce((s, c) => s + c.probability, 0) /
                        bundle.contracts.length
                    );
                    return (
                      <Link
                        key={bundle.id}
                        to={`/bundle/${bundle.id}`}
                        className="group flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: cfg.pastel }}
                        >
                          <CatIcon className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                            {bundle.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {bundle.contracts.length} contracts · avg {avgProb}%
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No bundles directly mapped. Explore related hedges in the bundle grid below.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Legend ── */}
      <div className="border-t border-border/40 px-6 py-3 flex flex-wrap items-center gap-4">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Legend
        </span>
        {(["GEOPOLITICS", "ENERGY", "MACRO", "TECHNOLOGY", "POLITICS"] as const).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const CatIcon = cfg.Icon;
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded flex items-center justify-center"
                style={{ backgroundColor: cfg.pastel }}
              >
                <CatIcon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 ml-auto">
          <svg width="24" height="8">
            <path d="M 0,4 L 18,4" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="4 2" />
          </svg>
          <span className="text-[10px] text-muted-foreground">Cross-chain cascade</span>
        </div>
      </div>
    </div>
  );
}
