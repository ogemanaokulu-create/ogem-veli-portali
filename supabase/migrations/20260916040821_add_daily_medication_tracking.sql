/*
# Add daily medication tracking

## Summary
Adds a daily medication record for each student so teachers can record whether medication
is needed, the medicine name, dosage, planned time, administration status, administration time,
and a short note.

## New table
- `medication_logs`
- `student_id`: student receiving the medication
- `tracking_date`: date of the daily record
- `has_medication`: whether medication is needed that day
- `medication_name`: medicine name
- `dose`: dosage or amount
- `planned_time`: planned administration time
- `status`: pending or given
- `administered_at`: actual administration time
- `note`: teacher note
- `recorded_by`: authenticated teacher or manager who saved the record
- `created_at`, `updated_at`: record timestamps

## Security
- RLS is enabled.
- Authenticated school users can read medication records.
- Teachers can insert and update records they recorded.
- Managers can insert, update, and delete all records.
- The unique student/date constraint keeps one daily medication record per student.
*/

CREATE TABLE IF NOT EXISTS public.medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tracking_date date NOT NULL,
  has_medication boolean NOT NULL DEFAULT false,
  medication_name text,
  dose text,
  planned_time time,
  status text NOT NULL DEFAULT 'pending',
  administered_at time,
  note text,
  recorded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medication_logs_student_date_key UNIQUE (student_id, tracking_date),
  CONSTRAINT medication_logs_status_check CHECK (status IN ('pending', 'given'))
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medication_select_school" ON public.medication_logs;
CREATE POLICY "medication_select_school" ON public.medication_logs FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "medication_teacher_insert" ON public.medication_logs;
CREATE POLICY "medication_teacher_insert" ON public.medication_logs FOR INSERT
  TO authenticated WITH CHECK (public.is_teacher() AND recorded_by = auth.uid());

DROP POLICY IF EXISTS "medication_teacher_update" ON public.medication_logs;
CREATE POLICY "medication_teacher_update" ON public.medication_logs FOR UPDATE
  TO authenticated
  USING ((public.is_teacher() AND recorded_by = auth.uid()) OR public.is_manager())
  WITH CHECK ((public.is_teacher() AND recorded_by = auth.uid()) OR public.is_manager());

DROP POLICY IF EXISTS "medication_manager_insert" ON public.medication_logs;
CREATE POLICY "medication_manager_insert" ON public.medication_logs FOR INSERT
  TO authenticated WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "medication_manager_delete" ON public.medication_logs;
CREATE POLICY "medication_manager_delete" ON public.medication_logs FOR DELETE
  TO authenticated USING (public.is_manager());
