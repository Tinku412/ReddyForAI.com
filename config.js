// Supabase Configuration
// Replace these values with your actual Supabase project credentials
// You can find these in your Supabase project settings

const SUPABASE_CONFIG = {
    url: 'https://cptyulgugrykwgltriom.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdHl1bGd1Z3J5a3dnbHRyaW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzgwMjIsImV4cCI6MjA4Mzg1NDAyMn0.PywFZSO1508wLPG2ix7aAQGqXROHIF9VkTkgXaPgupg',
    // Public Storage bucket for prompt images (create in Supabase Dashboard → Storage)
    storageBucket: 'prompt-images'
};

// For backwards compatibility
const supabaseConfig = SUPABASE_CONFIG;

// Note: Variables are available globally for regular <script> tags
// For ES6 modules, they need to be accessed directly or we use a workaround


// Database Schema for Supabase
// Create a table named 'prompts' with the following structure:
/*
-- First, create the table
CREATE TABLE prompts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(100),
    prompt TEXT,
    model_name TEXT,
    creator TEXT,
    image_url TEXT,
    tags TEXT[],
    notes TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_prompts_model_name ON prompts(model_name);
CREATE INDEX idx_prompts_is_active ON prompts(is_active);
CREATE INDEX idx_prompts_created_at ON prompts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to active prompts" ON prompts;
DROP POLICY IF EXISTS "Allow public insert" ON prompts;
DROP POLICY IF EXISTS "Allow authenticated update" ON prompts;

-- Create policies with unique names
-- Policy 1: Allow everyone to read active prompts only
CREATE POLICY "public_read_active_prompts" 
ON prompts 
FOR SELECT 
USING (is_active = true);

-- Policy 2: Allow ANYONE (including unauthenticated) to insert
CREATE POLICY "public_insert_prompts" 
ON prompts 
FOR INSERT 
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update (for admin)
CREATE POLICY "authenticated_update_prompts" 
ON prompts 
FOR UPDATE 
USING (auth.role() = 'authenticated');
*/
