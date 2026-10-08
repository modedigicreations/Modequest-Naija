-- ModeQuest: Naija — multiplayer schema (Supabase / Postgres)
--
-- Safety model for young players:
--   * Students are created by their teacher (username + 6-digit PIN, no email
--     or phone). Their public identity is a random nickname, never a real name.
--   * Real names live in class_members and are visible only to that teacher.
--   * Free-text chat exists only inside a class, is filtered and moderated by
--     the teacher. Everyone else gets preset quick-chat phrases (client side).
--   * Gifts are capped and only allowed between classmates, or between
--     independent (13+) players.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'player' check (role in ('player', 'student', 'teacher')),
  nickname text not null unique check (nickname ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 60),
  school text check (char_length(school) <= 120),
  city text not null default 'lagos',
  avatar jsonb,
  created_at timestamptz not null default now()
);

-- New auth users get a profile from their sign-up metadata.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r text := coalesce(meta ->> 'role', 'player');
  nick text := coalesce(meta ->> 'nickname', 'Player' || substr(replace(new.id::text, '-', ''), 1, 8));
begin
  if r not in ('player', 'student', 'teacher') then r := 'player'; end if;
  insert into public.profiles (id, role, nickname, display_name, school, city)
  values (new.id, r, nick, meta ->> 'display_name', meta ->> 'school', coalesce(meta ->> 'city', 'lagos'));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Classes (schools & teachers)
-- ---------------------------------------------------------------------------

create or replace function public.new_class_code() returns text
language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.classes c where c.code = v_code);
  end loop;
  return v_code;
end $$;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  school text check (char_length(school) <= 120),
  code text not null unique default public.new_class_code(),
  chat_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  real_name text not null check (char_length(real_name) <= 80),
  username text not null check (username ~ '^[a-z0-9]{2,20}$'),
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id),
  unique (class_id, username)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  lesson_id text not null,
  due_date date,
  created_at timestamptz not null default now(),
  unique (class_id, lesson_id)
);

-- Helpers (security definer so policies don't recurse).
create or replace function public.is_teacher_of(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes where id = c and teacher_id = auth.uid());
$$;

create or replace function public.is_member_of(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from class_members where class_id = c and student_id = auth.uid());
$$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Cloud saves (+ summary columns for teachers and leaderboards)
-- ---------------------------------------------------------------------------

create table public.saves (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  city text,
  day int,
  net_worth bigint,
  lessons_passed int,
  lesson_scores jsonb,
  scams_avoided int,
  scams_fallen int,
  shifts int,
  career text
);

-- ---------------------------------------------------------------------------
-- Gifts between players
-- ---------------------------------------------------------------------------

create table public.gifts (
  id bigserial primary key,
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  amount int not null check (amount between 100 and 50000),
  note text check (char_length(note) <= 60),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  check (from_id <> to_id)
);
create index gifts_to_unclaimed on public.gifts (to_id) where claimed_at is null;

-- ---------------------------------------------------------------------------
-- Class chat (the only free-text chat)
-- ---------------------------------------------------------------------------

create table public.class_messages (
  id bigserial primary key,
  class_id uuid not null references public.classes (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index class_messages_by_class on public.class_messages (class_id, created_at desc);

-- Mask unsafe words and contact details; rate-limit to 6 messages a minute.
create or replace function public.filter_class_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  w text;
  bad text[] := array['fuck','shit','bitch','bastard','idiot','stupid','mumu','ode','olodo','werey','ashawo','dick','pussy','nigga','kill yourself','kys'];
begin
  if (select count(*) from class_messages where author_id = new.author_id and created_at > now() - interval '1 minute') >= 6 then
    raise exception 'Slow down — too many messages.';
  end if;
  new.body := btrim(new.body);
  foreach w in array bad loop
    new.body := regexp_replace(new.body, '\m' || w || '\M', repeat('*', length(w)), 'gi');
  end loop;
  -- Hide phone numbers, emails and links: no off-platform contact in class chat.
  new.body := regexp_replace(new.body, '(\+?234|0)[789][01]\d{8}', '[number hidden]', 'g');
  new.body := regexp_replace(new.body, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email hidden]', 'g');
  new.body := regexp_replace(new.body, '(https?://|www\.)\S+', '[link hidden]', 'gi');
  return new;
end $$;

create trigger class_messages_filter before insert on public.class_messages
  for each row execute function public.filter_class_message();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments enable row level security;
alter table public.saves enable row level security;
alter table public.gifts enable row level security;
alter table public.class_messages enable row level security;

-- Profiles: public identity is readable by signed-in players; you can only
-- change your own nickname, city and avatar.
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (nickname, city, avatar) on public.profiles to authenticated;

-- Classes
create policy classes_read on public.classes for select to authenticated
  using (teacher_id = auth.uid() or public.is_member_of(id));
create policy classes_insert on public.classes for insert to authenticated
  with check (teacher_id = auth.uid() and public.my_role() = 'teacher');
create policy classes_update on public.classes for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy classes_delete on public.classes for delete to authenticated using (teacher_id = auth.uid());
revoke update on public.classes from authenticated;
grant update (name, school, chat_enabled) on public.classes to authenticated;

-- Members: the teacher sees the roster (with real names); a student sees only
-- their own row. Students are added by the server (service role) only.
create policy members_read on public.class_members for select to authenticated
  using (student_id = auth.uid() or public.is_teacher_of(class_id));
create policy members_remove on public.class_members for delete to authenticated
  using (public.is_teacher_of(class_id));

-- Assignments
create policy assignments_read on public.assignments for select to authenticated
  using (public.is_teacher_of(class_id) or public.is_member_of(class_id));
create policy assignments_write on public.assignments for insert to authenticated with check (public.is_teacher_of(class_id));
create policy assignments_update on public.assignments for update to authenticated using (public.is_teacher_of(class_id));
create policy assignments_delete on public.assignments for delete to authenticated using (public.is_teacher_of(class_id));

-- Saves: your own; teachers can read their students' saves.
create policy saves_read on public.saves for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.class_members m where m.student_id = saves.user_id and public.is_teacher_of(m.class_id))
  );
create policy saves_insert on public.saves for insert to authenticated with check (user_id = auth.uid());
create policy saves_update on public.saves for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saves_delete on public.saves for delete to authenticated using (user_id = auth.uid());

-- Gifts: read your own; create/claim only through the functions below.
create policy gifts_read on public.gifts for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());

