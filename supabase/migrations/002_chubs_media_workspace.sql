-- Chubs Media Workspace

CREATE TABLE public.cm_niches (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  niche_id smallint NOT NULL UNIQUE,
  name varchar NOT NULL,
  slug varchar UNIQUE,
  color varchar,
  icon varchar,
  sort_order smallint
);

CREATE TABLE public.cm_leads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  company_name varchar,
  contact_name varchar,
  phone varchar,
  whatsapp varchar,
  email varchar,
  instagram varchar,
  niche_id smallint REFERENCES public.cm_niches(niche_id) ON DELETE SET NULL,
  follow_up_status varchar,        -- not_called / called / interested / not_interested / follow_up / converted / lost
  source varchar,                  -- Instagram DM / WhatsApp / Referral / Cold Call / etc.
  last_contact date,
  next_follow_up date,
  best_time_to_call varchar,
  whatsapp_template_used varchar,
  response text,                   -- what the lead said
  notes text
);

CREATE TABLE public.cm_emails (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  company varchar,
  contact_name varchar,
  email varchar,
  subject varchar,
  campaign varchar,
  status varchar,                  -- draft / queued / sent / opened / replied / bounced
  sent_on timestamptz,
  opened_at timestamptz,           -- was boolean (loses timing)
  replied_at timestamptz,          -- was boolean (loses timing)
  next_follow_up date,
  content text,
  niche_id smallint REFERENCES public.cm_niches(niche_id) ON DELETE SET NULL
);

CREATE TABLE public.cm_ideas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title varchar NOT NULL,
  niche_id smallint REFERENCES public.cm_niches(niche_id) ON DELETE SET NULL,
  content text
);

-- Indexes
CREATE INDEX idx_cm_leads_niche ON public.cm_leads(niche_id);
CREATE INDEX idx_cm_leads_follow_up ON public.cm_leads(next_follow_up);
CREATE INDEX idx_cm_emails_niche ON public.cm_emails(niche_id);
CREATE INDEX idx_cm_emails_status ON public.cm_emails(status);
CREATE INDEX idx_cm_ideas_niche ON public.cm_ideas(niche_id);

-- updated_at triggers (function `trg_set_updated_at` already created with cs_ schema)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cm_niches FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cm_leads  FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cm_emails FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cm_ideas  FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();