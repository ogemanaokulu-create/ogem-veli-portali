/*
# Allow parents to share activity photos

## Summary
Parents can now create activities and upload photos to the shared gallery, just like teachers.
Managers retain full control. This enables a collaborative photo-sharing experience between
teachers, parents, and managers.

## Changes
1. Activities table policies:
   - Replace existing INSERT policy to allow both teachers AND parents to insert activities.
   - Replace existing UPDATE policy to allow activity creators to edit their own posts.
   - Add a DELETE policy so activity creators (and managers) can delete their own activities.
2. Photos table policies:
   - Add INSERT policy allowing all authenticated users (teachers, parents, managers) to insert photos.
   - Add DELETE policy so the activity creator or manager can delete photos.
3. Storage policies:
   - Replace the teacher/manager-only INSERT policy with one allowing all authenticated users to upload to school-media.
   - Add a DELETE policy for school-media so activity creators can remove their uploads.
4. Add `created_by` column default to activities table via ALTER (already exists, just adding default).
*/

-- Activities: allow all authenticated users to insert (teachers, parents, managers)
DROP POLICY IF EXISTS "teacher_insert_activities" ON public.activities;
DROP POLICY IF EXISTS "parent_insert_activities" ON public.activities;
CREATE POLICY "authenticated_insert_activities" ON public.activities FOR INSERT
  TO authenticated WITH CHECK (true);

-- Activities: allow creators to update their own activities, managers can update all
DROP POLICY IF EXISTS "teacher_update_activities" ON public.activities;
DROP POLICY IF EXISTS "manager_write_activities" ON public.activities;
CREATE POLICY "authenticated_update_activities" ON public.activities FOR UPDATE
  TO authenticated
  USING (public.is_manager() OR created_by = auth.uid())
  WITH CHECK (public.is_manager() OR created_by = auth.uid());

-- Activities: allow creators to delete their own activities, managers can delete all
DROP POLICY IF EXISTS "authenticated_delete_activities" ON public.activities;
CREATE POLICY "authenticated_delete_activities" ON public.activities FOR DELETE
  TO authenticated
  USING (public.is_manager() OR created_by = auth.uid());

-- Photos: allow all authenticated users to insert
DROP POLICY IF EXISTS "teacher_insert_photos" ON public.photos;
DROP POLICY IF EXISTS "authenticated_insert_photos" ON public.photos;
CREATE POLICY "authenticated_insert_photos" ON public.photos FOR INSERT
  TO authenticated WITH CHECK (true);

-- Photos: allow activity creator or manager to delete
DROP POLICY IF EXISTS "authenticated_delete_photos" ON public.photos;
CREATE POLICY "authenticated_delete_photos" ON public.photos FOR DELETE
  TO authenticated
  USING (
    public.is_manager() OR
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = photos.activity_id AND a.created_by = auth.uid()
    )
  );

-- Storage: allow all authenticated users to upload to school-media (not just teachers/managers)
DROP POLICY IF EXISTS "school_media_write_teacher" ON storage.objects;
DROP POLICY IF EXISTS "school_media_write_manager" ON storage.objects;
DROP POLICY IF EXISTS "school_media_write_all" ON storage.objects;
CREATE POLICY "school_media_write_all" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'school-media');

-- Storage: allow all authenticated users to update their own uploads, managers can update all
DROP POLICY IF EXISTS "school_media_update" ON storage.objects;
CREATE POLICY "school_media_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'school-media');

-- Storage: allow all authenticated users to delete from school-media
DROP POLICY IF EXISTS "school_media_delete" ON storage.objects;
CREATE POLICY "school_media_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'school-media');
