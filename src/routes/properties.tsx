import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "@/components/PropertyCard";
import { listAmenities, listSectors, searchProperties } from "@/lib/properties.functions";
import { useI18n } from "@/lib/i18n";
import type { FacingDirection, PropertyStatus, SearchFilters } from "@/lib/types";

type SortKey = "price_asc" | "price_desc" | "size" | "newest" | "possession";

interface RouteSearch {
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  bedrooms?: number;
  sector?: string;
  status?: PropertyStatus;
  facing?: FacingDirection;
  possessionBefore?: string;
  amenities?: string[];
  sort?: SortKey;
}

const STATUSES: PropertyStatus[] = ["available", "booked", "sold"];
const FACINGS: FacingDirection[] = [
  "north","south","east","west","north_east","north_west","south_east","south_west",
];
const SORTS: SortKey[] = ["price_asc","price_desc","size","newest","possession"];

function parseNumber(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export const Route = createFileRoute("/properties")({
  head: () => ({
    meta: [
      { title: "Browse properties — Jolshiri Smart City" },
      { name: "description", content: "Filter Jolshiri flats by price, size, bedrooms, sector and amenities." },
      { property: "og:title", content: "Browse properties — Jolshiri Smart City" },
      { property: "og:description", content: "Live search across every available flat in Jolshiri." },
    ],
  }),
  validateSearch: (raw: Record<string, unknown>): RouteSearch => {
    const status = typeof raw.status === "string" && STATUSES.includes(raw.status as PropertyStatus) ? (raw.status as PropertyStatus) : undefined;
    const facing = typeof raw.facing === "string" && FACINGS.includes(raw.facing as FacingDirection) ? (raw.facing as FacingDirection) : undefined;
    const sort = typeof raw.sort === "string" && SORTS.includes(raw.sort as SortKey) ? (raw.sort as SortKey) : "newest";
    const amenities = Array.isArray(raw.amenities)
      ? (raw.amenities as unknown[]).filter((a): a is string => typeof a === "string")
      : undefined;
    return {
      minPrice: parseNumber(raw.minPrice),
      maxPrice: parseNumber(raw.maxPrice),
      minSize: parseNumber(raw.minSize),
      maxSize: parseNumber(raw.maxSize),
      bedrooms: parseNumber(raw.bedrooms),
      sector: typeof raw.sector === "string" ? raw.sector : undefined,
      status,
      facing,
      possessionBefore: typeof raw.possessionBefore === "string" ? raw.possessionBefore : undefined,
      amenities: amenities && amenities.length ? amenities : undefined,
      sort,
    };
  },
  component: PropertiesPage,
});

function PropertiesPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate({ from: "/properties" });
  const search = Route.useSearch();

  const sectorsQ = useQuery({ queryKey: ["sectors"], queryFn: () => listSectors() });
  const amenitiesQ = useQuery({ queryKey: ["amenities"], queryFn: () => listAmenities() });

  const filters: SearchFilters & { limit?: number } = useMemo(
    () => ({ ...search }),
    [search],
  );

  const resultsQ = useQuery({
    queryKey: ["search", filters],
    queryFn: () => searchProperties({ data: filters }),
  });

  function update<K extends keyof RouteSearch>(key: K, value: RouteSearch[K] | undefined) {
    navigate({ search: (prev: RouteSearch) => ({ ...prev, [key]: value }) });
  }

  function toggleAmenity(name: string) {
    const cur = search.amenities ?? [];
    const next = cur.includes(name) ? cur.filter((a: string) => a !== name) : [...cur, name];
    update("amenities", next.length ? next : undefined);
  }


  const priceMin = search.minPrice ?? 0;
  const priceMax = search.maxPrice ?? 50000000;
  const sizeMin = search.minSize ?? 0;
  const sizeMax = search.maxSize ?? 3000;

  const list = (resultsQ.data?.exact?.length ?? 0) > 0 ? resultsQ.data!.exact : resultsQ.data?.closest ?? [];
  const isFallback = resultsQ.data && resultsQ.data.exact.length === 0 && resultsQ.data.closest.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t("searchTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {resultsQ.isLoading ? t("loading") : `${(resultsQ.data?.exact.length ?? list.length).toLocaleString()} ${t("resultsCount")}`}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5 rounded-xl border border-border/70 bg-card p-5 shadow-sm lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{t("filters")}</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate({ search: { sort: "newest" } })}>
              {t("reset")}
            </Button>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">{t("priceRange")}</Label>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>৳{(priceMin / 100000).toFixed(0)}L</span>
              <span className="ml-auto">৳{(priceMax / 100000).toFixed(0)}L</span>
            </div>
            <Slider
              min={0}
              max={50000000}
              step={500000}
              value={[priceMin, priceMax]}
              onValueChange={(v) => {
                update("minPrice", v[0] === 0 ? undefined : v[0]);
                update("maxPrice", v[1] === 50000000 ? undefined : v[1]);
              }}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">{t("sizeRange")}</Label>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{sizeMin}</span>
              <span className="ml-auto">{sizeMax}</span>
            </div>
            <Slider
              min={0}
              max={3000}
              step={50}
              value={[sizeMin, sizeMax]}
              onValueChange={(v) => {
                update("minSize", v[0] === 0 ? undefined : v[0]);
                update("maxSize", v[1] === 3000 ? undefined : v[1]);
              }}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">{t("bedrooms")}</Label>
              <Select
                value={search.bedrooms?.toString() ?? "any"}
                onValueChange={(v) => update("bedrooms", v === "any" ? undefined : Number(v))}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("any")}</SelectItem>
                  {[1, 2, 3, 4, 5].map((b) => (
                    <SelectItem key={b} value={b.toString()}>{b}+</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">{t("status")}</Label>
              <Select
                value={search.status ?? "any"}
                onValueChange={(v) => update("status", v === "any" ? undefined : (v as never))}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("any")}</SelectItem>
                  <SelectItem value="available">{t("available")}</SelectItem>
                  <SelectItem value="booked">{t("booked")}</SelectItem>
                  <SelectItem value="sold">{t("sold")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">{t("sector")}</Label>
            <Select
              value={search.sector ?? "any"}
              onValueChange={(v) => update("sector", v === "any" ? undefined : v)}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t("any")}</SelectItem>
                {(sectorsQ.data ?? []).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">{t("facing")}</Label>
            <Select
              value={search.facing ?? "any"}
              onValueChange={(v) => update("facing", v === "any" ? undefined : (v as never))}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t("any")}</SelectItem>
                {FACINGS.map((f) => (
                  <SelectItem key={f} value={f}>{f.replace("_", "-")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">{t("possessionBy")}</Label>
            <Input
              type="date"
              value={search.possessionBefore ?? ""}
              onChange={(e) => update("possessionBefore", e.target.value || undefined)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">{t("amenities")}</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(amenitiesQ.data ?? []).map((a) => {
                const active = (search.amenities ?? []).includes(a.name);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAmenity(a.name)}
                    className={
                      "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                      (active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40")
                    }
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">{t("sortBy")}</span>
            <Select value={search.sort ?? "newest"} onValueChange={(v) => update("sort", v as never)}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("newest")}</SelectItem>
                <SelectItem value="price_asc">{t("priceLow")}</SelectItem>
                <SelectItem value="price_desc">{t("priceHigh")}</SelectItem>
                <SelectItem value="size">{t("sizeSort")}</SelectItem>
                <SelectItem value="possession">{t("possessionSort")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {resultsQ.isLoading ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="mt-12 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              {t("noResults")}
            </div>
          ) : (
            <>
              {isFallback ? (
                <div className="mt-4 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-foreground">
                  {t("noResults")} <span className="font-medium">{t("closestMatches")}:</span>
                </div>
              ) : null}
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((row) => (
                  <PropertyCard key={row.id} row={row} />
                ))}
              </div>
            </>
          )}

          <p className="mt-8 text-center text-[10px] text-muted-foreground">lang: {lang}</p>
        </div>
      </div>
    </div>
  );
}
