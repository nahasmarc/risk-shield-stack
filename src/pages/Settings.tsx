import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Eye, EyeOff, Check, Loader2, ExternalLink, Trash2,
  ClipboardList, ArrowUpRight, ArrowDownLeft, Clock
} from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  bundle_id: string;
  bundle_title: string;
  contract_id: string;
  contract_title: string;
  side: string;
  size: number;
  price: number;
  status: string;
  polymarket_order_id: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  filled: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  cancelled: "bg-muted text-muted-foreground border-border",
  failed: "bg-red-100 text-red-700 border-red-200",
  simulated: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [apiPassphrase, setApiPassphrase] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("polymarket_credentials")
      .select("api_key")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHasExisting(true);
          setApiKey("••••••••" + data.api_key.slice(-4));
        }
        setLoadingCreds(false);
      });

    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setOrders(data as Order[]);
        setLoadingOrders(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!apiKey || apiKey.startsWith("••••") || !apiSecret || !apiPassphrase) {
      toast.error("Please fill in all three fields with your Polymarket credentials.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        api_passphrase: apiPassphrase.trim(),
        updated_at: new Date().toISOString(),
      };

      if (hasExisting) {
        const { error } = await supabase
          .from("polymarket_credentials")
          .update(payload)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("polymarket_credentials")
          .insert(payload);
        if (error) throw error;
      }

      setHasExisting(true);
      setApiKey("••••••••" + apiKey.trim().slice(-4));
      setApiSecret("");
      setApiPassphrase("");
      toast.success("Polymarket credentials saved securely.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save credentials.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("polymarket_credentials")
      .delete()
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to remove credentials.");
    } else {
      setHasExisting(false);
      setApiKey("");
      toast.success("Credentials removed.");
    }
  };

  if (authLoading || loadingCreds) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Manage your Polymarket connection and trade history.
        </p>

        <Tabs defaultValue="credentials">
          <TabsList className="mb-6">
            <TabsTrigger value="credentials" className="gap-2">
              <Shield className="w-4 h-4" />
              API Credentials
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Order History
              {orders.length > 0 && (
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {orders.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Credentials Tab */}
          <TabsContent value="credentials">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-primary" />
                  Polymarket API Credentials
                </CardTitle>
                <CardDescription>
                  Your credentials are stored securely and only used to execute trades on your behalf.{" "}
                  <a
                    href="https://polymarket.com/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Get your API keys <ExternalLink className="w-3 h-3" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Polymarket API key"
                    onFocus={() => { if (apiKey.startsWith("••••")) setApiKey(""); }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <div className="relative">
                    <Input
                      id="apiSecret"
                      type={showSecret ? "text" : "password"}
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder={hasExisting ? "••••••••(unchanged)" : "Enter your API secret"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiPassphrase">API Passphrase</Label>
                  <div className="relative">
                    <Input
                      id="apiPassphrase"
                      type={showPassphrase ? "text" : "password"}
                      value={apiPassphrase}
                      onChange={(e) => setApiPassphrase(e.target.value)}
                      placeholder={hasExisting ? "••••••••(unchanged)" : "Enter your API passphrase"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {hasExisting ? "Update Credentials" : "Save Credentials"}
                  </Button>
                  {hasExisting && (
                    <Button variant="outline" onClick={handleDelete} className="gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>

                {hasExisting && (
                  <p className="text-xs text-green-600 flex items-center gap-1.5 pt-1">
                    <Check className="w-3.5 h-3.5" />
                    Polymarket account connected — you can place trades.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order History Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Order History
                </CardTitle>
                <CardDescription>
                  All hedge orders placed through PolyBundle.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10">
                    <ClipboardList className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No orders yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Execute a hedge from any bundle detail page.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/20"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          order.side === "BUY" ? "bg-green-100" : "bg-red-100"
                        }`}>
                          {order.side === "BUY"
                            ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                            : <ArrowDownLeft className="w-4 h-4 text-red-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
                                {order.contract_title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{order.bundle_title}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold flex-shrink-0 ${STATUS_COLORS[order.status] || ""}`}
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{order.side}</span> ·{" "}
                              {parseFloat(String(order.size)).toFixed(2)} @ {parseFloat(String(order.price)).toFixed(3)}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>
                          {order.polymarket_order_id && (
                            <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate">
                              ID: {order.polymarket_order_id}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
