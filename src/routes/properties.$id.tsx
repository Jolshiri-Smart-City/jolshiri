import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Bath, Bed, Building2, Compass, Maximize2, MapPin, Phone, CalendarDays, FileImage, GitCompare, Check } from "lucide-react";
import { toast } from "sonner";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getProperty, similarProperties, submitLead } from "@/lib/properties.functions";
import { formatBDT, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { EmiCalculator } from "@/components/EmiCalculator";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { PropertyCard } from "@/components/PropertyCard";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { getCompareIds, toggleCompare } from "./compare";

const propOptions = (id: string) =>
  queryOptions({
    queryKey: ["property", id],
    queryFn: () => getProperty({ data: { id } }),
  });

export const Route = createFileRoute("/properties/$id")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(propOptions(params.id));
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Property — Jolshiri" }] };
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${loaderData.project.name} · Unit ${loaderData.unit_number}`,
      description: loaderData.description ?? `${loaderData.bedrooms} BHK ${loaderData.size_sqft} sqft in ${loaderData.project.name}.`,
      image: loaderData.media.map((m) => m.url),
      brand: { "@type": "Brand", name: loaderData.project.developer.name },
      offers: {
        "@type": "Offer",
        priceCurrency: "BDT",
        price: Number(loaderData.price_total),
        availability:
          loaderData.status === "available"
            ? "https://schema.org/InStock"
            : loaderData.status === "booked"
              ? "https://schema.org/LimitedAvailability"
              : "https://schema.org/SoldOut",
      },
    };
    return {
      meta: [
        { title: `${loaderData.project.name} · Unit ${loaderData.unit_number} — Jolshiri` },
        { name: "description", content: loaderData.description?.slice(0, 160) ?? `${loaderData.bedrooms} BHK ${loaderData.size_sqft} sqft in ${loaderData.project.name}.` },
        { property: "og:title", content: `${loaderData.project.name} · Unit ${loaderData.unit_number}` },
        { property: "og:description", content: `${loaderData.bedrooms} BHK · ${loaderData.size_sqft} sqft · ${loaderData.project.sector}` },
        { property: "og:image", content: loaderData.media[0]?.url ?? "" },
        { property: "og:type", content: "product" },
      ],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const { data } = useSuspenseQuery(propOptions(id));
  const { data: settings } = useSiteSettings();
  const [activeImage, setActiveImage] = useState(0);

  if (!data) return null;
  const waPhone = (settings?.brand as { whatsapp?: string } | undefined)?.whatsapp;

  const photos = data.media.filter((m) => m.media_type === "photo");
  const floorPlans = data.media.filter((m) => m.media_type === "floor_plan");
  const cover = photos[activeImage] ?? photos[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("properties")}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {data.project.developer.name} · {data.project.name}
          </div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            {t("unit")} {data.unit_number}
            {data.floor_number ? <span className="ml-2 text-base font-normal text-muted-foreground">· {t("floor")} {data.floor_number}</span> : null}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{data.project.sector}{data.project.block ? ` · ${data.project.block}` : ""}</span>
            <span className="inline-flex items-center gap-1"><Bed className="h-4 w-4" />{data.bedrooms} {t("beds")}</span>
            {data.bathrooms ? <span className="inline-flex items-center gap-1"><Bath className="h-4 w-4" />{data.bathrooms} {t("baths")}</span> : null}
            <span className="inline-flex items-center gap-1"><Maximize2 className="h-4 w-4" />{Math.round(Number(data.size_sqft))} {t("sqft")}</span>
            {data.facing ? <span className="inline-flex items-center gap-1"><Compass className="h-4 w-4" />{data.facing.replace("_", "-")}</span> : null}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-semibold text-primary">{formatBDT(Number(data.price_total), lang)}</div>
          {data.price_per_sqft ? (
            <div className="text-xs text-muted-foreground">৳{Math.round(Number(data.price_per_sqft)).toLocaleString()} / {t("sqft")}</div>
          ) : null}
          <StatusBadge status={data.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {cover ? (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-muted">
              <img src={cover.url} alt="" className="aspect-[4/3] w-full object-cover" />
            </div>
          ) : null}
          {photos.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "overflow-hidden rounded-md border-2 transition-colors",
                    i === activeImage ? "border-primary" : "border-transparent",
                  )}
                >
                  <img src={p.url} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          <Tabs defaultValue="overview" className="mt-8">
            <TabsList>
              <TabsTrigger value="overview">{t("description")}</TabsTrigger>
              <TabsTrigger value="pricing">{t("paymentPlan")}</TabsTrigger>
              {floorPlans.length ? <TabsTrigger value="floorplan">{t("floorPlan")}</TabsTrigger> : null}
              {data.amenities.length ? <TabsTrigger value="amenities">{t("amenities")}</TabsTrigger> : null}
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/90">
              <p className="whitespace-pre-line">{data.description ?? data.project.description ?? "—"}</p>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Fact icon={Building2} label={t("project")} value={data.project.name} />
                <Fact icon={CalendarDays} label={t("possessionBy")} value={data.possession_date ?? "—"} />
                <Fact icon={Maximize2} label={t("sizeRange")} value={`${Math.round(Number(data.size_sqft))} sqft`} />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-4">
              <div className="overflow-hidden rounded-lg border border-border/70">
                <table className="w-full text-sm">
                  <tbody>
                    <Row label={t("totalPrice")} value={formatBDT(Number(data.price_total), lang)} bold />
                    {data.price_per_sqft ? (
                      <Row label={t("pricePerSqft")} value={`৳${Math.round(Number(data.price_per_sqft)).toLocaleString()}`} />
                    ) : null}
                    {data.booking_money ? (
                      <Row label={t("bookingMoney")} value={formatBDT(Number(data.booking_money), lang)} />
                    ) : null}
                    {(data.payment_plan ?? []).map((p, i) => (
                      <Row key={i} label={p.label} value={formatBDT(Number(p.amount), lang)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {floorPlans.length ? (
              <TabsContent value="floorplan" className="mt-4 grid gap-3 sm:grid-cols-2">
                {floorPlans.map((f) => (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border/70">
                    <img src={f.url} alt="" className="w-full object-cover" />
                    <div className="flex items-center gap-1 border-t border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground">
                      <FileImage className="h-3.5 w-3.5" /> {t("floorPlan")}
                    </div>
                  </a>
                ))}
              </TabsContent>
            ) : null}

            {data.amenities.length ? (
              <TabsContent value="amenities" className="mt-4 flex flex-wrap gap-2">
                {data.amenities.map((a) => (
                  <span key={a.id} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs">{a.name}</span>
                ))}
              </TabsContent>
            ) : null}
          </Tabs>
          <div className="mt-6">
            <EmiCalculator price={Number(data.price_total)} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <LeadForm propertyId={data.id} />
        </aside>
      </div>
      <WhatsAppFab
        phone={waPhone}
        message={`Hi, I'm interested in ${data.project.name} unit ${data.unit_number}. ${typeof window !== "undefined" ? window.location.href : ""}`}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: "available" | "booked" | "sold" }) {
  const { t } = useI18n();
  const cls =
    status === "available"
      ? "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30"
      : status === "booked"
        ? "bg-[color:var(--warning)]/15 text-foreground border-[color:var(--warning)]/40"
        : "bg-[color:var(--sold)]/15 text-[color:var(--sold)] border-[color:var(--sold)]/30";
  return (
    <span className={cn("mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", cls)}>
      {t(status)}
    </span>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-card p-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <td className="bg-secondary/40 px-4 py-2 text-muted-foreground">{label}</td>
      <td className={cn("px-4 py-2 text-right", bold && "font-semibold text-foreground")}>{value}</td>
    </tr>
  );
}

