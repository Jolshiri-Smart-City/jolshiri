export type PropertyStatus = "available" | "booked" | "sold";
export type FacingDirection =
  | "north" | "south" | "east" | "west"
  | "north_east" | "north_west" | "south_east" | "south_west";
export type ConstructionStage = "planning" | "foundation" | "structure" | "finishing" | "ready";
export type MediaType = "photo" | "floor_plan" | "video" | "virtual_tour";

export interface ListingRow {
  id: string;
  unit_number: string;
  price_total: number;
  price_per_sqft: number | null;
  size_sqft: number;
  bedrooms: number;
  bathrooms: number | null;
  floor_number: number | null;
  status: PropertyStatus;
  possession_date: string | null;
  is_ready_to_move: boolean | null;
  facing: FacingDirection | null;
  created_at: string;
  project_name: string;
  sector: string;
  block: string | null;
  developer_name: string;
  cover_photo_url: string | null;
}

export interface PropertyDetail {
  id: string;
  project_id: string;
  unit_number: string;
  floor_number: number | null;
  total_floors: number | null;
  price_total: number;
  price_per_sqft: number | null;
  booking_money: number | null;
  payment_plan: Array<{ label: string; amount: number }> | null;
  is_negotiable: boolean;
  size_sqft: number;
  bedrooms: number;
  bathrooms: number | null;
  facing: FacingDirection | null;
  has_balcony: boolean | null;
  status: PropertyStatus;
  possession_date: string | null;
  is_ready_to_move: boolean | null;
  construction_stage: ConstructionStage | null;
  plot_road_number: string | null;
  description: string | null;
  ownership_docs_available: boolean | null;
  registration_type: string | null;
  project: { name: string; sector: string; block: string | null; description: string | null; developer: { name: string } };
  media: Array<{ id: string; media_type: MediaType; url: string; display_order: number }>;
  amenities: Array<{ id: string; name: string }>;
}

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  bedrooms?: number;
  sector?: string;
  status?: PropertyStatus;
  facing?: FacingDirection;
  possessionBefore?: string;
  amenities?: string[];
  sort?: "price_asc" | "price_desc" | "size" | "newest" | "possession";
}
