## Build plan — Jolshiri platform upgrades

Four bundles, shipped in order so each one is verifiable before the next.

---

### 1. Generated Jolshiri brand visuals (quick win, ships first)

Generate three branded assets and apply them as the new defaults in `site_settings`:

- **Hero image** — aerial render of a planned smart-city skyline at golden hour, teal water + warm gold lights (Jolshiri vibe).
- **Logo** — minimal mark combining a leaf/water-drop with a building silhouette, teal + gold, transparent PNG.
- **Sector map illustration** — stylized top-down map of sectors, used later in the map view and on the About area.

Saved as project assets, then the seed/migration updates `site_settings.brand` and `site_settings.hero` to point at them. Admin Settings tab still lets you override.

---

### 2. Image uploads to storage (foundation for everything else)

Replace every URL-only field with drag-and-drop uploads using Lovable Cloud Storage.

- Create public buckets: `property-photos`, `floor-plans`, `branding`.
- RLS: public read; authenticated admins write/delete (uses existing `is_admin()` helper).
- New `<ImageUploader />` component (single + multi, drag-drop, preview, progress, reorder, set-cover, delete).
- Wire into:
  - **Listing form** → photos (multi, reorderable, cover flag) + floor plan (single). Writes to `property_media`.
  - **Site Settings** → hero image, brand logo upload.
- Existing URL inputs kept as a "paste URL" fallback tab.

---

### 3. Admin productivity pack

**a. Dashboard home (`/admin` landing)**
- KPI cards: total listings, available / booked / sold, new leads (7d / 30d), conversion %, avg price/sqft.
- Charts (Recharts): leads over time (line), listings by status (donut), top sectors by inquiries (bar), price distribution (histogram).
- "Recent leads" + "Recently updated listings" tables.

**b. Lead Kanban + CRM**
- Replace flat leads table with drag-and-drop Kanban: New → Contacted → Site Visit → Negotiation → Won → Lost.
- Lead drawer: full contact, linked property card, **assignee** (dropdown of admin/agent users), **internal notes** (new table `lead_notes`), follow-up date, and an **activity timeline** built from `lead_status_history` + notes.
- Schema additions: `leads.assigned_to uuid`, `leads.follow_up_at timestamptz`, new `lead_notes` table (id, lead_id, author_id, body, created_at) with RLS + grants.
- Filters: by assignee, status, date range, source property. Bulk status change + CSV export.

**c. Audit log viewer**
- New "Activity" tab surfacing `admin_audit_log` with actor email, action, table, record id, before/after diff, timestamp. Filter by actor/table/date.

**d. Role-aware admin UI**
- Admin: sees everything.
- Agent (sales): sees only leads assigned to them + all listings (read).
- Designated/viewer role added (read-only dashboard + leads).
- Header "Admin" link respects role; tabs hidden per role.

---

### 4. Buyer UX upgrades

- **Lightbox gallery** on detail page (keyboard + swipe, thumbnails, fullscreen).
- **EMI calculator** card on detail page (price, down %, tenure yrs, rate % → monthly payment, total interest).
- **Compare** — pick up to 3 listings → `/compare` side-by-side specs table.
- **WhatsApp floating CTA** on detail page, prefilled with unit + URL; phone number editable in Site Settings.
- **Similar properties** carousel (same project or ±20% price, same bedrooms).
- **Sticky filter bar** with live result count and "no exact matches → nearest" fallback on search.
- **Skeleton loaders + empty states** on listings, search, detail.
- **Price formatting**: Lakh/Crore with Bangla numeral toggle (already partial — finish it).
- **SEO**: per-listing dynamic `og:image` from cover photo, `JSON-LD RealEstateListing`, sitemap.xml route.

---

### Technical notes

**Schema migration**
```text
- buckets: property-photos, floor-plans, branding (public read, admin write)
- leads: add assigned_to uuid refs profiles, follow_up_at timestamptz
- new table: lead_notes (id, lead_id fk, author_id fk profiles, body text, created_at)
- enum app_role: add 'viewer' role (or reuse 'agent' if user prefers)
- GRANTs on every new table; RLS using is_admin() / is_agent_or_admin()
```

**New routes**
- `/admin` → dashboard home (was listings; listings moves to `/admin/listings`)
- `/admin/leads` → Kanban
- `/admin/activity` → audit log
- `/compare` → buyer compare view
- `/sitemap.xml` → server route

**New components**
- `ImageUploader`, `KanbanBoard`, `LeadDrawer`, `ActivityTimeline`, `EmiCalculator`, `Lightbox`, `WhatsAppFab`, `SimilarProperties`, `KpiCard`, `StatusDonut`, `LeadsLineChart`.

**Libraries to add**
- `@dnd-kit/core` + `@dnd-kit/sortable` (Kanban + photo reorder)
- `recharts` (already common; confirm and add if missing)
- `yet-another-react-lightbox` (gallery)

**Out of scope (deferred per your earlier reply)**
- Email/SMS notifications, saved-search alerts, 2FA, map view, dark mode, password reset flow. We can add any of these next.

---

### Delivery order

1. Brand visuals + Site Settings defaults (small, immediate visual lift).
2. Image upload buckets + uploader wired into listing form & settings.
3. Schema migration for leads (assignee, notes, follow-up) + role expansion.
4. Admin dashboard home + Kanban + audit viewer + role-aware UI.
5. Buyer UX upgrades (lightbox, EMI, compare, WhatsApp, similar, SEO).

Each step is independently verifiable in the preview before moving on.
