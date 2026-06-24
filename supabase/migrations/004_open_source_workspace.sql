-- Open Source Workspace

CREATE TABLE public.os_repos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  repo_name varchar NOT NULL,
  github_link text,
  owner varchar,                       -- org / user the repo belongs to
  description text,
  theme varchar,                       -- e.g. devtools / ai / web / infra
  tech_stack text[],
  stars integer,
  status varchar,                      -- exploring / contributing / paused / done
  difficulty varchar,                  -- easy / medium / hard
  priority varchar,                    -- low / medium / high
  is_assigned boolean DEFAULT false,   -- currently assigned an issue
  notes text
  -- counters removed (prs_opened/merged/closed/issues_opened) — derive from os_prs and
os_issues
);

CREATE TABLE public.os_issues (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  repo_id bigint NOT NULL REFERENCES public.os_repos(id) ON DELETE CASCADE,
  issue_number integer,
  title varchar NOT NULL,
  link text,
  status varchar,                      -- open / assigned / in_progress / solved / abandoned
  is_assigned boolean DEFAULT false,
  assigned_at timestamptz,
  solved_at timestamptz,               -- IS NOT NULL replaces the `solved` boolean
  difficulty varchar,
  labels text[],
  notes text
);

CREATE TABLE public.os_prs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  repo_id bigint NOT NULL REFERENCES public.os_repos(id) ON DELETE CASCADE,
  issue_id bigint REFERENCES public.os_issues(id) ON DELETE SET NULL,
  pr_number integer,
  title varchar NOT NULL,
  link text,
  status varchar,                      -- draft / open / merged / closed
  opened_at timestamptz,
  merged_at timestamptz,
  closed_at timestamptz,
  notes text
);

CREATE INDEX idx_os_issues_repo ON public.os_issues(repo_id);
CREATE INDEX idx_os_prs_repo ON public.os_prs(repo_id);
CREATE INDEX idx_os_prs_issue ON public.os_prs(issue_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.os_repos  FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.os_issues FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.os_prs    FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();