
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_variants jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS color_name text DEFAULT NULL;
