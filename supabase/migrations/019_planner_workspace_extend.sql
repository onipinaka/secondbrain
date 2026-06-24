-- Extend daily_planner_schedule with workspace link + hard_block flag + status
-- Replaces the boolean is_done with a richer status field

ALTER TABLE public.daily_planner_schedule
  ADD COLUMN workspace_id smallint REFERENCES public.workspaces(id),
  ADD COLUMN is_hard_block boolean DEFAULT false,
  ADD COLUMN status varchar DEFAULT 'planned';
  -- status: planned / done / skipped

-- Backfill status from is_done
UPDATE public.daily_planner_schedule SET status = 'done' WHERE is_done = true;
UPDATE public.daily_planner_schedule SET status = 'planned' WHERE is_done = false;

CREATE INDEX idx_daily_schedule_workspace ON public.daily_planner_schedule(workspace_id);
