import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, BrainCircuit, Save, Flame, Cpu, Globe, Vote, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { ContractRow } from "@/components/ContractRow";
import { CATEGORY_CONFIG, HEDGE_BUNDLES, HedgeBundle, getAvgProbability, RISK_LEVEL_CONFIG } from "@/data/bundles";
import { ProbabilityGauge } from "@/components/ProbabilityGauge";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant" | "bundle";
  content: string;
  bundle?: HedgeBundle;
  timestamp: Date;
}

const KEYWORD_MAP: Record<string, string> = {
  oil: "oil-shock",
  crude: "oil-shock",
  opec: "oil-shock",
  energy: "oil-shock",
  "middle east": "oil-shock",
  ai: "ai-regulation",
  artificial: "ai-regulation",
  regulation: "ai-regulation",
  tech: "ai-regulation",
  taiwan: "taiwan-conflict",
  china: "taiwan-conflict",
  semiconductor: "taiwan-conflict",
  chip: "taiwan-conflict",
  nvidia: "taiwan-conflict",
  election: "us-election-volatility",
  vote: "us-election-volatility",
  political: "us-election-volatility",
  congress: "us-election-volatility",
  democrat: "us-election-volatility",
  republican: "us-election-volatility",
  inflation: "inflation-spike",
  cpi: "inflation-spike",
  fed: "inflation-spike",
  dollar: "inflation-spike",
  commodity: "inflation-spike",
  rate: "inflation-spike",
};

const SUGGESTION_CHIPS = [
  { label: "Oil price spike", icon: "🛢️", prompt: "I'm worried about oil prices spiking due to Middle East conflict" },
  { label: "AI regulation", icon: "🤖", prompt: "Hedge my exposure to AI regulation risk from the EU and US" },
  { label: "Taiwan conflict", icon: "🌏", prompt: "Protect against a Taiwan strait escalation and semiconductor supply disruption" },
  { label: "US election", icon: "🗳️", prompt: "I want to hedge against US election volatility and policy uncertainty" },
  { label: "Inflation surge", icon: "📈", prompt: "Hedge my portfolio against a resurgence in inflation and Fed rate hikes" },
];

function parseBundleFromInput(input: string): HedgeBundle | null {
  const lower = input.toLowerCase();
  for (const [keyword, bundleId] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      return HEDGE_BUNDLES.find((b) => b.id === bundleId) || null;
    }
  }
  return null;
}

function generateAssistantResponse(input: string, bundle: HedgeBundle | null): string {
  if (!bundle) {
    return "I wasn't able to identify a specific risk category from your query. Try mentioning keywords like **oil**, **AI regulation**, **Taiwan**, **election**, or **inflation** — or use one of the suggestion chips below.";
  }
  const avg = getAvgProbability(bundle);
  const catConfig = CATEGORY_CONFIG[bundle.category];
  return `I've identified a **${catConfig?.label ?? bundle.category}** risk profile from your query.\n\nConstructing the **"${bundle.title}"** hedge bundle — ${bundle.contracts.length} correlated Polymarket contracts with an aggregate probability of **${avg}%**. Here's your position:`;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm the **Netira AI Risk Builder**.\n\nDescribe a real-world risk you're exposed to and I'll construct a custom hedge bundle from Polymarket prediction markets. You can also tap one of the suggestions below to get started quickly.",
  timestamp: new Date(),
};

// Render bold markdown-ish text
function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-foreground font-semibold">{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

