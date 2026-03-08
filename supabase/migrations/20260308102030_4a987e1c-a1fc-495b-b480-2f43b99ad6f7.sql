ALTER TABLE public.orders ADD COLUMN coupon_code text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN discount_amount numeric DEFAULT 0;