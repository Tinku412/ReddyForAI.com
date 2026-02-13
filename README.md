# PROMPTWERK

A minimal and aesthetic directory of AI prompts for generating images and videos, inspired by high-fashion websites like Balenciaga and MODELWERK.

## Features

- **Clean, Minimal Design**: Boxy layout inspired by fashion industry aesthetics
- **4-Column Grid Gallery**: Responsive card-based layout
- **Filter System**: Filter prompts by AI platform (Gemini, ChatGPT, Midjourney, etc.)
- **Search Functionality**: Quick search through prompts
- **Newsletter Integration**: Email subscription for updates
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: Supabase
- **Storage**: Cloudflare R2 (for images and videos)

## Setup Instructions

### 1. Supabase Setup

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. Run the SQL commands from `config.js` to create the database schema
4. Copy your project URL and anon key
5. Update `config.js` with your credentials

### 2. Cloudflare R2 Setup

1. Sign up for [Cloudflare](https://cloudflare.com)
2. Navigate to R2 Object Storage
3. Create a new bucket for your images/videos
4. Generate API tokens (Access Key ID and Secret Access Key)
5. Update `config.js` with your credentials

### 3. Local Development

1. Clone or download this project
2. Update the configuration in `config.js`
3. Open `index.html` in a web browser or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

4. Open your browser to `http://localhost:8000`

### 4. Supabase Integration

To connect the frontend to Supabase, add the Supabase JS library:

```html
<!-- Add this to the <head> of index.html -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Then initialize Supabase in `script.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_ANON_KEY'
)
```

## Project Structure

```
promptwerk/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── script.js           # JavaScript functionality
├── config.js           # Configuration file
└── README.md          # This file
```

## Design Philosophy

The design is inspired by high-fashion websites with:
- **Minimal color palette**: Black, white, and grays
- **Clean typography**: Helvetica Neue with generous letter spacing
- **Boxy layouts**: Strong borders and defined sections
- **Uppercase text**: For that editorial feel
- **Generous whitespace**: To let content breathe
- **Hover effects**: Subtle interactions for better UX

## Customization

### Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary-bg: #ffffff;
    --secondary-bg: #000000;
    --primary-text: #000000;
    --secondary-text: #ffffff;
    --border-color: #000000;
}
```

### Grid Layout

Change the number of columns in `styles.css`:

```css
.gallery-grid {
    grid-template-columns: repeat(4, 1fr); /* Change 4 to your desired number */
}
```

## Future Enhancements

- [ ] User authentication
- [ ] Prompt submission form
- [ ] Detailed prompt view modal
- [ ] Like/favorite functionality
- [ ] Advanced filtering and sorting
- [ ] User profiles
- [ ] Prompt collections
- [ ] Video prompt support
- [ ] API integration with AI platforms

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Credits

Design inspired by MODELWERK and contemporary fashion websites.
