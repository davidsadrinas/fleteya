-- Allow authenticated users to create their own driver row (onboarding / fleet setup).

create policy "Users can insert own driver profile" on public.drivers
  for insert
  with check (auth.uid() = user_id);
