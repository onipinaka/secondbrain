-- Call scripts & templates for client acquisition

CREATE TABLE public.cm_call_scripts (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  headline   varchar NOT NULL DEFAULT 'Untitled',
  content    text
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cm_call_scripts FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();

ALTER TABLE public.cm_call_scripts DISABLE ROW LEVEL SECURITY;
