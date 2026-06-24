CREATE TABLE public.meditation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  log_date date NOT NULL,
  duration_mins integer,
  type varchar,
  resource varchar,
  mood_before smallint CHECK (mood_before BETWEEN 1 AND 5),
  mood_after smallint CHECK (mood_after BETWEEN 1 AND 5),
  notes text
);

CREATE INDEX idx_meditation_log_date ON public.meditation_log(log_date DESC);
