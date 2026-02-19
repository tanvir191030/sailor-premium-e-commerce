
-- Add tracking_id column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_id text UNIQUE;

-- Add email, district, thana columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS thana text;

-- Create function to auto-generate tracking_id
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS TRIGGER AS $$
DECLARE
  seq_num integer;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num FROM public.orders;
  NEW.tracking_id := 'SN-' || LPAD(seq_num::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER set_tracking_id
BEFORE INSERT ON public.orders
FOR EACH ROW
WHEN (NEW.tracking_id IS NULL)
EXECUTE FUNCTION public.generate_tracking_id();
