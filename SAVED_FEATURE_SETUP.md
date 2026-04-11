# Saved Prompts & Google OAuth Setup

## 1. Run SQL in Supabase

In **Supabase Dashboard → SQL Editor**, run the contents of `supabase-saved-prompts-setup.sql` to create the `saved_prompts` table and RLS policies.

## 2. Enable Google OAuth in Supabase

1. Go to **Supabase Dashboard → Authentication → Providers**.
2. Enable **Google**.
3. In **Google Cloud Console**:
   - Create a project (or use existing).
   - Go to **APIs & Services → Credentials**.
   - Create **OAuth 2.0 Client ID** (Web application).
   - Add **Authorized redirect URI**:  
     `https://cptyulgugrykwgltriom.supabase.co/auth/v1/callback`  
     (Replace with your project’s Supabase URL: `https://<project-ref>.supabase.co/auth/v1/callback`.)
4. Copy **Client ID** and **Client Secret** into Supabase Google provider settings.
5. Save.

## 3. Site URL (for redirect after login)

In **Supabase → Authentication → URL Configuration**:

- **Site URL**: `https://reddyforai.com` (or your production URL).
- **Redirect URLs**: Add:
  - `https://reddyforai.com`
  - `https://reddyforai.com/**`
  - `https://reddyforai.com/saved.html` (so users land on Saved after signing in from that page)
  - `http://localhost:8080` and `http://localhost:8080/saved.html` for local testing.

After this, the Save button and Saved page will work with Google sign-in.
