-- ============================================================
-- SAVED PROMPTS FEATURE - Run this in Supabase SQL Editor
-- ============================================================
-- 1. Create saved_prompts table (user_id, prompt_id, created_at)
-- 2. Enable RLS so users only see/modify their own saves
-- ============================================================

-- Table: saved_prompts
CREATE TABLE IF NOT EXISTS saved_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, prompt_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_prompt_id ON saved_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_created ON saved_prompts(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;

-- Policies: users can only read/insert/delete their own rows
DROP POLICY IF EXISTS "Users can read own saved prompts" ON saved_prompts;
CREATE POLICY "Users can read own saved prompts"
ON saved_prompts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved prompts" ON saved_prompts;
CREATE POLICY "Users can insert own saved prompts"
ON saved_prompts FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved prompts" ON saved_prompts;
CREATE POLICY "Users can delete own saved prompts"
ON saved_prompts FOR DELETE
USING (auth.uid() = user_id);
