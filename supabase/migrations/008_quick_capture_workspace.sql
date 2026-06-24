-- Quick Capture / Inbox (cross-workspace catch-all)

-- ----- Sudden Tasks -----

CREATE TABLE public.qc_tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  task varchar NOT NULL,
  due_date date,
  due_time time,
  workspace varchar,                  -- target workspace tag: personal / chubs_media / learning_lab /
...
  is_done boolean DEFAULT false,
  done_at timestamptz,
  processed_at timestamptz            -- when moved into the real workspace
);

-- ----- Reminders -----

CREATE TABLE public.qc_reminders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title varchar NOT NULL,             -- "Dentist Appointment", "Mom's Birthday"
  date date NOT NULL,
  time time,                          -- null => all-day
  is_all_day boolean DEFAULT false,
  person varchar,                     -- "Dr. Sharma", "Family", "Team" (single tag)
  notes text,
  processed_at timestamptz
);

-- ----- Time Blocks to Protect (persistent, not inbox-style) -----

CREATE TABLE public.qc_time_blocks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name varchar NOT NULL,              -- "Sleep", "Lunch", "Gym", "No Meeting Zone"
  recurrence varchar NOT NULL,        -- daily / weekly / once
  weekdays smallint[],                -- 0=Sun .. 6=Sat (used when recurrence='weekly')
  specific_date date,                 -- used when recurrence='once'
  start_time time NOT NULL,
  end_time time NOT NULL,
  type varchar,                       -- hard / soft
  notes text,
  is_active boolean DEFAULT true
);

-- ----- Random Ideas -----

CREATE TABLE public.qc_ideas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  idea text NOT NULL,
  category varchar,                   -- tech / business / personal / education / other
  is_sorted boolean DEFAULT false,
  sorted_to_workspace varchar,
  processed_at timestamptz
);

-- ----- Links to Check Later -----

CREATE TABLE public.qc_links (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title varchar,
  url text NOT NULL,
  tags text[],                        -- multi-tag: {system_design, read} / {dsa, learn}
  processed_at timestamptz
);

-- ----- Quick Notes -----

CREATE TABLE public.qc_notes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  content text NOT NULL,
  processed_at timestamptz
);

-- Indexes
CREATE INDEX idx_qc_tasks_due ON public.qc_tasks(due_date);
CREATE INDEX idx_qc_tasks_unprocessed ON public.qc_tasks(processed_at) WHERE processed_at
IS NULL;
CREATE INDEX idx_qc_reminders_date ON public.qc_reminders(date);
CREATE INDEX idx_qc_time_blocks_active ON public.qc_time_blocks(is_active) WHERE is_active =
true;
CREATE INDEX idx_qc_ideas_unsorted ON public.qc_ideas(is_sorted) WHERE is_sorted = false;
CREATE INDEX idx_qc_links_unprocessed ON public.qc_links(processed_at) WHERE processed_at IS
NULL;