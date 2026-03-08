
ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_category text,
  ADD COLUMN IF NOT EXISTS product_sub_category text,
  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;
