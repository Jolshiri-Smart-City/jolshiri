## Jolshiri Smart City – Property Search & Admin Platform

A responsive, bilingual (English/Bangla) property database and search platform for Jolshiri Smart City, built on TanStack Start + Lovable Cloud (Supabase) per your PRD and SQL schema.

### Build order

1. **Enable Lovable Cloud** and apply your full SQL schema as a migration (extensions, enums, tables, triggers, indexes, RLS, the `property_listing_view`, helper functions, seed amenities). The schema is used as-is. I'll add `GRANT` statements so the Data API can actually serve the tables.
2. **Seed demo data** via a separate data migration: 1 developer, 2–3 projects across different sectors, 8–10 properties with varied bedrooms / sizes / prices / statuses, plus 4–6 Unsplash photos and a floor-plan image per property, and amenity links.
3. **Public site**
   - Branded landing page (Jolshiri Smart City hero, value props, featured listings, CTA).
   - **Search page** `/properties` with sidebar filters (price range, size range, bedrooms, sector, possession date, amenities, status, facing), live result count, sort (price, size, newest, possession), card grid (cover photo, price, size, bedrooms, sector, status badge), "closest matches" fallback when zero exact results.
   - **Property detail** `/properties/$id` with photo gallery, floor plan, full specs, price breakdown table, payment plan, amenities, "Request Callback" and "Book a Site Visit" forms that write to `leads` (guest-friendly), WhatsApp click-to-chat.
4. **Auth + customer features**: email/password + Google sign-in, profile auto-created via the schema's trigger, favorites (heart button on cards/detail, `/favorites` page).
5. **Admin panel** at `/admin` (gated to `admin`/`agent` role via `_authenticated` layout + role check):
   - Properties table with inline status toggle (available / booked / sold), edit, delete.
   - Add / edit property form (all fields from `properties`, amenity multi-select, media URLs).
   - CSV/Excel bulk import (parse client-side, validate with Zod, insert in batches, show row-level errors).
   - Leads inbox with status pipeline (new → contacted → site_visit → closed).
6. **i18n**: lightweight EN/BN toggle in header, stored in localStorage; all UI strings translated, Bangla numerals optional for prices.
7. **Design system**: Jolshiri brand — deep teal primary, warm gold accent, off-white surfaces, Inter (EN) + Hind Siliguri (BN) typography, semantic tokens in `src/styles.css`. Mobile-first, accessible.

### Technical notes

- Stack: TanStack Start (already scaffolded), Tailwind v4, shadcn/ui, TanStack Query, Lovable Cloud (Supabase).
- Public reads go through a server-publishable Supabase client in a `createServerFn` (RLS-respected, anon-safe).
- Auth-gated mutations (favorites, admin CRUD, lead status updates) use `requireSupabaseAuth` server functions.
- Lead submissions from guests use the anon-allowed `insert` policy in your schema.
- CSV import: `papaparse` for CSV, `xlsx` (SheetJS) for Excel, processed in the browser and submitted to an admin-gated server fn.
- Demo images: Unsplash URLs stored directly in `property_media.url` — no binary uploads.
- Maps and saved-search alerts are explicitly Phase 2/3 in your PRD — not included now.

### Out of this iteration (per PRD phases)

Saved searches with alerts, comparison tool, agent CRM dashboard, interactive Jolshiri sector map, virtual tours, EMI calculator, online payment.

### One thing to confirm

This is a large build (schema + public site + auth + admin + bulk import + i18n + demo data). I'll ship it as one cohesive first pass and we can refine afterwards. If you'd rather I deliver in smaller verifiable chunks (e.g. Step 1: schema + search + listing only, then Step 2: admin + import, then Step 3: auth + favorites + i18n), say the word before approving.
