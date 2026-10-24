-- ============================================================
-- FrontRow — 0013_seed_achievements.sql
-- Achievements catalog (screen 21) + unlock-rate RPC.
--
-- criteria = { "type": <metric>, "threshold": <int> }. Metrics are
-- computed client-side from the user's attended shows
-- (src/features/achievements/logic.ts), which also syncs unlocked rows
-- into user_achievements (unlocked_at = date the threshold was reached):
--   shows, countries, cities, venues, artists (distinct headliners),
--   festivals, same_artist (max shows of one headliner),
--   shows_in_year / festivals_in_year (best calendar year),
--   streak_days (consecutive days with a show), tour_shows (max shows
--   on one tour), press (accredited shows).
-- ============================================================

alter table achievements add column if not exists sort_order int not null default 0;

insert into achievements (slug, name, description, rarity, criteria, sort_order) values
  ('first_timer',      'First Timer',          'Logged your very first show.',                       'common',    '{"type":"shows","threshold":1}',              10),
  ('regular',          'Regular',              'Attended 10 shows.',                                 'common',    '{"type":"shows","threshold":10}',             11),
  ('gig_goer',         'Gig Goer',             'Attended 25 shows.',                                 'uncommon',  '{"type":"shows","threshold":25}',             12),
  ('half_century',     'Half Century',         'Attended 50 shows. That''s a lot of encores.',       'rare',      '{"type":"shows","threshold":50}',             13),
  ('century_club',     'Century Club',         'Attended 100 concerts. You''re officially dedicated.', 'rare',    '{"type":"shows","threshold":100}',            14),
  ('lifer',            'Lifer',                'Attended 250 shows. Live music is your life.',       'legendary', '{"type":"shows","threshold":250}',            15),
  ('border_crosser',   'Border Crosser',       'Saw shows in 2 countries.',                          'common',    '{"type":"countries","threshold":2}',          20),
  ('globe_trotter',    'Globe Trotter',        'Saw shows in 5 countries.',                          'uncommon',  '{"type":"countries","threshold":5}',          21),
  ('world_tour',       'World Tour',           'Saw shows in 10 countries.',                         'rare',      '{"type":"countries","threshold":10}',         22),
  ('passport_full',    'Passport Full',        'Saw shows in 20 countries.',                         'legendary', '{"type":"countries","threshold":20}',         23),
  ('city_hopper',      'City Hopper',          'Saw shows in 5 different cities.',                   'common',    '{"type":"cities","threshold":5}',             30),
  ('road_warrior',     'Road Warrior',         'Saw shows in 15 different cities.',                  'uncommon',  '{"type":"cities","threshold":15}',            31),
  ('nomad',            'Nomad',                'Saw shows in 30 different cities.',                  'rare',      '{"type":"cities","threshold":30}',            32),
  ('festival_debut',   'Festival Debut',       'Went to your first festival.',                       'common',    '{"type":"festivals","threshold":1}',          40),
  ('festival_animal',  'Festival Animal',      'Attended 3 festivals.',                              'uncommon',  '{"type":"festivals","threshold":3}',          41),
  ('festival_veteran', 'Festival Veteran',     'Attended 10 festivals.',                             'rare',      '{"type":"festivals","threshold":10}',         42),
  ('summer_run',       'Summer Run',           'Went to 3 festivals in a single year.',              'uncommon',  '{"type":"festivals_in_year","threshold":3}',  43),
  ('fan',              'Fan',                  'Saw the same artist 3 times.',                       'common',    '{"type":"same_artist","threshold":3}',        50),
  ('superfan',         'Superfan',             'Saw the same artist 5 times.',                       'uncommon',  '{"type":"same_artist","threshold":5}',        51),
  ('devotee',          'Devotee',              'Saw the same artist 10 times.',                      'rare',      '{"type":"same_artist","threshold":10}',       52),
  ('eclectic',         'Eclectic',             'Saw 10 different headliners.',                       'common',    '{"type":"artists","threshold":10}',           60),
  ('encyclopedia',     'Walking Encyclopedia', 'Saw 50 different headliners.',                       'rare',      '{"type":"artists","threshold":50}',           61),
  ('venue_collector',  'Venue Collector',      'Visited 10 different venues.',                       'uncommon',  '{"type":"venues","threshold":10}',            70),
  ('monthly_habit',    'Monthly Habit',        '12 shows in a single year.',                         'uncommon',  '{"type":"shows_in_year","threshold":12}',     80),
  ('weekly_ritual',    'Weekly Ritual',        '52 shows in a single year.',                         'legendary', '{"type":"shows_in_year","threshold":52}',     81),
  ('back_to_back',     'Back to Back',         'Shows on two consecutive days.',                     'common',    '{"type":"streak_days","threshold":2}',        90),
  ('marathon',         'Marathon',             'Shows on 4 days in a row.',                          'rare',      '{"type":"streak_days","threshold":4}',        91),
  ('tour_chaser',      'Tour Chaser',          'Saw 3 dates of the same tour.',                      'uncommon',  '{"type":"tour_shows","threshold":3}',         95),
  ('backstage_debut',  'Backstage Debut',      'Your first accredited show.',                        'uncommon',  '{"type":"press","threshold":1}',              98),
  ('press_pass',       'Press Pass',           'Covered 10 shows with a press accreditation.',       'rare',      '{"type":"press","threshold":10}',             99)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  rarity = excluded.rarity,
  criteria = excluded.criteria,
  sort_order = excluded.sort_order;

-- % of users who unlocked each badge. user_achievements is owner-only
-- under RLS, so the aggregate needs SECURITY DEFINER; it exposes counts only.
create or replace function achievement_unlock_rates()
returns table (achievement_id uuid, pct numeric)
language sql stable security definer set search_path = public as $$
  select a.id,
         round(100.0 * count(ua.user_id) / greatest((select count(*) from profiles), 1), 1)
    from achievements a
    left join user_achievements ua
      on ua.achievement_id = a.id and ua.unlocked_at is not null
   group by a.id
$$;

revoke execute on function achievement_unlock_rates() from public, anon;
grant execute on function achievement_unlock_rates() to authenticated, service_role;
