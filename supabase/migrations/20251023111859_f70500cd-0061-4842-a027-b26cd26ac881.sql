-- Make user_id nullable in orders and reservations tables to support admin-created records
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reservations ALTER COLUMN user_id DROP NOT NULL;

-- Add admin INSERT policies for orders (admins can create orders for customers)
CREATE POLICY "Admins and staff can insert any order"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Add admin INSERT policies for reservations (admins can create reservations for customers)
CREATE POLICY "Admins and staff can insert any reservation"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));