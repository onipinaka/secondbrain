-- Projects Workspace

CREATE TABLE public.proj_projects (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name varchar NOT NULL,
  tagline varchar,
  description text,
  category varchar,                  -- web / mobile / saas / cli / library / ...
  status varchar,                    -- ideation / building / testing / completed / dropped / paused
  tech_stack text[],
  start_date date,
  target_date date,
  completed_at timestamptz,
  github_link text,
  deployed_link text,
  roadmap text,
  notes text
);

CREATE TABLE public.proj_documents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  project_id bigint NOT NULL REFERENCES public.proj_projects(id) ON DELETE CASCADE,
  doc_type varchar NOT NULL,         -- prd / figma / note / spec / research / other
  title varchar NOT NULL,
  content text,
  link text,
  sort_order smallint
);

CREATE TABLE public.proj_features (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  project_id bigint NOT NULL REFERENCES public.proj_projects(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  description text,
  notes text,
  status varchar DEFAULT 'backlog',  -- backlog / in_progress / testing / completed
  deadline date,
  hours_spent numeric(6,2) DEFAULT 0,
  sort_order smallint NOT NULL,
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE public.proj_tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  feature_id bigint NOT NULL REFERENCES public.proj_features(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  description text,
  notes text,
  status varchar DEFAULT 'backlog',  -- backlog / in_progress / testing / completed
  deadline date,
  hours_spent numeric(6,2) DEFAULT 0,
  sort_order smallint NOT NULL,
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE public.proj_bugs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  project_id bigint NOT NULL REFERENCES public.proj_projects(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  notes text,
  status varchar DEFAULT 'open',     -- open / in_progress / fixed / wont_fix
  priority varchar,                  -- low / medium / high / critical
  fixed_at timestamptz
);

-- Indexes
CREATE INDEX idx_proj_documents_project ON public.proj_documents(project_id);
CREATE INDEX idx_proj_features_project ON public.proj_features(project_id, sort_order);
CREATE INDEX idx_proj_features_status ON public.proj_features(status);
CREATE INDEX idx_proj_tasks_feature ON public.proj_tasks(feature_id, sort_order);
CREATE INDEX idx_proj_tasks_status ON public.proj_tasks(status);
CREATE INDEX idx_proj_bugs_project ON public.proj_bugs(project_id);
CREATE INDEX idx_proj_bugs_status ON public.proj_bugs(status);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.proj_projects  FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.proj_documents FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.proj_features  FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.proj_tasks     FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.proj_bugs      FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();