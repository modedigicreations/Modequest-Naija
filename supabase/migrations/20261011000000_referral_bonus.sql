-- Invite bonus: the inviter earns in-game naira once a friend who signed up
-- with their code has really played (reached Day 3 in the game). Capped at 10
-- bonuses per inviter every 30 days. Paid like top-ups: the game credits the
-- bonus and saves, then marks it claimed (two-phase, nothing lost or doubled).

alter table public.referrals add column if not exists reward int;
alter table public.referrals add column if not exists rewarded_at timestamptz;
alter table public.referrals add column if not exists claimed_at timestamptz;

-- Grant any bonuses due for this player as an invited friend.
create or replace function public.grant_referral_bonus(friend uuid, friend_day int)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if friend_day is null or friend_day < 3 then return; end if;
  update referrals r
     set reward = 20000, rewarded_at = now()
   where r.referred_id = friend
     and r.rewarded_at is null
     and (select count(*) from referrals x
           where x.referrer_id = r.referrer_id and x.rewarded_at > now() - interval '30 days') < 10;
end $$;
revoke execute on function public.grant_referral_bonus(uuid, int) from anon, authenticated, public;

-- Checked whenever a save is written (cheap: one primary-key lookup). If the
-- monthly cap is full, a later save grants it once there's room.
create or replace function public.on_save_referral() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.grant_referral_bonus(new.user_id, new.day);
  exception when others then
    -- never block saving the game
  end;
  return new;
end $$;

drop trigger if exists saves_referral_bonus on public.saves;
create trigger saves_referral_bonus after insert or update of day on public.saves
  for each row execute function public.on_save_referral();

-- Friends who already qualified before this migration.
do $$
declare r record;
begin
  for r in select s.user_id, s.day from saves s join referrals f on f.referred_id = s.user_id where f.rewarded_at is null loop
    perform public.grant_referral_bonus(r.user_id, r.day);
  end loop;
end $$;

-- Bonuses waiting to be added to my game.
create or replace function public.referral_rewards()
returns table (id uuid, amount int, friend text)
language sql stable security definer set search_path = public as $$
  select r.referred_id, r.reward, p.nickname
  from referrals r join profiles p on p.id = r.referred_id
  where r.referrer_id = auth.uid() and r.rewarded_at is not null and r.claimed_at is null;
$$;

-- Mark exactly these bonuses as added (after the game has saved them).
create or replace function public.claim_referral_rewards(ids uuid[])
returns table (id uuid)
language sql security definer set search_path = public as $$
  update referrals r set claimed_at = now()
  where r.referrer_id = auth.uid() and r.rewarded_at is not null and r.claimed_at is null and r.referred_id = any(ids)
  returning r.referred_id;
$$;

-- Stats now include bonuses earned.
drop function if exists public.my_referral_stats();
create function public.my_referral_stats()
returns table (code text, invited bigint, rewarded bigint, earned bigint)
language sql stable security definer set search_path = public as $$
  select p.referral_code,
         (select count(*) from referrals r where r.referrer_id = p.id),
         (select count(*) from referrals r where r.referrer_id = p.id and r.rewarded_at is not null),
         (select coalesce(sum(r.reward), 0) from referrals r where r.referrer_id = p.id and r.rewarded_at is not null)
  from profiles p
  where p.id = auth.uid() and p.role in ('player', 'teacher');
$$;

revoke execute on function public.referral_rewards() from anon, public;
revoke execute on function public.claim_referral_rewards(uuid[]) from anon, public;
revoke execute on function public.my_referral_stats() from anon, public;
grant execute on function public.referral_rewards() to authenticated;
grant execute on function public.claim_referral_rewards(uuid[]) to authenticated;
grant execute on function public.my_referral_stats() to authenticated;
