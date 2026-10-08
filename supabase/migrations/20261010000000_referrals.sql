-- Referrals: every player and teacher gets a short code to share
-- (modequest.stream/invite/CODE). A new account that signs up with a code is
-- recorded against the inviter. Class (student) accounts never refer anyone
-- and are never recorded as referred: they are created by teachers.

create or replace function public.new_referral_code() returns text
language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..7 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
  end loop;
  return v_code;
end $$;

alter table public.profiles add column if not exists referral_code text;

-- Backfill existing accounts one row at a time (each sees the codes before it).
do $$
declare r record;
begin
  for r in select id from public.profiles where referral_code is null loop
    update public.profiles set referral_code = public.new_referral_code() where id = r.id;
  end loop;
end $$;

alter table public.profiles alter column referral_code set default public.new_referral_code();
alter table public.profiles alter column referral_code set not null;
create unique index if not exists profiles_referral_code on public.profiles (referral_code);

create table if not exists public.referrals (
  referred_id uuid primary key references public.profiles (id) on delete cascade,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists referrals_by_referrer on public.referrals (referrer_id);

alter table public.referrals enable row level security;
-- You can see who you invited and who invited you; nobody writes directly.
create policy referrals_read on public.referrals for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid());
revoke insert, update, delete on public.referrals from anon, authenticated;

-- Record the referral when the new profile is created. Reads the code the
-- player typed (or arrived with) from their sign-up metadata. Never blocks a
-- sign-up: a bad or unknown code is simply ignored.
create or replace function public.record_referral() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ref text;
  inviter uuid;
begin
  if new.role = 'student' then return new; end if;
  begin
    select upper(trim(raw_user_meta_data ->> 'ref')) into ref from auth.users where id = new.id;
    if ref is null or ref !~ '^[A-Z0-9]{4,12}$' then return new; end if;
    select id into inviter from profiles where referral_code = ref and id <> new.id and role in ('player', 'teacher');
    if inviter is not null then
      insert into referrals (referred_id, referrer_id) values (new.id, inviter) on conflict do nothing;
    end if;
  exception when others then
    -- ignore: referrals are a bonus, sign-up must always succeed
  end;
  return new;
end $$;

drop trigger if exists on_profile_created_referral on public.profiles;
create trigger on_profile_created_referral after insert on public.profiles
  for each row execute function public.record_referral();

-- My code and how many people joined with it.
create or replace function public.my_referral_stats()
returns table (code text, invited bigint)
language sql stable security definer set search_path = public as $$
  select p.referral_code, (select count(*) from referrals r where r.referrer_id = p.id)
  from profiles p
  where p.id = auth.uid() and p.role in ('player', 'teacher');
$$;

revoke execute on function public.my_referral_stats() from anon, public;
grant execute on function public.my_referral_stats() to authenticated;
revoke execute on function public.new_referral_code() from anon, public;
