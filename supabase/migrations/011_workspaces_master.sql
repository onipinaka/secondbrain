CREATE TABLE public.workspaces (
  id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  slug varchar NOT NULL UNIQUE,          -- 'chubs_media', 'cs_dsa', 'gym', 'proj', ...
  name varchar NOT NULL,                 -- 'Chubs Media', 'DSA', 'Gym', 'Projects'
  icon varchar,
  color varchar,
  description text,
  category varchar,                      -- core_subject / business / personal / growth / life
  table_prefix varchar,                  -- 'cm_', 'cs_', 'gym_', 'proj_'
  sort_order smallint,
  is_active boolean DEFAULT true,
  is_pinned boolean DEFAULT false,
  last_accessed_at timestamptz
);

CREATE INDEX idx_workspaces_active ON public.workspaces(is_active) WHERE is_active = true;
CREATE INDEX idx_workspaces_sort ON public.workspaces(sort_order);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();

-- tasks
ALTER TABLE public.tasks ADD COLUMN workspace_id smallint REFERENCES public.workspaces(id);
-- backfill from existing workspace varchar, then:
ALTER TABLE public.tasks DROP COLUMN workspace;

-- qc_tasks
ALTER TABLE public.qc_tasks ADD COLUMN workspace_id smallint REFERENCES
public.workspaces(id);
ALTER TABLE public.qc_tasks DROP COLUMN workspace;

-- qc_ideas
ALTER TABLE public.qc_ideas ADD COLUMN sorted_to_workspace_id smallint REFERENCES
public.workspaces(id);
ALTER TABLE public.qc_ideas DROP COLUMN sorted_to_workspace;

INSERT INTO public.workspaces (slug, name, category, table_prefix, sort_order) VALUES
  ('cs_dsa',       'DSA',           'core_subject', 'cs_',   1),
  ('cs_os',        'Operating Systems', 'core_subject', 'cs_', 2),
  ('cs_cn',        'Computer Networks', 'core_subject', 'cs_', 3),
  ('cs_dbms',      'DBMS',          'core_subject', 'cs_',   4),
  ('chubs_media',  'Chubs Media',   'business',     'cm_',   5),
  ('opportunities','Opportunities', 'growth',       'opp_',  6),
  ('open_source',  'Open Source',   'growth',       'os_',   7),
  ('proj',         'Projects',      'growth',       'proj_', 8),
  ('gym',          'Gym',           'personal',     'gym_',  9),
  ('personal',     'Personal',      'personal',     'personal_', 10);