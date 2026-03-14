import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HedgeBundle,
  calculateHedgeCost,
  getAvgProbability,
  getTotalLiquidity,
  getTotalVolume,
  formatMillions,
} from "@/data/bundles";
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CoverageCalculatorProps {
  bundle: HedgeBundle;
}

export function CoverageCalculator({ bundle }: CoverageCalculatorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coverage, setCoverage] = useState<string>("10000");
  const [executed, setExecuted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);

  const coverageNum = parseFloat(coverage.replace(/,/g, "")) || 0;
  const cost = calculateHedgeCost(bundle, coverageNum);
  const avgProb = getAvgProbability(bundle);
  const totalLiq = getTotalLiquidity(bundle);
  const totalVol = getTotalVolume(bundle);

  // Use first contract as primary hedge contract
  const primaryContract = bundle.contracts[0];

  const handleExecuteClick = async () => {
    if (!user) {
      toast.error("Please sign in to place trades.", {
        action: { label: "Sign In", onClick: () => navigate("/login") },
      });
      return;
    }

    // Check credentials
    const { data } = await supabase
      .from("polymarket_credentials")
      .select("api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      setHasCredentials(false);
      setShowDialog(true);
    } else {
      setHasCredentials(true);
      setShowDialog(true);
    }
  };

  const handleConfirmOrder = async () => {
    if (!user || !hasCredentials) return;
    setPlacing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase.functions.invoke("place-order", {
        body: {
          // tokenId for primary contract — using contract id as proxy for demo
          tokenId: primaryContract.id,
          side: "BUY",
          size: (cost / primaryContract.probability * 100).toFixed(2),
          price: (primaryContract.probability / 100).toFixed(4),
          bundleId: bundle.id,
          bundleTitle: bundle.title,
          contractId: primaryContract.id,
          contractTitle: primaryContract.title,
        },
      });

      if (error) throw error;

      setShowDialog(false);
      setExecuted(true);
      setTimeout(() => setExecuted(false), 4000);

      toast.success("Hedge order placed!", {
        description: `Order submitted for "${primaryContract.title}"`,
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to place order.";
      toast.error(msg.includes("No Polymarket credentials")
        ? "No credentials found — please add them in Settings."
        : msg
      );
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <div
        className="bg-card rounded-2xl p-6 space-y-5"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)" }}
      >
        <div>
          <h3 className="text-base font-semibold text-foreground mb-0.5">
            Coverage Calculator
          </h3>
          <p className="text-sm text-muted-foreground">
            Simulate and execute your hedge position
          </p>
        </div>

        {/* Coverage Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Coverage Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
              $
            </span>
            <Input
              type="number"
              value={coverage}
              onChange={(e) => setCoverage(e.target.value)}
              className="pl-7 rounded-xl border-border bg-background focus-visible:ring-primary/30 text-sm"
              placeholder="10000"
            />
          </div>
        </div>

        {/* Cost Display */}
        <div className="space-y-3 py-4 border-y border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Cost to hedge</span>
            <span className="text-2xl font-bold text-primary">
              ${cost.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg probability</span>
            <span className="text-sm font-semibold text-primary">{avgProb}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Potential return</span>
            <span className="text-sm font-semibold text-foreground">
              ${coverageNum.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/60 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Liquidity</p>
            <p className="text-sm font-semibold text-foreground">
              {formatMillions(totalLiq)}
            </p>
          </div>
          <div className="bg-muted/60 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Volume</p>
            <p className="text-sm font-semibold text-foreground">
              {formatMillions(totalVol)}
            </p>
          </div>
        </div>

        {/* Execute Button */}
        <Button
          className="w-full rounded-full text-sm font-semibold py-5"
          style={{
            background: executed
              ? "hsl(142 60% 38%)"
              : "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 48%))",
            boxShadow: executed ? "none" : "0 4px 16px hsl(var(--primary) / 0.25)",
          }}
          onClick={handleExecuteClick}
          disabled={executed || coverageNum <= 0}
        >
          <AnimatePresence mode="wait">
            {executed ? (
              <motion.div
                key="done"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Hedge Placed!
              </motion.div>
            ) : (
              <motion.span key="idle">Execute Hedge →</motion.span>
            )}
          </AnimatePresence>
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Powered by Polymarket CLOB · Real trades execute on-chain
        </p>
      </div>

      {/* Confirm Order Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          {!hasCredentials ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Connect Polymarket Account
                </DialogTitle>
                <DialogDescription>
                  To place real trades, you need to connect your Polymarket API credentials in Settings.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => { setShowDialog(false); navigate("/settings"); }}
                >
                  Go to Settings
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Simulated Hedge Order
                </DialogTitle>
                <DialogDescription>
                  This is a <strong>paper trade simulation</strong> — no real funds will be moved. Live CLOB token IDs are required for on-chain execution.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bundle</span>
                    <span className="font-medium text-foreground text-right max-w-[180px] truncate">{bundle.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-medium text-foreground text-right max-w-[180px] line-clamp-1">{primaryContract.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Side</span>
                    <span className="font-semibold text-green-600">BUY YES</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium text-foreground">{(primaryContract.probability / 100).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2.5">
                    <span className="text-muted-foreground font-medium">Simulated Cost</span>
                    <span className="font-bold text-primary text-base">${cost.toLocaleString()} USDC</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Paper trade only.</strong> Full on-chain execution requires fetching CLOB token IDs from the Polymarket API. This simulation records the order without moving real funds.
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} disabled={placing}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmOrder} disabled={placing} className="gap-2">
                  {placing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    "Confirm Simulation"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
