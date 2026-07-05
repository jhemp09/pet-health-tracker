-- Households (a group of people sharing one or more pets) and pets themselves.

create extension if not exists pgcrypto;

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_uses int,
  use_count int not null default 0,
  created_at timestamptz not null default now()
);

create table pets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  species text not null default 'dog' check (species in ('dog', 'cat', 'other')),
  breed text,
  birth_date date,
  photo_url text,
  created_at timestamptz not null default now()
);

create index household_members_user_id_idx on household_members(user_id);
create index household_members_household_id_idx on household_members(household_id);
create index household_invites_code_idx on household_invites(code);
create index pets_household_id_idx on pets(household_id);

-- Helper functions used by RLS policies (security definer so they bypass RLS
-- on the tables they read, which avoids recursive-policy issues).

create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from household_members hm
    where hm.household_id = hid and hm.user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(hid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from household_members hm
    where hm.household_id = hid and hm.user_id = auth.uid() and hm.role = 'owner'
  );
$$;

create or replace function public.pet_household_id(pid uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select household_id from pets where id = pid;
$$;
