# Supabase SQL migrations

Before deploying the web panel changes for restaurant management, execute
both `migrations/202610140001_admin_restaurant_workflows.sql` and
`migrations/202610140002_admin_restaurant_owner_candidates.sql` in the Supabase
SQL Editor, in numeric order.

It creates two `SECURITY DEFINER` RPCs. Both verify the Firebase JWT subject
against `public.users` with `role_id = 4`:

- `admin_approve_restaurant_application`: locks the pending application and
  atomically creates the restaurant, marks the application approved, and sets
  the applicant's role to restaurant owner.
- `admin_create_restaurant`: creates a restaurant for an existing Firebase
  account and sets that account's role to restaurant owner in the same
  transaction. The current panel supports one restaurant per owner.
- `admin_list_restaurant_owner_candidates`: securely lists eligible client/
  owner profiles for the form without requiring broad `SELECT` policies on
  `users` or `restaurants`.

The admin panel exposes direct creation at `/admin/restaurants`. The selected
owner must already have signed in at least once so their Firebase UID/profile
exists in `public.users`. Each RPC enforces administrator authorization inside
Postgres; the web Server Actions also verify role and restaurant ownership.
