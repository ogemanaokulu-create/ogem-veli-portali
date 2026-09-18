/*
# Fix: Allow all authenticated users to read profiles

## Problem
The `profiles` table had a SELECT policy (`profiles_select_own`) that only allowed
reading your own profile (`id = auth.uid()`). This meant:
- Managers couldn't see teacher/parent names in the teacher/parent lists.
- Teachers couldn't see parent names in the messaging section.
- Class teacher assignments showed blank names.

## Fix
Add a new SELECT policy allowing all authenticated users to read all profiles.
This is a school app where teachers, parents, and managers need to see each other's
names for messaging and management. The existing own-profile UPDATE policy is kept.
The INSERT policy for parents is kept. No new write access is granted.

## Security
- SELECT: all authenticated users can read all profiles (names, roles, phones).
- INSERT: only own profile, only parent role (unchanged).
- UPDATE: only own profile (unchanged).
*/

DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_all_authenticated" ON public.profiles FOR SELECT
  TO authenticated USING (true);
