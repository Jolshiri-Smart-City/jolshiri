
# Improvement Plan — Jolshiri Smart City

Four bundles, shipped in this order so each builds on the last.

## 1. Buyer conversion polish

- **Sticky mobile inquiry bar** on property detail (Call, WhatsApp, Inquire) so the CTA is always one tap away.
- **Saved searches + email alerts**: logged-in-free flow — buyer enters email on the search page; a row in `saved_searches` stores the filter JSON; a daily cron server route emails new matches.
- **Share via WhatsApp / Copy link** button on every listing card and detail page (pre-filled message with unit number + price).
- **EMI quick-quote chip** on cards (monthly from ৳X) using the existing calculator logic.
- **Map view toggle** on `/properties` with sector pins (Leaflet + OpenStreetMap, no API key).
- **Mortgage pre-qualification mini-form** on detail page that creates a `lead` tagged `pre_qualified`.

## 2. Content & SEO depth

- **Sector landing pages** (`/sector/$id`) auto-generated from projects, each with own `head()` title/description/og.
- **FAQ accordion + FAQPage JSON-LD** on detail pages (possession, payment plan, handover).
- **OpenGraph image** per listing using the cover photo URL; BreadcrumbList JSON-LD.
- **robots.txt + canonical URLs** site-wide; expand existing sitemap to include sector pages.
- **Blog/news module** (`/news`, `/news/$slug`) with a `posts` table for handover updates and PR.
- **Bangla slug support** on listings (`slug` column, fallback to id).

## 3. Admin operations

- **Bulk edit** on Listings tab: multi-select rows → change status, price, or assign agent in one action.
- **Duplicate listing** button (clones row + media + amenities).
- **Scheduled publish**: `publish_at` column; only listings with `publish_at <= now()` show on public site.
- **Lead SLA timers** on Kanban cards (red after 4h in New, amber after 24h).
- **CSV/Excel export** for leads with current filter applied.
- **WhatsApp + email message templates** stored in `site_settings`, one-click send from lead drawer.
- **Saved filter presets** in the Listings tab (per-user).

## 4. Trust, performance & PWA

- **Image optimization**: serve signed Supabase URLs through `?width=` transforms, add `loading="lazy"` + LQIP blur placeholders, preload LCP hero.
- **Skeleton loaders** on search results and detail page.
- **Installable PWA** (manifest-only first — home screen + icon + theme color). Offline only if asked later.
- **Verified developer badge** on cards (driven by `developers.verified` boolean).
- **Testimonials section** on landing, editable from Site Settings.
- **Page-speed pass**: route-level code splitting check, remove unused Recharts on public bundle, compress hero asset.

## Technical notes

- New tables: `posts` (blog), columns added to `properties` (`slug`, `publish_at`), `site_settings` (`testimonials jsonb`, `message_templates jsonb`).
- New server functions: `subscribeSavedSearch`, `runSavedSearchAlerts` (cron via `/api/public/cron/saved-searches` with HMAC), `exportLeadsCsv`, `duplicateProperty`, `bulkUpdateProperties`.
- New routes: `/sector/$id`, `/news`, `/news/$slug`, `/api/public/cron/saved-searches`, `/manifest.webmanifest`.
- Map: `react-leaflet` + `leaflet`. Lightbox already installed. CSV export via existing `papaparse`.
- All new admin actions gated by `is_admin()` / `is_agent_or_admin()`.

## Out of scope (ask separately)

Native app (Capacitor), payment gateway integration, full offline PWA, AI chatbot, video tours.
