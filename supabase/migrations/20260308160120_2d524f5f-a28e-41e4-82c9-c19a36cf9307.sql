
ALTER TABLE public.sub_categories 
  ADD COLUMN IF NOT EXISTS size_chart_image text,
  ADD COLUMN IF NOT EXISTS size_chart_data jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.sub_categories.size_chart_image IS 'URL to uploaded size chart image';
COMMENT ON COLUMN public.sub_categories.size_chart_data IS 'JSON array of size chart rows e.g. [{"size":"M","chest":"38","length":"28"}]';
