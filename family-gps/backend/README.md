# Family GPS Backend Handoff

The Family GPS backend is designed to run on Supabase. This repository intentionally contains no Supabase URL, anonymous key, service-role key, or other credentials.

The backend definition is currently in `../supabase/migrations/001_initial.sql`. It creates profiles, families, memberships, pairing codes, locations, and device status tables. It also enables Row Level Security and defines the atomic `create_pairing_code` and `redeem_pairing_code` database functions.

## Manual connection sequence

1. Create or select the Supabase project you want to use.
2. Open the Supabase SQL Editor and run `../supabase/migrations/001_initial.sql`.
3. Verify that the migration succeeds and that the Data API exposes only the tables/functions required by the app.
4. Enable email/password authentication, or update the Android authentication implementation if a different provider is selected.
5. Copy the Supabase project URL and public anonymous key into the Android project’s uncommitted `local.properties` file using `local.properties.example` as the template.
6. Do not put the service-role key in the Android app or commit any credential to GitHub.
7. After the client repositories are connected, test the RLS policies with separate Admin and Receiver accounts before testing real GPS uploads.

The Android app must use the authenticated client and the public anonymous key. Pairing must remain an RPC/database operation, not a sequence of unrestricted client-side membership writes.
