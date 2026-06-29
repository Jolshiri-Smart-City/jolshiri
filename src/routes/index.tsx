import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Filter, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/PropertyCard";
import { Testimonials } from "@/components/Testimonials";
import { featuredProperties } from "@/lib/properties.functions";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings } from "@/hooks/use-site-settings";
import heroJolshiri from "@/assets/hero-jolshiri.jpg";

const featuredOptions = queryOptions({
  queryKey: ["featured"],
  queryFn: () => featuredProperties(),
});

const DEFAULT_HERO_IMG = heroJolshiri;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jolshiri Smart City — Find your flat in Purbachal" },
      { name: "description", content: "Search verified flats across every block of Jolshiri Smart City. Filter by price, size, possession, sector and amenities." },
      { property: "og:title", content: "Jolshiri Smart City — Find your flat in Purbachal" },
      { property: "og:description", content: "Verified flats. Real-time status. Bangla + English." },
      { property: "og:image", content: DEFAULT_HERO_IMG },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredOptions),
  component: Index,
});

function Index() {
  const { t, lang } = useI18n();
  const { data: featured } = useSuspenseQuery(featuredOptions);
  const { data: settings } = useSiteSettings();

  const hero = settings?.hero;
  const heroImg = hero?.image_url || DEFAULT_HERO_IMG;
  const title = hero ? (lang === "bn" ? hero.title_bn : hero.title_en) : t("tagline");
  const subtitle = hero ? (lang === "bn" ? hero.subtitle_bn : hero.subtitle_en) : t("heroSub");
  const badge = hero ? (lang === "bn" ? hero.badge_bn : hero.badge_en) : "Purbachal · 48,000+ flats";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-20"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Strong dark overlay for guaranteed text readability */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/65 to-black/35" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <div className="max-w-3xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/40 px-3 py-1 text-xs font-medium backdrop-blur">
              <BadgeCheck className="h-3.5 w-3.5" /> {badge}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}>
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white sm:text-lg" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>
              {subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground shadow-lg hover:bg-accent/90">
                <Link to="/properties">
                  {t("browse")} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/60 bg-white/20 text-white backdrop-blur hover:bg-white/30">
                <Link to="/properties" search={{ bedrooms: 3 } as never}>
                  3-bedroom flats
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>




      {/* Why us */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">{t("whyUs")}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: BadgeCheck, title: t("why1Title"), body: t("why1Body") },
            { icon: Filter, title: t("why2Title"), body: t("why2Body") },
            { icon: Globe2, title: t("why3Title"), body: t("why3Body") },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
              <c.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-display text-lg font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("featured")}</h2>
          <Link to="/properties" className="text-sm font-medium text-primary hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((row) => (
            <PropertyCard key={row.id} row={row} />
          ))}
        </div>
      </section>

      <Testimonials
        items={(settings as { testimonials?: Array<{ name: string; role?: string; text: string; rating?: number }> } | undefined)?.testimonials}
      />
    </div>
  );
}
