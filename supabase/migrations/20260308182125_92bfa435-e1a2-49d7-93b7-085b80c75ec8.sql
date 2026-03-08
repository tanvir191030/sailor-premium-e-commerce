
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  subscribed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Admins can read all subscribers
CREATE POLICY "Admins can read subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role_type));

-- Admins can delete subscribers
CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers
  FOR DELETE USING (has_role(auth.uid(), 'admin'::user_role_type));
