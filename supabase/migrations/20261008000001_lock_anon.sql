-- Supabase grants new functions to the anon role by default. None of ours
-- should be callable by signed-out visitors.
revoke execute on function public.leaderboard(text, uuid, int) from anon, public;
revoke execute on function public.class_roster(uuid) from anon, public;
revoke execute on function public.send_gift(text, int, text) from anon, public;
revoke execute on function public.claim_gifts() from anon, public;
revoke execute on function public.can_gift(uuid, uuid) from anon, public;
revoke execute on function public.is_teacher_of(uuid) from anon, public;
revoke execute on function public.is_member_of(uuid) from anon, public;
revoke execute on function public.my_role() from anon, public;
revoke execute on function public.new_class_code() from anon, public;

grant execute on function public.leaderboard(text, uuid, int) to authenticated;
grant execute on function public.class_roster(uuid) to authenticated;
grant execute on function public.send_gift(text, int, text) to authenticated;
grant execute on function public.claim_gifts() to authenticated;
grant execute on function public.can_gift(uuid, uuid) to authenticated;
grant execute on function public.is_teacher_of(uuid) to authenticated;
grant execute on function public.is_member_of(uuid) to authenticated;
grant execute on function public.my_role() to authenticated;
grant execute on function public.new_class_code() to authenticated;
