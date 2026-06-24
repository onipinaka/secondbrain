-- Core Subject Workspace (cs_ prefix)

CREATE TABLE public.cs_core_subjects (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  core_subject_id smallint NOT NULL UNIQUE,
  core_subject_name varchar NOT NULL,
  slug varchar UNIQUE,
  color varchar,
  icon text,
  description text,
  sort_order smallint
);

CREATE TABLE public.cs_topics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  topic_id smallint NOT NULL UNIQUE,
  core_subject_id smallint NOT NULL REFERENCES public.cs_core_subjects(core_subject_id) ON
DELETE CASCADE,
  title varchar NOT NULL,
  slug varchar,
  color varchar,
  status varchar,                -- not_started / in_progress / done
  difficulty varchar,            -- easy / medium / hard
  timeline varchar,
  total_hours smallint,
  completed_hours smallint,
  description text,
  notes text,
  sort_order smallint
);

CREATE TABLE public.cs_topic_resources (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),     -- was missing
  topic_id smallint NOT NULL REFERENCES public.cs_topics(topic_id) ON DELETE CASCADE,
  title varchar NOT NULL,
  url text NOT NULL,
  type varchar                   -- video / article / docs / book / course
);

CREATE TABLE public.cs_questions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  core_subject_id smallint NOT NULL REFERENCES public.cs_core_subjects(core_subject_id) ON
DELETE CASCADE,
  topic_id smallint REFERENCES public.cs_topics(topic_id) ON DELETE SET NULL,
  title varchar NOT NULL,
  link text,
  solution text,
  difficulty varchar,
  status varchar,                -- todo / attempted / solved / revisit
  solved_at timestamptz,
  timer smallint,                -- minutes
  attempt smallint DEFAULT 0,
  notes text
);

CREATE TABLE public.cs_interview_questions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  core_subject_id smallint NOT NULL REFERENCES public.cs_core_subjects(core_subject_id) ON
DELETE CASCADE,
  topic_id smallint REFERENCES public.cs_topics(topic_id) ON DELETE SET NULL,
  question text NOT NULL,
  answer text,
  tag varchar,
  difficulty varchar,
  viewed boolean DEFAULT false,
  notes text
);

CREATE TABLE public.cs_revision_sessions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  core_subject_id smallint NOT NULL REFERENCES public.cs_core_subjects(core_subject_id) ON
DELETE CASCADE,
  topic_id smallint REFERENCES public.cs_topics(topic_id) ON DELETE SET NULL,
  title varchar NOT NULL,
  description text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  status varchar,                -- scheduled / completed / skipped
  notes text
);

CREATE TABLE public.cs_cheat_sheets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  core_subject_id smallint NOT NULL REFERENCES public.cs_core_subjects(core_subject_id) ON
DELETE CASCADE,
  topic_id smallint REFERENCES public.cs_topics(topic_id) ON DELETE SET NULL,
  title varchar NOT NULL,
  content text
);

CREATE TABLE public.cs_notes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  core_subject_id smallint NOT NULL REFERENCES public.cs_core_subjects(core_subject_id) ON
DELETE CASCADE,
  topic_id smallint REFERENCES public.cs_topics(topic_id) ON DELETE SET NULL,
  title varchar NOT NULL,
  content text,
  tags text[]
);

-- Indexes
CREATE INDEX idx_cs_topics_subject ON public.cs_topics(core_subject_id);
CREATE INDEX idx_cs_topic_resources_topic ON public.cs_topic_resources(topic_id);
CREATE INDEX idx_cs_questions_subject ON public.cs_questions(core_subject_id);
CREATE INDEX idx_cs_questions_topic ON public.cs_questions(topic_id);
CREATE INDEX idx_cs_interview_questions_topic ON public.cs_interview_questions(topic_id);
CREATE INDEX idx_cs_revision_sessions_topic ON public.cs_revision_sessions(topic_id);
CREATE INDEX idx_cs_cheat_sheets_topic ON public.cs_cheat_sheets(topic_id);
CREATE INDEX idx_cs_notes_topic ON public.cs_notes(topic_id);

-- updated_at auto-bump (create ONCE for the whole DB; covers every workspace)
CREATE OR REPLACE FUNCTION public.trg_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to every cs_ table
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cs_core_subjects       FOR EACH
ROW EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cs_topics              FOR EACH
ROW EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cs_topic_resources     FOR EACH
ROW EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cs_questions           FOR EACH
ROW EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cs_interview_questions FOR EACH
ROW EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cs_revision_sessions   FOR EACH
ROW EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cs_cheat_sheets        FOR EACH
ROW EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cs_notes               FOR EACH
ROW EXECUTE FUNCTION public.trg_set_updated_at();