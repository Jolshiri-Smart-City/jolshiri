import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Jolshiri Smart City" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back");
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created — you can sign in now.");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">{t("signIn")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Save favorites and manage your inquiries.</p>
      <Tabs defaultValue="signin" className="mt-6">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="signin">{t("signIn")}</TabsTrigger>
          <TabsTrigger value="signup">{t("signUp")}</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <form className="mt-4 space-y-3" onSubmit={signIn}>
            <div><Label>{t("email")}</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? t("loading") : t("signIn")}</Button>
          </form>
        </TabsContent>
        <TabsContent value="signup">
          <form className="mt-4 space-y-3" onSubmit={signUp}>
            <div><Label>{t("yourName")}</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
            <div><Label>{t("email")}</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? t("loading") : t("signUp")}</Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
