/*
# Add meal columns to weekly_menus

## Summary
Adds 15 new columns to weekly_menus for 3 meals per day (breakfast, lunch, afternoon snack)
across 5 weekdays (monday-friday). The existing single-column-per-day fields are kept for
backwards compatibility but the UI will now use the new structured columns.

## New Columns
- monday_breakfast, monday_lunch, monday_snack
- tuesday_breakfast, tuesday_lunch, tuesday_snack
- wednesday_breakfast, wednesday_lunch, wednesday_snack
- thursday_breakfast, thursday_lunch, thursday_snack
- friday_breakfast, friday_lunch, friday_snack

All columns are text, nullable.

## Security
No policy changes needed — weekly_menus already has RLS enabled with
manager write and authenticated read policies.
*/

ALTER TABLE public.weekly_menus
  ADD COLUMN IF NOT EXISTS monday_breakfast text,
  ADD COLUMN IF NOT EXISTS monday_lunch text,
  ADD COLUMN IF NOT EXISTS monday_snack text,
  ADD COLUMN IF NOT EXISTS tuesday_breakfast text,
  ADD COLUMN IF NOT EXISTS tuesday_lunch text,
  ADD COLUMN IF NOT EXISTS tuesday_snack text,
  ADD COLUMN IF NOT EXISTS wednesday_breakfast text,
  ADD COLUMN IF NOT EXISTS wednesday_lunch text,
  ADD COLUMN IF NOT EXISTS wednesday_snack text,
  ADD COLUMN IF NOT EXISTS thursday_breakfast text,
  ADD COLUMN IF NOT EXISTS thursday_lunch text,
  ADD COLUMN IF NOT EXISTS thursday_snack text,
  ADD COLUMN IF NOT EXISTS friday_breakfast text,
  ADD COLUMN IF NOT EXISTS friday_lunch text,
  ADD COLUMN IF NOT EXISTS friday_snack text;