const AIBuilderPage = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [savedBundles, setSavedBundles] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSubmit = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || isThinking) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 700));

    const bundle = parseBundleFromInput(text);
    const responseText = generateAssistantResponse(text, bundle);

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: responseText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMsg]);

    if (bundle) {
      await new Promise((r) => setTimeout(r, 350));
      const bundleMsg: Message = {
        id: crypto.randomUUID(),
        role: "bundle",
        content: "",
        bundle,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, bundleMsg]);
    }

    setIsThinking(false);
    inputRef.current?.focus();
  };

  const handleSave = (bundle: HedgeBundle) => {
    if (savedBundles.includes(bundle.id)) return;
    setSavedBundles((prev) => [...prev, bundle.id]);
    toast({
      title: "Bundle Saved",
      description: `"${bundle.title}" has been added to your portfolio.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Page header */}
      <div className="border-b border-border/40" style={{ background: "hsl(232 20% 6% / 0.8)" }}>
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center gap-3">
          <div className="w-6 h-6 rounded-sm bg-primary/15 border border-primary/25 flex items-center justify-center">
            <BrainCircuit className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              AI RISK BUILDER
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-amber" />
            <span className="text-[9px] font-mono tracking-widest uppercase text-primary/70">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* USER bubble */}
                {msg.role === "user" && (
                  <div className="flex justify-end">
                    <div
                      className="max-w-lg px-4 py-3 rounded-sm text-sm font-sans text-foreground"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))",
                        border: "1px solid hsl(var(--primary) / 0.25)",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                )}

                {/* ASSISTANT bubble */}
                {msg.role === "assistant" && (
                  <div className="flex gap-3 items-start">
                    <div
                      className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(271 76% 60% / 0.15))",
                        border: "1px solid hsl(var(--primary) / 0.3)",
                      }}
                    >
                      <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/50 mb-1.5">
                        NETIRA AI
                      </p>
                      <div className="glass-card rounded-sm px-4 py-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {msg.content.split("\n").map((line, i) => (
                            <span key={i}>
                              <RichText text={line} />
                              {i < msg.content.split("\n").length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* BUNDLE card */}
                {msg.role === "bundle" && msg.bundle && (
                  <BundleCard
                    bundle={msg.bundle}
                    saved={savedBundles.includes(msg.bundle.id)}
                    onSave={() => handleSave(msg.bundle!)}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 items-start"
              >
                <div
                  className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(271 76% 60% / 0.15))",
                    border: "1px solid hsl(var(--primary) / 0.3)",
                  }}
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="glass-card rounded-sm px-4 py-3.5 flex items-center gap-1.5 mt-[22px]">
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border/50 backdrop-blur-xl" style={{ background: "hsl(232 20% 6% / 0.95)" }}>
        <div className="max-w-3xl mx-auto px-6 pt-4 pb-5">
          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleSubmit(chip.prompt)}
                disabled={isThinking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all duration-200 hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2.5 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Describe a risk you want to hedge..."
              className="flex-1 px-4 py-3 rounded-sm text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 transition-all duration-200"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.4)";
                e.currentTarget.style.boxShadow = "0 0 0 1px hsl(var(--primary) / 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
              disabled={isThinking}
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isThinking}
              className="h-11 w-11 p-0 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(211 100% 45%))",
              }}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>

          <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/25 mt-2.5">
            MOCK AI · NO DATA LEAVES THIS BROWSER · PRESS ENTER TO SUBMIT
          </p>
        </div>
      </div>
    </div>
  );
};

function BundleCard({
  bundle,
  saved,
  onSave,
}: {
  bundle: HedgeBundle;
  saved: boolean;
  onSave: () => void;
}) {
  const catConfig = CATEGORY_CONFIG[bundle.category] ?? CATEGORY_CONFIG["MACRO"];
  const CatIcon = catConfig.Icon;
  const riskConfig = RISK_LEVEL_CONFIG[bundle.riskLevel];
  const avg = getAvgProbability(bundle);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="ml-10 glass-card rounded-sm overflow-hidden"
      style={{
        borderTopColor: bundle.categoryColor,
        borderTopWidth: "2px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
            style={{ background: `${bundle.categoryColor}18`, border: `1px solid ${bundle.categoryColor}30` }}
          >
            <CatIcon className="w-3.5 h-3.5" style={{ color: bundle.categoryColor }} />
          </div>
          <div>
            <span className="text-[9px] font-mono tracking-widest uppercase block" style={{ color: bundle.categoryColor }}>
              {catConfig.label}
            </span>
            <h3 className="text-sm font-semibold text-foreground leading-snug">{bundle.title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-sm border"
            style={{ color: riskConfig.color, borderColor: `${riskConfig.color}35`, backgroundColor: `${riskConfig.color}12` }}
          >
            {riskConfig.label}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-[10px] tracking-widest h-7 px-2.5"
            onClick={onSave}
            disabled={saved}
          >
            <Save className="w-3 h-3 mr-1" />
            {saved ? "SAVED" : "SAVE"}
          </Button>
        </div>
      </div>

      {/* Probability gauge */}
      <div className="px-4 pt-3 pb-2">
        <ProbabilityGauge value={avg} color={bundle.categoryColor} size="md" />
      </div>

      {/* Contracts */}
      <div className="px-4 pb-4 space-y-1.5">
        {bundle.contracts.map((contract, i) => (
          <ContractRow key={contract.id} contract={contract} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border/40 flex items-center gap-4">
        <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
          {bundle.contracts.length} MARKETS
        </span>
        <span className="text-[10px] font-mono tracking-widest uppercase text-accent">
          AVG PROB: {avg}%
        </span>
      </div>
    </motion.div>
  );
}

export default AIBuilderPage;
