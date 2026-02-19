-- Add default categories if missing
INSERT INTO public.categories (name) VALUES ('Kids')
ON CONFLICT DO NOTHING;

-- Add default brands
INSERT INTO public.brands (name) VALUES ('Nike'), ('Adidas'), ('Puma'), ('Local Brand')
ON CONFLICT DO NOTHING;