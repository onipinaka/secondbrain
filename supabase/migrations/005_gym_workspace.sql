-- Gym Workspace (all append-only / log-based for analytics)

-- ----- Pushup tracker -----

CREATE TABLE public.gym_pushup_goals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  effective_from date NOT NULL UNIQUE,
  daily_goal smallint NOT NULL,
  notes text
);

CREATE TABLE public.gym_pushup_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  logged_at timestamptz NOT NULL,
  count smallint NOT NULL,
  notes text
);

-- ----- Workout logger -----

CREATE TABLE public.gym_exercises (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name varchar NOT NULL,
  muscle_group varchar,
  equipment varchar,
  notes text
);

CREATE TABLE public.gym_workouts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL,
  muscle_groups text[],
  duration_minutes smallint,
  notes text
);

CREATE TABLE public.gym_workout_sets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  workout_id bigint NOT NULL REFERENCES public.gym_workouts(id) ON DELETE CASCADE,
  exercise_id bigint NOT NULL REFERENCES public.gym_exercises(id) ON DELETE RESTRICT,
  set_number smallint,
  reps smallint,
  weight_kg numeric(6,2),
  is_warmup boolean DEFAULT false,
  notes text
);

CREATE TABLE public.gym_exercise_prs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  exercise_id bigint NOT NULL REFERENCES public.gym_exercises(id) ON DELETE CASCADE,
  achieved_at timestamptz NOT NULL,
  reps smallint,
  weight_kg numeric(6,2),
  notes text
);

-- ----- Body metrics -----

CREATE TABLE public.gym_body_metrics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  logged_at timestamptz NOT NULL,
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,2),
  muscle_mass_kg numeric(5,2),
  notes text
);

-- ----- Nutrition / intake -----

CREATE TABLE public.gym_nutrition_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  logged_at timestamptz NOT NULL,
  intake_type varchar NOT NULL,
  amount numeric(8,2) NOT NULL,
  unit varchar NOT NULL,
  notes text
);

-- Indexes
CREATE INDEX idx_gym_pushup_logs_time ON public.gym_pushup_logs(logged_at);
CREATE INDEX idx_gym_workouts_date ON public.gym_workouts(date);
CREATE INDEX idx_gym_sets_workout ON public.gym_workout_sets(workout_id);
CREATE INDEX idx_gym_sets_exercise ON public.gym_workout_sets(exercise_id);
CREATE INDEX idx_gym_prs_exercise ON public.gym_exercise_prs(exercise_id, achieved_at DESC);
CREATE INDEX idx_gym_body_metrics_time ON public.gym_body_metrics(logged_at);
CREATE INDEX idx_gym_nutrition_time ON public.gym_nutrition_logs(logged_at);
CREATE INDEX idx_gym_nutrition_type ON public.gym_nutrition_logs(intake_type);

-- Triggers only on tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.gym_exercises FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.gym_workouts  FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();