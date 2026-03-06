
-- Create sub_categories table
CREATE TABLE public.sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  measurement_template text NOT NULL DEFAULT 'none',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Sub-categories are publicly readable"
  ON public.sub_categories FOR SELECT
  USING (true);

-- Admin manage
CREATE POLICY "Admins can manage sub-categories"
  ON public.sub_categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role_type))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role_type));
