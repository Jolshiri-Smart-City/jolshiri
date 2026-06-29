import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Filter, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/PropertyCard";
import { featuredProperties } from "@/lib/properties.functions";
import { useI18n } from "@/lib/i18n";

const featuredOptions = queryOptions({
  queryKey: ["featured"],
  queryFn: () => featuredProperties(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jolshiri Smart City — Find your flat in Purbachal" },
      { name: "description", content: "Search verified flats across every block of Jolshiri Smart City. Filter by price, size, possession, sector and amenities." },
      { property: "og:title", content: "Jolshiri Smart City — Find your flat in Purbachal" },
      { property: "og:description", content: "Verified flats. Real-time status. Bangla + English." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredOptions),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const { data: featured } = useSuspenseQuery(featuredOptions);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary to-[oklch(0.28_0.06_200)]"
        />
        <div
          className="absolute inset-0 -z-10 opacity-25"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=2000&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "overlay",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <div className="max-w-3xl text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <BadgeCheck className="h-3.5 w-3.5" /> Purbachal · 48,000+ flats coming online
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              {t("tagline")}
            </h1>
            <p className="mt-4 max-w-xl text-base text-primary-foreground/85 sm:text-lg">
              {t("heroSub")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/properties">
                  {t("browse")} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20">
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
      <section className="mx-auto max-w-7xl px-4 pb-20">
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
    </div>
  );
}
