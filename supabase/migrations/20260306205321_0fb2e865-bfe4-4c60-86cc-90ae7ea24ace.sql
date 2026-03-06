INSERT INTO public.sub_categories (name, category_id, measurement_template) VALUES
('Pants', 'a92f6d7c-4d7b-465c-94f7-972de76a7406', 'pants'),
('Trousers', 'a92f6d7c-4d7b-465c-94f7-972de76a7406', 'pants'),
('Shoes', 'a92f6d7c-4d7b-465c-94f7-972de76a7406', 'shoes'),
('Watch', 'a92f6d7c-4d7b-465c-94f7-972de76a7406', 'watch'),
('Hijab', 'b05c4b79-3395-4e30-9292-31b2a0cd0c04', 'hijab'),
('Orna', 'b05c4b79-3395-4e30-9292-31b2a0cd0c04', 'hijab'),
('Salwar Kameez', 'b05c4b79-3395-4e30-9292-31b2a0cd0c04', 'salwar_kameez'),
('Bracelet', 'b05c4b79-3395-4e30-9292-31b2a0cd0c04', 'jewellery'),
('Jewellery', 'b05c4b79-3395-4e30-9292-31b2a0cd0c04', 'jewellery'),
('Shoes', 'b05c4b79-3395-4e30-9292-31b2a0cd0c04', 'shoes'),
('Watch', 'b05c4b79-3395-4e30-9292-31b2a0cd0c04', 'watch');

-- Update existing sub-categories with correct templates
UPDATE public.sub_categories SET measurement_template = 'clothing' WHERE name = 'Shirt' AND measurement_template = 'none';
UPDATE public.sub_categories SET measurement_template = 'clothing' WHERE name = 'T-shirt' AND measurement_template = 'none';
UPDATE public.sub_categories SET measurement_template = 'clothing' WHERE name = 'Polo' AND measurement_template = 'none';
UPDATE public.sub_categories SET measurement_template = 'panjabi' WHERE name = 'Panjabi' AND measurement_template = 'none';
UPDATE public.sub_categories SET measurement_template = 'clothing' WHERE name = 'Borkha' AND measurement_template = 'none';