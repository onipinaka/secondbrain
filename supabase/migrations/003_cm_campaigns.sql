-- Campaign-based email outreach (replaces cm_emails approach)

CREATE TABLE public.cm_campaigns (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  name          varchar NOT NULL,
  subject       varchar,
  niche_id      smallint REFERENCES public.cm_niches(niche_id) ON DELETE SET NULL,
  content       text,
  attachment    varchar,
  status        varchar NOT NULL DEFAULT 'active',   -- active / finished
  replied_count int     NOT NULL DEFAULT 0
);

CREATE TABLE public.cm_campaign_contacts (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  campaign_id   bigint NOT NULL REFERENCES public.cm_campaigns(id) ON DELETE CASCADE,
  email         varchar,
  company_name  varchar,
  contact_name  varchar,
  niche_id      smallint REFERENCES public.cm_niches(niche_id) ON DELETE SET NULL
);

CREATE INDEX idx_cm_campaigns_niche    ON public.cm_campaigns(niche_id);
CREATE INDEX idx_cm_campaigns_status   ON public.cm_campaigns(status);
CREATE INDEX idx_cm_cc_campaign        ON public.cm_campaign_contacts(campaign_id);
CREATE INDEX idx_cm_cc_niche           ON public.cm_campaign_contacts(niche_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cm_campaigns FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();

-- Single-user app, no auth needed
ALTER TABLE public.cm_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_campaign_contacts DISABLE ROW LEVEL SECURITY;
