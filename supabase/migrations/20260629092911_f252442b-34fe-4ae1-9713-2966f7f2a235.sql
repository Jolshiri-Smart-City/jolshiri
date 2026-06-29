
-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type property_status as enum ('available','booked','sold');
create type facing_direction as enum ('north','south','east','west','north_east','north_west','south_east','south_west');
create type construction_stage as enum ('planning','foundation','structure','finishing','ready');
create type media_type as enum ('photo','floor_plan','video','virtual_tour');
create type user_role as enum ('buyer','agent','admin');
create type lead_status as enum ('new','contacted','site_visit','closed');

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

-- Developers
create table public.developers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  contact_phone text,
  contact_email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.developers to anon;
grant select, insert, update, delete on public.developers to authenticated;
grant all on public.developers to service_role;
alter table public.developers enable row level security;
create trigger trg_developers_updated_at before update on public.developers for each row execute function public.set_updated_at();

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete restrict,
  name text not null,
  sector text not null,
  block text,
  description text,
  rajuk_approval_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create trigger trg_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create index idx_projects_developer on public.projects(developer_id);
create index idx_projects_sector on public.projects(sector);

-- Amenities
create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text
);
grant select on public.amenities to anon;
grant select, insert, update, delete on public.amenities to authenticated;
grant all on public.amenities to service_role;
alter table public.amenities enable row level security;

-- Properties
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  unit_number text not null,
  floor_number int,
  total_floors int,
  price_total numeric(14,2) not null,
  price_per_sqft numeric(10,2),
  booking_money numeric(14,2),
  payment_plan jsonb,
  is_negotiable boolean not null default false,
  size_sqft numeric(8,2) not null,
  bedrooms int not null,
  bathrooms int,
  facing facing_direction,
  has_balcony boolean default false,
  status property_status not null default 'available',
  possession_date date,
  is_ready_to_move boolean default false,
  construction_stage construction_stage,
  lat numeric(10,6),
  lng numeric(10,6),
  plot_road_number text,
  registration_type text,
  ownership_docs_available boolean default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, unit_number)
);
grant select on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;
grant all on public.properties to service_role;
alter table public.properties enable row level security;
create trigger trg_properties_updated_at before update on public.properties for each row execute function public.set_updated_at();
create index idx_properties_price on public.properties(price_total);
create index idx_properties_size on public.properties(size_sqft);
create index idx_properties_bedrooms on public.properties(bedrooms);
create index idx_properties_status on public.properties(status);
create index idx_properties_possession on public.properties(possession_date);
create index idx_properties_project on public.properties(project_id);
create index idx_properties_filter_combo on public.properties(status,bedrooms,price_total,size_sqft);

-- Property amenities
create table public.property_amenities (
  property_id uuid not null references public.properties(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);
grant select on public.property_amenities to anon;
grant select, insert, update, delete on public.property_amenities to authenticated;
grant all on public.property_amenities to service_role;
alter table public.property_amenities enable row level security;
create index idx_property_amenities_amenity on public.property_amenities(amenity_id);

-- Property media
create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  media_type media_type not null,
  url text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.property_media to anon;
grant select, insert, update, delete on public.property_media to authenticated;
grant all on public.property_media to service_role;
alter table public.property_media enable row level security;
create index idx_property_media_property on public.property_media(property_id, display_order);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'buyer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- New user trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$ begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'buyer');
  return new;
end; $$;
create trigger trg_on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Favorites
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);
grant select, insert, update, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create index idx_favorites_user on public.favorites(user_id);

-- Saved searches
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  filters jsonb not null,
  alerts_enabled boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.saved_searches to authenticated;
grant all on public.saved_searches to service_role;
alter table public.saved_searches enable row level security;
create index idx_saved_searches_user on public.saved_searches(user_id);

-- Leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  source_filters jsonb,
  message text,
  request_type text,
  status lead_status not null default 'new',
  assigned_agent_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;
alter table public.leads enable row level security;
create trigger trg_leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
create index idx_leads_property on public.leads(property_id);
create index idx_leads_status on public.leads(status);
create index idx_leads_agent on public.leads(assigned_agent_id);

-- Lead status history
create table public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  old_status lead_status,
  new_status lead_status not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now()
);
grant select on public.lead_status_history to authenticated;
grant all on public.lead_status_history to service_role;
alter table public.lead_status_history enable row level security;

create or replace function public.log_lead_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$ begin
  if old.status is distinct from new.status then
    insert into public.lead_status_history (lead_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end; $$;
create trigger trg_log_lead_status_change after update on public.leads for each row execute function public.log_lead_status_change();

-- Admin audit log
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  changes jsonb,
  created_at timestamptz not null default now()
);
grant select on public.admin_audit_log to authenticated;
grant all on public.admin_audit_log to service_role;
alter table public.admin_audit_log enable row level security;

-- Helper functions
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.is_agent_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role in ('agent','admin')); $$;

-- Policies
create policy "Public read developers" on public.developers for select using (true);
create policy "Admin write developers" on public.developers for all using (public.is_admin()) with check (public.is_admin());

create policy "Public read projects" on public.projects for select using (true);
create policy "Admin write projects" on public.projects for all using (public.is_admin()) with check (public.is_admin());

create policy "Public read amenities" on public.amenities for select using (true);
create policy "Admin write amenities" on public.amenities for all using (public.is_admin()) with check (public.is_admin());

create policy "Public read properties" on public.properties for select using (true);
create policy "Agent/Admin write properties" on public.properties for all using (public.is_agent_or_admin()) with check (public.is_agent_or_admin());

create policy "Public read property_amenities" on public.property_amenities for select using (true);
create policy "Agent/Admin write property_amenities" on public.property_amenities for all using (public.is_agent_or_admin()) with check (public.is_agent_or_admin());

create policy "Public read property_media" on public.property_media for select using (true);
create policy "Agent/Admin write property_media" on public.property_media for all using (public.is_agent_or_admin()) with check (public.is_agent_or_admin());

create policy "Users view own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage own favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own saved searches" on public.saved_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Anyone can create a lead" on public.leads for insert with check (true);
create policy "Users view own leads, staff view all" on public.leads for select using (auth.uid() = user_id or public.is_agent_or_admin());
create policy "Agent/Admin update leads" on public.leads for update using (public.is_agent_or_admin()) with check (public.is_agent_or_admin());

create policy "Agent/Admin read lead history" on public.lead_status_history for select using (public.is_agent_or_admin());
create policy "Admin only audit log" on public.admin_audit_log for select using (public.is_admin());

-- Listing view
create view public.property_listing_view
with (security_invoker = on) as
select
  p.id, p.unit_number, p.price_total, p.price_per_sqft, p.size_sqft,
  p.bedrooms, p.bathrooms, p.floor_number, p.status, p.possession_date,
  p.is_ready_to_move, p.facing, p.created_at,
  pr.name as project_name, pr.sector, pr.block,
  d.name as developer_name,
  (select pm.url from public.property_media pm where pm.property_id = p.id and pm.media_type='photo' order by pm.display_order asc limit 1) as cover_photo_url
from public.properties p
join public.projects pr on pr.id = p.project_id
join public.developers d on d.id = pr.developer_id;
grant select on public.property_listing_view to anon, authenticated;

-- Seed amenities
insert into public.amenities (name) values
('Lift'),('Generator'),('Gas Line'),('Parking'),('Community Space'),
('Security'),('Mosque Nearby'),('School Nearby'),('Market Nearby'),
('Swimming Pool'),('Gym'),('Rooftop Garden')
on conflict (name) do nothing;
