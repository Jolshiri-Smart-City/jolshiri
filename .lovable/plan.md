## Problem

The 10 demo listings are still in the database, but the homepage and `/properties` show none. Cause: the security migration restricted `developers` SELECT to admins/agents. `property_listing_view` joins `developers`, so anonymous visitors now read 0 rows from the view.

## Fix

Restore public reads of developer **name only** (no contact info leaks) so listings re-appear without undoing the security hardening.

Migration:
1. Create a minimal `public.developers_public` view exposing only `id, name` (no email/phone/address), with `security_invoker=on`.
2. `GRANT SELECT` on `developers_public` to `anon, authenticated`.
3. Recreate `property_listing_view` to join `developers_public` instead of `developers`. Column shape (`developer_name`) stays identical, so no frontend changes.
4. Leave the locked-down `developers` table policy untouched — admin/agent CRUD in the admin panel keeps working; contacts stay private.

## Verification

- Reload `/` and `/properties` — featured + listing grids re-populate with the 10 demo units.
- Confirm `developers` table still returns 0 rows for anon (contacts remain protected).

No frontend code changes required.