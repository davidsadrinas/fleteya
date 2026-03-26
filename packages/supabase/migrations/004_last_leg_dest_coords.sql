-- Coords of last leg destination (where the driver ends the current trip) — for chained-trip / backhaul proximity.

create or replace function public.last_leg_dest_coords(p_shipment_id uuid)
returns table (lat double precision, lng double precision)
language sql
stable
security definer
set search_path = public
as $$
  select
    st_y(l.dest_location::geometry) as lat,
    st_x(l.dest_location::geometry) as lng
  from public.shipment_legs l
  where l.shipment_id = p_shipment_id
  order by l.leg_order desc
  limit 1;
$$;

revoke all on function public.last_leg_dest_coords(uuid) from public;
grant execute on function public.last_leg_dest_coords(uuid) to service_role;
