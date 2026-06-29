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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, formatBDT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/lib/types";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { SingleImageUploader, PhotoUploader, type MediaItem } from "@/components/ImageUploader";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { LeadKanban } from "@/components/admin/LeadKanban";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

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
  const isAdmin = role === "admin";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t("admin")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage listings, leads, attributes and site settings.</p>
      <Tabs defaultValue={isAdmin ? "dashboard" : "leads"} className="mt-6">
        <TabsList className="flex-wrap">
          {isAdmin && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          {isAdmin && <TabsTrigger value="attributes">Attributes</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
          {isAdmin && <TabsTrigger value="activity">Activity</TabsTrigger>}
          {isAdmin && <TabsTrigger value="settings">Site settings</TabsTrigger>}
        </TabsList>
        {isAdmin && <TabsContent value="dashboard"><DashboardStats /></TabsContent>}
        <TabsContent value="leads"><LeadKanban /></TabsContent>
        <TabsContent value="listings"><ListingsAdmin /></TabsContent>
        {isAdmin && <TabsContent value="attributes"><AttributesAdmin /></TabsContent>}
        {isAdmin && <TabsContent value="users"><UsersAdmin /></TabsContent>}
        {isAdmin && <TabsContent value="activity"><AuditLogViewer /></TabsContent>}
        {isAdmin && <TabsContent value="settings"><SettingsAdmin /></TabsContent>}
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

function useAmenities() {
  return useQuery({
    queryKey: ["admin", "amenities"],
    queryFn: async () => {
      const { data } = await supabase.from("amenities").select("id, name").order("name");
      return (data ?? []) as Array<{ id: string; name: string }>;
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
        <div className="text-sm text-muted-foreground">{listQ.data?.length ?? 0} listings</div>
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
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<Set<string>>(new Set());
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [floorPlan, setFloorPlan] = useState<string>("");
  const amenitiesQ = useAmenities();

  useEffect(() => {
    setForm(row ?? { status: "available", bedrooms: 3 });
    if (row?.id) {
      supabase
        .from("property_amenities")
        .select("amenity_id")
        .eq("property_id", row.id)
        .then(({ data }) => {
          setSelectedAmenityIds(new Set((data ?? []).map((r: { amenity_id: string }) => r.amenity_id)));
        });
      supabase
        .from("property_media")
        .select("id, url, media_type, display_order")
        .eq("property_id", row.id)
        .order("display_order")
        .then(({ data }) => {
          const all = (data ?? []) as MediaItem[];
          setPhotos(all.filter((m) => m.media_type === "photo"));
          setFloorPlan(all.find((m) => m.media_type === "floor_plan")?.url ?? "");
        });
    } else {
      setSelectedAmenityIds(new Set());
      setPhotos([]);
      setFloorPlan("");
    }
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
      let propertyId = row?.id;
      if (isEdit) {
        const { error } = await supabase.from("properties").update(payload).eq("id", row!.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("properties").insert(payload).select("id").single();
        if (error) throw error;
        propertyId = (data as { id: string }).id;
      }
      if (propertyId) {
        await supabase.from("property_amenities").delete().eq("property_id", propertyId);
        const amenityRows = Array.from(selectedAmenityIds).map((amenity_id) => ({ property_id: propertyId!, amenity_id }));
        if (amenityRows.length > 0) {
          const { error } = await supabase.from("property_amenities").insert(amenityRows);
          if (error) throw error;
        }
        // Sync media: wipe and re-insert (simple, predictable)
        await supabase.from("property_media").delete().eq("property_id", propertyId);
        const mediaRows: Array<{ property_id: string; url: string; media_type: "photo" | "floor_plan"; display_order: number }> = [];
        photos.forEach((p, i) => mediaRows.push({ property_id: propertyId!, url: p.url, media_type: "photo", display_order: i }));
        if (floorPlan) mediaRows.push({ property_id: propertyId!, url: floorPlan, media_type: "floor_plan", display_order: 0 });
        if (mediaRows.length > 0) {
          const { error } = await supabase.from("property_media").insert(mediaRows);
          if (error) throw error;
        }
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

  function toggleAmenity(id: string) {
    setSelectedAmenityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

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
            <Label>Amenities</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-border/60 p-3 text-sm sm:grid-cols-3">
              {(amenitiesQ.data ?? []).map((a) => (
                <label key={a.id} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAmenityIds.has(a.id)}
                    onChange={() => toggleAmenity(a.id)}
                  />
                  {a.name}
                </label>
              ))}
              {amenitiesQ.data?.length === 0 && (
                <span className="text-muted-foreground">No amenities yet — add them in the Attributes tab.</span>
              )}
            </div>
          </div>
          <div>
            <PhotoUploader bucket="property-photos" items={photos} onChange={setPhotos} label="Photos" />
          </div>
          <div>
            <SingleImageUploader
              bucket="floor-plans"
              value={floorPlan}
              onChange={setFloorPlan}
              label="Floor plan"
              aspect="video"
            />
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

/* ---------------- Attributes (Projects + Amenities) ---------------- */

function AttributesAdmin() {
  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <DevelopersManager />
      <ProjectsManager />
      <AmenitiesManager />
      <FaqsManager />
    </div>
  );
}

function DevelopersManager() {
  const qc = useQueryClient();
  const devsQ = useQuery({
    queryKey: ["admin", "developers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("developers")
        .select("id, name, contact_phone, contact_email, logo_url, verified, is_active")
        .order("name");
      return (data ?? []) as Array<{ id: string; name: string; contact_phone: string | null; contact_email: string | null; logo_url: string | null; verified: boolean | null; is_active: boolean | null }>;
    },
  });
  const [editing, setEditing] = useState<{ id?: string; name: string; contact_phone: string; contact_email: string; logo_url: string; verified: boolean; is_active: boolean }>({
    name: "", contact_phone: "", contact_email: "", logo_url: "", verified: false, is_active: true,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!editing.name.trim()) throw new Error("Name required");
      const payload = {
        name: editing.name.trim(),
        contact_phone: editing.contact_phone.trim() || null,
        contact_email: editing.contact_email.trim() || null,
        logo_url: editing.logo_url.trim() || null,
        verified: editing.verified,
        is_active: editing.is_active,
      };
      if (editing.id) {
        const { error } = await supabase.from("developers").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("developers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing.id ? "Updated" : "Added");
      setEditing({ name: "", contact_phone: "", contact_email: "", logo_url: "", verified: false, is_active: true });
      qc.invalidateQueries({ queryKey: ["admin", "developers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("developers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "developers"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border border-border/70 bg-card p-4">
      <h3 className="font-display text-lg font-semibold">Developers</h3>
      <p className="text-xs text-muted-foreground">Companies that build the projects. Used when creating projects.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input placeholder="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
        <Input placeholder="Contact phone" value={editing.contact_phone} onChange={(e) => setEditing({ ...editing, contact_phone: e.target.value })} />
        <Input placeholder="Contact email" type="email" value={editing.contact_email} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })} />
        <Input placeholder="Logo URL" value={editing.logo_url} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={editing.verified} onChange={(e) => setEditing({ ...editing, verified: e.target.checked })} /> Verified
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          {editing.id && (
            <Button variant="outline" size="sm" onClick={() => setEditing({ name: "", contact_phone: "", contact_email: "", logo_url: "", verified: false, is_active: true })}>Cancel</Button>
          )}
          <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            <Plus className="mr-1 h-4 w-4" />{editing.id ? "Update" : "Add"}
          </Button>
        </div>
      </div>
      <ul className="mt-3 divide-y divide-border/60 text-sm">
        {(devsQ.data ?? []).map((d) => (
          <li key={d.id} className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">{d.name} {d.verified && <span className="ml-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">VERIFIED</span>}</div>
              <div className="text-xs text-muted-foreground">{d.contact_phone ?? "—"} · {d.contact_email ?? "—"}</div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setEditing({
                id: d.id, name: d.name, contact_phone: d.contact_phone ?? "", contact_email: d.contact_email ?? "",
                logo_url: d.logo_url ?? "", verified: !!d.verified, is_active: d.is_active ?? true,
              })}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${d.name}?`)) delMut.mutate(d.id); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FaqItem { q: string; a: string }

function FaqsManager() {
  const qc = useQueryClient();
  const { data: settings } = useSiteSettings();
  const [items, setItems] = useState<FaqItem[]>([]);

  useEffect(() => {
    const raw = (settings as { faqs?: FaqItem[] } | undefined)?.faqs;
    if (Array.isArray(raw)) setItems(raw);
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { updateSiteSetting } = await import("@/lib/site-settings.functions");
      const clean = items.filter((f) => f.q.trim() && f.a.trim());
      await updateSiteSetting({ data: { key: "faqs", value: { items: clean } as never } });
    },
    onSuccess: () => { toast.success("FAQs saved"); qc.invalidateQueries({ queryKey: ["site_settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Support both legacy array and {items: []} shape
  useEffect(() => {
    const raw = (settings as { faqs?: FaqItem[] | { items?: FaqItem[] } } | undefined)?.faqs;
    if (raw && !Array.isArray(raw) && Array.isArray((raw as { items?: FaqItem[] }).items)) {
      setItems((raw as { items: FaqItem[] }).items);
    }
  }, [settings]);

  return (
    <div className="rounded-lg border border-border/70 bg-card p-4">
      <h3 className="font-display text-lg font-semibold">FAQs</h3>
      <p className="text-xs text-muted-foreground">Shown on every property detail page above the default FAQs.</p>
      <div className="mt-3 space-y-3">
        {items.map((f, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">FAQ #{i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Input placeholder="Question" value={f.q} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, q: e.target.value } : x))} />
            <Textarea rows={2} placeholder="Answer" value={f.a} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, a: e.target.value } : x))} />
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground">No custom FAQs yet.</p>}
      </div>
      <div className="mt-3 flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setItems([...items, { q: "", a: "" }])}>
          <Plus className="mr-1 h-4 w-4" />Add FAQ
        </Button>
        <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? "Saving…" : "Save FAQs"}
        </Button>
      </div>
    </div>
  );
}

function ProjectsManager() {
  const qc = useQueryClient();
  const projects = useProjects();
  const devsQ = useQuery({
    queryKey: ["admin", "developers"],
    queryFn: async () => {
      const { data } = await supabase.from("developers").select("id, name").order("name");
      return (data ?? []) as Array<{ id: string; name: string }>;
    },
  });
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [developerId, setDeveloperId] = useState("");

  const addMut = useMutation({
    mutationFn: async () => {
      if (!name || !sector || !developerId) throw new Error("Name, sector and developer required");
      const { error } = await supabase.from("projects").insert({ name, sector, developer_id: developerId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project added");
      setName(""); setSector("");
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
      qc.invalidateQueries({ queryKey: ["sectors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border border-border/70 bg-card p-4">
      <h3 className="font-display text-lg font-semibold">Projects</h3>
      <p className="text-xs text-muted-foreground">Add or remove projects shown in the listing form and filters.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Sector" value={sector} onChange={(e) => setSector(e.target.value)} />
        <Select value={developerId} onValueChange={setDeveloperId}>
          <SelectTrigger><SelectValue placeholder="Developer" /></SelectTrigger>
          <SelectContent>
            {(devsQ.data ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => addMut.mutate()} disabled={addMut.isPending}><Plus className="mr-1 h-4 w-4" />Add</Button>
      </div>
      <ul className="mt-3 divide-y divide-border/60 text-sm">
        {(projects.data ?? []).map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2">
            <span><span className="font-medium">{p.name}</span> · <span className="text-muted-foreground">{p.sector}</span></span>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${p.name}?`)) delMut.mutate(p.id); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AmenitiesManager() {
  const qc = useQueryClient();
  const amenities = useAmenities();
  const [name, setName] = useState("");

  const addMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("amenities").insert({ name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Amenity added");
      setName("");
      qc.invalidateQueries({ queryKey: ["admin", "amenities"] });
      qc.invalidateQueries({ queryKey: ["amenities"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("amenities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "amenities"] });
      qc.invalidateQueries({ queryKey: ["amenities"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border border-border/70 bg-card p-4">
      <h3 className="font-display text-lg font-semibold">Amenities</h3>
      <p className="text-xs text-muted-foreground">
        Used as filter chips on the search page and checkboxes in the listing form.
      </p>
      <div className="mt-3 flex gap-2">
        <Input placeholder="Amenity name (e.g. Gym)" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={() => addMut.mutate()} disabled={addMut.isPending}><Plus className="mr-1 h-4 w-4" />Add</Button>
      </div>
      <ul className="mt-3 divide-y divide-border/60 text-sm">
        {(amenities.data ?? []).map((a) => (
          <li key={a.id} className="flex items-center justify-between py-2">
            <span>{a.name}</span>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${a.name}?`)) delMut.mutate(a.id); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Users ---------------- */

function UsersAdmin() {
  const qc = useQueryClient();
  const usersQ = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { listUsers } = await import("@/lib/admin-users.functions");
      return await listUsers();
    },
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "agent" as "admin" | "agent" | "buyer" });

  const createMut = useMutation({
    mutationFn: async () => {
      const { createAdminUser } = await import("@/lib/admin-users.functions");
      return await createAdminUser({ data: form });
    },
    onSuccess: () => {
      toast.success("User created");
      setOpen(false);
      setForm({ email: "", password: "", fullName: "", role: "agent" });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMut = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "admin" | "agent" | "buyer" }) => {
      const { updateUserRole } = await import("@/lib/admin-users.functions");
      return await updateUserRole({ data: { id, role } });
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { deleteAdminUser } = await import("@/lib/admin-users.functions");
      return await deleteAdminUser({ data: { id } });
    },
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{usersQ.data?.length ?? 0} users</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Add user</Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/70">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {usersQ.isLoading ? (
              <tr><td colSpan={4} className="p-4"><Skeleton className="h-20 w-full" /></td></tr>
            ) : (usersQ.data ?? []).map((u) => (
              <tr key={u.id} className="border-t border-border/60">
                <td className="px-3 py-2 font-medium">
                  <div>{u.full_name ?? "—"}</div>
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                <td className="px-3 py-2">
                  <RoleCheckboxes
                    value={u.role as "admin" | "agent" | "buyer"}
                    onChange={(role) => roleMut.mutate({ id: u.id, role })}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${u.email}?`)) delMut.mutate(u.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add user</DialogTitle></DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}
          >
            <div><Label>Full name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><Label>Password (min 8)</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as never })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Sales / Agent</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Site settings ---------------- */

function SettingsAdmin() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useSiteSettings();
  const [hero, setHero] = useState({
    title_en: "", title_bn: "", subtitle_en: "", subtitle_bn: "",
    image_url: "", badge_en: "", badge_bn: "",
  });
  const [brand, setBrand] = useState({ name_en: "", name_bn: "", logo_url: "", whatsapp: "" });

  useEffect(() => {
    if (settings?.hero) setHero((h) => ({ ...h, ...settings.hero }));
    if (settings?.brand) setBrand((b) => ({ ...b, ...(settings.brand as typeof b) }));
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { updateSiteSetting } = await import("@/lib/site-settings.functions");
      await updateSiteSetting({ data: { key: "hero", value: hero } });
      await updateSiteSetting({ data: { key: "brand", value: brand } });
    },
    onSuccess: () => {
      toast.success("Site settings saved");
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="mt-4 h-72 w-full" />;

  return (
    <div className="mt-4 space-y-6">
      <div className="rounded-lg border border-border/70 bg-card p-4">
        <h3 className="font-display text-lg font-semibold">Brand</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><Label>Brand name (English)</Label><Input value={brand.name_en} onChange={(e) => setBrand({ ...brand, name_en: e.target.value })} /></div>
          <div><Label>Brand name (Bangla)</Label><Input value={brand.name_bn} onChange={(e) => setBrand({ ...brand, name_bn: e.target.value })} /></div>
          <div>
            <Label>WhatsApp number (with country code)</Label>
            <Input placeholder="+8801XXXXXXXXX" value={brand.whatsapp} onChange={(e) => setBrand({ ...brand, whatsapp: e.target.value })} />
            <p className="mt-1 text-xs text-muted-foreground">Shown as the floating WhatsApp button on listing pages.</p>
          </div>
          <div className="sm:col-span-2">
            <SingleImageUploader
              bucket="branding"
              value={brand.logo_url}
              onChange={(url) => setBrand({ ...brand, logo_url: url })}
              label="Logo"
              aspect="square"
              prefix="logo-"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-card p-4">
        <h3 className="font-display text-lg font-semibold">Hero section</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SingleImageUploader
              bucket="branding"
              value={hero.image_url}
              onChange={(url) => setHero({ ...hero, image_url: url })}
              label="Background image"
              aspect="video"
              prefix="hero-"
            />
          </div>
          <div><Label>Title (English)</Label><Textarea rows={2} value={hero.title_en} onChange={(e) => setHero({ ...hero, title_en: e.target.value })} /></div>
          <div><Label>Title (Bangla)</Label><Textarea rows={2} value={hero.title_bn} onChange={(e) => setHero({ ...hero, title_bn: e.target.value })} /></div>
          <div><Label>Subtitle (English)</Label><Textarea rows={2} value={hero.subtitle_en} onChange={(e) => setHero({ ...hero, subtitle_en: e.target.value })} /></div>
          <div><Label>Subtitle (Bangla)</Label><Textarea rows={2} value={hero.subtitle_bn} onChange={(e) => setHero({ ...hero, subtitle_bn: e.target.value })} /></div>
          <div><Label>Badge (English)</Label><Input value={hero.badge_en} onChange={(e) => setHero({ ...hero, badge_en: e.target.value })} /></div>
          <div><Label>Badge (Bangla)</Label><Input value={hero.badge_bn} onChange={(e) => setHero({ ...hero, badge_bn: e.target.value })} /></div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
