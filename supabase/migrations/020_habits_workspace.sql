-- Link habits to workspaces (optional) for dashboard integration
ALTER TABLE public.habits
  ADD COLUMN workspace_id smallint REFERENCES public.workspaces(id) ON DELETE SET NULL;

CREATE INDEX idx_habits_workspace ON public.habits(workspace_id) WHERE workspace_id IS NOT NULL;
