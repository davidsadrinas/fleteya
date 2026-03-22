-- FleteYa Seed Data (Development)
-- Run with: pnpm db:seed

-- Note: These users need to exist in auth.users first.
-- In development, create them via Supabase Auth UI or API.
-- The profiles trigger will auto-create the profile row.

-- Sample drivers (after auth user exists)
-- INSERT INTO public.drivers (user_id, verified, dni_verified, rating, total_trips, bio)
-- VALUES
--   ('<user-uuid-1>', true, true, 4.8, 342, 'Fletero experimentado zona norte y CABA'),
--   ('<user-uuid-2>', true, true, 4.9, 567, 'Especialista en mudanzas, zona sur'),
--   ('<user-uuid-3>', true, false, 4.7, 189, 'Camioneta disponible AMBA'),
--   ('<user-uuid-4>', false, false, 4.6, 98, 'Camión y camioneta, zona oeste');

-- Sample vehicles
-- INSERT INTO public.vehicles (driver_id, type, brand, model, year, plate, capacity, active)
-- VALUES
--   ('<driver-uuid-1>', 'camioneta', 'Ford', 'Ranger', 2021, 'AC 234 BD', '1.5tn', true),
--   ('<driver-uuid-1>', 'utilitario', 'Renault', 'Kangoo', 2019, 'AB 789 CD', '500kg', false),
--   ('<driver-uuid-2>', 'utilitario', 'Fiat', 'Fiorino', 2022, 'AD 456 EF', '500kg', true),
--   ('<driver-uuid-3>', 'camioneta', 'Toyota', 'Hilux', 2022, 'AG 567 KL', '1.5tn', true),
--   ('<driver-uuid-4>', 'camion', 'Mercedes', 'Sprinter', 2020, 'AE 012 GH', '6tn', true),
--   ('<driver-uuid-4>', 'camioneta', 'Toyota', 'Hilux', 2023, 'AF 345 IJ', '1.5tn', false),
--   ('<driver-uuid-4>', 'moto', 'Honda', 'CG 150', 2022, 'A 678 KLM', '20kg', false);

-- To seed properly:
-- 1. Create users via Supabase Auth dashboard or API
-- 2. Get their UUIDs from auth.users table
-- 3. Uncomment and replace UUIDs above
-- 4. Run: psql $DATABASE_URL < seed/dev.sql
