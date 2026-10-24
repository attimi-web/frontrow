-- ============================================================
-- FrontRow — 0010_social_notifications.sql
-- Auto-create in-app notifications on social events.
--
-- The notifications table has no INSERT policy (a user may only
-- read/update their own rows), so notifications for *other* users
-- must be written by SECURITY DEFINER triggers that bypass RLS.
-- ============================================================

-- ---------- friend request received ----------
create or replace function notify_friend_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare requester_name text;
begin
  select coalesce(display_name, username) into requester_name
    from profiles where id = new.requester_id;
  insert into notifications (user_id, type, title, body, data)
  values (
    new.addressee_id,
    'friend_request',
    coalesce(requester_name, 'Someone') || ' sent you a friend request',
    null,
    jsonb_build_object('friendship_id', new.id, 'actor_id', new.requester_id)
  );
  return new;
end $$;

drop trigger if exists trg_notify_friend_request on friendships;
create trigger trg_notify_friend_request
  after insert on friendships
  for each row when (new.status = 'pending')
  execute function notify_friend_request();

-- ---------- friend request accepted ----------
create or replace function notify_friend_accepted() returns trigger
language plpgsql security definer set search_path = public as $$
declare addressee_name text;
begin
  select coalesce(display_name, username) into addressee_name
    from profiles where id = new.addressee_id;
  insert into notifications (user_id, type, title, body, data)
  values (
    new.requester_id,
    'friend_accepted',
    coalesce(addressee_name, 'Someone') || ' accepted your friend request',
    null,
    jsonb_build_object('friendship_id', new.id, 'actor_id', new.addressee_id)
  );
  return new;
end $$;

drop trigger if exists trg_notify_friend_accepted on friendships;
create trigger trg_notify_friend_accepted
  after update on friendships
  for each row when (old.status = 'pending' and new.status = 'accepted')
  execute function notify_friend_accepted();

-- ---------- tagged as a concert buddy ----------
create or replace function notify_buddy_tagged() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner_name text;
begin
  select coalesce(display_name, username) into owner_name
    from profiles where id = new.owner_id;
  insert into notifications (user_id, type, title, body, data)
  values (
    new.tagged_user_id,
    'buddy_tagged',
    coalesce(owner_name, 'Someone') || ' tagged you as a concert buddy',
    null,
    jsonb_build_object('concert_id', new.concert_id, 'buddy_id', new.id, 'actor_id', new.owner_id)
  );
  return new;
end $$;

drop trigger if exists trg_notify_buddy_tagged on concert_buddies;
create trigger trg_notify_buddy_tagged
  after insert on concert_buddies
  for each row execute function notify_buddy_tagged();

-- ---------- buddy confirmed attendance ----------
create or replace function notify_buddy_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
declare tagged_name text;
begin
  select coalesce(display_name, username) into tagged_name
    from profiles where id = new.tagged_user_id;
  insert into notifications (user_id, type, title, body, data)
  values (
    new.owner_id,
    'buddy_confirmed',
    coalesce(tagged_name, 'Someone') || ' confirmed they were there',
    null,
    jsonb_build_object('concert_id', new.concert_id, 'buddy_id', new.id, 'actor_id', new.tagged_user_id)
  );
  return new;
end $$;

drop trigger if exists trg_notify_buddy_confirmed on concert_buddies;
create trigger trg_notify_buddy_confirmed
  after update on concert_buddies
  for each row when (old.status is distinct from 'confirmed' and new.status = 'confirmed')
  execute function notify_buddy_confirmed();
