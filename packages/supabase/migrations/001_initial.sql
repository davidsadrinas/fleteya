-- FleteYa Database Schema
-- Migration: 001_initial

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Enum types
create type user_role as enum ('client', 'driver', 'admin');
create type vehicle_type as enum ('moto', 'utilitario', 'camioneta', 'camion', 'grua', 'atmosferico');
create type shipment_status as enum (
  'pending', 'accepted', 'heading_to_origin', 'at_origin',
  'loading', 'in_transit', 'arriving', 'delivered', 'cancelled'
);
create type shipment_type as enum ('mudanza', 'mercaderia', 'materiales', 'electrodomesticos', 'muebles', 'acarreo_vehiculo', 'limpieza_atmosferico', 'residuos');
create type payment_status as enum ('pending', 'approved', 'rejected', 'refunded');

-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null default '',
  phone text,
  role user_role not null default 'client',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Drivers
create table public.drivers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  verified boolean not null default false,
  dni_verified boolean not null default false,
  dni_front_url text,
  dni_back_url text,
  selfie_url text,
  license_url text,
  license_expiry date,
  insurance_url text,
  insurance_expiry date,
  vtv_url text,
  vtv_expiry date,
  rating numeric(3,2) not null default 0,
  total_trips integer not null default 0,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Vehicles
create table public.vehicles (
  id uuid default uuid_generate_v4() primary key,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  type vehicle_type not null,
  brand text not null,
  model text not null default '',
  year integer not null,
  plate text not null,
  capacity text,
  photo_url text,
  active boolean not null default false,
  -- Specialized certifications (grúa, atmosférico)
  hazmat_cert_url text,       -- Certificado Ambiental (Ley 24.051)
  hazmat_cert_expiry date,
  towing_license_url text,    -- Habilitación de grúa
  towing_license_expiry date,
  created_at timestamptz not null default now()
);

-- Shipments
create table public.shipments (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) not null,
  driver_id uuid references public.drivers(id),
  vehicle_id uuid references public.vehicles(id),
  status shipment_status not null default 'pending',
  type shipment_type,
  description text,
  weight text,
  helpers integer not null default 0,
  scheduled_at timestamptz,
  base_price numeric(12,2),
  discount numeric(5,2) default 0,
  final_price numeric(12,2),
  commission numeric(12,2),
  is_backhaul boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Shipment legs (multi-stop routes)
create table public.shipment_legs (
  id uuid default uuid_generate_v4() primary key,
  shipment_id uuid references public.shipments(id) on delete cascade not null,
  leg_order integer not null,
  origin_address text not null,
  origin_location geography(Point, 4326) not null,
  dest_address text not null,
  dest_location geography(Point, 4326) not null,
  distance_km numeric(8,2),
  estimated_minutes integer,
  price numeric(12,2),
  discount numeric(5,2) default 0,
  created_at timestamptz not null default now()
);

-- GPS tracking points
create table public.tracking_points (
  id uuid default uuid_generate_v4() primary key,
  shipment_id uuid references public.shipments(id) on delete cascade not null,
  location geography(Point, 4326) not null,
  speed numeric(6,2),
  heading numeric(6,2),
  created_at timestamptz not null default now()
);

-- Reviews
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  shipment_id uuid references public.shipments(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) not null,
  to_user_id uuid references public.profiles(id) not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

-- Payments
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  shipment_id uuid references public.shipments(id) not null,
  amount numeric(12,2) not null,
  commission numeric(12,2) not null,
  driver_payout numeric(12,2) not null,
  status payment_status not null default 'pending',
  mercadopago_id text,
  mercadopago_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_shipments_client on public.shipments(client_id);
create index idx_shipments_driver on public.shipments(driver_id);
create index idx_shipments_status on public.shipments(status);
create index idx_shipment_legs_shipment on public.shipment_legs(shipment_id);
create index idx_tracking_shipment on public.tracking_points(shipment_id);
create index idx_tracking_time on public.tracking_points(created_at desc);
create index idx_vehicles_driver on public.vehicles(driver_id);
create index idx_reviews_to on public.reviews(to_user_id);

-- Spatial indexes
create index idx_leg_origin on public.shipment_legs using gist(origin_location);
create index idx_leg_dest on public.shipment_legs using gist(dest_location);
create index idx_tracking_location on public.tracking_points using gist(location);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_legs enable row level security;
alter table public.tracking_points enable row level security;
alter table public.reviews enable row level security;
alter table public.payments enable row level security;

-- RLS Policies: Profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- RLS Policies: Drivers
create policy "Drivers can view own data" on public.drivers
  for select using (auth.uid() = user_id);
create policy "Drivers can update own data" on public.drivers
  for update using (auth.uid() = user_id);
create policy "Clients can view verified drivers" on public.drivers
  for select using (verified = true);

-- RLS Policies: Vehicles
create policy "Drivers can manage own vehicles" on public.vehicles
  for all using (driver_id in (select id from public.drivers where user_id = auth.uid()));
create policy "Anyone can view vehicles of verified drivers" on public.vehicles
  for select using (true);

-- RLS Policies: Shipments
create policy "Clients can view own shipments" on public.shipments
  for select using (auth.uid() = client_id);
create policy "Drivers can view assigned shipments" on public.shipments
  for select using (driver_id in (select id from public.drivers where user_id = auth.uid()));
create policy "Clients can create shipments" on public.shipments
  for insert with check (auth.uid() = client_id);

-- Function: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function: update driver rating after review
create or replace function public.update_driver_rating()
returns trigger as $$
begin
  update public.drivers
  set rating = (
    select coalesce(avg(r.rating), 0)
    from public.reviews r
    where r.to_user_id = (select user_id from public.drivers where id = new.to_user_id)
  )
  where user_id = new.to_user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.update_driver_rating();

-- Enable realtime for tracking
alter publication supabase_realtime add table public.tracking_points;
alter publication supabase_realtime add table public.shipments;
