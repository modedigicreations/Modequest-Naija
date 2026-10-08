-- Row-level security tests. Run with scripts/test-db.sh (local Postgres).
\set ON_ERROR_STOP on
set client_min_messages = notice;
\o /dev/null

create or replace function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FAIL: %', label; end if;
  raise notice 'PASS: %', label;
end $$;

-- Expect a statement to fail.
create or replace function pg_temp.fails(stmt text, label text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'PASS: % (%)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % — statement succeeded', label;
end $$;

grant execute on function pg_temp.ok(boolean, text) to authenticated;
grant execute on function pg_temp.fails(text, text) to authenticated, anon;
grant execute on function pg_temp.ok(boolean, text) to anon;

-- Users ---------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 't@school.ng', '{"role":"teacher","nickname":"MrsIbim","display_name":"Mrs Ibim","school":"GGSS Rumueme"}'),
  ('77777777-7777-7777-7777-777777777777', 't2@school.ng', '{"role":"teacher","nickname":"MrOkafor"}'),
  ('22222222-2222-2222-2222-222222222222', 'ada-abc123@students.modequest.com.ng', '{"role":"student","nickname":"SwiftDanfo42"}'),
  ('33333333-3333-3333-3333-333333333333', 'tobi-abc123@students.modequest.com.ng', '{"role":"student","nickname":"BrightKeke17"}'),
  ('44444444-4444-4444-4444-444444444444', 'zee-xyz999@students.modequest.com.ng', '{"role":"student","nickname":"CalmSuya88"}'),
  ('55555555-5555-5555-5555-555555555555', 'p1@mail.com', '{"role":"player","nickname":"LagosBoss"}'),
  ('66666666-6666-6666-6666-666666666666', 'p2@mail.com', '{"nickname":"AbujaQueen","role":"admin"}');

select pg_temp.ok((select count(*) from profiles) = 7, 'profiles created by trigger');
select pg_temp.ok((select role from profiles where nickname = 'AbujaQueen') = 'player', 'unknown role falls back to player');

-- Teacher creates a class ---------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
insert into classes (teacher_id, name, school) values ('11111111-1111-1111-1111-111111111111', 'JSS2 Gold', 'GGSS Rumueme');
select pg_temp.ok((select length(code) = 6 from classes where name = 'JSS2 Gold'), 'class gets a 6-char code');
commit;

-- Other teacher's class (for isolation)
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-7777-7777-777777777777', true);
insert into classes (teacher_id, name) values ('77777777-7777-7777-7777-777777777777', 'SS1 Blue');
commit;

-- Server (service role / superuser) enrols students
insert into class_members (class_id, student_id, real_name, username)
select id, '22222222-2222-2222-2222-222222222222', 'Adaeze Okoro', 'ada' from classes where name = 'JSS2 Gold';
insert into class_members (class_id, student_id, real_name, username)
select id, '33333333-3333-3333-3333-333333333333', 'Tobi Bello', 'tobi' from classes where name = 'JSS2 Gold';
insert into class_members (class_id, student_id, real_name, username)
select id, '44444444-4444-4444-4444-444444444444', 'Zainab Musa', 'zee' from classes where name = 'SS1 Blue';

select id as ss1 from classes where name = 'SS1 Blue' \gset
select id as gold from classes where name = 'JSS2 Gold' \gset

-- Saves
insert into saves (user_id, state, net_worth, lessons_passed, scams_avoided, city) values
  ('22222222-2222-2222-2222-222222222222', '{"secret":"ada"}', 50000, 5, 3, 'portharcourt'),
  ('33333333-3333-3333-3333-333333333333', '{"secret":"tobi"}', 80000, 2, 1, 'portharcourt'),
  ('44444444-4444-4444-4444-444444444444', '{"secret":"zee"}', 90000, 7, 4, 'abuja'),
  ('55555555-5555-5555-5555-555555555555', '{"secret":"p1"}', 120000, 1, 0, 'lagos');

