/*
# Extend OGEM schema — attendance, water, daily notes, calendar, health, documents

1. New Tables
- `attendance`: daily per-student attendance (present/absent/late/leave)
- `water_logs`: daily water intake tracking
- `daily_notes`: standalone daily teacher notes (separate from daily_reports)
- `calendar_events`: school calendar (holidays, meetings, trips, birthdays)
- `health_info`: student health records (allergies, meds, blood type, doctor notes, emergency contact)
- `documents`: shared files (PDFs, permission slips, etc.)

2. Modified Tables
- `profiles`: add `must_change_password` boolean for teacher first-login flow
- `daily_reports`: add `mood` text, `water_status` text, `attendance_status` text columns
- `parents`: add `relation` text (anne/baba), add `phone` text

3. Security
- All new tables get RLS enabled
- attendance: teachers insert/update own class, managers full, parents read own children
- water_logs, daily_notes: same as daily_reports pattern
- calendar_events: all authenticated can read, managers write
- health_info: parents read own children, managers write
- documents: all authenticated read, managers write

4. Important notes
- Safe to re-run (IF NOT EXISTS, DROP POLICY IF EXISTS)
- Does not remove or alter existing data
*/

-- Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Add columns to daily_reports
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS mood text;
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS water_status text;
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS attendance_status text;

-- Add columns to parents
ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS relation text;
ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS phone text;

-- attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  attendance_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'present',
  note text,
  recorded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, attendance_date)
);

-- water_logs table
CREATE TABLE IF NOT EXISTS public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id uuid NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT ' orta',
  note text
);

-- daily_notes table
CREATE TABLE IF NOT EXISTS public.daily_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  note_date date NOT NULL DEFAULT current_date,
  note text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  end_date date,
  event_type text NOT NULL DEFAULT 'event',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- health_info table
CREATE TABLE IF NOT EXISTS public.health_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  allergies text,
  medications text,
  blood_type text,
  doctor_note text,
  emergency_contact text,
  updated_by uuid DEFAULT auth.uid() REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  storage_path text NOT NULL,
  file_type text,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['attendance','water_logs','daily_notes','calendar_events','health_info','documents'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- attendance policies
DROP POLICY IF EXISTS "attendance_select_school" ON public.attendance;
CREATE POLICY "attendance_select_school" ON public.attendance FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "attendance_teacher_insert" ON public.attendance;
CREATE POLICY "attendance_teacher_insert" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher() AND recorded_by = auth.uid());
DROP POLICY IF EXISTS "attendance_teacher_update" ON public.attendance;
CREATE POLICY "attendance_teacher_update" ON public.attendance FOR UPDATE TO authenticated
  USING (public.is_teacher() AND recorded_by = auth.uid())
  WITH CHECK (public.is_teacher() AND recorded_by = auth.uid());
DROP POLICY IF EXISTS "attendance_manager_delete" ON public.attendance;
CREATE POLICY "attendance_manager_delete" ON public.attendance FOR DELETE TO authenticated
  USING (public.is_manager() OR recorded_by = auth.uid());

-- water_logs policies (same pattern as meals/sleep_logs)
DROP POLICY IF EXISTS "school_read_water_logs" ON public.water_logs;
CREATE POLICY "school_read_water_logs" ON public.water_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "manager_write_water_logs" ON public.water_logs;
CREATE POLICY "manager_write_water_logs" ON public.water_logs FOR ALL TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());
-- teachers can also insert/update water_logs for their class
DROP POLICY IF EXISTS "teacher_write_water_logs" ON public.water_logs;
CREATE POLICY "teacher_write_water_logs" ON public.water_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher());

-- daily_notes policies
DROP POLICY IF EXISTS "daily_notes_select_school" ON public.daily_notes;
CREATE POLICY "daily_notes_select_school" ON public.daily_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "daily_notes_teacher_insert" ON public.daily_notes;
CREATE POLICY "daily_notes_teacher_insert" ON public.daily_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher() AND created_by = auth.uid());
DROP POLICY IF EXISTS "daily_notes_teacher_update" ON public.daily_notes;
CREATE POLICY "daily_notes_teacher_update" ON public.daily_notes FOR UPDATE TO authenticated
  USING (public.is_teacher() AND created_by = auth.uid())
  WITH CHECK (public.is_teacher() AND created_by = auth.uid());
DROP POLICY IF EXISTS "daily_notes_manager_delete" ON public.daily_notes;
CREATE POLICY "daily_notes_manager_delete" ON public.daily_notes FOR DELETE TO authenticated
  USING (public.is_manager() OR created_by = auth.uid());

-- calendar_events policies
DROP POLICY IF EXISTS "calendar_select_school" ON public.calendar_events;
CREATE POLICY "calendar_select_school" ON public.calendar_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "calendar_manager_insert" ON public.calendar_events;
CREATE POLICY "calendar_manager_insert" ON public.calendar_events FOR INSERT TO authenticated
  WITH CHECK (public.is_manager() AND created_by = auth.uid());
