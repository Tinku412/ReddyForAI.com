# .htaccess Configuration Guide

## What This File Does

The `.htaccess` file has been configured to create clean, SEO-friendly URLs for your entire website.

## URL Transformations

### Before & After Examples:

| **Old URL** | **New Clean URL** |
|-------------|------------------|
| `https://reddyforai.com/index.html` | `https://reddyforai.com/` |
| `https://reddyforai.com/about.html` | `https://reddyforai.com/about` |
| `https://reddyforai.com/ai-image-prompts.html` | `https://reddyforai.com/ai-image-prompts` |
| `https://reddyforai.com/submit.html` | `https://reddyforai.com/submit` |
| `https://reddyforai.com/prompt/index.html` | `https://reddyforai.com/prompt/` |
| `https://reddyforai.com/prompt/some-title` | `https://reddyforai.com/prompt/some-title` |

## Features Implemented

### 1. **Remove index.html**
- ✅ Automatically redirects `/index.html` to `/`
- ✅ Redirects `/any-folder/index.html` to `/any-folder/`
- ✅ 301 redirect (permanent, SEO-friendly)

### 2. **Remove .html Extensions**
- ✅ Automatically redirects `.html` files to extensionless URLs
- ✅ Example: `/about.html` → `/about`
- ✅ Internally serves the `.html` file without showing extension

### 3. **Clean Trailing Slashes**
- ✅ Removes trailing slashes from URLs (except directories)
- ✅ Example: `/about/` → `/about`

### 4. **Path-Based Routing for /prompt/**
- ✅ All `/prompt/*` URLs route to `/prompt/index.html`
- ✅ Enables client-side JavaScript routing
- ✅ Example: `/prompt/cyberpunk-neon` loads the detail page

### 5. **Security Headers**
- ✅ X-Frame-Options: Prevents clickjacking
- ✅ XSS Protection: Prevents cross-site scripting
- ✅ X-Content-Type-Options: Prevents MIME sniffing
- ✅ Referrer Policy: Controls referrer information

### 6. **Performance Optimization**
- ✅ GZIP Compression for HTML, CSS, JS
- ✅ Browser caching for images (1 year)
- ✅ Browser caching for CSS/JS (1 month)
- ✅ Browser caching for fonts (1 year)

### 7. **Security**
- ✅ Prevents directory browsing
- ✅ Protects sensitive files (.env, .htaccess, etc.)
- ✅ Blocks access to config files

## How It Works

### URL Rewriting Flow:

1. **User enters:** `https://reddyforai.com/about.html`
2. **.htaccess redirects (301):** → `https://reddyforai.com/about`
3. **Server internally serves:** `about.html`
4. **User sees clean URL:** `https://reddyforai.com/about`

### Path-Based Routing:

1. **User clicks image:** Navigates to `/prompt/cyberpunk-neon`
2. **.htaccess routes to:** `/prompt/index.html`
3. **JavaScript reads URL:** Extracts "cyberpunk-neon"
4. **Fetches data:** Matches slug to title, loads prompt

## Update Your Internal Links

You should update your HTML files to use clean URLs:

### ❌ Old Way:
```html
<a href="index.html">Home</a>
<a href="about.html">About</a>
<a href="ai-image-prompts.html">Explore</a>
```

### ✅ New Way (Recommended):
```html
<a href="/">Home</a>
<a href="/about">About</a>
<a href="/ai-image-prompts">Explore</a>
```

## Optional Configuration

### Enable HTTPS (If you have SSL):
Uncomment these lines in `.htaccess`:
```apache
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### Remove WWW from URLs:
Uncomment these lines:
```apache
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
```

## Testing Your URLs

After uploading the `.htaccess` file, test these URLs:

1. ✅ `https://yoursite.com/` (should work)
2. ✅ `https://yoursite.com/index.html` (should redirect to `/`)
3. ✅ `https://yoursite.com/about` (should work)
4. ✅ `https://yoursite.com/about.html` (should redirect to `/about`)
5. ✅ `https://yoursite.com/prompt/some-slug` (should load detail page)

## Troubleshooting

### "Internal Server Error" (500)
- Your server might not support `.htaccess`
- Check if `mod_rewrite` is enabled
- Contact your hosting provider

### "404 Not Found"
- Make sure the `.htaccess` file is in the **root directory**
- Check file permissions (should be 644)
- Verify `mod_rewrite` is enabled

### Redirects Not Working
- Clear your browser cache
- Try in incognito/private mode
- Check server error logs

### CSS/JS Not Loading
- Update paths to absolute (`/styles.css` instead of `styles.css`)
- Already done in `/prompt/index.html`

## File Location

The `.htaccess` file **must be** in your website's root directory:

```
ReddyForAI/
├── .htaccess          ← HERE (root directory)
├── index.html
├── about.html
├── styles.css
├── prompt/
│   └── index.html
└── ...
```

## Server Requirements

- Apache web server
- `mod_rewrite` module enabled
- `.htaccess` files allowed (`AllowOverride All`)

Most shared hosting (cPanel, Bluehost, HostGator, etc.) supports this by default.

## SEO Benefits

✅ **Clean URLs**: Professional-looking, easy to share  
✅ **Better Rankings**: Search engines prefer clean URLs  
✅ **User-Friendly**: Easier to remember and type  
✅ **Link Equity**: Consolidated ranking signals (no .html duplication)  
✅ **Faster Load**: GZIP compression and caching enabled  

## Need Help?

If you encounter issues, check:
1. Is the file named exactly `.htaccess` (with the dot)?
2. Is it in the root directory?
3. Are file permissions correct (644)?
4. Is `mod_rewrite` enabled on your server?

Your URLs are now clean, fast, and SEO-optimized! 🚀
