CREATE TABLE public.proj_roadmap_phases (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  project_id bigint NOT NULL REFERENCES public.proj_projects(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  description text,
  status varchar NOT NULL DEFAULT 'planned', -- planned / in_progress / completed / skipped
  sort_order smallint NOT NULL DEFAULT 0,
  target_date date
);

CREATE INDEX idx_proj_roadmap_project ON public.proj_roadmap_phases(project_id, sort_order);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.proj_roadmap_phases FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
