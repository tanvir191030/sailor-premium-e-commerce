
-- Add delivery_charge column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_charge numeric DEFAULT 0;

-- Seed default delivery charge settings
INSERT INTO public.site_settings (key, value) VALUES ('delivery_inside_dhaka', '80') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('delivery_outside_dhaka', '130') ON CONFLICT (key) DO NOTHING;

-- Add unique constraint on key if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_key_unique') THEN
    ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_key_unique UNIQUE (key);
  END IF;
END $$;
