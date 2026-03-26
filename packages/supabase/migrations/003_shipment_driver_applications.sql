-- Driver applications to shipments + platform-side assignment (flexible strategies in app code).

create type application_status as enum ('pending', 'selected', 'rejected', 'withdrawn');

create table public.shipment_driver_applications (
  id uuid default uuid_generate_v4() primary key,
  shipment_id uuid references public.shipments(id) on delete cascade not null,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  status application_status not null default 'pending',
  applied_at timestamptz not null default now(),
  driver_lat double precision,
  driver_lng double precision,
  unique (shipment_id, driver_id)
);

create index idx_shipment_applications_shipment on public.shipment_driver_applications(shipment_id);
create index idx_shipment_applications_driver on public.shipment_driver_applications(driver_id);
create index idx_shipment_applications_pending on public.shipment_driver_applications(shipment_id)
  where status = 'pending';

comment on table public.shipment_driver_applications is
  'Fleteros se postulan; la app asigna con reglas versionadas (reputación, distancia, etc.).';

alter table public.shipments
  add column if not exists assignment_strategy_id text;

comment on column public.shipments.assignment_strategy_id is
  'Id de la estrategia de matching usada al fijar driver_id (ej. default_v1).';

alter table public.shipment_driver_applications enable row level security;

-- Drivers: apply only to open pending shipments
create policy "Drivers can insert own applications for open shipments"
  on public.shipment_driver_applications
  for insert
  with check (
    driver_id in (select id from public.drivers where user_id = auth.uid())
    and exists (
      select 1 from public.shipments s
      where s.id = shipment_id
        and s.driver_id is null
        and s.status = 'pending'::shipment_status
    )
  );

create policy "Drivers can view own shipment applications"
  on public.shipment_driver_applications
 for select
  using (driver_id in (select id from public.drivers where user_id = auth.uid()));

create policy "Clients can view applications on own shipments"
  on public.shipment_driver_applications
  for select
  using (
    shipment_id in (select id from public.shipments where client_id = auth.uid())
  );

-- Pickup point for distance scoring (assignment strategies)
create or replace function public.first_leg_origin_coords(p_shipment_id uuid)
returns table (lat double precision, lng double precision)
language sql
stable
security definer
set search_path = public
as $$
  select
    st_y(l.origin_location::geometry) as lat,
    st_x(l.origin_location::geometry) as lng
  from public.shipment_legs l
  where l.shipment_id = p_shipment_id
  order by l.leg_order asc
  limit 1;
$$;

revoke all on function public.first_leg_origin_coords(uuid) from public;
grant execute on function public.first_leg_origin_coords(uuid) to service_role;

-- Fleteros pueden ver cargas pendientes sin conductor (para postularse)
create policy "Drivers can view open pending shipments"
  on public.shipments
  for select
  using (
    driver_id is null
    and status = 'pending'::shipment_status
    and exists (select 1 from public.drivers d where d.user_id = auth.uid())
  );
