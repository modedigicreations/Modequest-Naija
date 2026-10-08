-- ModeQuest: Naija — in-app purchases (Paystack), entitlements and school plans.
--
-- Money never moves through the client. The server creates an order, Paystack
-- takes payment, and the server (webhook or verify) marks the order paid and
-- grants entitlements. Clients can only read their own orders/entitlements and
-- claim in-game naira top-ups exactly once.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id text not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  reference text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  provider text not null default 'paystack',
  provider_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_by_user on public.orders (user_id, created_at desc);

create table public.entitlements (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  kind text not null check (kind in ('cosmetic', 'naira', 'supporter', 'plan')),
  item text not null,
  quantity bigint not null default 1,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
create index entitlements_by_user on public.entitlements (user_id, kind);
-- A paid order grants each item once, even if Paystack retries the webhook.
-- (Manual grants have a null order_id; nulls never conflict.)
alter table public.entitlements add constraint entitlements_once unique (order_id, kind, item);

alter table public.orders enable row level security;
alter table public.entitlements enable row level security;
create policy orders_read_own on public.orders for select to authenticated using (user_id = auth.uid());
create policy entitlements_read_own on public.entitlements for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.entitlements from anon, authenticated;

-- Fair leaderboards: track wealth bought with real money separately.
alter table public.saves add column if not exists topped_up bigint not null default 0;
alter table public.saves add column if not exists earned_worth bigint;

-- ---------------------------------------------------------------------------
-- School plans
-- ---------------------------------------------------------------------------

create or replace function public.plan_limits(uid uuid)
returns table (plan text, max_classes int, max_students int, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  with active as (
    select item, expires_at from entitlements
    where user_id = uid and kind = 'plan' and (expires_at is null or expires_at > now())
  )
  select * from (
    select 'school'::text, 60, 3000, (select max(expires_at) from active where item = 'school')
      where exists (select 1 from active where item = 'school')
    union all
    select 'classroom', 5, 250, (select max(expires_at) from active where item = 'classroom')
      where exists (select 1 from active where item = 'classroom') and not exists (select 1 from active where item = 'school')
    union all
    select 'free', 1, 40, null::timestamptz
      where not exists (select 1 from active)
  ) p
  limit 1;
$$;

create or replace function public.my_plan()
returns table (plan text, max_classes int, max_students int, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select * from public.plan_limits(auth.uid());
$$;

-- Enforce the class limit in the database, not just the UI.
create or replace function public.enforce_class_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  lim int;
begin
  select max_classes into lim from public.plan_limits(new.teacher_id);
  if (select count(*) from classes where teacher_id = new.teacher_id) >= coalesce(lim, 1) then
    raise exception 'Your plan allows % class(es). Upgrade your school plan to add more.', coalesce(lim, 1);
  end if;
  return new;
end $$;

create trigger classes_limit before insert on public.classes
  for each row execute function public.enforce_class_limit();

-- ---------------------------------------------------------------------------
-- Client RPCs
-- ---------------------------------------------------------------------------

-- Claim purchased in-game naira exactly once.
create or replace function public.claim_topups()
returns table (id bigint, amount bigint)
language sql security definer set search_path = public as $$
  update entitlements e set claimed_at = now()
  where e.user_id = auth.uid() and e.kind = 'naira' and e.claimed_at is null
  returning e.id, e.quantity;
$$;

-- Leaderboards rank on earned wealth and flag active supporters.
drop function if exists public.leaderboard(text, uuid, int);
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
    and (class is null or exists (select 1 from class_members m where m.class_id = class and m.student_id = p.id))
    and (class is null or public.is_member_of(class) or public.is_teacher_of(class))
  order by value desc nulls last
  limit least(lim, 100);
$$;

revoke execute on function public.plan_limits(uuid) from anon, public, authenticated;
revoke execute on function public.my_plan() from anon, public;
revoke execute on function public.claim_topups() from anon, public;
revoke execute on function public.leaderboard(text, uuid, int) from anon, public;
revoke execute on function public.enforce_class_limit() from anon, public;
grant execute on function public.my_plan() to authenticated;
grant execute on function public.claim_topups() to authenticated;
grant execute on function public.leaderboard(text, uuid, int) to authenticated;
