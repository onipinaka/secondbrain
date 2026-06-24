-- Extend cm_emails with contact_name and subject columns
ALTER TABLE public.cm_emails
  ADD COLUMN IF NOT EXISTS contact_name varchar,
  ADD COLUMN IF NOT EXISTS subject varchar;
