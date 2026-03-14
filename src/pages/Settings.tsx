import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Check, Loader2, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">Connect your Polymarket account to enable real trading.</p>

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
      </div>
    </>
  );
}
