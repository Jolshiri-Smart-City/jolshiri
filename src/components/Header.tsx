import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldCheck, LogOut, Languages, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import jolshiriLogo from "@/assets/jolshiri-logo.png";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { user, role } = useAuth();
  const { data: settings } = useSiteSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const isStaff = role === "admin" || role === "agent";
  const brandName = settings?.brand
    ? (lang === "bn" ? settings.brand.name_bn : settings.brand.name_en)
    : t("brand");
  const logoUrl = settings?.brand?.logo_url || jolshiriLogo;

  const nav = [
    { to: "/", label: brandName, exact: true, hideLabel: true },
    { to: "/properties", label: t("properties") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
          <img src={logoUrl} alt={brandName} className="h-9 w-9 rounded-md object-contain" />

          <span className="hidden sm:inline">{brandName}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {nav.filter((n) => !n.hideLabel).map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "bg-secondary text-foreground",
                )}
              >
                {n.label}
              </Link>
            );
          })}
          {isStaff ? (
            <Link
              to="/admin"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith("/admin") && "bg-secondary text-foreground",
              )}
            >
              {t("admin")}
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="gap-1.5"
            title="Language"
          >
            <Languages className="h-4 w-4" />
            <span className="text-xs font-semibold">{lang === "en" ? "বাংলা" : "EN"}</span>
          </Button>

          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => supabase.auth.signOut()}
              className="hidden gap-1.5 sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              {t("signOut")}
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
              <Link to="/auth">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {nav.filter((n) => !n.hideLabel).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            {isStaff ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t("admin")}
              </Link>
            ) : null}
            {user ? (
              <button
                onClick={() => {
                  setOpen(false);
                  supabase.auth.signOut();
                }}
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t("signOut")}
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Admin sign in
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
