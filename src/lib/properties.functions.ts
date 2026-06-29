import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ListingRow, PropertyDetail, SearchFilters } from "./types";

const filtersSchema = z.object({
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
  bedrooms: z.number().optional(),
  sector: z.string().optional(),
  status: z.enum(["available", "booked", "sold"]).optional(),
  facing: z
    .enum(["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"])
    .optional(),
  possessionBefore: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  sort: z.enum(["price_asc", "price_desc", "size", "newest", "possession"]).optional(),
  limit: z.number().optional(),
});

export const searchProperties = createServerFn({ method: "POST" })
  .inputValidator((input: SearchFilters & { limit?: number }) => filtersSchema.parse(input))
  .handler(async ({ data }) => {
    const { getPublicSupabase } = await import("./supabase-server");
    const supabase = getPublicSupabase();

    // If amenity filter present, look up matching property IDs first
    let amenityFilteredIds: string[] | null = null;
    if (data.amenities && data.amenities.length > 0) {
      const { data: am } = await supabase
        .from("amenities")
        .select("id")
        .in("name", data.amenities);
      const amenityIds = (am ?? []).map((a: { id: string }) => a.id);
      if (amenityIds.length === 0) {
        return { exact: [] as ListingRow[], closest: [] as ListingRow[], total: 0 };
      }
      const { data: pa } = await supabase
        .from("property_amenities")
        .select("property_id, amenity_id")
        .in("amenity_id", amenityIds);
      const counts = new Map<string, number>();
      for (const row of pa ?? []) {
        counts.set(row.property_id, (counts.get(row.property_id) ?? 0) + 1);
      }
      amenityFilteredIds = Array.from(counts.entries())
        .filter(([, c]) => c >= amenityIds.length)
        .map(([id]) => id);
      if (amenityFilteredIds.length === 0) {
        return { exact: [] as ListingRow[], closest: [] as ListingRow[], total: 0 };
      }
    }

    const buildQuery = (strict: boolean) => {
      let q = supabase.from("property_listing_view").select("*", { count: "exact" });
      if (amenityFilteredIds) q = q.in("id", amenityFilteredIds);
      if (strict) {
        if (data.minPrice !== undefined) q = q.gte("price_total", data.minPrice);
        if (data.maxPrice !== undefined) q = q.lte("price_total", data.maxPrice);
        if (data.minSize !== undefined) q = q.gte("size_sqft", data.minSize);
        if (data.maxSize !== undefined) q = q.lte("size_sqft", data.maxSize);
        if (data.bedrooms !== undefined) q = q.eq("bedrooms", data.bedrooms);
        if (data.facing) q = q.eq("facing", data.facing);
        if (data.possessionBefore) q = q.lte("possession_date", data.possessionBefore);
      }
      if (data.sector) q = q.eq("sector", data.sector);
      if (data.status) q = q.eq("status", data.status);

      switch (data.sort) {
        case "price_asc": q = q.order("price_total", { ascending: true }); break;
        case "price_desc": q = q.order("price_total", { ascending: false }); break;
        case "size": q = q.order("size_sqft", { ascending: false }); break;
        case "possession": q = q.order("possession_date", { ascending: true, nullsFirst: false }); break;
        default: q = q.order("created_at", { ascending: false });
      }
      return q.limit(data.limit ?? 60);
    };

    const { data: exact, count } = await buildQuery(true);
    let closest: ListingRow[] = [];
    if ((exact?.length ?? 0) === 0) {
      const { data: fallback } = await buildQuery(false);
      closest = (fallback as ListingRow[] | null) ?? [];
    }
    return {
      exact: (exact as ListingRow[] | null) ?? [],
      closest,
      total: count ?? 0,
    };
  });

export const getProperty = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { getPublicSupabase } = await import("./supabase-server");
    const supabase = getPublicSupabase();
    const { data: prop, error } = await supabase
      .from("properties")
      .select(
        `id, project_id, unit_number, floor_number, total_floors, price_total, price_per_sqft,
         booking_money, payment_plan, is_negotiable, size_sqft, bedrooms, bathrooms, facing,
         has_balcony, status, possession_date, is_ready_to_move, construction_stage,
         plot_road_number, description, ownership_docs_available, registration_type,
         project:projects(name, sector, block, description, developer:developers(name)),
         media:property_media(id, media_type, url, display_order),
         property_amenities(amenities(id, name))`,
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!prop) return null;
    const raw = prop as unknown as PropertyDetail & {
      property_amenities?: Array<{ amenities: { id: string; name: string } | { id: string; name: string }[] }>;
    };
    const amenities = (raw.property_amenities ?? []).flatMap((pa) =>
      Array.isArray(pa.amenities) ? pa.amenities : [pa.amenities],
    );
    const mapped: PropertyDetail = { ...raw, amenities };
    mapped.media = (mapped.media ?? []).sort((a, b) => a.display_order - b.display_order);
    return mapped;
  });

export const listSectors = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicSupabase } = await import("./supabase-server");
  const supabase = getPublicSupabase();
  const { data } = await supabase.from("projects").select("sector");
  const set = new Set<string>();
  for (const r of (data ?? []) as { sector: string }[]) set.add(r.sector);
  return Array.from(set).sort();
});

export const listAmenities = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicSupabase } = await import("./supabase-server");
  const supabase = getPublicSupabase();
  const { data } = await supabase.from("amenities").select("id, name").order("name");
  return (data ?? []) as Array<{ id: string; name: string }>;
});

export const featuredProperties = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicSupabase } = await import("./supabase-server");
  const supabase = getPublicSupabase();
  const { data } = await supabase
    .from("property_listing_view")
    .select("*")
    .eq("status", "available")
    .order("price_total", { ascending: false })
    .limit(6);
  return (data ?? []) as ListingRow[];
});

export const similarProperties = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; sector: string; bedrooms: number }) =>
    z.object({ id: z.string().uuid(), sector: z.string(), bedrooms: z.number() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getPublicSupabase } = await import("./supabase-server");
    const supabase = getPublicSupabase();
    const { data: rows } = await supabase
      .from("property_listing_view")
      .select("*")
      .eq("sector", data.sector)
      .eq("status", "available")
      .neq("id", data.id)
      .order("bedrooms", { ascending: true })
      .limit(6);
    return (rows ?? []) as ListingRow[];
  });

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: {
    propertyId?: string;
    fullName: string;
    phone: string;
    email?: string;
    message?: string;
    requestType?: string;
    sourceFilters?: SearchFilters;
  }) =>
    z
      .object({
        propertyId: z.string().uuid().optional(),
        fullName: z.string().trim().min(1).max(120),
        phone: z.string().trim().min(5).max(40),
        email: z.string().trim().email().max(200).optional().or(z.literal("").transform(() => undefined)),
        message: z.string().trim().max(2000).optional(),
        requestType: z.string().max(40).optional(),
        sourceFilters: z.any().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { getPublicSupabase } = await import("./supabase-server");
    const supabase = getPublicSupabase();
    const { error } = await supabase.from("leads").insert({
      property_id: data.propertyId ?? null,
      full_name: data.fullName,
      phone: data.phone,
      email: data.email ?? null,
      message: data.message ?? null,
      request_type: data.requestType ?? "callback",
      source_filters: data.sourceFilters ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
