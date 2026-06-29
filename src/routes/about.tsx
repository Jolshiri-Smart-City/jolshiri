import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Building2, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Jolshiri Smart City" },
      { name: "description", content: "Jolshiri Smart City — Purbachal's largest planned community. Verified inventory, transparent pricing, and end-to-end buyer support." },
      { property: "og:title", content: "About — Jolshiri Smart City" },
      { property: "og:description", content: "Verified flats in Purbachal. Real-time status. Bangla + English." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, lang } = useI18n();
  const { data: settings } = useSiteSettings();
  const brandName = settings?.brand ? (lang === "bn" ? settings.brand.name_bn : settings.brand.name_en) : t("brand");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{t("about")}</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        {brandName} is a curated platform for buyers, NRBs and investors searching apartments across Purbachal's planned smart city blocks. We aggregate verified inventory from trusted developers and give you a single source of truth on availability, pricing and possession.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: BadgeCheck, title: "Verified inventory", body: "Every listing is checked against developer records before going live." },
          { icon: Building2, title: "All major projects", body: "Sectors across Purbachal — apartments, duplexes, ready and under-construction." },
          { icon: Sparkles, title: "Transparent pricing", body: "Total price, per-sqft cost and the full payment plan on every listing." },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-border/70 bg-card p-5">
            <c.icon className="h-5 w-5 text-primary" />
            <div className="mt-2 font-display text-base font-semibold">{c.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border/70 bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-primary" /> Purbachal New Town, Dhaka
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Have a question, looking for a specific block, or want to schedule a site visit? Reach out — our team replies the same day.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild><Link to="/properties">{t("browse")}</Link></Button>
          <Button asChild variant="outline"><Link to="/contact">{t("contact")}</Link></Button>
        </div>
      </div>
    </div>
  );
}
