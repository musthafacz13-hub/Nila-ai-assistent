-- Family GPS MVP schema.
-- Apply this migration in Supabase SQL Editor or through the Supabase CLI.
-- The client must use only the anon key; never ship a service-role key.

create extension if not exists pgcrypto with schema extensions;

create type public.family_role as enum ('admin', 'receiver');
create type public.network_status as enum ('wifi', 'mobile', 'offline', 'unknown');

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null check (char_length(name) between 1 and 120),
    email text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.families (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 120),
    admin_user_id uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.family_members (
    id uuid primary key default gen_random_uuid(),
    family_id uuid not null references public.families(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role public.family_role not null,
    device_name text not null default 'Family GPS device' check (char_length(device_name) between 1 and 120),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (family_id, user_id),
    unique (family_id, role) deferrable initially immediate
);

create or replace function public.seed_admin_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.family_members (family_id, user_id, role, device_name)
    values (new.id, new.admin_user_id, 'admin', 'Admin phone');
    return new;
end;
$$;

create trigger families_seed_admin_membership
    after insert on public.families
    for each row execute function public.seed_admin_membership();

create table public.pairing_codes (
    id uuid primary key default gen_random_uuid(),
    family_id uuid not null references public.families(id) on delete cascade,
    code_hash text not null,
    created_by uuid not null references auth.users(id) on delete restrict,
    expires_at timestamptz not null,
    used_at timestamptz,
    created_at timestamptz not null default now()
);

create table public.locations (
    id bigint generated always as identity primary key,
    family_member_id uuid not null references public.family_members(id) on delete cascade,
    latitude double precision not null check (latitude between -90 and 90),
    longitude double precision not null check (longitude between -180 and 180),
    accuracy double precision not null check (accuracy >= 0),
    battery_level smallint check (battery_level between 0 and 100),
    is_charging boolean not null default false,
    network_status public.network_status not null default 'unknown',
    speed double precision check (speed is null or speed >= 0),
    heading double precision check (heading is null or (heading >= 0 and heading < 360)),
    recorded_at timestamptz not null,
    created_at timestamptz not null default now()
);

create table public.device_status (
    id uuid primary key default gen_random_uuid(),
    family_member_id uuid not null unique references public.family_members(id) on delete cascade,
    is_online boolean not null default false,
    battery_level smallint check (battery_level between 0 and 100),
    is_charging boolean not null default false,
    gps_available boolean not null default false,
    network_status public.network_status not null default 'unknown',
    sharing_enabled boolean not null default false,
    last_seen_at timestamptz,
    updated_at timestamptz not null default now()
);

create index locations_member_recorded_idx
    on public.locations (family_member_id, recorded_at desc);
create index pairing_codes_active_idx
    on public.pairing_codes (family_id, expires_at)
    where used_at is null;

create or replace function public.is_family_admin(p_user_id uuid, p_family_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.families f
        where f.id = p_family_id
          and f.admin_user_id = p_user_id
    );
$$;

create or replace function public.is_family_member(p_user_id uuid, p_family_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.family_members fm
        where fm.family_id = p_family_id
          and fm.user_id = p_user_id
    );
$$;

-- Returns the plain code exactly once to the authenticated Admin. Only its hash is stored.
create or replace function public.create_pairing_code(p_family_id uuid)
returns table (pairing_id uuid, code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_bytes bytea;
    v_value bigint;
    v_code text;
    v_expires timestamptz;
    v_id uuid;
begin
    if auth.uid() is null or not public.is_family_admin(auth.uid(), p_family_id) then
        raise exception 'not authorized';
    end if;

    v_bytes := extensions.gen_random_bytes(4);
    v_value := get_byte(v_bytes, 0)::bigint * 16777216
             + get_byte(v_bytes, 1)::bigint * 65536
             + get_byte(v_bytes, 2)::bigint * 256
             + get_byte(v_bytes, 3)::bigint;
    v_code := lpad((100000 + (v_value % 900000))::text, 6, '0');
    v_expires := now() + interval '10 minutes';

    update public.pairing_codes
       set used_at = now()
     where family_id = p_family_id
       and used_at is null;

    insert into public.pairing_codes (family_id, code_hash, created_by, expires_at)
    values (
        p_family_id,
        encode(extensions.digest(convert_to(v_code, 'UTF8'), 'sha256'), 'hex'),
        auth.uid(),
        v_expires
    )
    returning id into v_id;

    return query select v_id, v_code, v_expires;
end;
$$;

-- Validates and consumes a code atomically, then creates the Receiver membership.
create or replace function public.redeem_pairing_code(p_code text, p_device_name text)
returns public.family_members
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_code_row public.pairing_codes;
    v_member public.family_members;
    v_hash text;
begin
    if auth.uid() is null then
        raise exception 'authentication required';
    end if;
    if p_code is null or p_code !~ '^[0-9]{6}$' then
        raise exception 'invalid pairing code';
    end if;
    if p_device_name is null or char_length(trim(p_device_name)) not between 1 and 120 then
        raise exception 'invalid device name';
    end if;

    v_hash := encode(extensions.digest(convert_to(p_code, 'UTF8'), 'sha256'), 'hex');

    select * into v_code_row
      from public.pairing_codes
     where code_hash = v_hash
       and used_at is null
       and expires_at > now()
     order by created_at desc
     limit 1
     for update;

    if not found then
        raise exception 'invalid or expired pairing code';
    end if;

    if exists (
        select 1 from public.family_members
         where family_id = v_code_row.family_id
           and user_id = auth.uid()
    ) then
        raise exception 'already a family member';
    end if;

    if exists (
        select 1 from public.family_members
         where family_id = v_code_row.family_id
           and role = 'receiver'
    ) then
        raise exception 'family already has a receiver';
    end if;

    update public.pairing_codes
       set used_at = now()
     where id = v_code_row.id;

    insert into public.family_members (family_id, user_id, role, device_name)
    values (v_code_row.family_id, auth.uid(), 'receiver', trim(p_device_name))
    returning * into v_member;

    insert into public.device_status (family_member_id, sharing_enabled)
    values (v_member.id, false);

    return v_member;
end;
$$;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.pairing_codes enable row level security;
alter table public.locations enable row level security;
alter table public.device_status enable row level security;

create policy profiles_select_self on public.profiles
    for select to authenticated using (id = auth.uid());
create policy profiles_insert_self on public.profiles
    for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on public.profiles
    for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy families_admin_select on public.families
    for select to authenticated using (admin_user_id = auth.uid());
create policy families_admin_insert on public.families
    for insert to authenticated with check (admin_user_id = auth.uid());
create policy families_admin_update on public.families
    for update to authenticated using (admin_user_id = auth.uid()) with check (admin_user_id = auth.uid());
create policy families_admin_delete on public.families
    for delete to authenticated using (admin_user_id = auth.uid());

create policy members_family_select on public.family_members
    for select to authenticated using (public.is_family_member(auth.uid(), family_id));
create policy members_self_update on public.family_members
    for update to authenticated using (user_id = auth.uid())
    with check (user_id = auth.uid() and role = 'receiver');
create policy members_admin_delete on public.family_members
    for delete to authenticated using (public.is_family_admin(auth.uid(), family_id));

create policy pairing_admin_select on public.pairing_codes
    for select to authenticated using (public.is_family_admin(auth.uid(), family_id));

create policy locations_admin_select on public.locations
    for select to authenticated using (
        exists (
            select 1 from public.family_members fm
            where fm.id = family_member_id
              and public.is_family_admin(auth.uid(), fm.family_id)
        )
    );
create policy locations_receiver_insert on public.locations
    for insert to authenticated with check (
        exists (
            select 1 from public.family_members fm
            where fm.id = family_member_id
              and fm.user_id = auth.uid()
              and fm.role = 'receiver'
        )
    );
create policy locations_receiver_update on public.locations
    for update to authenticated using (
        exists (
            select 1 from public.family_members fm
            where fm.id = family_member_id and fm.user_id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from public.family_members fm
            where fm.id = family_member_id and fm.user_id = auth.uid()
        )
    );

create policy status_family_select on public.device_status
    for select to authenticated using (
        exists (
            select 1 from public.family_members fm
            where fm.id = family_member_id
              and public.is_family_member(auth.uid(), fm.family_id)
        )
    );
create policy status_receiver_insert on public.device_status
    for insert to authenticated with check (
        exists (
            select 1 from public.family_members fm
            where fm.id = family_member_id and fm.user_id = auth.uid() and fm.role = 'receiver'
        )
    );
create policy status_receiver_update on public.device_status
    for update to authenticated using (
        exists (
            select 1 from public.family_members fm
            where fm.id = family_member_id and fm.user_id = auth.uid() and fm.role = 'receiver'
        )
    ) with check (
        exists (
            select 1 from public.family_members fm
            where fm.id = family_member_id and fm.user_id = auth.uid() and fm.role = 'receiver'
        )
    );

-- Realtime publication for Admin subscriptions. Re-check RLS behavior in the target Supabase project.
alter publication supabase_realtime add table public.locations;
alter publication supabase_realtime add table public.device_status;
