import { Link } from "@tanstack/react-router";
import { Bed, Bath, Maximize2, MapPin } from "lucide-react";
import type { ListingRow } from "@/lib/types";
import { formatBDT, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FALLBACK = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80";

export function PropertyCard({ row }: { row: ListingRow }) {
  const { t, lang } = useI18n();
  const statusClass =
    row.status === "available"
      ? "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30"
      : row.status === "booked"
        ? "bg-[color:var(--warning)]/15 text-[color:var(--foreground)] border-[color:var(--warning)]/40"
        : "bg-[color:var(--sold)]/15 text-[color:var(--sold)] border-[color:var(--sold)]/30";

  return (
    <Link
      to="/properties/$id"
      params={{ id: row.id }}
      className="group block overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
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
            "absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
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
  );
}
