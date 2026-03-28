-- 008_atomic_shipment_and_vehicle_rpcs.sql
-- Atomic RPCs for shipment creation and active vehicle switching.

create or replace function public.create_shipment_with_legs(
  p_client_id uuid,
  p_type shipment_type,
  p_description text,
  p_weight text,
  p_helpers integer,
  p_scheduled_at timestamptz,
  p_base_price numeric,
  p_discount numeric,
  p_final_price numeric,
  p_commission numeric,
  p_legs jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shipment_id uuid;
  v_leg jsonb;
begin
  if p_legs is null or jsonb_array_length(p_legs) = 0 then
    raise exception 'p_legs requerido';
  end if;

  insert into public.shipments (
    client_id,
    type,
    description,
    weight,
    helpers,
    scheduled_at,
    base_price,
    discount,
    final_price,
    commission,
    status
  )
  values (
    p_client_id,
    p_type,
    p_description,
    p_weight,
    coalesce(p_helpers, 0),
    p_scheduled_at,
    p_base_price,
    p_discount,
    p_final_price,
    p_commission,
    'pending'
  )
  returning id into v_shipment_id;

  for v_leg in select * from jsonb_array_elements(p_legs)
  loop
    insert into public.shipment_legs (
      shipment_id,
      leg_order,
      origin_address,
      origin_location,
      dest_address,
      dest_location,
      distance_km,
      estimated_minutes,
      price,
      discount
    )
    values (
      v_shipment_id,
      (v_leg->>'leg_order')::integer,
      v_leg->>'origin_address',
      ST_GeogFromText(
        format(
          'POINT(%s %s)',
          (v_leg->>'origin_lng')::numeric,
          (v_leg->>'origin_lat')::numeric
        )
      ),
      v_leg->>'dest_address',
      ST_GeogFromText(
        format(
          'POINT(%s %s)',
          (v_leg->>'dest_lng')::numeric,
          (v_leg->>'dest_lat')::numeric
        )
      ),
      (v_leg->>'distance_km')::numeric,
      (v_leg->>'estimated_minutes')::integer,
      (v_leg->>'price')::numeric,
      (v_leg->>'discount')::numeric
    );
  end loop;

  return v_shipment_id;
end;
$$;

grant execute on function public.create_shipment_with_legs(
  uuid,
  shipment_type,
  text,
  text,
  integer,
  timestamptz,
  numeric,
  numeric,
  numeric,
  numeric,
  jsonb
) to authenticated;

create or replace function public.set_active_vehicle(
  p_driver_id uuid,
  p_vehicle_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vehicles
  set active = false
  where driver_id = p_driver_id;

  update public.vehicles
  set active = true
  where id = p_vehicle_id
    and driver_id = p_driver_id;

  return true;
end;
$$;

grant execute on function public.set_active_vehicle(uuid, uuid) to authenticated;
