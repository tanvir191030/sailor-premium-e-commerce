-- SQL Script to update Supabase Schema for Modest Mart Website
-- 
-- 1. Add `sub_category` column to the `products` table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sub_category text;

-- 2. "Size Stock" Structure Note:
-- The `sizes` column in the `products` table is already of type `jsonb` (or `json`).
-- We are using this existing JSON structure to store the individual stock counts 
-- and specific measurements for S, M, L, XL, XXL, Free Size, etc. This is 
-- preferred over a new table because it offers the flexibility needed to handle 
-- both simple standard sizes and unique hijab measurements (Width, Length) 
-- without needing complex joins or altering multiple schemas.

-- Typical data structure stored in the existing `sizes` json column for women's products:
-- {
--   "sub_category": "Hijab",
--   "variants": {
--     "Free Size": {
--       "stock": 50,
--       "measurements": { "width": "30", "length": "80" }
--     }
--   }
-- }
-- 
-- For regular clothes:
-- {
--   "sub_category": "Borkha",
--   "variants": {
--     "M": {
--       "stock": 10,
--       "measurements": { "bust": "36", "length": "52" }
--     }
--   }
-- }

-- Please run this script in your Supabase SQL Editor.
