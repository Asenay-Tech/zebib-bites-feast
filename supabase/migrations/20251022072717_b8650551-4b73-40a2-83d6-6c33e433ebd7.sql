-- Create table for Our Specialties section
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_de TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_de TEXT,
  description_en TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

-- Anyone can view specialties
CREATE POLICY "Anyone can view specialties" 
ON public.specialties 
FOR SELECT 
USING (true);

-- Admins can insert specialties
CREATE POLICY "Admins can insert specialties" 
ON public.specialties 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admins can update specialties
CREATE POLICY "Admins can update specialties" 
ON public.specialties 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admins can delete specialties
CREATE POLICY "Admins can delete specialties" 
ON public.specialties 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_specialties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_specialties_updated_at
BEFORE UPDATE ON public.specialties
FOR EACH ROW
EXECUTE FUNCTION public.update_specialties_updated_at();