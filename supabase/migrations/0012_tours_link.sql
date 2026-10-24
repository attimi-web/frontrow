-- ============================================================
-- FrontRow — 0012_tours_link.sql
-- Link concerts to the shared `tours` catalog (Tour Tracker).
--
-- Until now concerts only carried a free-text tour_name; tour_id was
-- never set. A tour is identified by (headliner artist, name), case-
-- insensitive, and created on demand like artists/venues (0007).
-- total_shows is the tour's length; any user with a show on the tour
-- may set it (SECURITY DEFINER RPC, since tours has no UPDATE policy).
-- ============================================================

create unique index if not exists tours_artist_name_key on tours (artist_id, lower(name));

create or replace function find_or_create_tour(p_artist_id uuid, p_name text)
returns tours language plpgsql security invoker set search_path = public as $$
declare v_name text := nullif(trim(p_name), ''); result tours;
begin
  if v_name is null then raise exception 'tour name required'; end if;
  select * into result from tours
    where artist_id = p_artist_id and lower(name) = lower(v_name)
    limit 1;
  if found then return result; end if;
  insert into tours (artist_id, name) values (p_artist_id, v_name)
    on conflict (artist_id, lower(name)) do nothing
    returning * into result;
  if result.id is null then
    select * into result from tours
      where artist_id = p_artist_id and lower(name) = lower(v_name)
      limit 1;
  end if;
  return result;
end; $$;

create or replace function set_tour_total_shows(p_tour_id uuid, p_total int)
returns tours language plpgsql security definer set search_path = public as $$
declare result tours;
begin
  if p_total is null or p_total < 1 or p_total > 1000 then
    raise exception 'total_shows must be between 1 and 1000';
  end if;
  if not exists (
    select 1 from concerts where tour_id = p_tour_id and user_id = auth.uid()
  ) then
    raise exception 'you have no shows on this tour';
  end if;
  update tours set total_shows = p_total where id = p_tour_id returning * into result;
  return result;
end; $$;

revoke execute on function find_or_create_tour(uuid, text) from public, anon;
revoke execute on function set_tour_total_shows(uuid, int) from public, anon;
grant execute on function find_or_create_tour(uuid, text) to authenticated, service_role;
grant execute on function set_tour_total_shows(uuid, int) to authenticated, service_role;

-- ---------- backfill: existing tour_name → tours + concerts.tour_id ----------
insert into tours (artist_id, name)
select distinct on (c.headliner_id, lower(trim(c.tour_name)))
       c.headliner_id, trim(c.tour_name)
  from concerts c
 where c.headliner_id is not null
   and nullif(trim(c.tour_name), '') is not null
on conflict (artist_id, lower(name)) do nothing;

update concerts c
   set tour_id = t.id
  from tours t
 where c.tour_id is null
   and c.headliner_id = t.artist_id
   and lower(trim(c.tour_name)) = lower(t.name);
