-- Master Tasks + Daily Planner

-- ============================================================
-- MASTER TASKS
-- ============================================================

CREATE TABLE public.tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title varchar NOT NULL,
  description text,
  status varchar DEFAULT 'backlog',
    -- backlog / in_progress / blocked / skipped / completed / cancelled
  priority varchar,                      -- high / medium / low
  workspace varchar,                     -- personal / chubs_media / cs_dsa / proj / gym / ...
  category varchar,
  due_date date,
  due_time time,
  is_deep_work boolean DEFAULT false,
  is_quick_task boolean DEFAULT false,
  estimated_minutes smallint,
  actual_minutes smallint,
  blocked_reason text,
  skipped_reason text,
  started_at timestamptz,
  completed_at timestamptz,
  skipped_at timestamptz,
  notes text
);

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_workspace ON public.tasks(workspace);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_deep_work ON public.tasks(is_deep_work) WHERE is_deep_work = true;
CREATE INDEX idx_tasks_quick ON public.tasks(is_quick_task) WHERE is_quick_task = true;
CREATE INDEX idx_tasks_open ON public.tasks(status) WHERE status NOT IN ('completed',
'cancelled');


-- ============================================================
-- DAILY PLANNER
-- ============================================================

CREATE TABLE public.daily_planner_days (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL UNIQUE,

  -- Morning
  intention text,
  day_focus text,

  -- End of day
  mood varchar,                          -- great / good / okay / bad / terrible
  energy_level smallint,                 -- 1-10
  productivity_score smallint,           -- 1-10
  gratitude text,
  wins text,
  improvements text,
  reflection text,
  notes text
);

CREATE TABLE public.daily_planner_top_priorities (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 3),
  task_id bigint REFERENCES public.tasks(id) ON DELETE SET NULL,
  custom_title varchar,
  is_done boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(date, position)
);

CREATE TABLE public.daily_planner_schedule (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  title varchar NOT NULL,
  category varchar,                      -- deep_work / meeting / break / personal / admin
  task_id bigint REFERENCES public.tasks(id) ON DELETE SET NULL,
  is_done boolean DEFAULT false,
  notes text
);

CREATE INDEX idx_daily_top_priorities_date ON public.daily_planner_top_priorities(date);
CREATE INDEX idx_daily_top_priorities_task ON public.daily_planner_top_priorities(task_id);
CREATE INDEX idx_daily_schedule_date ON public.daily_planner_schedule(date);
CREATE INDEX idx_daily_schedule_task ON public.daily_planner_schedule(task_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tasks                        FOR
EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.daily_planner_days           FOR
EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.daily_planner_top_priorities FOR
EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.daily_planner_schedule       FOR
EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
