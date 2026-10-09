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

update saves set topped_up = 119990 where user_id = '55555555-5555-5555-5555-555555555555';
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);
select pg_temp.ok((select value from leaderboard('net_worth') where nickname = 'LagosBoss') = 10, 'leaderboard ranks earned wealth, not bought wealth');
commit;

begin;
set local role anon;
select pg_temp.fails($$select * from leaderboard('net_worth')$$, 'signed-out visitors cannot read leaderboards');
commit;

-- Referrals -------------------------------------------------------------------
select pg_temp.ok((select count(*) from profiles where referral_code ~ '^[A-Z0-9]{7}$') = 7, 'every profile has a referral code');
select set_config('test.code', (select referral_code from profiles where nickname = 'LagosBoss'), false);
select set_config('test.tcode', (select referral_code from profiles where nickname = 'SwiftDanfo42'), false);
insert into auth.users (id, email, raw_user_meta_data) values
  ('88888888-8888-8888-8888-888888888888', 'p3@mail.com', jsonb_build_object('role', 'player', 'nickname', 'NewPal', 'ref', lower(current_setting('test.code')))),
  ('99999999-9999-9999-9999-999999999999', 'p4@mail.com', '{"role":"player","nickname":"NoCodePal","ref":"NOPE!!"}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'p5@mail.com', jsonb_build_object('role', 'player', 'nickname', 'StudentRef', 'ref', current_setting('test.tcode')));
select pg_temp.ok((select referrer_id from referrals where referred_id = '88888888-8888-8888-8888-888888888888') = '55555555-5555-5555-5555-555555555555', 'sign-up with a code (any case) is recorded');
select pg_temp.ok(exists (select 1 from profiles where nickname = 'NoCodePal'), 'a bad code never blocks sign-up');
select pg_temp.ok(not exists (select 1 from referrals where referred_id in ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')), 'bad codes and class accounts are not referrers');

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
select pg_temp.ok((select invited from my_referral_stats()) = 1, 'inviter sees their count');
select pg_temp.fails($$insert into referrals (referred_id, referrer_id) values ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555')$$, 'players cannot fake referrals');
select pg_temp.fails($$update profiles set referral_code = 'VANITY1' where id = '55555555-5555-5555-5555-555555555555'$$, 'players cannot change their code');
commit;
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);
select pg_temp.ok((select count(*) from referrals) = 0, 'others cannot see someone else''s referrals');
commit;
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select pg_temp.ok((select count(*) from my_referral_stats()) = 0, 'class accounts get no referral code to share');
commit;

-- Invite bonus ------------------------------------------------------------------
insert into saves (user_id, state, day) values ('88888888-8888-8888-8888-888888888888', '{}', 1);
select pg_temp.ok((select rewarded_at from referrals where referred_id = '88888888-8888-8888-8888-888888888888') is null, 'no bonus before the friend plays');
update saves set day = 3 where user_id = '88888888-8888-8888-8888-888888888888';
select pg_temp.ok((select reward from referrals where referred_id = '88888888-8888-8888-8888-888888888888') = 20000, 'bonus granted when the friend reaches day 3');

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);
select pg_temp.ok((select count(*) from referral_rewards()) = 0, 'others see no bonus');
select pg_temp.ok((select count(*) from claim_referral_rewards(array['88888888-8888-8888-8888-888888888888'::uuid])) = 0, 'others cannot claim someone else''s bonus');
select pg_temp.fails($$select grant_referral_bonus('88888888-8888-8888-8888-888888888888', 99)$$, 'players cannot grant bonuses directly');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
select pg_temp.ok((select amount from referral_rewards()) = 20000, 'inviter sees the bonus waiting');
select pg_temp.ok((select friend from referral_rewards()) = 'NewPal', 'bonus names the friend');
select pg_temp.ok((select earned from my_referral_stats()) = 20000, 'stats show bonus earned');
select pg_temp.ok((select count(*) from claim_referral_rewards(array['88888888-8888-8888-8888-888888888888'::uuid])) = 1, 'inviter claims the bonus');
select pg_temp.ok((select count(*) from claim_referral_rewards(array['88888888-8888-8888-8888-888888888888'::uuid])) = 0, 'a bonus can only be claimed once');
select pg_temp.ok((select count(*) from referral_rewards()) = 0, 'nothing left to claim');
commit;

-- Cap: 10 bonuses per inviter every 30 days
do $$
declare i int;
begin
  for i in 1..11 loop
    insert into auth.users (id, email, raw_user_meta_data) values
      (('bbbbbbbb-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, 'cap' || i || '@mail.com',
       jsonb_build_object('role', 'player', 'nickname', 'CapPal' || i, 'ref', (select referral_code from profiles where nickname = 'MrsIbim')));
    insert into saves (user_id, state, day) values (('bbbbbbbb-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, '{}', 5);
  end loop;
end $$;
select pg_temp.ok((select count(*) from referrals r join profiles p on p.id = r.referrer_id where p.nickname = 'MrsIbim' and r.rewarded_at is not null) = 10, 'bonus capped at 10 per 30 days');
select pg_temp.ok((select count(*) from referrals r join profiles p on p.id = r.referrer_id where p.nickname = 'MrsIbim') = 11, 'every invite is still counted');

insert into auth.users (id, email, raw_user_meta_data) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'p6@mail.com', jsonb_build_object('role', 'player', 'nickname', 'RealPal', 'ref', (select referral_code from profiles where nickname = 'LagosBoss')));
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
insert into saves (user_id, state, day) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '{}', 1);
update saves set day = 4 where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
select pg_temp.fails($$update referrals set claimed_at = null$$, 'friends cannot touch referral rows');
commit;
select pg_temp.ok((select reward from referrals where referred_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc') = 20000, 'the friend''s own game save triggers the bonus');

-- Economy checks ----------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('dddddddd-0000-0000-0000-000000000001', 'honest@mail.com', '{"role":"player","nickname":"HonestPal"}'),
  ('dddddddd-0000-0000-0000-000000000002', 'timecheat@mail.com', '{"role":"player","nickname":"TimeCheat"}'),
  ('dddddddd-0000-0000-0000-000000000003', 'richcheat@mail.com', '{"role":"player","nickname":"RichCheat"}');
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-000000000001', true);
-- Honest save, but the client summary lies about lessons, shifts and days.
insert into saves (user_id, state, net_worth, lessons_passed, shifts, day)
  values ('dddddddd-0000-0000-0000-000000000001', '{"time": 10500, "flags": {"startDay": 7}, "lessons": {"budget": 80, "ponzi": 40}, "stats": {"shiftsWorked": 1, "scamsAvoided": 2, "scamsFallen": 0}}', 90000, 25, 99, 40);
commit;
select pg_temp.ok((select lessons_passed from saves where user_id = 'dddddddd-0000-0000-0000-000000000001') = 1, 'lessons passed comes from the save, not the client');
select pg_temp.ok((select shifts from saves where user_id = 'dddddddd-0000-0000-0000-000000000001') = 1, 'shifts come from the save');
select pg_temp.ok((select day from saves where user_id = 'dddddddd-0000-0000-0000-000000000001') = 2, 'days played come from the save (life day)');
select pg_temp.ok((select flagged from saves where user_id = 'dddddddd-0000-0000-0000-000000000001') is null, 'an honest save is not flagged');

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-000000000002', true);
insert into saves (user_id, state, net_worth) values ('dddddddd-0000-0000-0000-000000000002', '{"time": 144000, "flags": {"startDay": 1}}', 50000);
commit;
select pg_temp.ok((select flagged from saves where user_id = 'dddddddd-0000-0000-0000-000000000002') like 'days played%', 'a brand-new account claiming 101 days is flagged');

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-000000000003', true);
insert into saves (user_id, state, net_worth) values ('dddddddd-0000-0000-0000-000000000003', '{"time": 600}', 900000000);
select pg_temp.ok((select count(*) from leaderboard('net_worth') where nickname = 'RichCheat') = 0, 'flagged wealth never reaches the leaderboard');
update saves set flagged = null, first_saved_at = now() - interval '900 days' where user_id = 'dddddddd-0000-0000-0000-000000000003';
commit;
select pg_temp.ok((select flagged from saves where user_id = 'dddddddd-0000-0000-0000-000000000003') like 'wealth%', 'players cannot clear their own flag or backdate their account');

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-000000000001', true);
update saves set net_worth = 9000000 where user_id = 'dddddddd-0000-0000-0000-000000000001';
commit;
select pg_temp.ok((select flagged from saves where user_id = 'dddddddd-0000-0000-0000-000000000001') is not null, 'a huge wealth jump in a day is flagged');

insert into auth.users (id, email, raw_user_meta_data) values ('dddddddd-0000-0000-0000-000000000004', 'guest@mail.com', '{"role":"player","nickname":"GuestFirst"}');
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-000000000004', true);
insert into saves (user_id, state, net_worth) values ('dddddddd-0000-0000-0000-000000000004', '{"time": 30000, "flags": {"startDay": 1}}', 400000);
commit;
select pg_temp.ok((select flagged from saves where user_id = 'dddddddd-0000-0000-0000-000000000004') is null, 'three weeks of guest play brought to a new account is not flagged');

-- A flagged friend's save doesn't pay the inviter.
insert into auth.users (id, email, raw_user_meta_data) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'cheatpal@mail.com', jsonb_build_object('role', 'player', 'nickname', 'CheatPal', 'ref', (select referral_code from profiles where nickname = 'HonestPal')));
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'eeeeeeee-0000-0000-0000-000000000001', true);
insert into saves (user_id, state, net_worth) values ('eeeeeeee-0000-0000-0000-000000000001', '{"time": 600}', 900000000);
update saves set state = '{"time": 6000}' where user_id = 'eeeeeeee-0000-0000-0000-000000000001';
commit;
select pg_temp.ok((select flagged from saves where user_id = 'eeeeeeee-0000-0000-0000-000000000001') is not null, 'cheating friend is flagged');
select pg_temp.ok((select rewarded_at from referrals where referred_id = 'eeeeeeee-0000-0000-0000-000000000001') is null, 'a flagged friend earns the inviter no bonus');

\o
\echo 'ALL RLS TESTS PASSED'
