import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import { toast } from "sonner";
import { Plus, Upload, Trash2, Pencil, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, formatBDT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Jolshiri" }] }),
  component: AdminPage,
});

interface AdminRow {
  id: string;
  unit_number: string;
  project_id: string;
  size_sqft: number;
  bedrooms: number;
  bathrooms: number | null;
  price_total: number;
  price_per_sqft: number | null;
  status: PropertyStatus;
  possession_date: string | null;
  floor_number: number | null;
  total_floors: number | null;
  description: string | null;
  facing: string | null;
  has_balcony: boolean | null;
  booking_money: number | null;
  is_negotiable: boolean | null;
  is_ready_to_move: boolean | null;
  construction_stage: string | null;
  plot_road_number: string | null;
  registration_type: string | null;
  ownership_docs_available: boolean | null;
  lat: number | null;
  lng: number | null;
}

function AdminPage() {
  const { user, role, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (role && role !== "admin" && role !== "agent") {
      toast.error("Admin access required");
      navigate({ to: "/" });
    }
  }, [user, role, loading, navigate]);

  if (!user || (role && role !== "admin" && role !== "agent")) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t("admin")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage listings, status and leads.</p>
      <Tabs defaultValue="listings" className="mt-6">
        <TabsList>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>
        <TabsContent value="listings"><ListingsAdmin /></TabsContent>
        <TabsContent value="leads"><LeadsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function useProjects() {
  return useQuery({
    queryKey: ["admin", "projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name, sector").order("name");
      return (data ?? []) as Array<{ id: string; name: string; sector: string }>;
    },
  });
}

