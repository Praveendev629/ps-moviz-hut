# 🎬 PS Moviz Hut

A Neo-Brutalism styled movie fetcher web application with chat-style UI.

## Features

- **Chat-style interface** — type a movie name and get results as messages
- **Multiple sources** — Tamil (Moviesda), Tamil Dubbed (Isaidub), Global (PrimeShows + Corsflix)
- **Embedded player** — watch movies inside the app with HLS + custom controls
- **Download manager** — pick quality (480p / 720p / 1080p) and download
- **Intro animation** — branded splash screen on load
- **Auto-fallback** — Global automatically switches between PrimeShows and Corsflix

---

## File Structure

```
ps-moviz-hut/
├── api/
│   └── index.py        # Flask backend — all scrapers + API routes
├── public/
│   ├── index.html      # Full frontend (HTML + CSS + JS, single file)
│   └── logo.png        # App logo
├── vercel.json         # Vercel deployment configuration
├── requirements.txt    # Python dependencies
└── README.md
```

---

## Local Development

### Requirements
- Python 3.9+
- pip

### Setup

```bash
# 1. Clone / unzip the project
cd ps-moviz-hut

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the Flask server
cd api
python index.py
```

The app runs at `http://localhost:5000`.

> The Flask app serves `../public/index.html` as the root (`/`) and all API routes under `/api/*`.

---

## Vercel Deployment

### Prerequisites
- A [Vercel](https://vercel.com) account
- [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`

### Steps

```bash
# 1. Login to Vercel
vercel login

# 2. From the project root
cd ps-moviz-hut
vercel

# 3. Follow prompts:
#    - Link to existing project? No
#    - Project name: ps-moviz-hut
#    - Override settings? No

# 4. Deploy to production
vercel --prod
```

Alternatively, push to GitHub and import the repo in the Vercel dashboard.

### Important Vercel Notes

- The `vercel.json` routes `/api/*` to the Flask serverless function
- Static files in `public/` are served directly by Vercel's CDN
- Python runtime uses `@vercel/python` — no extra config needed
- Serverless function timeout: 10s (free tier). Heavy scraping may hit this limit.

---

## API Reference

| Endpoint | Params | Description |
|----------|--------|-------------|
| `GET /api/search` | `q`, `source` | Search movies (`source`: tamil / dubbed / global) |
| `GET /api/links` | `url`, `source` | Fetch watch + download links for a movie page |
| `GET /api/proxy` | `url` | Proxy a video stream (avoids CORS) |
| `GET /api/health` | — | Health check |

---

## Usage Guide

1. **Open the app** → watch the intro animation
2. **Choose a source** using the header buttons:
   - **Tamil** → Tamil movies from Moviesda
   - **Dubbed** → Tamil dubbed movies from Isaidub
   - **Global** → International movies from PrimeShows (Corsflix fallback)
3. **Type a movie name** in the input bar and press Enter or click Send
4. **Browse results** — each card shows title, year, source
5. **Watch** → opens embedded player with play/pause, volume, fullscreen, quality selection
6. **Download** → pick a quality (480p / 720p / 1080p) and download directly

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Icons | Font Awesome 6 |
| Video | HLS.js (adaptive streaming) + native HTML5 video |
| Backend | Python (Flask) |
| Scraping | requests + BeautifulSoup4 |
| Hosting | Vercel (Python serverless + static CDN) |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No results found | Try a different source or check spelling |
| Video won't play | The link may require CORS proxy — the app auto-retries |
| Deployment error | Ensure `requirements.txt` is present and has no extras |
| Timeout on Vercel | Source site may be slow — try again or use a different source |
