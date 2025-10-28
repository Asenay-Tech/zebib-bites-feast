-- Fix nullable user_id columns in reservations and orders tables
-- These tables have RLS policies based on user_id but allow NULL values
-- This can bypass access controls if not properly handled

-- First, set any existing NULL user_id values to a system UUID
-- (You may want to clean these up manually based on your business logic)
UPDATE public.reservations 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE user_id IS NULL;

UPDATE public.orders 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE user_id IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE public.reservations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN user_id SET NOT NULL;

-- Add trigger function to prevent double-booking of tables
CREATE OR REPLACE FUNCTION public.check_table_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE table_number = NEW.table_number
      AND date = NEW.date
      AND status != 'cancelled'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        -- Check for overlap: existing_start < new_end AND existing_end > new_start
        -- Assuming 2 hour reservation duration
        (time::time, (time::time + interval '2 hours')) OVERLAPS 
        (NEW.time::time, (NEW.time::time + interval '2 hours'))
      )
  ) THEN
    RAISE EXCEPTION 'Table % is already reserved for this time slot on %', NEW.table_number, NEW.date;
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger to prevent double-booking
DROP TRIGGER IF EXISTS prevent_double_booking ON public.reservations;
CREATE TRIGGER prevent_double_booking
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_table_overlap();