-- Student view ---------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select pg_temp.ok((select count(*) from class_members) = 1, 'student sees only own membership row');
select pg_temp.ok((select count(*) from classes) = 1, 'student sees only own class');
select pg_temp.ok((select count(*) from saves) = 1, 'student reads only own save');
select pg_temp.ok((select count(*) from class_roster((select id from classes limit 1))) = 2, 'student sees classmates by nickname');
select pg_temp.fails($$insert into classes (teacher_id, name) values ('22222222-2222-2222-2222-222222222222', 'Fake')$$, 'student cannot create a class');
select pg_temp.fails($$update profiles set role = 'teacher' where id = '22222222-2222-2222-2222-222222222222'$$, 'student cannot change role');
update profiles set city = 'enugu' where id = '22222222-2222-2222-2222-222222222222';
select pg_temp.ok((select city from profiles where id = '22222222-2222-2222-2222-222222222222') = 'enugu', 'student can change own city');
select pg_temp.fails($$insert into class_members (class_id, student_id, real_name, username) select id, '22222222-2222-2222-2222-222222222222', 'x', 'xx' from classes$$, 'student cannot add members');

-- class chat
insert into class_messages (class_id, author_id, body)
select id, '22222222-2222-2222-2222-222222222222', 'You are so stupid lol, call me 08031234567 or visit https://bad.link' from classes;
select pg_temp.ok((select body from class_messages order by id desc limit 1) = 'You are so ****** lol, call me [number hidden] or visit [link hidden]', 'chat filter masks insults, numbers and links');
select pg_temp.fails($$insert into class_messages (class_id, author_id, body) select id, '33333333-3333-3333-3333-333333333333', 'impersonation' from classes$$, 'cannot post as someone else');

-- gifts
select pg_temp.ok(send_gift('BrightKeke17', 5000) > 0, 'classmates can gift each other');
select pg_temp.fails($$select send_gift('LagosBoss', 5000)$$, 'student cannot gift a stranger');
select pg_temp.fails($$select send_gift('CalmSuya88', 5000)$$, 'student cannot gift another class');
select pg_temp.fails($$select send_gift('BrightKeke17', 99000)$$, 'daily gift cap enforced');

-- leaderboard: class-only view
select pg_temp.ok((select count(*) from leaderboard('academy', (select id from classes limit 1))) = 2, 'class leaderboard shows only classmates');
select pg_temp.ok((select count(*) from leaderboard('academy', :'ss1')) = 0, 'cannot read another class leaderboard');
commit;

-- Classmate claims the gift
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select pg_temp.ok((select sum(amount) from claim_gifts()) = 5000, 'recipient claims gift');
select pg_temp.ok((select count(*) from claim_gifts()) = 0, 'gift cannot be claimed twice');
select pg_temp.ok((select count(*) from class_messages) = 1, 'classmate reads class chat');
commit;

-- Teacher view ----------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select pg_temp.ok((select count(*) from class_members) = 2, 'teacher sees own roster');
select pg_temp.ok((select string_agg(real_name, ',' order by real_name) from class_members) = 'Adaeze Okoro,Tobi Bello', 'teacher sees real names');
select pg_temp.ok((select count(*) from saves) = 2, 'teacher reads own students'' saves');
update class_messages set deleted_at = now();
insert into assignments (class_id, lesson_id) select id, 'phishing' from classes where teacher_id = auth.uid();
update classes set chat_enabled = false where teacher_id = auth.uid();
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select pg_temp.ok((select count(*) from class_messages) = 0, 'deleted messages hidden from students');
select pg_temp.ok((select count(*) from assignments) = 1, 'student sees assignment');
select pg_temp.fails($$insert into class_messages (class_id, author_id, body) select id, '22222222-2222-2222-2222-222222222222', 'hi' from classes$$, 'student cannot post when chat is off');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-7777-7777-777777777777', true);
select pg_temp.ok((select count(*) from class_members) = 1, 'other teacher sees only their roster');
select pg_temp.ok((select count(*) from saves) = 1, 'other teacher reads only their student');
select pg_temp.fails(format($$insert into assignments (class_id, lesson_id) values (%L, 'x')$$, :'gold'), 'teacher cannot assign to another class');
commit;

