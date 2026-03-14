import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, BrainCircuit, Save, Newspaper, MessageSquare } from "lucide-react";
import { NewsToHedge } from "@/components/NewsToHedge";
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
  const [activeTab, setActiveTab] = useState<"chat" | "news">("chat");
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {/* Tab switcher */}
      <div className="bg-card border-b border-border/60">
        <div className="max-w-2xl mx-auto px-6 pt-4 pb-0 flex gap-1">
          {[
            { id: "chat" as const, label: "AI Chat Builder", icon: MessageSquare },
            { id: "news" as const, label: "News to Hedge", icon: Newspaper, badge: "NEW" },
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all duration-200 border-b-2 -mb-px ${
                activeTab === id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "news" ? (
          <motion.div
            key="news"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 overflow-y-auto"
          >
            <NewsToHedge />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
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
                      className="max-w-sm px-5 py-3.5 rounded-2xl rounded-br-md text-sm font-medium text-white leading-relaxed"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 48%))",
                        boxShadow: "0 4px 16px hsl(var(--primary) / 0.25)",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                )}

                {/* ASSISTANT bubble */}
                {msg.role === "assistant" && (
                  <div className="flex gap-3 items-start">
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 80% 70%))",
                      }}
                    >
                      <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                        Netira AI
                      </p>
                      <div
                        className="bg-card rounded-2xl rounded-bl-md px-5 py-4"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)" }}
                      >
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
                  className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 80% 70%))",
                  }}
                >
                  <BrainCircuit className="w-4 h-4 text-white" />
                </div>
                <div
                  className="bg-card rounded-2xl rounded-bl-md px-5 py-4 mt-[26px]"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50" />
                    <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50" />
                    <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="bg-card border-t border-border/60" style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.04)" }}>
              <div className="max-w-2xl mx-auto px-6 pt-4 pb-5">
                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleSubmit(chip.prompt)}
                      disabled={isThinking}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-foreground bg-background border border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      <span>{chip.icon}</span>
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Input bar */}
                <div
                  className="flex items-center gap-3 bg-background rounded-2xl px-5 py-3 border border-border transition-all duration-200 focus-within:border-primary/40"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)" }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Describe a risk you want to hedge..."
                    className="flex-1 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
                    disabled={isThinking}
                  />
                  <button
                    onClick={() => handleSubmit()}
                    disabled={!input.trim() || isThinking}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 48%))",
                      boxShadow: "0 2px 8px hsl(var(--primary) / 0.3)",
                    }}
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-2.5 text-center">
                  Mock AI · No data leaves this browser · Press Enter to submit
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      className="ml-12 bg-card rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)" }}
    >
      {/* Thin top accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: catConfig.accentHex }} />

      {/* Header row */}
      <div className="flex items-center px-5 py-4 gap-3 border-b border-border/60">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: catConfig.pastel }}
        >
          <CatIcon className="w-4 h-4" style={{ color: catConfig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold block" style={{ color: catConfig.color }}>{catConfig.label}</span>
          <h3 className="text-sm font-bold text-foreground leading-snug truncate">{bundle.title}</h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: riskConfig.color, backgroundColor: riskConfig.bg }}
          >
            {riskConfig.label}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-full text-xs font-semibold px-3 border-primary/20 text-primary hover:bg-primary/5"
            onClick={onSave}
            disabled={saved}
          >
            <Save className="w-3 h-3 mr-1" />
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      {/* Probability gauge */}
      <div className="px-5 pt-4 pb-2">
        <ProbabilityGauge value={avg} color={catConfig.accentHex} size="md" />
      </div>

      {/* Contracts */}
      <div className="px-5 pb-5 space-y-2">
        {bundle.contracts.map((contract, i) => (
          <ContractRow key={contract.id} contract={contract} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/60 bg-muted/30 flex items-center gap-4">
        <span className="text-xs text-muted-foreground">
          {bundle.contracts.length} markets
        </span>
        <span className="text-xs font-semibold" style={{ color: catConfig.color }}>
          Avg probability: {avg}%
        </span>
      </div>
    </motion.div>
  );
}

export default AIBuilderPage;
