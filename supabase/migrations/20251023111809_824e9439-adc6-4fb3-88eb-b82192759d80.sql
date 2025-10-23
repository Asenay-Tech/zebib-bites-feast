-- Add DELETE policies for admin/staff to orders table
CREATE POLICY "Admins and staff can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Add DELETE policies for admin/staff to reservations table
CREATE POLICY "Admins and staff can delete reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Add DELETE policies for admin/staff to profiles table
CREATE POLICY "Admins and staff can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));