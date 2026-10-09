-- Server-side economy checks. The game runs in the browser, so the server
-- double-checks every cloud save before it can reach a leaderboard:
--   * Summary numbers (days played, lessons passed, shifts, scams, bought
--     money) are re-read from the save itself, not trusted from the client.
--   * Plausibility against real time: the clock is real Nigerian time, so a
--     life can't have more days than real days since it started, and wealth
--     can't outgrow a generous real-time ceiling or jump wildly in a day.
-- Suspicious saves are flagged (never blocked): they leave the leaderboards
-- and teachers see a ⚠️. Clear a false alarm with:
--   update saves set flagged = null where user_id = '<id>';

alter table public.saves add column if not exists first_saved_at timestamptz;
alter table public.saves add column if not exists flagged text;

-- Existing saves were played on the old fast clock: count each game day as a
-- real day already lived, so long-time players aren't flagged.
update public.saves set first_saved_at = now() - make_interval(days => greatest(coalesce(day, 1), 1))
 where first_saved_at is null;

create or replace function public.check_save() returns trigger
language plpgsql as $$
declare
  st jsonb := new.state;
  t bigint;
  start_day int;
  real_days numeric;
  cap bigint;
  worth bigint;
  reason text;
begin
  -- Summary from the save itself (when the save has the field).
  begin
    t := (st ->> 'time')::bigint;
    start_day := coalesce((st -> 'flags' ->> 'startDay')::int, 1);
    if t is not null then new.day := (t / 1440 + 1) - start_day + 1; end if;
    if jsonb_typeof(st -> 'lessons') = 'object' then
      new.lessons_passed := (select count(*) from jsonb_each_text(st -> 'lessons') l where l.value::numeric >= 60);
      new.lesson_scores := st -> 'lessons';
    end if;
    if jsonb_typeof(st -> 'stats') = 'object' then
      new.scams_avoided := coalesce((st -> 'stats' ->> 'scamsAvoided')::int, new.scams_avoided);
      new.scams_fallen := coalesce((st -> 'stats' ->> 'scamsFallen')::int, new.scams_fallen);
      new.shifts := coalesce((st -> 'stats' ->> 'shiftsWorked')::int, new.shifts);
      new.topped_up := coalesce((st -> 'stats' ->> 'toppedUp')::bigint, 0);
    end if;
    if new.net_worth is not null then new.earned_worth := new.net_worth - coalesce(new.topped_up, 0); end if;
  exception when others then
    reason := 'unreadable save';
  end;

  -- Server-owned columns: the client can't set these. A first cloud save may
  -- bring earlier play from this device (guest play), so credit up to 60 days.
  if tg_op = 'UPDATE' then
    new.first_saved_at := coalesce(old.first_saved_at, now());
    new.flagged := old.flagged;
  else
    new.first_saved_at := now() - make_interval(days => least(greatest(coalesce(new.day, 1) - 1, 0), 60));
    new.flagged := null;
  end if;

  -- Plausibility (only flags; saving always succeeds).
  real_days := extract(epoch from (now() - new.first_saved_at)) / 86400.0;
  worth := coalesce(new.earned_worth, new.net_worth, 0);
  cap := 2000000 + (1500000 * real_days)::bigint;
  if reason is null and coalesce(new.day, 0) > real_days + 8 then
    reason := format('days played (%s) ahead of real time (%s days)', new.day, floor(real_days));
  elsif reason is null and worth > cap then
    reason := format('wealth ₦%s above the ₦%s ceiling for %s days played', worth, cap, floor(real_days));
  elsif reason is null and tg_op = 'UPDATE' and old.updated_at > now() - interval '1 day'
        and worth - coalesce(old.earned_worth, old.net_worth, 0) > 2000000 + 0.3 * greatest(coalesce(old.earned_worth, old.net_worth, 0), 0) then
    reason := format('wealth jumped by ₦%s in under a day', worth - coalesce(old.earned_worth, old.net_worth, 0));
  elsif reason is null and coalesce(new.shifts, 0) > greatest(coalesce(new.day, 0), 0) + 1 then
    reason := format('%s shifts in %s days', new.shifts, new.day);
  end if;
  if reason is not null and new.flagged is null then new.flagged := reason; end if;
  return new;
end $$;

drop trigger if exists saves_check on public.saves;
create trigger saves_check before insert or update on public.saves
  for each row execute function public.check_save();


-- Leaderboards skip flagged saves.
create or replace function public.leaderboard(metric text, class uuid default null, lim int default 50)
returns table (nickname text, city text, value bigint, is_me boolean, supporter boolean)
language sql stable security definer set search_path = public as $$
  select p.nickname, s.city,
    case metric
      when 'net_worth' then coalesce(s.earned_worth, s.net_worth)
      when 'academy' then s.lessons_passed::bigint
      when 'scams' then s.scams_avoided::bigint
      else coalesce(s.earned_worth, s.net_worth)
    end as value,
    p.id = auth.uid() as is_me,
    exists (select 1 from entitlements e where e.user_id = p.id and e.kind = 'supporter' and (e.expires_at is null or e.expires_at > now())) as supporter
  from saves s
  join profiles p on p.id = s.user_id
  where p.role <> 'teacher'
    and s.flagged is null
    and (class is null or exists (select 1 from class_members m where m.class_id = class and m.student_id = p.id))
    and (class is null or public.is_member_of(class) or public.is_teacher_of(class))
  order by value desc nulls last
  limit least(lim, 100);
$$;