-- Class chat
create policy chat_read on public.class_messages for select to authenticated
  using (public.is_teacher_of(class_id) or (public.is_member_of(class_id) and deleted_at is null));
create policy chat_write on public.class_messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and (public.is_teacher_of(class_id)
         or (public.is_member_of(class_id) and exists (select 1 from public.classes c where c.id = class_id and c.chat_enabled)))
  );
create policy chat_moderate on public.class_messages for update to authenticated using (public.is_teacher_of(class_id));
revoke update on public.class_messages from authenticated;
grant update (deleted_at) on public.class_messages to authenticated;

-- ---------------------------------------------------------------------------
-- Functions the client calls (RPC)
-- ---------------------------------------------------------------------------

-- Leaderboards expose only nickname, city and a number — never saves.
create or replace function public.leaderboard(metric text, class uuid default null, lim int default 50)
returns table (nickname text, city text, value bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  select p.nickname, s.city,
    case metric
      when 'net_worth' then s.net_worth
      when 'academy' then s.lessons_passed::bigint
      when 'scams' then s.scams_avoided::bigint
      else s.net_worth
    end as value,
    p.id = auth.uid() as is_me
  from saves s
  join profiles p on p.id = s.user_id
  where p.role <> 'teacher'
    and (class is null or exists (select 1 from class_members m where m.class_id = class and m.student_id = p.id))
    and (class is null or public.is_member_of(class) or public.is_teacher_of(class))
  order by value desc nulls last
  limit least(lim, 100);
$$;

-- Classmates by nickname (no real names).
create or replace function public.class_roster(class uuid)
returns table (student_id uuid, nickname text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nickname
  from class_members m join profiles p on p.id = m.student_id
  where m.class_id = class and (public.is_member_of(class) or public.is_teacher_of(class))
  order by p.nickname;
$$;

create or replace function public.can_gift(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from class_members x join class_members y on x.class_id = y.class_id where x.student_id = a and y.student_id = b)
    or ((select role from profiles where id = a) = 'player' and (select role from profiles where id = b) = 'player');
$$;

create or replace function public.send_gift(to_nickname text, amount int, note text default null)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  target uuid;
  sent_today int;
  gift_id bigint;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  select id into target from profiles where lower(nickname) = lower(to_nickname);
  if target is null then raise exception 'No player with that nickname.'; end if;
  if target = auth.uid() then raise exception 'You can''t gift yourself.'; end if;
  if not public.can_gift(auth.uid(), target) then
    raise exception 'Gifts are only allowed between classmates or between independent players.';
  end if;
  select coalesce(sum(g.amount), 0) into sent_today from gifts g where g.from_id = auth.uid() and g.created_at > now() - interval '1 day';
  if sent_today + amount > 100000 then raise exception 'Daily gift limit is ₦100,000.'; end if;
  insert into gifts (from_id, to_id, amount, note) values (auth.uid(), target, amount, left(note, 60)) returning id into gift_id;
  return gift_id;
end $$;

-- Atomically claim all pending gifts for the current player.
create or replace function public.claim_gifts()
returns table (id bigint, amount int, from_nickname text, note text)
language sql security definer set search_path = public as $$
  update gifts g set claimed_at = now()
  from profiles p
  where g.to_id = auth.uid() and g.claimed_at is null and p.id = g.from_id
  returning g.id, g.amount, p.nickname, g.note;
$$;

grant execute on function public.leaderboard(text, uuid, int) to authenticated;
grant execute on function public.class_roster(uuid) to authenticated;
grant execute on function public.send_gift(text, int, text) to authenticated;
grant execute on function public.claim_gifts() to authenticated;

-- Live class chat (Supabase Realtime), if the publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.class_messages;
  end if;
end $$;