function LeadForm({ propertyId }: { propertyId: string }) {
  const { t } = useI18n();
  const [requestType, setRequestType] = useState<"callback" | "site_visit">("callback");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", message: "" });

  const mut = useMutation({
    mutationFn: () => submitLead({ data: { propertyId, requestType, ...form } }),
    onSuccess: () => {
      toast.success(t("thanks"));
      setForm({ fullName: "", phone: "", email: "", message: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold">{t("requestCallback")}</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={requestType === "callback" ? "default" : "outline"}
          size="sm"
          onClick={() => setRequestType("callback")}
        >
          <Phone className="mr-1 h-4 w-4" /> {t("requestCallback")}
        </Button>
        <Button
          type="button"
          variant={requestType === "site_visit" ? "default" : "outline"}
          size="sm"
          onClick={() => setRequestType("site_visit")}
        >
          <CalendarDays className="mr-1 h-4 w-4" /> {t("bookSiteVisit")}
        </Button>
      </div>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.fullName.trim() || !form.phone.trim()) {
            toast.error("Name and phone required");
            return;
          }
          mut.mutate();
        }}
      >
        <div>
          <Label className="text-xs">{t("yourName")}</Label>
          <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
        </div>
        <div>
          <Label className="text-xs">{t("phone")}</Label>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
        </div>
        <div>
          <Label className="text-xs">{t("email")}</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <Label className="text-xs">{t("message")}</Label>
          <Textarea rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
        </div>
        <Button type="submit" className="w-full" disabled={mut.isPending}>
          {mut.isPending ? t("loading") : t("send")}
        </Button>
      </form>
    </div>
  );
}
