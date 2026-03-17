-- Create product variants table for color-specific inventory, image, and optional price overrides
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  price NUMERIC NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_stock_quantity_non_negative CHECK (stock_quantity >= 0),
  CONSTRAINT product_variants_unique_color_per_product UNIQUE (product_id, color_name)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_sort_order ON public.product_variants(product_id, sort_order);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product variants are publicly readable"
ON public.product_variants
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can insert product variants"
ON public.product_variants
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product variants"
ON public.product_variants
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product variants"
ON public.product_variants
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));