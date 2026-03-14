import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  AlertTriangle,
  Search,
  Zap,
  CheckCircle2,
  Save,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractRow } from "@/components/ContractRow";
import { ProbabilityGauge } from "@/components/ProbabilityGauge";
import {
  CATEGORY_CONFIG,
  HEDGE_BUNDLES,
  type HedgeBundle,
  getAvgProbability,
  RISK_LEVEL_CONFIG,
} from "@/data/bundles";
import { useToast } from "@/hooks/use-toast";
import { newsHedge, type NewsHedgeResponse } from "@/lib/api";

/* ─── Example headlines ─── */
const EXAMPLE_HEADLINES = [
  "China increases military activity near Taiwan Strait, US Navy deploys carrier group",
  "Fed signals 50bps rate hike amid persistent inflation data; CPI holds above 4%",
  "EU Parliament approves sweeping AI Act — tech giants face heavy compliance costs",
  "OPEC+ agrees emergency production cut as Middle East tensions threaten supply",
  "2026 midterm polls tighten; Democrats within striking distance of flipping House",
];

/* ─── Step indicator ─── */
function StepIndicator({
  step,
  current,
  label,
  icon: Icon,
}: {
  step: number;
  current: number;
  label: string;
  icon: React.ElementType;
}) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          done
            ? "bg-primary text-primary-foreground"
            : active
            ? "bg-primary/10 border-2 border-primary text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
      </div>
      <span
        className={`text-xs font-medium transition-colors duration-300 ${
          done || active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

interface AnalysisResult {
  detectedRisk: {
    riskLabel: string;
    keyword: string;
    confidence: number;
    bundleId: string;
  };
  bundle: HedgeBundle;
}

/* ─── Map API response → frontend AnalysisResult ─── */
function mapApiResponse(resp: NewsHedgeResponse): AnalysisResult | null {
  const frontendBundle = HEDGE_BUNDLES.find((b) => b.id === resp.bundle.id);
  if (!frontendBundle) return null;

  return {
    detectedRisk: {
      riskLabel: resp.detectedRisk.riskLabel,
      keyword: resp.detectedRisk.keywords?.[0] ?? resp.detectedRisk.riskCategory.toLowerCase(),
      confidence: resp.confidence ?? resp.detectedRisk.confidence,
      bundleId: resp.bundle.id,
    },
    bundle: frontendBundle,
  };
}

/* ─── Keyword fallback (used when API call fails) ─── */
const KEYWORD_MAP: Record<string, string> = {
  oil: "oil-shock", crude: "oil-shock", opec: "oil-shock",
  energy: "oil-shock", "middle east": "oil-shock",
  ai: "ai-regulation", artificial: "ai-regulation",
  regulation: "ai-regulation", tech: "ai-regulation",
  taiwan: "taiwan-conflict", china: "taiwan-conflict",
  semiconductor: "taiwan-conflict", chip: "taiwan-conflict",
  nvidia: "taiwan-conflict",
  election: "us-election-volatility", vote: "us-election-volatility",
  political: "us-election-volatility", congress: "us-election-volatility",
  inflation: "inflation-spike", cpi: "inflation-spike",
  fed: "inflation-spike", dollar: "inflation-spike",
  commodity: "inflation-spike", rate: "inflation-spike",
  recession: "inflation-spike", gdp: "inflation-spike",
  military: "taiwan-conflict", conflict: "taiwan-conflict",
  russia: "taiwan-conflict", war: "taiwan-conflict",
  sanctions: "taiwan-conflict",
};

const RISK_LABELS: Record<string, string> = {
  "oil-shock":             "Energy / Oil Supply Risk",
  "ai-regulation":         "AI Regulation Risk",
  "taiwan-conflict":       "Geopolitical Conflict Risk",
  "us-election-volatility":"Electoral Volatility Risk",
  "inflation-spike":       "Macroeconomic / Inflation Risk",
};

function keywordFallback(raw: string): AnalysisResult | null {
  const text = raw.trim().slice(0, 2000);
  if (!text) return null;
  const lower = text.toLowerCase();
  const hits: { keyword: string; bundleId: string; count: number }[] = [];
  for (const [kw, id] of Object.entries(KEYWORD_MAP)) {
    let count = 0;
    let pos = 0;
    while ((pos = lower.indexOf(kw, pos)) !== -1) { count++; pos += kw.length; }
    if (count > 0) hits.push({ keyword: kw, bundleId: id, count });
  }
  if (hits.length === 0) return null;
  hits.sort((a, b) => b.count - a.count || b.keyword.length - a.keyword.length);
  const top = hits[0];
  const bundle = HEDGE_BUNDLES.find((b) => b.id === top.bundleId);
  if (!bundle) return null;
  const rawConf = Math.min(40 + top.count * 18 + Math.min(text.length / 20, 22), 97);
  return {
    detectedRisk: {
      keyword: top.keyword,
      riskLabel: RISK_LABELS[top.bundleId] ?? "Geopolitical Risk",
      confidence: Math.round(rawConf),
      bundleId: top.bundleId,
    },
    bundle,
  };
}

/* ─── Main component ─── */
export function NewsToHedge({ onSaveBundle }: { onSaveBundle?: (b: HedgeBundle) => void }) {
  const [newsText, setNewsText] = useState("");
  const [analysisStep, setAnalysisStep] = useState<0 | 1 | 2 | 3>(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const canSubmit = newsText.trim().length >= 8 && analysisStep === 0;

  const handleAnalyze = async () => {
    if (!canSubmit) return;
    setError(null);
    setResult(null);
    setSaved(false);

    // Step 1 — extracting risk
    setAnalysisStep(1);

    let analysis: AnalysisResult | null = null;

    try {
      // Real AI backend call
      const resp = await newsHedge(newsText);
      analysis = mapApiResponse(resp);

      // Step 2 — mapping markets (brief pause for UX)
      setAnalysisStep(2);
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      // Graceful degradation to keyword fallback
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.warn("news-hedge API error, falling back:", msg);

      if (msg.includes("Rate limit") || msg.includes("credits")) {
        toast({ title: "AI Limit Reached", description: msg, variant: "destructive" });
      }

      // Step 2 — mapping markets
      setAnalysisStep(2);
      await new Promise((r) => setTimeout(r, 600));
      analysis = keywordFallback(newsText);
    }

    if (!analysis) {
      setError(
        "Unable to identify a specific risk from this text. Try headlines mentioning Taiwan, oil, inflation, AI regulation, or US elections."
      );
      setAnalysisStep(0);
      return;
    }

    // Step 3 — done
    setAnalysisStep(3);
    setResult(analysis);
  };

  const handleReset = () => {
    setAnalysisStep(0);
    setResult(null);
    setError(null);
    setSaved(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSave = (bundle: HedgeBundle) => {
    setSaved(true);
    onSaveBundle?.(bundle);
    toast({ title: "Bundle Saved", description: `"${bundle.title}" added to your portfolio.` });
  };

  const handleExample = (headline: string) => {
    setNewsText(headline);
    setResult(null);
    setError(null);
    setAnalysisStep(0);
    setSaved(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {/* Input card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.06)" }}
      >
        {/* Header stripe */}
        <div
          className="px-6 py-4 flex items-center gap-3 border-b border-border/60"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.05), hsl(var(--primary)/0.02))" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 44%))" }}
          >
            <Newspaper className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">News to Hedge Generator</p>
            <p className="text-xs text-muted-foreground">Paste any headline or article to extract risk and build a hedge</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Paste news article or headline
            </label>
            <textarea
              ref={textareaRef}
              value={newsText}
              onChange={(e) => {
                if (e.target.value.length <= 2000) setNewsText(e.target.value);
              }}
              disabled={analysisStep > 0 && analysisStep < 3}
              placeholder={`e.g. "China increases military activity near Taiwan Strait, US Navy deploys carrier group"`}
              rows={4}
              className="w-full resize-none rounded-xl text-sm text-foreground placeholder:text-muted-foreground bg-background border border-border px-4 py-3 focus:outline-none focus:border-primary/40 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">Powered by Lovable AI · Supports headlines, articles, or risk descriptions</p>
              <span className={`text-[11px] tabular-nums ${newsText.length > 1800 ? "text-destructive" : "text-muted-foreground"}`}>
                {newsText.length} / 2000
              </span>
            </div>
          </div>

          {/* Example headlines */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Examples</p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLE_HEADLINES.map((h) => (
                <button
                  key={h}
                  onClick={() => handleExample(h)}
                  disabled={analysisStep > 0 && analysisStep < 3}
                  className="text-left text-xs text-muted-foreground px-3 py-2 rounded-lg border border-border/60 hover:border-primary/30 hover:text-primary hover:bg-primary/4 transition-all duration-200 line-clamp-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3 h-3 inline-block mr-1 opacity-60" />
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze button */}
          {analysisStep < 3 && (
            <button
              onClick={handleAnalyze}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: canSubmit
                  ? "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 44%))"
                  : undefined,
                boxShadow: canSubmit ? "0 4px 16px hsl(var(--primary)/0.3)" : undefined,
              }}
            >
              {analysisStep === 0 ? (
                <>
                  <Zap className="w-4 h-4" />
                  Analyze & Generate Hedge
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing…
                </>
              )}
            </button>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-2.5 p-3.5 rounded-xl bg-destructive/8 border border-destructive/20"
              >
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-xs text-destructive leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Analysis progress ── */}
      <AnimatePresence>
        {analysisStep >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-2xl px-6 py-5"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Analysis Pipeline
            </p>
            <div className="space-y-3">
              <StepIndicator step={1} current={analysisStep} label="Extracting core risk from text" icon={Search} />
              <div className="ml-3.5 w-px h-3 bg-border" />
              <StepIndicator step={2} current={analysisStep} label="Mapping to prediction markets" icon={Zap} />
              <div className="ml-3.5 w-px h-3 bg-border" />
              <StepIndicator step={3} current={analysisStep} label="Hedge bundle generated" icon={CheckCircle2} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ── */}
      <AnimatePresence>
        {analysisStep === 3 && result && (
          <>
            {/* Detected Risk card */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl px-6 py-5"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.05)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Detected Risk</p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xl font-bold text-foreground">{result.detectedRisk.riskLabel}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Triggered by keyword: <span className="font-semibold text-foreground">"{result.detectedRisk.keyword}"</span>
                  </p>
                </div>
                {/* Confidence meter */}
                <div className="flex-shrink-0 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex flex-col items-center justify-center border-4"
                    style={{ borderColor: "hsl(var(--primary))", backgroundColor: "hsl(var(--primary)/0.06)" }}
                  >
                    <span className="text-sm font-bold text-primary">{result.detectedRisk.confidence}%</span>
                    <span className="text-[9px] text-muted-foreground leading-none">conf.</span>
                  </div>
                </div>
              </div>

              {/* Category tag */}
              {(() => {
                const cat = CATEGORY_CONFIG[result.bundle.category] ?? CATEGORY_CONFIG["MACRO"];
                const CatIcon = cat.Icon;
                return (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/60">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: cat.pastel }}
                    >
                      <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: cat.color }}>
                      {cat.label}
                    </span>
                    <span className="text-xs text-muted-foreground">category identified</span>
                  </div>
                );
              })()}
            </motion.div>

            {/* Relevant Markets */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl px-6 py-5"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.05)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Relevant Markets</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {result.bundle.contracts.length} markets found
                </span>
              </div>

              <div className="space-y-2">
                {result.bundle.contracts.map((contract, i) => (
                  <ContractRow key={contract.id} contract={contract} index={i} />
                ))}
              </div>
            </motion.div>

            {/* Suggested Hedge Bundle */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.07)" }}
            >
              {(() => {
                const cat = CATEGORY_CONFIG[result.bundle.category] ?? CATEGORY_CONFIG["MACRO"];
                const CatIcon = cat.Icon;
                const riskCfg = RISK_LEVEL_CONFIG[result.bundle.riskLevel];
                const avg = getAvgProbability(result.bundle);
                return (
                  <>
                    <div className="h-1 w-full" style={{ backgroundColor: cat.accentHex }} />
                    <div className="px-6 py-5">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">Suggested Hedge Bundle</p>
                      </div>

                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: cat.pastel }}
                        >
                          <CatIcon className="w-5 h-5" style={{ color: cat.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ color: riskCfg.color, backgroundColor: riskCfg.bg }}
                            >
                              {riskCfg.label}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-foreground mt-0.5">{result.bundle.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                            {result.bundle.description}
                          </p>
                        </div>
                      </div>

                      {/* Gauge */}
                      <div className="mb-5">
                        <ProbabilityGauge value={avg} color={cat.accentHex} size="md" />
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {result.bundle.tags.map((tag) => (
                          <span key={tag} className="text-[11px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSave(result.bundle)}
                          disabled={saved}
                          className="flex-1 rounded-xl h-10 text-sm font-semibold"
                        >
                          <Save className="w-3.5 h-3.5 mr-1.5" />
                          {saved ? "Saved ✓" : "Save Bundle"}
                        </Button>
                        <button
                          onClick={handleReset}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                          style={{
                            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 44%))",
                            boxShadow: "0 4px 14px hsl(var(--primary)/0.25)",
                          }}
                        >
                          Analyze Another
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
