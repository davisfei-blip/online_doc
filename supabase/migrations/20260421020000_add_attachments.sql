ALTER TABLE notes_public
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
