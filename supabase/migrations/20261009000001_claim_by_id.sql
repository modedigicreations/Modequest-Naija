-- Two-phase top-up claiming: the game credits and saves first, then marks
-- exactly those entitlements claimed. Nothing paid for can be lost if the
-- tab closes in between (the save's own flags stop double crediting).
create or replace function public.claim_topups_by_id(ids bigint[])
returns table (id bigint, amount bigint)
language sql security definer set search_path = public as $$
  update entitlements e set claimed_at = now()
  where e.user_id = auth.uid() and e.kind = 'naira' and e.claimed_at is null and e.id = any(ids)
  returning e.id, e.quantity;
$$;

revoke execute on function public.claim_topups_by_id(bigint[]) from anon, public;
grant execute on function public.claim_topups_by_id(bigint[]) to authenticated;
