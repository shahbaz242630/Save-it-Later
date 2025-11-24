# Supabase Backend

This folder stores the SQL definition for the Save-It-Later backend. Run these scripts against your Supabase project whenever you need to recreate the database locally or in a new environment.

## Files

- `schema.sql` – tables and indexes for profiles, saved items, tags, and the join table.
- `policies.sql` – row-level security policies that scope all data by `auth.uid()`.

## Applying changes

```bash
supabase db push --file backend/supabase/schema.sql
supabase db push --file backend/supabase/policies.sql
```

When using the Supabase dashboard, paste the contents of each file into the SQL editor and run them sequentially. Make sure Row Level Security is enabled on each table.
