-- Opportunities Workspace

CREATE TABLE public.opp_opportunities (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name varchar NOT NULL,
  type varchar,                    -- hackathon / competition / fellowship / internship / grant / etc.
  status varchar,                  -- not_started / in_progress / submitted / accepted / rejected /
dropped
  deadline date,
  priority varchar,                -- low / medium / high
  theme varchar,
  notes text,
  ps text,                         -- problem statement
  solution text
);

CREATE INDEX idx_opp_opportunities_deadline ON public.opp_opportunities(deadline);
CREATE INDEX idx_opp_opportunities_status ON public.opp_opportunities(status);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.opp_opportunities FOR EACH ROW
EXECUTE FUNCTION public.trg_set_updated_at();