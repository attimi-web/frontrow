-- ============================================================
-- FrontRow — 0011_app_admins.sql
-- App-level admins (maintenance operations such as the venue
-- geocoding backfill in the geocode-venue Edge Function).
--
-- Clients can neither read nor write this table: RLS is on with no
-- policies and role grants are revoked. Only the service role (Edge
-- Functions, dashboard) uses it. Rows are inserted by hand per
-- environment, since user ids differ between dev and prod:
--   insert into app_admins (user_id) values ('<auth.users.id>');
-- ============================================================

create table app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table app_admins enable row level security;

revoke all on table app_admins from anon, authenticated;