-- Independent players ---------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
select pg_temp.ok(send_gift('AbujaQueen', 1000) > 0, 'independent players can gift each other');
select pg_temp.fails($$select send_gift('SwiftDanfo42', 1000)$$, 'adult player cannot gift a student');
select pg_temp.ok((select count(*) from classes) = 0, 'player sees no classes');
select pg_temp.ok((select count(*) from class_messages) = 0, 'player cannot read class chat');
select pg_temp.ok((select count(*) from leaderboard('net_worth')) = 4, 'global leaderboard excludes teachers');
select pg_temp.ok(not exists (select 1 from information_schema.columns where table_name = 'leaderboard'), 'leaderboard is a function');
commit;

-- Payments & plans -----------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
select pg_temp.fails($$insert into orders (user_id, product_id, amount_kobo, reference) values ('55555555-5555-5555-5555-555555555555', 'x', 100, 'r1')$$, 'players cannot create orders directly');
select pg_temp.fails($$insert into entitlements (user_id, kind, item, quantity) values ('55555555-5555-5555-5555-555555555555', 'naira', 'topup', 999999)$$, 'players cannot grant themselves items');
commit;

-- Server grants a paid top-up
insert into orders (id, user_id, product_id, amount_kobo, reference, status) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'topup_s', 30000, 'ref_test_1', 'paid');
insert into entitlements (user_id, order_id, kind, item, quantity) values ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'naira', 'topup_s', 30000);
select pg_temp.fails($$insert into entitlements (user_id, order_id, kind, item, quantity) values ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'naira', 'topup_s', 30000)$$, 'an order grants each item only once');

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
select pg_temp.ok((select count(*) from claim_topups_by_id(array[999]::bigint[])) = 0, 'claim by id ignores unknown ids');
select pg_temp.ok((select sum(amount) from claim_topups_by_id(array(select id from entitlements where kind = 'naira'))) = 30000, 'player claims top-up by id');
select pg_temp.ok((select count(*) from claim_topups_by_id(array(select id from entitlements where kind = 'naira'))) = 0, 'top-up cannot be claimed twice');
select pg_temp.ok((select count(*) from orders) = 1, 'player sees own orders');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);
select pg_temp.ok((select count(*) from orders) = 0, 'players cannot see others'' orders');
select pg_temp.ok((select count(*) from claim_topups()) = 0, 'cannot claim someone else''s top-up');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select pg_temp.ok((select plan from my_plan()) = 'free', 'teachers start on the free plan');
select pg_temp.fails($$insert into classes (teacher_id, name) values ('11111111-1111-1111-1111-111111111111', 'Second class')$$, 'free plan allows one class');
commit;

insert into entitlements (user_id, kind, item, expires_at) values ('11111111-1111-1111-1111-111111111111', 'plan', 'classroom', now() + interval '120 days');
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select pg_temp.ok((select max_classes from my_plan()) = 5, 'classroom plan raises limit');
insert into classes (teacher_id, name) values ('11111111-1111-1111-1111-111111111111', 'Second class');
select pg_temp.ok((select count(*) from classes) = 2, 'upgraded teacher creates a second class');
commit;

update saves set earned_worth = 10 where user_id = '55555555-5555-5555-5555-555555555555';
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);
select pg_temp.ok((select value from leaderboard('net_worth') where nickname = 'LagosBoss') = 10, 'leaderboard ranks earned wealth, not bought wealth');
commit;

begin;
set local role anon;
select pg_temp.fails($$select * from leaderboard('net_worth')$$, 'signed-out visitors cannot read leaderboards');
commit;

\o
\echo 'ALL RLS TESTS PASSED'