function ListingsAdmin() {
  const qc = useQueryClient();
  const projects = useProjects();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [creating, setCreating] = useState(false);

  const listQ = useQuery({
    queryKey: ["admin", "properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, unit_number, project_id, size_sqft, bedrooms, bathrooms, price_total, price_per_sqft, status, possession_date, floor_number, total_floors, description, facing, has_balcony, booking_money, is_negotiable, is_ready_to_move, construction_stage, plot_road_number, registration_type, ownership_docs_available, lat, lng")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AdminRow[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-properties")
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => {
        qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc]);

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PropertyStatus }) => {
      const { error } = await supabase.from("properties").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleImport(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const projectMap = new Map(projects.data?.map((p) => [p.name.toLowerCase(), p.id]) ?? []);
        const rows = results.data
          .map((r) => {
            const projectId = r.project_id || (r.project_name ? projectMap.get(r.project_name.toLowerCase()) : null);
            if (!projectId || !r.unit_number) return null;
            return {
              project_id: projectId,
              unit_number: r.unit_number,
              size_sqft: Number(r.size_sqft) || 0,
              bedrooms: Number(r.bedrooms) || 0,
              bathrooms: r.bathrooms ? Number(r.bathrooms) : null,
              price_total: Number(r.price_total) || 0,
              price_per_sqft: r.price_per_sqft ? Number(r.price_per_sqft) : null,
              status: (["available","booked","sold"].includes(r.status) ? r.status : "available") as PropertyStatus,
              possession_date: r.possession_date || null,
              floor_number: r.floor_number ? Number(r.floor_number) : null,
              description: r.description || null,
            };
          })
          .filter(Boolean);
        if (rows.length === 0) {
          toast.error("No valid rows. Required: project_id (or project_name), unit_number");
          return;
        }
        const { error } = await supabase.from("properties").insert(rows as never);
        if (error) toast.error(error.message);
        else {
          toast.success(`Imported ${rows.length} listings`);
          qc.invalidateQueries({ queryKey: ["admin", "properties"] });
        }
      },
      error: (err) => toast.error(err.message),
    });
  }

  const projectName = useMemo(
    () => new Map(projects.data?.map((p) => [p.id, `${p.name} · ${p.sector}`]) ?? []),
    [projects.data],
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {listQ.data?.length ?? 0} listings
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1 h-4 w-4" /> CSV import
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" /> New listing
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/70">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Beds</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {listQ.isLoading ? (
                <tr><td colSpan={7} className="p-4"><Skeleton className="h-20 w-full" /></td></tr>
              ) : (listQ.data ?? []).map((row) => (
                <tr key={row.id} className="border-t border-border/60">
                  <td className="px-3 py-2 font-medium">{row.unit_number}</td>
                  <td className="px-3 py-2 text-muted-foreground">{projectName.get(row.project_id) ?? "—"}</td>
                  <td className="px-3 py-2">{row.bedrooms}</td>
                  <td className="px-3 py-2">{Math.round(Number(row.size_sqft))}</td>
                  <td className="px-3 py-2">{formatBDT(Number(row.price_total))}</td>
                  <td className="px-3 py-2">
                    <Select
                      value={row.status}
                      onValueChange={(v) => statusMut.mutate({ id: row.id, status: v as PropertyStatus })}
                    >
                      <SelectTrigger className={cn(
                        "h-8 w-[130px] text-xs",
                        row.status === "available" && "border-[color:var(--success)]/40",
                        row.status === "booked" && "border-[color:var(--warning)]/40",
                        row.status === "sold" && "border-[color:var(--sold)]/40",
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete unit ${row.unit_number}?`)) deleteMut.mutate(row.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ListingDialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        row={editing}
        projects={projects.data ?? []}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "properties"] })}
      />
    </div>
  );
}

function ListingDialog({
  open, onOpenChange, row, projects, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  row: AdminRow | null;
  projects: Array<{ id: string; name: string; sector: string }>;
  onSaved: () => void;
}) {
  const isEdit = !!row;
  const [form, setForm] = useState<Partial<AdminRow>>({});

  useEffect(() => {
    setForm(row ?? { status: "available", bedrooms: 3 });
  }, [row, open]);

  const mut = useMutation({
    mutationFn: async () => {
      const numOrNull = (v: unknown) => (v === "" || v === undefined || v === null ? null : Number(v));
      const payload = {
        project_id: form.project_id!,
        unit_number: form.unit_number!,
        size_sqft: Number(form.size_sqft) || 0,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: numOrNull(form.bathrooms),
        price_total: Number(form.price_total) || 0,
        price_per_sqft: numOrNull(form.price_per_sqft),
        booking_money: numOrNull(form.booking_money),
        status: (form.status ?? "available") as PropertyStatus,
        possession_date: form.possession_date || null,
        floor_number: numOrNull(form.floor_number),
        total_floors: numOrNull(form.total_floors),
        description: form.description || null,
        facing: (form.facing || null) as never,
        has_balcony: !!form.has_balcony,
        is_negotiable: !!form.is_negotiable,
        is_ready_to_move: !!form.is_ready_to_move,
        construction_stage: (form.construction_stage || null) as never,
        plot_road_number: form.plot_road_number || null,
        registration_type: form.registration_type || null,
        ownership_docs_available: !!form.ownership_docs_available,
        lat: numOrNull(form.lat),
        lng: numOrNull(form.lng),
      };
      if (isEdit) {
        const { error } = await supabase.from("properties").update(payload).eq("id", row!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("properties").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Saved" : "Created");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof AdminRow>(k: K, v: AdminRow[K] | string | boolean | number | null) =>
    setForm((f) => ({ ...f, [k]: v as never }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit listing" : "New listing"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.project_id || !form.unit_number) {
              toast.error("Project and unit number required");
              return;
            }
            mut.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Project</Label>
              <Select value={form.project_id ?? ""} onValueChange={(v) => set("project_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} · {p.sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Unit #</Label><Input value={form.unit_number ?? ""} onChange={(e) => set("unit_number", e.target.value)} required /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status ?? "available"} onValueChange={(v) => set("status", v as PropertyStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Floor</Label><Input type="number" value={form.floor_number ?? ""} onChange={(e) => set("floor_number", Number(e.target.value))} /></div>
            <div><Label>Total floors</Label><Input type="number" value={form.total_floors ?? ""} onChange={(e) => set("total_floors", Number(e.target.value))} /></div>
            <div><Label>Bedrooms</Label><Input type="number" value={form.bedrooms ?? ""} onChange={(e) => set("bedrooms", Number(e.target.value))} required /></div>
            <div><Label>Bathrooms</Label><Input type="number" value={form.bathrooms ?? ""} onChange={(e) => set("bathrooms", Number(e.target.value))} /></div>
            <div><Label>Size (sqft)</Label><Input type="number" value={form.size_sqft ?? ""} onChange={(e) => set("size_sqft", Number(e.target.value))} required /></div>
            <div>
              <Label>Facing</Label>
              <Select value={form.facing ?? ""} onValueChange={(v) => set("facing", v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {["north","south","east","west","north_east","north_west","south_east","south_west"].map((f) => (
                    <SelectItem key={f} value={f}>{f.replace("_","-")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Price (BDT)</Label><Input type="number" value={form.price_total ?? ""} onChange={(e) => set("price_total", Number(e.target.value))} required /></div>
            <div><Label>Price/sqft</Label><Input type="number" value={form.price_per_sqft ?? ""} onChange={(e) => set("price_per_sqft", Number(e.target.value))} /></div>
            <div><Label>Booking money</Label><Input type="number" value={form.booking_money ?? ""} onChange={(e) => set("booking_money", Number(e.target.value))} /></div>
            <div><Label>Possession date</Label><Input type="date" value={form.possession_date ?? ""} onChange={(e) => set("possession_date", e.target.value)} /></div>
            <div>
              <Label>Construction stage</Label>
              <Select value={form.construction_stage ?? ""} onValueChange={(v) => set("construction_stage", v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {["planning","foundation","structure","finishing","ready"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Plot / Road #</Label><Input value={form.plot_road_number ?? ""} onChange={(e) => set("plot_road_number", e.target.value)} /></div>
            <div><Label>Registration type</Label><Input value={form.registration_type ?? ""} onChange={(e) => set("registration_type", e.target.value)} /></div>
            <div><Label>Latitude</Label><Input type="number" step="0.000001" value={form.lat ?? ""} onChange={(e) => set("lat", Number(e.target.value))} /></div>
            <div><Label>Longitude</Label><Input type="number" step="0.000001" value={form.lng ?? ""} onChange={(e) => set("lng", Number(e.target.value))} /></div>
          </div>
          <div className="flex flex-wrap gap-4 rounded-md border border-border/60 p-3 text-sm">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.has_balcony} onChange={(e) => set("has_balcony", e.target.checked)} /> Balcony</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.is_negotiable} onChange={(e) => set("is_negotiable", e.target.checked)} /> Negotiable</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.is_ready_to_move} onChange={(e) => set("is_ready_to_move", e.target.checked)} /> Ready to move</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.ownership_docs_available} onChange={(e) => set("ownership_docs_available", e.target.checked)} /> Ownership docs</label>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={4} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function LeadsAdmin() {
  const q = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, full_name, phone, email, message, request_type, status, created_at, property_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border/70">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Message</th>
              <th className="px-3 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              <tr><td colSpan={6} className="p-4"><Skeleton className="h-20 w-full" /></td></tr>
            ) : (q.data ?? []).length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No leads yet.</td></tr>
            ) : (q.data ?? []).map((l) => (
              <tr key={l.id} className="border-t border-border/60">
                <td className="px-3 py-2 font-medium">{l.full_name}</td>
                <td className="px-3 py-2"><a className="text-primary hover:underline" href={`tel:${l.phone}`}>{l.phone}</a></td>
                <td className="px-3 py-2">{l.email ? <a className="text-primary hover:underline" href={`mailto:${l.email}`}><Mail className="inline h-3.5 w-3.5" /> {l.email}</a> : "—"}</td>
                <td className="px-3 py-2 capitalize">{l.request_type ?? "—"}</td>
                <td className="px-3 py-2 max-w-[280px] truncate text-muted-foreground">{l.message ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
