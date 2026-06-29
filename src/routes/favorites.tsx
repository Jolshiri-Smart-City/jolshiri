import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { PropertyCard } from "@/components/PropertyCard";
import type { ListingRow } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "My favorites — Jolshiri" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const q = useQuery({
    enabled: !!user,
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favorites")
        .select("property_id")
        .eq("user_id", user!.id);
      const ids = (favs ?? []).map((f) => f.property_id);
      if (ids.length === 0) return [] as ListingRow[];
      const { data } = await supabase
        .from("property_listing_view")
        .select("*")
        .in("id", ids);
      return ((data ?? []) as unknown) as ListingRow[];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t("favorites")}</h1>
      {q.isLoading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : (q.data?.length ?? 0) === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No favorites yet.</p>
          <Link to="/properties" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">{t("browse")} →</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {q.data!.map((row) => <PropertyCard key={row.id} row={row} />)}
        </div>
      )}
    </div>
  );
}
