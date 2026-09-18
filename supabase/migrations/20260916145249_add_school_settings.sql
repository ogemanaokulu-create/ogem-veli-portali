/*
# Add school settings table

## Summary
Single-row table storing editable school information (name, phone, email, address).
Only managers can read and update.

## Security
- RLS enabled.
- All authenticated users can read (so teacher/parent panels can display school name).
- Only managers can update.
*/

CREATE TABLE IF NOT EXISTS public.school_settings (
  id int PRIMARY KEY DEFAULT 1,
  school_name text NOT NULL DEFAULT 'OGEM Anaokulu',
  phone text,
  email text,
  address text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_settings_single_row CHECK (id = 1)
);

INSERT INTO public.school_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_authenticated" ON public.school_settings;
CREATE POLICY "settings_select_authenticated" ON public.school_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "settings_update_manager" ON public.school_settings;
CREATE POLICY "settings_update_manager" ON public.school_settings FOR UPDATE
  TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());
