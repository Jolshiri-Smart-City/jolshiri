import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, type DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Mail, Phone, User, StickyNote, GripVertical, Download, LayoutGrid, List as ListIcon, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type LeadStatus = "new" | "contacted" | "site_visit" | "closed";
const COLUMNS: { id: LeadStatus; label: string; tone: string; badge: string }[] = [
  { id: "new", label: "New", tone: "border-sky-500/40 bg-sky-500/5", badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  { id: "contacted", label: "Contacted", tone: "border-amber-500/40 bg-amber-500/5", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { id: "site_visit", label: "Site visit", tone: "border-violet-500/40 bg-violet-500/5", badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30" },
  { id: "closed", label: "Closed", tone: "border-emerald-500/40 bg-emerald-500/5", badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
];

interface LeadRow {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  message: string | null;
  request_type: string | null;
  status: LeadStatus;
  created_at: string;
  property_id: string | null;
  assigned_to: string | null;
}

export function LeadKanban() {
  const qc = useQueryClient();
  const [openLead, setOpenLead] = useState<LeadRow | null>(null);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");

  const leadsQ = useQuery({
    queryKey: ["admin", "leads-kanban"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, full_name, phone, email, message, request_type, status, created_at, property_id, assigned_to")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as LeadRow[];
    },
  });

  const staffQ = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, role").in("role", ["admin", "agent"]);
      return (data ?? []) as Array<{ id: string; full_name: string | null; role: string }>;
    },
  });

  const propsQ = useQuery({
    queryKey: ["admin", "leads-property-labels"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, unit_number, project_id, projects(name)").limit(500);
      const map = new Map<string, string>();
      for (const r of (data ?? []) as Array<{ id: string; unit_number: string; projects: { name: string } | { name: string }[] | null }>) {
        const proj = Array.isArray(r.projects) ? r.projects[0] : r.projects;
        map.set(r.id, `${proj?.name ?? "Project"} · ${r.unit_number}`);
      }
      return map;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () =>
        qc.invalidateQueries({ queryKey: ["admin", "leads-kanban"] }),
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [qc]);

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "leads-kanban"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const byCol = useMemo(() => {
    const map: Record<LeadStatus, LeadRow[]> = { new: [], contacted: [], site_visit: [], closed: [] };
    for (const l of leadsQ.data ?? []) map[l.status].push(l);
    return map;
  }, [leadsQ.data]);

  const filtered = useMemo(() => {
    const all = leadsQ.data ?? [];
    return statusFilter === "all" ? all : all.filter((l) => l.status === statusFilter);
  }, [leadsQ.data, statusFilter]);

  function onDragEnd(e: DragEndEvent) {
    const overId = e.over?.id as LeadStatus | undefined;
    const id = e.active.id as string;
    if (!overId) return;
    const current = (leadsQ.data ?? []).find((l) => l.id === id);
    if (!current || current.status === overId) return;
    statusMut.mutate({ id, status: overId });
  }

  if (leadsQ.isLoading) return <Skeleton className="mt-4 h-72 w-full" />;

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {leadsQ.data?.length ?? 0} lead{(leadsQ.data?.length ?? 0) === 1 ? "" : "s"}
          {view === "kanban" ? " · drag a card to change status" : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {view === "list" && (
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {COLUMNS.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <div className="inline-flex overflow-hidden rounded-md border border-border/70">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn("inline-flex items-center gap-1 px-3 py-1.5 text-xs", view === "list" ? "bg-primary text-primary-foreground" : "bg-background")}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={cn("inline-flex items-center gap-1 px-3 py-1.5 text-xs", view === "kanban" ? "bg-primary text-primary-foreground" : "bg-background")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => exportLeadsCsv(leadsQ.data ?? [])}
            disabled={!leadsQ.data?.length}
          >
            <Download className="mr-1 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <div className="overflow-hidden rounded-lg border border-border/70">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Property</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Assigned</th>
                  <th className="px-3 py-2">Received</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No leads.</td></tr>
                ) : filtered.map((l) => {
                  const assignee = (staffQ.data ?? []).find((s) => s.id === l.assigned_to);
                  return (
                    <tr key={l.id} className="border-t border-border/60 hover:bg-secondary/30">
                      <td className="px-3 py-2 font-medium">{l.full_name}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Phone className="h-3 w-3" />{l.phone}</a>
                          {l.email && <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"><Mail className="h-3 w-3" />{l.email}</a>}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{l.property_id ? (propsQ.data?.get(l.property_id) ?? "—") : "—"}</td>
                      <td className="px-3 py-2 text-xs capitalize">{l.request_type ?? "—"}</td>
                      <td className="px-3 py-2">
                        <Select
                          value={l.status}
                          onValueChange={(v) => statusMut.mutate({ id: l.id, status: v as LeadStatus })}
                        >
                          <SelectTrigger className={cn("h-8 w-[130px] text-xs", COLUMNS.find((c) => c.id === l.status)?.badge)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLUMNS.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{assignee?.full_name ?? "Unassigned"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => setOpenLead(l)}>
                          <MessageSquare className="mr-1 h-3.5 w-3.5" /> Notes
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => (
              <Column key={col.id} col={col} count={byCol[col.id].length}>
                {byCol[col.id].map((lead) => (
                  <Card key={lead.id} lead={lead} onOpen={() => setOpenLead(lead)} />
                ))}
                {byCol[col.id].length === 0 && (
                  <p className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                    Drop leads here
                  </p>
                )}
              </Column>
            ))}
          </div>
        </DndContext>
      )}

      <LeadDrawer
        lead={openLead}
        staff={staffQ.data ?? []}
        propertyLabel={openLead?.property_id ? propsQ.data?.get(openLead.property_id) ?? null : null}
        onClose={() => setOpenLead(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "leads-kanban"] })}
      />
    </div>
  );
}

function Column({ col, count, children }: { col: { id: LeadStatus; label: string; tone: string }; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div ref={setNodeRef} className={cn("rounded-lg border p-3 transition-colors", col.tone, isOver && "ring-2 ring-primary/40")}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">{col.label}</h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Card({ lead, onOpen }: { lead: LeadRow; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("rounded-md border border-border/70 bg-background p-3 text-sm shadow-sm", isDragging && "opacity-50")}
    >
      <div className="flex items-start gap-2">
        <button {...listeners} {...attributes} className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground" aria-label="Drag">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{lead.full_name}</span>
            <button onClick={onOpen} className="text-xs text-primary hover:underline">Open</button>
          </div>
          <a href={`tel:${lead.phone}`} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <Phone className="h-3 w-3" />{lead.phone}
          </a>
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
              <Mail className="h-3 w-3" />{lead.email}
            </a>
          )}
          {lead.request_type && <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{lead.request_type}</div>}
        </div>
      </div>
    </div>
  );
}

function LeadDrawer({
  lead, staff, propertyLabel, onClose, onSaved,
}: {
  lead: LeadRow | null;
  staff: Array<{ id: string; full_name: string | null; role: string }>;
  propertyLabel: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [note, setNote] = useState("");
  const notesQ = useQuery({
    queryKey: ["lead-notes", lead?.id],
    enabled: !!lead,
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_notes")
        .select("id, body, created_at, author:profiles!lead_notes_author_id_fkey(full_name)")
        .eq("lead_id", lead!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const historyQ = useQuery({
    queryKey: ["lead-history", lead?.id],
    enabled: !!lead,
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_status_history")
        .select("id, old_status, new_status, changed_at")
        .eq("lead_id", lead!.id)
        .order("changed_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const assignMut = useMutation({
    mutationFn: async (assigned_to: string | null) => {
      const { error } = await supabase.from("leads").update({ assigned_to }).eq("id", lead!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Assigned"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async (status: LeadStatus) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", lead!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status updated"); onSaved(); historyQ.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const noteMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("lead_notes").insert({
        lead_id: lead!.id, body: note.trim(), author_id: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { setNote(""); notesQ.refetch(); toast.success("Note added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {lead && (
          <>
            <SheetHeader>
              <SheetTitle>{lead.full_name}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 text-sm">
              <div className="space-y-1 rounded-md border border-border/60 bg-secondary/30 p-3">
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /><a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a></div>
                {lead.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /><a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a></div>}
                {propertyLabel && <div className="text-xs"><span className="text-muted-foreground">Property: </span>{propertyLabel}</div>}
                {lead.request_type && <div className="text-xs"><span className="text-muted-foreground">Type: </span><span className="capitalize">{lead.request_type}</span></div>}
                <div className="text-xs text-muted-foreground">Received {new Date(lead.created_at).toLocaleString()}</div>
                {lead.message && <p className="mt-2 whitespace-pre-line text-foreground/90">{lead.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</label>
                  <Select value={lead.status} onValueChange={(v) => statusMut.mutate(v as LeadStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <User className="h-3 w-3" /> Assigned
                  </label>
                  <Select
                    value={lead.assigned_to ?? "unassigned"}
                    onValueChange={(v) => assignMut.mutate(v === "unassigned" ? null : v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name ?? s.id.slice(0, 6)} · {s.role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <StickyNote className="h-3 w-3" /> Internal notes
                </label>
                <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the team…" />
                <Button size="sm" className="mt-2" onClick={() => note.trim() && noteMut.mutate()} disabled={noteMut.isPending}>
                  {noteMut.isPending ? "Saving…" : "Add note"}
                </Button>
                <ul className="mt-3 space-y-2">
                  {(notesQ.data ?? []).map((n) => {
                    const author = (n as { author?: { full_name?: string } | { full_name?: string }[] }).author;
                    const authorName = Array.isArray(author) ? author[0]?.full_name : author?.full_name;
                    return (
                      <li key={n.id} className="rounded-md border border-border/60 bg-card p-2 text-xs">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {authorName ?? "—"} · {new Date(n.created_at).toLocaleString()}
                        </div>
                        <p className="mt-1 whitespace-pre-line">{n.body}</p>
                      </li>
                    );
                  })}
                  {(notesQ.data ?? []).length === 0 && <li className="text-xs text-muted-foreground">No notes yet.</li>}
                </ul>
              </div>

              {(historyQ.data ?? []).length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Status history</label>
                  <ul className="space-y-1 text-xs">
                    {(historyQ.data ?? []).map((h) => {
                      const row = h as { id: string; old_status: string | null; new_status: string; changed_at: string };
                      return (
                        <li key={row.id} className="flex justify-between rounded border border-border/60 bg-card px-2 py-1">
                          <span><span className="text-muted-foreground">{row.old_status ?? "—"}</span> → <span className="font-medium capitalize">{row.new_status.replace("_", " ")}</span></span>
                          <span className="text-muted-foreground">{new Date(row.changed_at).toLocaleString()}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function exportLeadsCsv(rows: LeadRow[]) {
  const headers = ["created_at", "full_name", "phone", "email", "status", "request_type", "message", "property_id", "assigned_to"];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.created_at, r.full_name, r.phone, r.email ?? "", r.status,
      r.request_type ?? "", r.message ?? "", r.property_id ?? "", r.assigned_to ?? "",
    ].map(escape).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jolshiri-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
