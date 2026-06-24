-- Per-core-subject daily configuration (editable from overview page)

CREATE TABLE public.cs_daily_config (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  core_subject_id smallint NOT NULL UNIQUE REFERENCES public.cs_core_subjects(core_subject_id) ON DELETE CASCADE,
  questions_daily_goal smallint NOT NULL DEFAULT 3
);

CREATE INDEX idx_cs_daily_config_subject ON public.cs_daily_config(core_subject_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cs_daily_config
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
