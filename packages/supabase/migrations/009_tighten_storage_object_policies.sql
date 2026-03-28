-- 009_tighten_storage_object_policies.sql
-- Tighten storage.objects policies by enforcing path ownership/participation.

drop policy if exists "Participants can read shipment evidence files" on storage.objects;
create policy "Participants can read shipment evidence files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'shipment-evidence'
  and exists (
    select 1
    from public.shipments s
    left join public.drivers d on d.id = s.driver_id
    where s.id::text = split_part(name, '/', 1)
      and (s.client_id = auth.uid() or d.user_id = auth.uid())
  )
);

drop policy if exists "Authenticated users can upload shipment evidence files" on storage.objects;
create policy "Authenticated users can upload shipment evidence files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shipment-evidence'
  and exists (
    select 1
    from public.shipments s
    left join public.drivers d on d.id = s.driver_id
    where s.id::text = split_part(name, '/', 1)
      and (s.client_id = auth.uid() or d.user_id = auth.uid())
  )
);

drop policy if exists "Drivers can read own dni docs" on storage.objects;
create policy "Drivers can read own dni docs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'dni-documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Drivers can upload own dni docs" on storage.objects;
create policy "Drivers can upload own dni docs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'dni-documents'
  and split_part(name, '/', 1) = auth.uid()::text
);
