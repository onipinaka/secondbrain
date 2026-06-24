-- Extend cm_leads with fields needed for Add/Edit Lead modal
ALTER TABLE public.cm_leads
  ADD COLUMN IF NOT EXISTS whatsapp varchar,
  ADD COLUMN IF NOT EXISTS source varchar,
  ADD COLUMN IF NOT EXISTS last_contact date,
  ADD COLUMN IF NOT EXISTS best_time_to_call varchar,
  ADD COLUMN IF NOT EXISTS whatsapp_template_used varchar,
  ADD COLUMN IF NOT EXISTS response text;
