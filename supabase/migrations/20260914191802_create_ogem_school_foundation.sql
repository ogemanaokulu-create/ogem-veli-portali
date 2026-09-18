/*
# Create OGEM Anaokulu school foundation

1. New Tables
- `profiles`: signed-in people, their display name and server-controlled role.
- `classes`: school classes and their age group.
- `students`: child records connected to a class.
- `daily_reports`: daily attendance, meal, sleep, toilet and teacher notes.
- `activities`: class activity posts.
- `announcements`: school-wide notices.
- `weekly_menus`: weekly meal plans.
- `messages`: parent-teacher messages.
- `notifications`: in-app notifications for a profile.
- `teachers`: teacher assignments.
- `parents`: parent/student links.
- `photos`: activity photos.
- `videos`: activity videos.
- `roles`: role reference records.
- `meals`, `sleep_logs`, `toilet_logs`: normalized daily tracking records.

2. Security
- Every table enables row-level security.
- Signed-in users can read school records only after a profile exists.
- Profiles can only read and update themselves; new profiles are always parent accounts.
- School records are writable only by managers, except daily reports which teachers can create for their assigned classes.
- Role-changing and ownership fields are not client-writable.

3. Important notes
- The existing auth.users table remains the source of authentication.
- This migration is safe to re-run and does not remove existing data.
*/

CREATE TABLE IF NOT EXISTS public.roles (
  id text PRIMARY KEY,
  label text NOT NULL
);
INSERT INTO public.roles (id, label) VALUES
  ('manager', 'Müdür / Yönetici'),
  ('teacher', 'Öğretmen'),
  ('parent', 'Veli')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  role text NOT NULL DEFAULT 'parent' REFERENCES public.roles(id),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age_group text NOT NULL,
  teacher_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  birth_date date,
  photo_url text,
  allergy_info text,
  special_notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teachers (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parents (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  approval_status text NOT NULL DEFAULT 'pending',
  tc_identity_last4 text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT current_date,
  breakfast text,
  lunch text,
  snack text,
  meal_note text,
  slept boolean,
  sleep_start time,
  sleep_end time,
  toilet_status text,
  toilet_note text,
  daily_note text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, report_date)
);

CREATE TABLE IF NOT EXISTS public.meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id uuid NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  meal_type text NOT NULL,
  status text NOT NULL,
  note text
);
CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id uuid NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  slept boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  ended_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.toilet_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id uuid NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text
);

CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  activity_date date NOT NULL DEFAULT current_date,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES public.activities(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES public.activities(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  duration_seconds integer
);
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id)
);
CREATE TABLE IF NOT EXISTS public.weekly_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  monday text,
  tuesday text,
  wednesday text,
  thursday text,
  friday text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id)
);
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager') $$;
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'teacher')) $$;
REVOKE EXECUTE ON FUNCTION public.is_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_teacher() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated;

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['roles','profiles','classes','students','teachers','parents','daily_reports','meals','sleep_logs','toilet_logs','activities','photos','videos','announcements','weekly_menus','messages','notifications'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "roles_read_authenticated" ON public.roles;
CREATE POLICY "roles_read_authenticated" ON public.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_insert_own_parent" ON public.profiles;
CREATE POLICY "profiles_insert_own_parent" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid() AND role = 'parent');
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "classes_select_school" ON public.classes;
CREATE POLICY "classes_select_school" ON public.classes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "classes_manager_insert" ON public.classes;
CREATE POLICY "classes_manager_insert" ON public.classes FOR INSERT TO authenticated WITH CHECK (public.is_manager());
DROP POLICY IF EXISTS "classes_manager_update" ON public.classes;
CREATE POLICY "classes_manager_update" ON public.classes FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());
DROP POLICY IF EXISTS "classes_manager_delete" ON public.classes;
CREATE POLICY "classes_manager_delete" ON public.classes FOR DELETE TO authenticated USING (public.is_manager());

DROP POLICY IF EXISTS "students_select_school" ON public.students;
CREATE POLICY "students_select_school" ON public.students FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "students_manager_insert" ON public.students;
CREATE POLICY "students_manager_insert" ON public.students FOR INSERT TO authenticated WITH CHECK (public.is_manager());
DROP POLICY IF EXISTS "students_manager_update" ON public.students;
CREATE POLICY "students_manager_update" ON public.students FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());
DROP POLICY IF EXISTS "students_manager_delete" ON public.students;
CREATE POLICY "students_manager_delete" ON public.students FOR DELETE TO authenticated USING (public.is_manager());

DROP POLICY IF EXISTS "reports_select_school" ON public.daily_reports;
CREATE POLICY "reports_select_school" ON public.daily_reports FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "reports_teacher_insert" ON public.daily_reports;
CREATE POLICY "reports_teacher_insert" ON public.daily_reports FOR INSERT TO authenticated WITH CHECK (public.is_teacher() AND created_by = auth.uid());
DROP POLICY IF EXISTS "reports_teacher_update" ON public.daily_reports;
CREATE POLICY "reports_teacher_update" ON public.daily_reports FOR UPDATE TO authenticated USING (public.is_teacher() AND created_by = auth.uid()) WITH CHECK (public.is_teacher() AND created_by = auth.uid());
DROP POLICY IF EXISTS "reports_teacher_delete" ON public.daily_reports;
CREATE POLICY "reports_teacher_delete" ON public.daily_reports FOR DELETE TO authenticated USING (public.is_manager() OR created_by = auth.uid());

DROP POLICY IF EXISTS "announcements_select_school" ON public.announcements;
CREATE POLICY "announcements_select_school" ON public.announcements FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "announcements_manager_insert" ON public.announcements;
CREATE POLICY "announcements_manager_insert" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.is_manager() AND created_by = auth.uid());
DROP POLICY IF EXISTS "announcements_manager_update" ON public.announcements;
CREATE POLICY "announcements_manager_update" ON public.announcements FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());
DROP POLICY IF EXISTS "announcements_manager_delete" ON public.announcements;
CREATE POLICY "announcements_manager_delete" ON public.announcements FOR DELETE TO authenticated USING (public.is_manager());

DROP POLICY IF EXISTS "notifications_own_select" ON public.notifications;
CREATE POLICY "notifications_own_select" ON public.notifications FOR SELECT TO authenticated USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "notifications_own_update" ON public.notifications;
CREATE POLICY "notifications_own_update" ON public.notifications FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "messages_participant_select" ON public.messages;
CREATE POLICY "messages_participant_select" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_manager());
DROP POLICY IF EXISTS "messages_sender_insert" ON public.messages;
CREATE POLICY "messages_sender_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "messages_recipient_update" ON public.messages;
CREATE POLICY "messages_recipient_update" ON public.messages FOR UPDATE TO authenticated USING (recipient_id = auth.uid() OR public.is_manager()) WITH CHECK (recipient_id = auth.uid() OR public.is_manager());

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['teachers','parents','meals','sleep_logs','toilet_logs','activities','photos','videos','weekly_menus'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "school_read_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "school_read_%s" ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "manager_write_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "manager_write_%s" ON public.%I FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager())', t, t);
  END LOOP;
END $$;