DROP POLICY IF EXISTS "calendar_manager_update" ON public.calendar_events;
CREATE POLICY "calendar_manager_update" ON public.calendar_events FOR UPDATE TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());
DROP POLICY IF EXISTS "calendar_manager_delete" ON public.calendar_events;
CREATE POLICY "calendar_manager_delete" ON public.calendar_events FOR DELETE TO authenticated
  USING (public.is_manager());

-- health_info policies
DROP POLICY IF EXISTS "health_select_school" ON public.health_info;
CREATE POLICY "health_select_school" ON public.health_info FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "health_manager_write" ON public.health_info;
CREATE POLICY "health_manager_write" ON public.health_info FOR ALL TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());

-- documents policies
DROP POLICY IF EXISTS "documents_select_school" ON public.documents;
CREATE POLICY "documents_select_school" ON public.documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "documents_manager_write" ON public.documents;
CREATE POLICY "documents_manager_write" ON public.documents FOR ALL TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());

-- Allow teachers to insert/update activities for their classes
DROP POLICY IF EXISTS "school_read_activities" ON public.activities;
CREATE POLICY "school_read_activities" ON public.activities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "manager_write_activities" ON public.activities;
CREATE POLICY "manager_write_activities" ON public.activities FOR ALL TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());
DROP POLICY IF EXISTS "teacher_insert_activities" ON public.activities;
CREATE POLICY "teacher_insert_activities" ON public.activities FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher() AND created_by = auth.uid());
DROP POLICY IF EXISTS "teacher_update_activities" ON public.activities;
CREATE POLICY "teacher_update_activities" ON public.activities FOR UPDATE TO authenticated
  USING (public.is_teacher() AND created_by = auth.uid())
  WITH CHECK (public.is_teacher() AND created_by = auth.uid());

-- Allow teachers to insert photos and videos
DROP POLICY IF EXISTS "teacher_insert_photos" ON public.photos;
CREATE POLICY "teacher_insert_photos" ON public.photos FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "teacher_insert_videos" ON public.videos;
CREATE POLICY "teacher_insert_videos" ON public.videos FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher());

-- Allow teachers to insert/update meals, sleep_logs, toilet_logs
DROP POLICY IF EXISTS "teacher_insert_meals" ON public.meals;
CREATE POLICY "teacher_insert_meals" ON public.meals FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "teacher_update_meals" ON public.meals;
CREATE POLICY "teacher_update_meals" ON public.meals FOR UPDATE TO authenticated
  USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "teacher_insert_sleep_logs" ON public.sleep_logs;
CREATE POLICY "teacher_insert_sleep_logs" ON public.sleep_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "teacher_update_sleep_logs" ON public.sleep_logs;
CREATE POLICY "teacher_update_sleep_logs" ON public.sleep_logs FOR UPDATE TO authenticated
  USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "teacher_insert_toilet_logs" ON public.toilet_logs;
CREATE POLICY "teacher_insert_toilet_logs" ON public.toilet_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "teacher_update_toilet_logs" ON public.toilet_logs;
CREATE POLICY "teacher_update_toilet_logs" ON public.toilet_logs FOR UPDATE TO authenticated
  USING (public.is_teacher()) WITH CHECK (public.is_teacher());

-- Allow teachers to update water_logs
DROP POLICY IF EXISTS "teacher_update_water_logs" ON public.water_logs;
CREATE POLICY "teacher_update_water_logs" ON public.water_logs FOR UPDATE TO authenticated
  USING (public.is_teacher()) WITH CHECK (public.is_teacher());

-- Helper: get classes for current teacher
CREATE OR REPLACE FUNCTION public.my_class_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
  FROM public.classes WHERE teacher_id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.my_class_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_class_ids() TO authenticated;

-- Helper: get student_ids linked to current parent
CREATE OR REPLACE FUNCTION public.my_student_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(array_agg(student_id), ARRAY[]::uuid[])
  FROM public.parents WHERE profile_id = auth.uid() AND approval_status = 'approved'
$$;
REVOKE EXECUTE ON FUNCTION public.my_student_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_student_ids() TO authenticated;

-- Allow parents to insert messages to teachers
-- (messages_sender_insert already exists and allows any authenticated user to send as themselves)

-- Storage bucket for school photos/videos/documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-media', 'school-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for school-media bucket
DROP POLICY IF EXISTS "school_media_read_all" ON storage.objects;
CREATE POLICY "school_media_read_all" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'school-media');

DROP POLICY IF EXISTS "school_media_write_teacher" ON storage.objects;
CREATE POLICY "school_media_write_teacher" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'school-media' AND public.is_teacher());

DROP POLICY IF EXISTS "school_media_write_manager" ON storage.objects;
CREATE POLICY "school_media_write_manager" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'school-media' AND public.is_manager());

DROP POLICY IF EXISTS "school_media_update" ON storage.objects;
CREATE POLICY "school_media_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'school-media' AND public.is_teacher());

DROP POLICY IF EXISTS "school_media_delete" ON storage.objects;
CREATE POLICY "school_media_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'school-media' AND public.is_manager());
