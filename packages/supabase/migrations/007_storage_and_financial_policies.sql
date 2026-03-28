-- 007_storage_and_financial_policies.sql
-- Completes storage + financial table policies needed by web/mobile flows.

-- Ensure required storage buckets exist.
insert into storage.buckets (id, name, public)
values ('dni-documents', 'dni-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('shipment-evidence', 'shipment-evidence', false)
on conflict (id) do nothing;

-- Storage policies for shipment evidence.
drop policy if exists "Participants can read shipment evidence files" on storage.objects;
create policy "Participants can read shipment evidence files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'shipment-evidence'
);

drop policy if exists "Authenticated users can upload shipment evidence files" on storage.objects;
create policy "Authenticated users can upload shipment evidence files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shipment-evidence'
);

-- Storage policies for driver docs.
drop policy if exists "Drivers can read own dni docs" on storage.objects;
create policy "Drivers can read own dni docs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'dni-documents'
);

drop policy if exists "Drivers can upload own dni docs" on storage.objects;
create policy "Drivers can upload own dni docs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'dni-documents'
);

-- Payments and reviews policies to align with API selections.
drop policy if exists "Clients can view own shipment payments" on public.payments;
create policy "Clients can view own shipment payments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.shipments s
    where s.id = payments.shipment_id
      and s.client_id = auth.uid()
  )
);

drop policy if exists "Assigned drivers can view shipment payments" on public.payments;
create policy "Assigned drivers can view shipment payments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.shipments s
    join public.drivers d on d.id = s.driver_id
    where s.id = payments.shipment_id
      and d.user_id = auth.uid()
  )
);

drop policy if exists "Clients can create reviews for own shipments" on public.reviews;
create policy "Clients can create reviews for own shipments"
on public.reviews
for insert
to authenticated
with check (
  exists (
    select 1
    from public.shipments s
    where s.id = reviews.shipment_id
      and s.client_id = auth.uid()
  )
);

drop policy if exists "Participants can view reviews for their shipments" on public.reviews;
create policy "Participants can view reviews for their shipments"
on public.reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.shipments s
    left join public.drivers d on d.id = s.driver_id
    where s.id = reviews.shipment_id
      and (s.client_id = auth.uid() or d.user_id = auth.uid())
  )
);
