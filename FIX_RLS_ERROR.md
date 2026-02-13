# Fix RLS Policy Error - Quick Guide

## Error: `new row violates row-level security policy for table "prompts"`

This happens when the RLS policies aren't configured correctly. Follow these steps:

---

## Option 1: Run This SQL (Recommended)

Go to Supabase SQL Editor and run this:

```sql
-- First, drop any existing policies
DROP POLICY IF EXISTS "Allow public read access to active prompts" ON prompts;
DROP POLICY IF EXISTS "Allow public insert" ON prompts;
DROP POLICY IF EXISTS "Allow authenticated update" ON prompts;
DROP POLICY IF EXISTS "Enable insert for all users" ON prompts;
DROP POLICY IF EXISTS "Enable read for active prompts" ON prompts;

-- Now create fresh policies with unique names
-- Policy 1: Allow everyone to read active prompts
CREATE POLICY "public_read_active_prompts" 
ON prompts 
FOR SELECT 
USING (is_active = true);

-- Policy 2: Allow ANYONE (including anonymous) to insert
CREATE POLICY "public_insert_prompts" 
ON prompts 
FOR INSERT 
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update
CREATE POLICY "authenticated_update_prompts" 
ON prompts 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Verify RLS is enabled
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
```

---

## Option 2: Disable RLS Temporarily (Quick Test)

If you just want to test quickly:

```sql
ALTER TABLE prompts DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning:** This makes the table fully public! Only use for testing, then re-enable RLS.

---

## Option 3: Check Existing Policies

See what policies currently exist:

```sql
SELECT * FROM pg_policies WHERE tablename = 'prompts';
```

---

## Verify It Works

After running Option 1, verify the policies:

```sql
-- Check that policies exist
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'prompts';
```

You should see 3 policies:
1. `public_read_active_prompts` (SELECT)
2. `public_insert_prompts` (INSERT)  
3. `authenticated_update_prompts` (UPDATE)

---

## Test the Submit Form

1. Go to http://localhost:8001/submit.html
2. Fill in some fields
3. Click Submit
4. Should work now! ✅

---

## If Still Not Working

Run this to allow ALL operations temporarily:

```sql
-- Nuclear option: Allow everything for testing
DROP POLICY IF EXISTS "Allow all operations" ON prompts;

CREATE POLICY "Allow all operations" 
ON prompts 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

Then once it works, replace with the proper policies from Option 1.

---

## Common Issues

### Issue: "permission denied for table prompts"
**Fix:** RLS is disabled. Run:
```sql
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
```

### Issue: Policies conflict
**Fix:** Drop all policies first, then recreate with unique names

### Issue: Still blocked after creating policies
**Fix:** Make sure the INSERT policy has `WITH CHECK (true)` not `USING (true)`

---

## Final Verification

After fixing, your policies should look like this in Supabase:

| Policy Name | Command | Definition |
|------------|---------|------------|
| public_read_active_prompts | SELECT | is_active = true |
| public_insert_prompts | INSERT | true |
| authenticated_update_prompts | UPDATE | auth.role() = 'authenticated' |
