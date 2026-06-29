import { Link } from "@tanstack/react-router";
import { Bed, Bath, Maximize2, MapPin, MessageSquare } from "lucide-react";
import type { ListingRow } from "@/lib/types";
import { formatBDT, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LeadDialog } from "@/components/LeadDialog";
import { ShareButton } from "@/components/ShareButton";
import { useState } from "react";

const FALLBACK = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80";

export function PropertyCard({ row }: { row: ListingRow }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);

  const statusClass =
    row.status === "available"
      ? "bg-emerald-500 text-white"
      : row.status === "booked"
        ? "bg-amber-500 text-black"
        : "bg-rose-600 text-white";

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to="/properties/$id"
        params={{ id: row.id }}
        className="block"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={row.cover_photo_url ?? FALLBACK}
            alt={`${row.project_name} ${row.unit_number}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span
            className={cn(
              "absolute left-3 top-3 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-md ring-1 ring-black/10",
              statusClass,
            )}
          >
            {t(row.status)}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-display text-lg font-semibold text-foreground">
                {formatBDT(Number(row.price_total), lang)}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.price_per_sqft ? `৳${Math.round(Number(row.price_per_sqft)).toLocaleString()} / ${t("sqft")}` : null}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {t("unit")} {row.unit_number}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{row.bedrooms} {t("beds")}</span>
            {row.bathrooms ? (
              <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{row.bathrooms} {t("baths")}</span>
            ) : null}
            <span className="inline-flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{Math.round(Number(row.size_sqft))} {t("sqft")}</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{row.project_name} · {row.sector}{row.block ? ` · ${row.block}` : ""}</span>
          </div>
        </div>
      </Link>
      <div className="mt-auto flex gap-2 border-t border-border/60 p-3">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to="/properties/$id" params={{ id: row.id }}>{t("viewDetails") ?? "View details"}</Link>
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={(e) => { e.preventDefault(); setOpen(true); }}
        >
          <MessageSquare className="mr-1 h-3.5 w-3.5" />
          {t("inquire") ?? "Inquire"}
        </Button>
      </div>
      <LeadDialog
        open={open}
        onOpenChange={setOpen}
        propertyId={row.id}
        propertyLabel={`${row.project_name} · ${t("unit")} ${row.unit_number}`}
      />
    </div>
  );
}
