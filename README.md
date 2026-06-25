# 🎬 PS Moviz Hut

> A Neo-Brutalism chat-style Tamil movie finder — powered by Moviesda (moviesda32.com)

![PS Moviz Hut](public/assets/logo.png)

---

## 📋 Features

- 🎨 **Neo-Brutalism UI** — Purple + Red + Black, bold & high-contrast
- 💬 **Chat Interface** — Type a movie name, get results instantly
- 🎬 **Intro Animation** — Your custom intro video plays on load
- 🔍 **Full-Database Search** — Crawls all year categories (2012–2026) & pagination tabs
- 🖼️ **Movie Cards** — Poster, title, year for each result
- ▶️ **Embedded Player** — Watch online without leaving the app
- 📥 **Download Links** — 480p, 720p, 1080p quality selection
- 📱 **Responsive** — Works on mobile, tablet, and desktop

---

## 🗂️ File Structure

```
ps-moviz-hut/
├── api/
│   └── index.py          # Flask backend — scraper + API routes
├── public/
│   ├── index.html        # Main HTML shell (chat UI)
│   ├── style.css         # Neo-Brutalism stylesheet
│   ├── app.js            # Frontend logic (search, player, modal)
│   └── assets/
│       ├── intro.mp4     # Intro animation video
│       └── logo.png      # PS Moviz Hut logo
├── vercel.json           # Vercel deployment config
├── requirements.txt      # Python dependencies
└── README.md             # This file
```

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.9+
- pip
- Node.js (optional, for Vercel CLI)

### Install & Run

```bash
# 1. Clone / download the project
cd ps-moviz-hut

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Run the backend
cd api
python index.py
# → Running on http://localhost:5000

# 4. Open browser → http://localhost:5000
```

---

## 🚀 Deploy to Vercel

### Method 1: Vercel CLI (recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project root
cd ps-moviz-hut
vercel

# Follow prompts — select your team/account
# First deploy = preview URL
# Production deploy:
vercel --prod
```

### Method 2: GitHub + Vercel Dashboard

1. Push code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. **Framework Preset:** Other
5. **Root Directory:** `ps-moviz-hut` (or leave blank if it's the root)
6. Click **Deploy**

### Vercel Environment (auto-detected)
- Python runtime via `@vercel/python`
- Static files served from `public/`
- API routes handled by `api/index.py`

---

## 🧭 How It Works

### Scraping Flow

```
User types "Leo"
        ↓
Backend searches moviesda32.com/category/tamil-20XX-movies/
        ↓
Iterates page 1 → 2 → 3 ... (up to 7 pages per year)
        ↓
Extracts movie cards: title, poster, URL
        ↓
Fuzzy-matches query against titles
        ↓
Returns matching results to frontend
        ↓
User clicks a movie card → fetches detail page
        ↓
Extracts: poster, year, description, watch links, download links
        ↓
Displays in modal with embedded player or download buttons
```

### API Endpoints

| Endpoint | Method | Params | Description |
|----------|--------|--------|-------------|
| `/api/search` | GET | `q=<query>` | Search movies across all categories |
| `/api/movie` | GET | `url=<moviesda_url>` | Fetch full movie details |
| `/api/proxy` | GET | `url=<stream_url>` | Proxy streaming content (CORS bypass) |

---

## 🎮 Usage Guide

1. **Open** the app → intro animation plays (or click **SKIP**)
2. **Chat loads** with quick-search chips (Leo, Jailer, Vikram, Kanguva)
3. **Type** a movie name in the text box → hit **SEND** or press **Enter**
4. **Results appear** as movie cards with poster + year
5. **Click a card** → modal opens with:
   - Poster, title, year, description
   - **Watch Online** → opens embedded player inside PS Moviz Hut
   - **Download** → quality buttons (480p, 720p, 1080p)
6. **Player controls:** Play/Pause, Volume, Seek bar, Fullscreen, Quality selector
7. **Sidebar** → filter by year category (2026, 2025, 2024...) or Web Series

---

## 🛠️ Customization

### Add More Sources
Edit `YEAR_CATEGORIES` in `api/index.py` to add more category slugs from Moviesda.

### Change Theme Colors
Edit CSS variables in `public/style.css`:
```css
:root {
  --purple: #7B2FBE;
  --red:    #E63946;
  --black:  #0A0A0A;
}
```

### Swap Intro Video
Replace `public/assets/intro.mp4` with your new video file.

---

## ⚠️ Disclaimer

PS Moviz Hut is a **search/aggregation tool** that indexes publicly available information from Moviesda. It does not host any video content. All streaming and download links are sourced directly from third-party sites. Use responsibly and respect copyright laws in your region.

---

## 📄 License

MIT License — Free to use, modify, and distribute.
