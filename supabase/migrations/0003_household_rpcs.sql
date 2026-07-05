-- RPCs for the two operations that can't be expressed as plain RLS-gated
-- inserts: creating a household (need to insert the household row AND the
-- creator's membership row atomically) and joining one via an invite code
-- (need to look up the invite before the caller is a member of anything).

create or replace function public.create_household(household_name text, member_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into households (name, created_by)
  values (household_name, auth.uid())
  returning id into new_household_id;

  insert into household_members (household_id, user_id, role, display_name)
  values (new_household_id, auth.uid(), 'owner', member_display_name);

  return new_household_id;
end;
$$;

create or replace function public.create_household_invite(hid uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if not is_household_member(hid) then
    raise exception 'not a member of this household';
  end if;

  new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  insert into household_invites (household_id, code, created_by)
  values (hid, new_code, auth.uid());

  return new_code;
end;
$$;

create or replace function public.join_household_with_code(invite_code text, member_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite household_invites%rowtype;
begin
  select * into invite
  from household_invites
  where code = upper(invite_code)
  for update;

  if invite is null then
    raise exception 'invalid invite code';
  end if;

  if invite.expires_at < now() then
    raise exception 'invite code has expired';
  end if;

  if invite.max_uses is not null and invite.use_count >= invite.max_uses then
    raise exception 'invite code has already been used';
  end if;

  insert into household_members (household_id, user_id, role, display_name)
  values (invite.household_id, auth.uid(), 'member', member_display_name)
  on conflict (household_id, user_id) do nothing;

  update household_invites
  set use_count = use_count + 1
  where id = invite.id;

  return invite.household_id;
end;
$$;
