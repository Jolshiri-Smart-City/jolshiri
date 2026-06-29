import { useQuery } from "@tanstack/react-query";
import { Building2, ShoppingBag, Users2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStats() {
  const q = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: async () => {
      const [props, leads, sectors] = await Promise.all([
        supabase.from("properties").select("status"),
        supabase.from("leads").select("id, status, created_at, property_id"),
        supabase.from("property_listing_view").select("sector"),
      ]);
      const counts = { available: 0, booked: 0, sold: 0 };
      for (const p of (props.data ?? []) as Array<{ status: keyof typeof counts }>) counts[p.status]++;

      const leadStatus = { new: 0, contacted: 0, site_visit: 0, closed: 0 } as Record<string, number>;
      const weekAgo = Date.now() - 7 * 86400000;
      let newWeek = 0;
      for (const l of (leads.data ?? []) as Array<{ status: string; created_at: string }>) {
        leadStatus[l.status] = (leadStatus[l.status] ?? 0) + 1;
        if (new Date(l.created_at).getTime() >= weekAgo) newWeek++;
      }

      const sectorMap = new Map<string, number>();
      for (const r of (sectors.data ?? []) as Array<{ sector: string }>) {
        sectorMap.set(r.sector, (sectorMap.get(r.sector) ?? 0) + 1);
      }
      const sectorData = Array.from(sectorMap.entries())
        .map(([sector, count]) => ({ sector, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      return {
        totalListings: (props.data ?? []).length,
        totalLeads: (leads.data ?? []).length,
        newLeadsWeek: newWeek,
        counts,
        leadStatus,
        sectorData,
        statusData: [
          { name: "Available", count: counts.available, fill: "hsl(150 60% 40%)" },
          { name: "Booked", count: counts.booked, fill: "hsl(38 92% 50%)" },
          { name: "Sold", count: counts.sold, fill: "hsl(0 75% 50%)" },
        ],
      };
    },
  });

  if (q.isLoading) return <Skeleton className="mt-4 h-72 w-full" />;
  const d = q.data!;

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Building2} label="Total listings" value={d.totalListings} sub={`${d.counts.available} available`} />
        <Kpi icon={ShoppingBag} label="Booked + Sold" value={d.counts.booked + d.counts.sold} sub={`${d.counts.sold} sold`} />
        <Kpi icon={Users2} label="Total leads" value={d.totalLeads} sub={`${d.leadStatus.new ?? 0} new`} />
        <Kpi icon={TrendingUp} label="Leads · last 7 days" value={d.newLeadsWeek} sub="inquiries" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Inventory by status">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={d.statusData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Listings by sector">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={d.sectorData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Building2; label: string; value: number; sub: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
