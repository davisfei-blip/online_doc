CREATE TABLE notes_public (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL DEFAULT '无标题笔记',
    content TEXT DEFAULT '',
    workspace_id TEXT NOT NULL DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tags_public (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    workspace_id TEXT NOT NULL DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, workspace_id)
);

CREATE TABLE note_tags_public (
    note_id UUID NOT NULL REFERENCES notes_public(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags_public(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

ALTER TABLE notes_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags_public ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to notes"
    ON notes_public
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public access to tags"
    ON tags_public
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public access to note_tags"
    ON note_tags_public
    FOR ALL
    USING (true)
    WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON notes_public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tags_public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON note_tags_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION update_notes_public_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_public_updated_at
    BEFORE UPDATE ON notes_public
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_public_updated_at();
