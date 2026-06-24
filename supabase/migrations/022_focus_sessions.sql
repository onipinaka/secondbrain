-- Focus Sessions: tracks Dashboard "Focus Mode" timer sessions

CREATE TABLE public.focus_sessions (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at      timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  duration_minutes integer
);
