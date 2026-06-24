CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  quote text NOT NULL,
  author varchar,
  category varchar,
  source varchar,
  is_favourite boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_quotes_category ON public.quotes(category);
CREATE INDEX idx_quotes_favourite ON public.quotes(is_favourite) WHERE is_favourite = true;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
