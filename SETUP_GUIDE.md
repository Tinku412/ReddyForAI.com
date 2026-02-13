# PROMPTWERK - Complete Setup Guide

## 🚀 Quick Start

Follow these steps to get PROMPTWERK up and running with Supabase and Cloudflare R2.

---

## 📋 Prerequisites

- Supabase account (free tier works)
- Cloudflare account with R2 enabled
- Basic knowledge of SQL

---

## 1️⃣ Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - Name: `promptwerk`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Click **"Create new project"** and wait for setup

### Step 2: Get Your Credentials

1. Go to **Project Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: Long JWT token

3. Update `config.js`:
```javascript
export const supabaseConfig = {
    url: 'YOUR_PROJECT_URL_HERE',
    anonKey: 'YOUR_ANON_KEY_HERE'
};
```

### Step 3: Create Database Table

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Paste and run this SQL:

```sql
-- Create prompts table
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

-- Policy: Allow everyone to read active prompts
CREATE POLICY "Allow public read access to active prompts" 
ON prompts FOR SELECT 
USING (is_active = true);

-- Policy: Allow anyone (including anonymous) to insert
CREATE POLICY "Allow public insert" 
ON prompts FOR INSERT 
WITH CHECK (true);

-- Policy: Allow authenticated users to update (for admin)
CREATE POLICY "Allow authenticated update" 
ON prompts FOR UPDATE 
USING (auth.role() = 'authenticated');
```

4. Click **"Run"**

### Step 4: Verify Table Creation

1. Go to **Table Editor** in Supabase
2. You should see the `prompts` table
3. Check the columns match the schema

---

## 2️⃣ Cloudflare R2 Setup

See `CLOUDFLARE_R2_SETUP.md` for detailed R2 setup instructions.

**Quick Summary:**
1. Create R2 bucket named `images`
2. Generate API token with Read & Write permissions
3. Save Access Key ID and Secret Access Key
4. Update config.js with credentials
5. Configure CORS policy

---

## 3️⃣ Frontend Setup

### Step 1: Add Supabase JS Library

The HTML files already include the Supabase CDN link:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Step 2: Test the Application

1. Start a local server:
```bash
python -m http.server 8001
```

2. Open browser to `http://localhost:8001`

3. Test submit form at `http://localhost:8001/submit.html`

---

## 4️⃣ Using the Application

### Submitting a Prompt

1. Navigate to Submit page
2. Fill in the form (all fields are optional):
   - **Prompt**: The actual AI prompt text
   - **Title**: Short descriptive title (max 100 chars)
   - **Model Name**: Select AI model (Gemini, ChatGPT, etc.)
   - **Creator**: Your name or handle
   - **Image**: Upload example image (max 5MB)
   - **Tags**: Comma-separated tags
   - **Notes**: Additional information

3. Click **"SUBMIT PROMPT"**
4. Prompt is saved with `is_active: false` by default

### Activating Prompts (Admin)

Prompts need to be manually activated to appear on the homepage:

**Method 1: Supabase Dashboard**
1. Go to Table Editor > prompts
2. Find the prompt you want to activate
3. Edit the row and set `is_active` to `true`
4. Save

**Method 2: SQL Editor**
```sql
-- Activate a specific prompt by ID
UPDATE prompts 
SET is_active = true 
WHERE id = 'prompt-uuid-here';

-- Activate all prompts from a specific creator
UPDATE prompts 
SET is_active = true 
WHERE creator = 'CreatorName';

-- View all inactive prompts
SELECT * FROM prompts WHERE is_active = false ORDER BY created_at DESC;
```

### Viewing Active Prompts

Only prompts with `is_active = true` will appear on the homepage gallery.

---

## 5️⃣ Customization

### Adding More AI Models

Edit `submit.html` and add options to the select dropdown:

```html
<select id="modelName" name="modelName">
    <option value="">Select a model</option>
    <option value="Gemini">Gemini</option>
    <option value="ChatGPT">ChatGPT</option>
    <!-- Add more here -->
    <option value="YourNewModel">Your New Model</option>
</select>
```

### Styling

All styles are in:
- `styles.css` - Main site styles
- `submit-styles.css` - Submit page specific styles

### Modifying Filter Options

Edit `index.html` filter bar section to add/remove filters.

---

## 6️⃣ Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Deploy (no build step needed for static site)
5. Add environment variables in Vercel dashboard if needed

### Option 2: Netlify

1. Push code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Connect your repository
4. Deploy

### Option 3: Cloudflare Pages

1. Push code to GitHub
2. Go to Cloudflare Pages
3. Connect repository
4. Build settings:
   - Build command: (none)
   - Build output directory: `/`
5. Deploy

### Important: Update CORS

After deployment, update your R2 bucket CORS policy with your production domain:

```json
{
  "AllowedOrigins": ["https://yourdomain.com"],
  "AllowedMethods": ["GET", "PUT", "POST"],
  "AllowedHeaders": ["*"]
}
```

---

## 🔒 Security Considerations

### Current Setup (Development)
- ✅ Public read access for active prompts only
- ✅ Public insert (anyone can submit, but prompts are inactive by default)
- ✅ Authenticated update only (for activating prompts)

### Production Recommendations

1. **Add Captcha** to submit form to prevent spam
2. **Rate Limiting** on submission endpoint
3. **Image Validation** - Check file types and sizes server-side
4. **Content Moderation** - Review all submissions before activating
5. **Admin Dashboard** - Build a proper admin interface for managing prompts

---

## 📊 Database Management

### View All Prompts
```sql
SELECT * FROM prompts ORDER BY created_at DESC;
```

### Count Active vs Inactive
```sql
SELECT 
    is_active, 
    COUNT(*) as count 
FROM prompts 
GROUP BY is_active;
```

### Find Prompts by Model
```sql
SELECT * FROM prompts 
WHERE model_name = 'Gemini' 
AND is_active = true;
```

### Delete Spam/Unwanted Prompts
```sql
DELETE FROM prompts WHERE id = 'uuid-here';
```

---

## 🐛 Troubleshooting

### "Supabase not initialized" error
- Check that Supabase CDN script is loaded
- Verify config.js has correct URL and key
- Open browser console for detailed errors

### Images not uploading
- Check R2 credentials in config.js
- Verify CORS policy is configured
- Check file size (max 5MB)
- See CLOUDFLARE_R2_SETUP.md

### Prompts not appearing
- Check `is_active` is set to `true` in database
- Verify RLS policies are correct
- Check browser console for errors

### CORS errors
- Update R2 CORS policy with your domain
- Check that origin matches exactly
- Verify allowed methods include required methods

---

## 📝 Notes

- All form fields in submit page are optional (no validation)
- Prompts default to `is_active: false` for moderation
- Image uploads require proper R2 setup (see separate guide)
- The filter bar functionality will be enhanced later

---

## 🚀 Next Steps

1. ✅ Set up Supabase
2. ✅ Set up Cloudflare R2
3. ✅ Test submission form
4. ✅ Activate some test prompts
5. 🔜 Build admin dashboard
6. 🔜 Add search functionality
7. 🔜 Implement proper filtering
8. 🔜 Add user authentication (optional)

---

Need help? Check the individual setup guides:
- `CLOUDFLARE_R2_SETUP.md` - Detailed R2 configuration
- `README.md` - Project overview
