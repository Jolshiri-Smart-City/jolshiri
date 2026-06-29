import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function AuditLogViewer() {
  const q = useQuery({
    queryKey: ["admin", "audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("id, action, table_name, record_id, changes, created_at, admin_id, admin:profiles!admin_audit_log_admin_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (q.isLoading) return <Skeleton className="mt-4 h-72 w-full" />;
  const rows = q.data ?? [];

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border/70">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Admin</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Table</th>
              <th className="px-3 py-2">Record</th>
              <th className="px-3 py-2">Changes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No audit events yet.</td></tr>
            ) : rows.map((r) => {
              const admin = (r as { admin?: { full_name?: string } | { full_name?: string }[] }).admin;
              const adminName = Array.isArray(admin) ? admin[0]?.full_name : admin?.full_name;
              return (
                <tr key={r.id} className="border-t border-border/60 align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{adminName ?? "—"}</td>
                  <td className="px-3 py-2 font-medium capitalize">{r.action}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.table_name}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{r.record_id?.slice(0, 8) ?? "—"}</td>
                  <td className="max-w-[360px] px-3 py-2">
                    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-muted-foreground">{r.changes ? JSON.stringify(r.changes, null, 0).slice(0, 200) : "—"}</pre>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
