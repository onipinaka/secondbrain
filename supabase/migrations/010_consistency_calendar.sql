-- Consistency Calendar

CREATE TABLE public.habits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name varchar NOT NULL,                 -- "Gym", "DSA", "Pushups", ...
  icon varchar,
  color varchar,
  sort_order smallint,
  is_active boolean DEFAULT true,
  started_on date,
  notes text
);

CREATE TABLE public.habit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  habit_id bigint NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date date NOT NULL,
  status varchar NOT NULL,               -- done / partial / missed
  notes text,
  UNIQUE(habit_id, date)
);

CREATE INDEX idx_habits_active ON public.habits(is_active) WHERE is_active = true;
CREATE INDEX idx_habit_logs_date ON public.habit_logs(date);
CREATE INDEX idx_habit_logs_habit ON public.habit_logs(habit_id, date DESC);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.habits     FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.habit_logs FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();