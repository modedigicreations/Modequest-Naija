-- Site stats for the owner dashboard (/admin): live players, player totals
-- and all-time visits. Visitors are a random ID kept in the browser: no names,
-- emails or IP addresses are stored. Only the server (service role) can read
-- the numbers; browsers can only report a visit or a heartbeat.

create table if not exists public.visitors (
  visitor_id uuid primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  visits int not null default 1
);

create table if not exists public.daily_visits (
  day date primary key,
  visits int not null default 0,
  new_visitors int not null default 0
);

create table if not exists public.live_sessions (
  session_id uuid primary key,
  visitor_id uuid,
  user_id uuid,
  city text,
  playing boolean not null default false,
  last_seen timestamptz not null default now()
);
create index if not exists live_sessions_seen on public.live_sessions (last_seen);

alter table public.visitors enable row level security;
alter table public.daily_visits enable row level security;
alter table public.live_sessions enable row level security;
-- No policies: nobody reads or writes these directly except through the functions below.
revoke all on public.visitors, public.daily_visits, public.live_sessions from anon, authenticated;

-- One visit (a new browser tab session). Days are counted in Nigerian time.
create or replace function public.track_visit(visitor uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  is_new boolean;
  today date := (now() at time zone 'Africa/Lagos')::date;
begin
  if visitor is null then return; end if;
  insert into visitors (visitor_id) values (visitor)
  on conflict (visitor_id) do update set last_seen = now(), visits = visitors.visits + 1
  returning (xmax = 0) into is_new;
  insert into daily_visits (day, visits, new_visitors) values (today, 1, case when is_new then 1 else 0 end)
  on conflict (day) do update set visits = daily_visits.visits + 1, new_visitors = daily_visits.new_visitors + excluded.new_visitors;
end $$;

-- "Still here" ping every minute from each open tab.
create or replace function public.heartbeat(session uuid, visitor uuid, city text, playing boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if session is null then return; end if;
  insert into live_sessions (session_id, visitor_id, user_id, city, playing, last_seen)
  values (session, visitor, auth.uid(), left(city, 30), coalesce(playing, false), now())
  on conflict (session_id) do update
    set last_seen = now(), user_id = auth.uid(), city = left(excluded.city, 30), playing = excluded.playing;
  -- Tidy up old sessions now and then.
  if random() < 0.02 then
    delete from live_sessions where last_seen < now() - interval '1 day';
  end if;
end $$;

revoke execute on function public.track_visit(uuid) from public;
revoke execute on function public.heartbeat(uuid, uuid, text, boolean) from public;
grant execute on function public.track_visit(uuid) to anon, authenticated;
grant execute on function public.heartbeat(uuid, uuid, text, boolean) to anon, authenticated;

-- Everything the dashboard shows, in one call. Server only.
create or replace function public.stats_overview()
returns jsonb
language sql stable security definer set search_path = public as $$
  with live as (
    select * from live_sessions where last_seen > now() - interval '2 minutes'
  )
  select jsonb_build_object(
    'live_playing', (select count(*) from live where playing),
    'live_browsing', (select count(*) from live where not playing),
    'live_signed_in', (select count(*) from live where playing and user_id is not null),
    'live_by_city', coalesce((select jsonb_object_agg(city, n) from (select coalesce(city, 'unknown') as city, count(*) as n from live where playing group by 1) c), '{}'::jsonb),
    'players_total', (select count(*) from profiles where role = 'player'),
    'students_total', (select count(*) from profiles where role = 'student'),
    'teachers_total', (select count(*) from profiles where role = 'teacher'),
    'signups_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'cloud_saves', (select count(*) from saves),
    'visits_all_time', coalesce((select sum(visits) from daily_visits), 0),
    'visitors_all_time', (select count(*) from visitors),
    'visits_today', coalesce((select visits from daily_visits where day = (now() at time zone 'Africa/Lagos')::date), 0),
    'visitors_7d', (select count(*) from visitors where last_seen > now() - interval '7 days'),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'visits', visits, 'new', new_visitors) order by day)
                       from daily_visits where day > (now() at time zone 'Africa/Lagos')::date - 30), '[]'::jsonb),
    'paid_orders', (select count(*) from orders where status = 'paid'),
    'revenue_kobo', coalesce((select sum(amount_kobo) from orders where status = 'paid'), 0),
    'revenue_30d_kobo', coalesce((select sum(amount_kobo) from orders where status = 'paid' and created_at > now() - interval '30 days'), 0),
    'tracking_since', (select min(day) from daily_visits)
  );
$$;

revoke execute on function public.stats_overview() from public, anon, authenticated;
