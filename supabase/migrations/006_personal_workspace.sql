-- Personal Workspace

-- ----- Journal -----

CREATE TABLE public.personal_journal (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  logged_at timestamptz NOT NULL,
  title varchar NOT NULL,
  content text
);

-- ----- Goals (short / mid / long / life / bucket_list) -----

CREATE TABLE public.personal_goals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  goal_type varchar NOT NULL,            -- short_term / mid_term / long_term / life / bucket_list
  title varchar NOT NULL,
  content text,
  status varchar DEFAULT 'in_progress',  -- not_started / in_progress / achieved / dropped
  target_date date,
  achieved_at timestamptz
);

-- ----- Wishlist -----

CREATE TABLE public.personal_wishlist (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title varchar NOT NULL,
  content text,
  image_url text,
  price numeric(12,2),
  currency varchar DEFAULT 'INR',
  priority varchar,                      -- low / medium / high
  status varchar DEFAULT 'wished',       -- wished / saving / purchased / dropped
  purchased_at timestamptz
);

-- Indexes
CREATE INDEX idx_personal_journal_logged_at ON public.personal_journal(logged_at DESC);
CREATE INDEX idx_personal_goals_type ON public.personal_goals(goal_type);
CREATE INDEX idx_personal_goals_status ON public.personal_goals(status);
CREATE INDEX idx_personal_wishlist_status ON public.personal_wishlist(status);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.personal_journal  FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.personal_goals    FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.personal_wishlist FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();