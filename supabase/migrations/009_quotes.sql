CREATE TABLE public.qc_quotes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  quote text NOT NULL,
  author varchar
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.qc_quotes FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();