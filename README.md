# Save-It-Later

Save-It-Later is a cross-platform bookmarking app built with Expo Router and Supabase. This repository keeps the mobile app and backend SQL in separate folders so each surface can evolve independently.

## Structure

```
apps/
  mobile/          # Expo + React Native client
backend/
  supabase/        # SQL schema & RLS policies
Project BRD.txt    # Business requirements document
```

## Getting started (mobile)

```bash
cd apps/mobile
npm install
npm run start
```

Set your Supabase credentials in `apps/mobile/.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=...your project url
EXPO_PUBLIC_SUPABASE_KEY=...publishable key
```

The Expo app uses `@/lib/supabase` for authenticated requests and relies on the Supabase tables/policies defined under `backend/supabase`.

## Backend

All SQL for the Supabase project lives under `backend/supabase`. Use the Supabase SQL editor or CLI to run `schema.sql` and `policies.sql` when bootstrapping an environment. Row Level Security is mandatory for the mobile client.

## GitHub

The canonical repository lives at `https://github.com/shahbaz242630/Save-it-Later`. Push changes from this workspace to keep progress in sync.
