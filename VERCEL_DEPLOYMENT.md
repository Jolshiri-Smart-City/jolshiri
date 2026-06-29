# Vercel deployment notes

Use these settings when importing the GitHub repository into Vercel.

## Build settings

- Framework preset: **Other** or **Vite**
- Install command: `bun install`
- Build command: `bun run build`
- Output directory: leave blank/default

The Vite config automatically switches the server build target to Vercel when Vercel sets `VERCEL=1` during the build.

## Required environment variables

Add these in **Vercel → Project Settings → Environment Variables** for Production, Preview, and Development:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

The `SUPABASE_*` values should match the corresponding `VITE_SUPABASE_*` values. Public property pages need these variables to load listings during server rendering.

## Admin features

Public pages can run with the publishable backend key above. Admin-only user management features also need a service-role backend secret if you self-host outside Lovable.