
-- Create site-assets storage bucket for logo/favicon uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for site-assets
CREATE POLICY "Site assets are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::user_role_type));

CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::user_role_type));

CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::user_role_type));
