-- Reviewer3 peer-review sessions: one row per completed review, comments
-- stored as the full comments[] array (jsonb) so a session can be restored
-- without re-querying the Reviewer3 API. session_id is Reviewer3's id
-- (e.g. r-XC98GRPLZ3) and stays the stable upsert key.
CREATE TABLE IF NOT EXISTS reviewer3_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL UNIQUE,
    title TEXT,
    file_name TEXT,
    review_mode TEXT NOT NULL DEFAULT 'author',
    status TEXT NOT NULL DEFAULT 'completed',
    comments JSONB NOT NULL DEFAULT '[]'::jsonb,
    share_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviewer3_sessions_user_created
    ON reviewer3_sessions(user_id, created_at DESC);

ALTER TABLE reviewer3_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own reviewer3 sessions" ON reviewer3_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reviewer3 sessions" ON reviewer3_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviewer3 sessions" ON reviewer3_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviewer3 sessions" ON reviewer3_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Reuse the shared updated_at trigger function if it exists (created by the
-- feedback/chat migrations); create it otherwise.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_reviewer3_sessions_updated_at ON reviewer3_sessions;
CREATE TRIGGER update_reviewer3_sessions_updated_at
    BEFORE UPDATE ON reviewer3_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
