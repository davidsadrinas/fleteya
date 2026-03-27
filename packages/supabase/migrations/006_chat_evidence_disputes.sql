-- Chat, shipment evidence and dispute workflow (MVP).

do $$
begin
  if not exists (select 1 from pg_type where typname = 'evidence_stage') then
    create type evidence_stage as enum ('pickup', 'delivery');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'dispute_status') then
    create type dispute_status as enum ('open', 'under_review', 'resolved', 'rejected');
  end if;
end $$;

create table if not exists public.shipment_chat_messages (
  id uuid default uuid_generate_v4() primary key,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  quick_tag text,
  created_at timestamptz not null default now()
);

create table if not exists public.shipment_evidence (
  id uuid default uuid_generate_v4() primary key,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  stage evidence_stage not null,
  file_url text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.shipment_disputes (
  id uuid default uuid_generate_v4() primary key,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  description text,
  evidence_urls jsonb not null default '[]'::jsonb,
  status dispute_status not null default 'open',
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_shipment_chat_messages_shipment
  on public.shipment_chat_messages (shipment_id, created_at desc);
create index if not exists idx_shipment_evidence_shipment
  on public.shipment_evidence (shipment_id, created_at desc);
create index if not exists idx_shipment_disputes_shipment
  on public.shipment_disputes (shipment_id, created_at desc);

alter table public.shipment_chat_messages enable row level security;
alter table public.shipment_evidence enable row level security;
alter table public.shipment_disputes enable row level security;

-- Shipment chat: only shipment participants can read/insert.
drop policy if exists "Participants can view shipment chat messages" on public.shipment_chat_messages;
create policy "Participants can view shipment chat messages"
  on public.shipment_chat_messages
  for select
  using (
    shipment_id in (
      select s.id
      from public.shipments s
      left join public.drivers d on d.id = s.driver_id
      where s.client_id = auth.uid() or d.user_id = auth.uid()
    )
  );

drop policy if exists "Participants can insert shipment chat messages" on public.shipment_chat_messages;
create policy "Participants can insert shipment chat messages"
  on public.shipment_chat_messages
  for insert
  with check (
    sender_user_id = auth.uid()
    and shipment_id in (
      select s.id
      from public.shipments s
      left join public.drivers d on d.id = s.driver_id
      where s.client_id = auth.uid() or d.user_id = auth.uid()
    )
  );

-- Shipment evidence: participants can read; participant uploader can insert.
drop policy if exists "Participants can view shipment evidence" on public.shipment_evidence;
create policy "Participants can view shipment evidence"
  on public.shipment_evidence
  for select
  using (
    shipment_id in (
      select s.id
      from public.shipments s
      left join public.drivers d on d.id = s.driver_id
      where s.client_id = auth.uid() or d.user_id = auth.uid()
    )
  );

drop policy if exists "Participants can insert shipment evidence" on public.shipment_evidence;
create policy "Participants can insert shipment evidence"
  on public.shipment_evidence
  for insert
  with check (
    uploaded_by = auth.uid()
    and shipment_id in (
      select s.id
      from public.shipments s
      left join public.drivers d on d.id = s.driver_id
      where s.client_id = auth.uid() or d.user_id = auth.uid()
    )
  );

-- Shipment disputes: participants can create/view disputes.
drop policy if exists "Participants can view shipment disputes" on public.shipment_disputes;
create policy "Participants can view shipment disputes"
  on public.shipment_disputes
  for select
  using (
    shipment_id in (
      select s.id
      from public.shipments s
      left join public.drivers d on d.id = s.driver_id
      where s.client_id = auth.uid() or d.user_id = auth.uid()
    )
  );

drop policy if exists "Participants can insert shipment disputes" on public.shipment_disputes;
create policy "Participants can insert shipment disputes"
  on public.shipment_disputes
  for insert
  with check (
    reported_by = auth.uid()
    and shipment_id in (
      select s.id
      from public.shipments s
      left join public.drivers d on d.id = s.driver_id
      where s.client_id = auth.uid() or d.user_id = auth.uid()
    )
  );

-- Realtime tables.
alter publication supabase_realtime add table public.shipment_chat_messages;
alter publication supabase_realtime add table public.shipment_disputes;

-- Bucket for shipment evidence (private).
insert into storage.buckets (id, name, public)
select 'shipment-evidence', 'shipment-evidence', false
where not exists (
  select 1 from storage.buckets where id = 'shipment-evidence'
);
