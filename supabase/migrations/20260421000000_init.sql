
-- 创建笔记表
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL DEFAULT '无标题笔记',
    content TEXT DEFAULT '',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);

-- 启用行级安全
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的笔记
CREATE POLICY "Users can only access their own notes"
    ON notes
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 权限设置
GRANT SELECT, INSERT, UPDATE, DELETE ON notes TO authenticated;

-- 创建标签表
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, user_id)
);

-- 创建索引
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- 启用行级安全
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can only access their own tags"
    ON tags
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 权限设置
GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO authenticated;

-- 创建关联表
CREATE TABLE note_tags (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

-- 创建索引
CREATE INDEX idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX idx_note_tags_tag_id ON note_tags(tag_id);

-- 启用行级安全
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can only access their own note_tags"
    ON note_tags
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id = note_tags.note_id 
            AND notes.user_id = auth.uid()
        )
    );

-- 权限设置
GRANT SELECT, INSERT, DELETE ON note_tags TO authenticated;

-- 创建自动更新时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为笔记表添加触发器
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

