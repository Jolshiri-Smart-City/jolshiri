import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import jolshiriLogo from "@/assets/jolshiri-logo.png";

export function Header() {
  const { t } = useI18n();
  const { user, role } = useAuth();
  const { data: settings } = useSiteSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const isStaff = role === "admin" || role === "agent";
  const isAdminArea = pathname.startsWith("/admin");
  const brandName = settings?.brand?.name_en || t("brand");
  const logoUrl = settings?.brand?.logo_url || jolshiriLogo;

  const nav: Array<{ to: string; label: string; exact?: boolean }> = [
    { to: "/", label: t("home"), exact: true },
    { to: "/properties", label: t("properties") },
    { to: "/compare", label: t("compare") },
    { to: "/about", label: t("about") },
    { to: "/contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
          <img src={logoUrl} alt={brandName} className="h-9 w-9 rounded-md object-contain" />
          <span className="hidden sm:inline">{brandName}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {nav.map((n) => {
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
          {isStaff && isAdminArea ? (
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
          {user && isAdminArea ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => supabase.auth.signOut()}
              className="hidden gap-1.5 sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              {t("signOut")}
            </Button>
          ) : null}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            {isStaff && isAdminArea ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t("admin")}
              </Link>
            ) : null}
            {user && isAdminArea ? (
              <button
                onClick={() => {
                  setOpen(false);
                  supabase.auth.signOut();
                }}
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t("signOut")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
