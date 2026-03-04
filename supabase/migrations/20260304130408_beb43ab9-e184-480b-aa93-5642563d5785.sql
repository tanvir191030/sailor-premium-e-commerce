CREATE POLICY "Admins can update reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role_type))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role_type));