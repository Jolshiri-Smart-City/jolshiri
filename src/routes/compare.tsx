import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ListingRow } from "@/lib/types";
import { formatBDT, useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "Compare properties — Jolshiri" }] }),
  component: ComparePage,
});

const KEY = "jolshiri:compare";

export function getCompareIds(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]; } catch { return []; }
}
export function setCompareIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(ids.slice(0, 3)));
  window.dispatchEvent(new Event("jolshiri:compare-change"));
}
export function toggleCompare(id: string) {
  const cur = getCompareIds();
  setCompareIds(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(0, 3));
}

function ComparePage() {
  const { t, lang } = useI18n();
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<ListingRow[]>([]);

  useEffect(() => {
    const sync = () => setIds(getCompareIds());
    sync();
    window.addEventListener("jolshiri:compare-change", sync);
    return () => window.removeEventListener("jolshiri:compare-change", sync);
  }, []);

  useEffect(() => {
    if (ids.length === 0) { setItems([]); return; }
    supabase.from("property_listing_view").select("*").in("id", ids).then(({ data }) => {
      const rows = (data ?? []) as ListingRow[];
      // preserve order of ids
      setItems(ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as ListingRow[]);
    });
  }, [ids]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("properties")}
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">Compare properties</h1>
      <p className="mt-1 text-sm text-muted-foreground">Up to 3 listings side-by-side.</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Add listings from the property page using the "Compare" button.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border/70">
          <table className="w-full text-sm">
            <tbody>
              <Row label="" cells={items.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-2">
                  <Link to="/properties/$id" params={{ id: p.id }} className="block">
                    <img src={p.cover_photo_url ?? ""} alt="" className="h-24 w-full rounded object-cover" />
                    <div className="mt-1 font-medium">{p.project_name} · Unit {p.unit_number}</div>
                    <div className="text-xs text-muted-foreground">{p.sector}</div>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => { toggleCompare(p.id); }} aria-label="Remove">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))} />
              <Row label="Price" cells={items.map((p) => <span key={p.id} className="font-semibold text-primary">{formatBDT(Number(p.price_total), lang)}</span>)} />
              <Row label="Price / sqft" cells={items.map((p) => p.price_per_sqft ? `৳${Math.round(Number(p.price_per_sqft)).toLocaleString()}` : "—")} />
              <Row label="Size" cells={items.map((p) => `${Math.round(Number(p.size_sqft))} sqft`)} />
              <Row label="Bedrooms" cells={items.map((p) => p.bedrooms)} />
              <Row label="Bathrooms" cells={items.map((p) => p.bathrooms ?? "—")} />
              <Row label="Floor" cells={items.map((p) => p.floor_number ?? "—")} />
              <Row label="Facing" cells={items.map((p) => p.facing?.replace("_", "-") ?? "—")} />
              <Row label="Possession" cells={items.map((p) => p.possession_date ?? (p.is_ready_to_move ? "Ready" : "—"))} />
              <Row label="Status" cells={items.map((p) => <span key={p.id} className="capitalize">{p.status}</span>)} />
              <Row label="Developer" cells={items.map((p) => p.developer_name)} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, cells }: { label: string; cells: React.ReactNode[] }) {
  return (
    <tr className="border-b border-border/60">
      <th className="w-32 bg-secondary/40 px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</th>
      {cells.map((c, i) => <td key={i} className="px-3 py-3 align-top">{c}</td>)}
    </tr>
  );
}
