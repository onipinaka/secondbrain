-- Polymorphic rich-text notes used by BlockEditor
-- entity_type + entity_id point to any table (journal_entry, workspace_notes, cp_journal, etc.)

CREATE TABLE public.note_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title varchar NOT NULL DEFAULT '',
  content jsonb,
  entity_type varchar,
  entity_id varchar,
  tags text[],
  workspace_id smallint REFERENCES public.workspaces(id) ON DELETE SET NULL
);

CREATE INDEX idx_note_pages_entity ON public.note_pages(entity_type, entity_id);
CREATE INDEX idx_note_pages_workspace ON public.note_pages(workspace_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.note_pages
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();
