-- API keys for the public Developer API (/api/v1/*).
--
-- Integrators authenticate by sending a bearer token. We never store the raw
-- key: only its SHA-256 hash (key_hash) plus a short, non-secret display
-- prefix (key_prefix, e.g. "msk_live_a1b2c3d4"). The raw key is shown to the
-- user exactly once, at creation time.
--
-- Verification happens server-side in the Next.js gateway using the Supabase
-- SERVICE ROLE key (bypasses RLS), because an incoming API request has no user
-- session. The RLS policies below only govern the in-app key manager, where the
-- signed-in user reads/creates/revokes their own keys via the cookie session.
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'API key',
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    -- Reserved for future per-endpoint gating; not enforced yet. Empty = all.
    scopes TEXT[] NOT NULL DEFAULT '{}',
    last_used_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_created
    ON api_keys(user_id, created_at DESC);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own api keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own api keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own api keys" ON api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api keys" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Reuse the shared updated_at trigger function if it exists (created by the
-- feedback/chat/reviewer3 migrations); create it otherwise.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
