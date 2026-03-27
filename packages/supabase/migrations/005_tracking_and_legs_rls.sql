-- Fill missing RLS policies for shipment_legs and tracking_points.
-- Also allow shipment status updates for clients and assigned drivers.

drop policy if exists "Clients can view own shipment legs" on public.shipment_legs;
create policy "Clients can view own shipment legs"
  on public.shipment_legs
  for select
  using (
    shipment_id in (
      select s.id from public.shipments s where s.client_id = auth.uid()
    )
  );

drop policy if exists "Clients can insert own shipment legs" on public.shipment_legs;
create policy "Clients can insert own shipment legs"
  on public.shipment_legs
  for insert
  with check (
    shipment_id in (
      select s.id from public.shipments s where s.client_id = auth.uid()
    )
  );

drop policy if exists "Clients can update own shipment legs" on public.shipment_legs;
create policy "Clients can update own shipment legs"
  on public.shipment_legs
  for update
  using (
    shipment_id in (
      select s.id from public.shipments s where s.client_id = auth.uid()
    )
  )
  with check (
    shipment_id in (
      select s.id from public.shipments s where s.client_id = auth.uid()
    )
  );

drop policy if exists "Clients can delete own shipment legs" on public.shipment_legs;
create policy "Clients can delete own shipment legs"
  on public.shipment_legs
  for delete
  using (
    shipment_id in (
      select s.id from public.shipments s where s.client_id = auth.uid()
    )
  );

drop policy if exists "Assigned drivers can view shipment legs" on public.shipment_legs;
create policy "Assigned drivers can view shipment legs"
  on public.shipment_legs
  for select
  using (
    shipment_id in (
      select s.id
      from public.shipments s
      where s.driver_id in (select d.id from public.drivers d where d.user_id = auth.uid())
    )
  );

drop policy if exists "Clients can view own tracking points" on public.tracking_points;
create policy "Clients can view own tracking points"
  on public.tracking_points
  for select
  using (
    shipment_id in (
      select s.id from public.shipments s where s.client_id = auth.uid()
    )
  );

drop policy if exists "Assigned drivers can view tracking points" on public.tracking_points;
create policy "Assigned drivers can view tracking points"
  on public.tracking_points
  for select
  using (
    shipment_id in (
      select s.id
      from public.shipments s
      where s.driver_id in (select d.id from public.drivers d where d.user_id = auth.uid())
    )
  );

drop policy if exists "Assigned drivers can insert tracking points" on public.tracking_points;
create policy "Assigned drivers can insert tracking points"
  on public.tracking_points
  for insert
  with check (
    shipment_id in (
      select s.id
      from public.shipments s
      where s.driver_id in (select d.id from public.drivers d where d.user_id = auth.uid())
    )
  );

drop policy if exists "Clients can update own shipments" on public.shipments;
create policy "Clients can update own shipments"
  on public.shipments
  for update
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

drop policy if exists "Assigned drivers can update shipment status" on public.shipments;
create policy "Assigned drivers can update shipment status"
  on public.shipments
  for update
  using (driver_id in (select d.id from public.drivers d where d.user_id = auth.uid()))
  with check (driver_id in (select d.id from public.drivers d where d.user_id = auth.uid()));
