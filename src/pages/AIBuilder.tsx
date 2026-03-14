import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Terminal, BrainCircuit, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { ContractRow } from "@/components/ContractRow";
import {
  HEDGE_BUNDLES,
  HedgeBundle,
  getAvgProbability,
} from "@/data/bundles";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "system" | "bundle";
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

function parseBundleFromInput(input: string): HedgeBundle | null {
  const lower = input.toLowerCase();
  for (const [keyword, bundleId] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      return HEDGE_BUNDLES.find((b) => b.id === bundleId) || null;
    }
  }
  return null;
}

function generateSystemResponse(input: string, bundle: HedgeBundle | null): string {
  if (!bundle) {
    return `⚠ Unable to identify a specific risk type from your query. Try mentioning: oil, AI regulation, Taiwan, election, or inflation. Or browse the predefined bundles on the dashboard.`;
  }
  const avg = getAvgProbability(bundle);
  return `✓ Risk profile identified: ${bundle.category} EXPOSURE\n\nConstructing hedge bundle "${bundle.title}" with ${bundle.contracts.length} correlated markets. Aggregate probability: ${avg}%. Rendering position below...`;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "system",
  content:
    "NETIRA AI RISK BUILDER INITIALIZED\n\nDescribe a real-world risk you want to hedge. The system will identify relevant prediction markets and construct a custom bundle.\n\nExamples:\n• \"I'm worried about oil prices rising due to Middle East tensions\"\n• \"Hedge my exposure to US election uncertainty\"\n• \"Protect against AI regulation risk\"",
  timestamp: new Date(),
};

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
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    // Simulate AI thinking delay
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 600));

    const bundle = parseBundleFromInput(userMsg.content);
    const responseText = generateSystemResponse(userMsg.content, bundle);

    const sysMsg: Message = {
      id: crypto.randomUUID(),
      role: "system",
      content: responseText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, sysMsg]);

    if (bundle) {
      await new Promise((r) => setTimeout(r, 400));
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      {/* Header */}
      <div className="border-b border-border/40 bg-card/20">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            AI RISK BUILDER — NATURAL LANGUAGE INTERFACE
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-primary">
            <BrainCircuit className="w-2.5 h-2.5" />
            MOCK AI
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-6 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {msg.role === "user" && (
                <div className="flex justify-end">
                  <div className="max-w-xl bg-primary/10 border border-primary/20 rounded-sm px-4 py-3">
                    <p className="text-[10px] font-mono tracking-widest uppercase text-primary/60 mb-1">
                      YOU
                    </p>
                    <p className="text-sm text-foreground font-mono">{msg.content}</p>
                  </div>
                </div>
              )}

              {msg.role === "system" && (
                <div className="flex justify-start">
                  <div className="max-w-xl">
                    <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50 mb-1 flex items-center gap-1">
                      <Terminal className="w-2.5 h-2.5" />
                      NETIRA AI
                    </p>
                    <div className="bg-card/40 border border-border/60 rounded-sm px-4 py-3">
                      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {msg.role === "bundle" && msg.bundle && (
                <div className="border border-border/60 rounded-sm overflow-hidden">
                  {/* Bundle Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-card/50 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{msg.bundle.icon}</span>
                      <div>
                        <span
                          className="text-[9px] font-mono tracking-widest uppercase block mb-0.5"
                          style={{ color: msg.bundle.categoryColor }}
                        >
                          {msg.bundle.category}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">
                          {msg.bundle.title}
                        </h3>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-mono text-[10px] tracking-widest"
                      onClick={() => handleSave(msg.bundle!)}
                      disabled={savedBundles.includes(msg.bundle!.id)}
                    >
                      <Save className="w-3 h-3 mr-1.5" />
                      {savedBundles.includes(msg.bundle!.id)
                        ? "SAVED"
                        : "SAVE BUNDLE"}
                    </Button>
                  </div>

                  {/* Contracts */}
                  <div className="p-4 space-y-2">
                    {msg.bundle.contracts.map((contract, i) => (
                      <ContractRow key={contract.id} contract={contract} index={i} />
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 bg-card/30 border-t border-border/40 flex items-center gap-4">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
                      {msg.bundle.contracts.length} MARKETS
                    </span>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-accent">
                      AVG PROB: {getAvgProbability(msg.bundle)}%
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-xs font-mono text-muted-foreground animate-pulse">
                Analyzing risk profile...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-mono text-sm">
                &gt;
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Describe a risk you want to hedge..."
                className="w-full pl-7 pr-4 py-3 bg-background/60 border border-border/60 rounded-sm font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                disabled={isThinking}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isThinking}
              className="px-4 h-11 font-mono tracking-wider text-sm shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/25 mt-2">
            PRESS ENTER TO SUBMIT · MOCK AI · NO DATA LEAVES THIS BROWSER
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIBuilderPage;
