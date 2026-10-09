-- Invite bonuses only count friends whose save passes the economy checks:
-- a flagged (implausible) save can't earn the inviter game money.
create or replace function public.on_save_referral() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    if new.flagged is null then
      perform public.grant_referral_bonus(new.user_id, new.day);
    end if;
  exception when others then
    -- never block saving the game
  end;
  return new;
end $$;
