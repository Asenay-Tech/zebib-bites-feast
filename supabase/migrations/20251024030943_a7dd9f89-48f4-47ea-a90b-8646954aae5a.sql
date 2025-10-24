-- Fix activity log security issue
DROP POLICY IF EXISTS "Service role can insert activity logs" ON public.activity_log;

CREATE POLICY "Users can insert own activity logs"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add order_code column to orders table for human-readable order IDs
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code TEXT;

-- Create index for faster order_code lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);