-- Extend personal_goals with rich UI fields
ALTER TABLE public.personal_goals
  ADD COLUMN IF NOT EXISTS why_it_matters text,
  ADD COLUMN IF NOT EXISTS emoji varchar(10);

-- Add already_have toggle to personal_wishlist
ALTER TABLE public.personal_wishlist
  ADD COLUMN IF NOT EXISTS already_have boolean NOT NULL DEFAULT false;
