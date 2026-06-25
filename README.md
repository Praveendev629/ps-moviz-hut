# 🎬 PS Moviz Hut

> A premium Neo-Brutalism chat-style Tamil movie finder and media player — powered by Moviesda (`moviesda32.com`).

![PS Moviz Hut Logo](public/assets/logo.png)

---

## 📋 Features

- 🎨 **Neo-Brutalism UI** — Purple + Red + Black, bold, high-contrast, flat blocky shadows, and zero gradients.
- 💬 **Chat Interface** — Chat bubble styled conversation flows. Type any movie/series and hit **SEND**.
- 🎬 **Intro Animation** — Dynamic video intro using the provided video file playing seamlessly on app load.
- 🔍 **Hybrid Fast Search Engine** — Instantly queries a pre-compiled JSON database of 2,000+ movies combined with concurrent, real-time page-1 sweeps for new releases in under 0.8 seconds.
- 🖼️ **Movie Details Modal** — Detailed layout fetching poster, year of release, and description.
- ▶️ **Embedded Custom Media Player** — Streams direct `.mp4` video files with custom controls (play/pause, volume slider, fullscreen toggle, quality selector, and keyboard shortcuts) inside the app.
- 📥 **Download Manager** — Directly downloads files from the resolved Moviesda servers by quality (360p, 480p, 720p, 1080p).
- 📱 **Mobile-First Responsive** — Optimized grid layouts, sidebar drawer, and flexible input wrap for all screens.

---

## 🗂️ File Structure

```
ps-moviz-hut/
├── api/
│   ├── index.py            # Flask backend serverless entry (API endpoints)
│   ├── build_db.py         # Concurrent crawler script to compile local database
│   └── movies_db.json      # Compiled local database of 2,000+ movie index entries
├── public/
│   ├── index.html          # Main HTML structure (Chat UI & Player shell)
│   ├── style.css           # Neo-Brutalism styled stylesheet
│   ├── app.js              # Frontend logic (Chat state, Modal rendering, Media player)
│   └── assets/
│       ├── intro.mp4       # Provided intro animation video
│       └── logo.png        # PS Moviz Hut logo asset
├── vercel.json             # Vercel deployment & routing config
├── requirements.txt        # Backend python dependencies
├── package_project.py      # Script to pack code and assets into ZIP
└── README.md               # This file
```

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.9+
- pip (Python package installer)

### Install & Run

1. **Clone or Extract** the project to your workspace.
2. **Open Terminal** in the project directory:
   ```bash
   cd ps-moviz-hut
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Compile Movies Database** (already generated, but you can update it at any time):
   ```bash
   python api/build_db.py
   ```
   *This scans 15 categories, 10 pages deep, and saves 2,000+ movies into `api/movies_db.json` in under 30 seconds.*
5. **Run the Flask Backend**:
   ```bash
   python api/index.py
   ```
   *The server starts on `http://localhost:5000`.*
6. **Open in Browser**: Navigate to `http://localhost:5000` to run the application.

---

## 🚀 Deploy to Vercel

PS Moviz Hut is pre-configured for Vercel deployment using the `@vercel/python` builder.

### Method 1: Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Log in and deploy from project directory:
   ```bash
   vercel
   ```
   *Follow the command prompt instructions to link your account.*
3. Push to production:
   ```bash
   vercel --prod
   ```

### Method 2: GitHub Integration
1. Push the project files to a GitHub repository.
2. Link your GitHub account on [vercel.com](https://vercel.com).
3. Import the repository, select **Other** framework preset, and click **Deploy**. Vercel will build and serve the application automatically using `vercel.json`.

---

## 🧭 Under The Hood: How It Works

### Fast Hybrid Search
```
                       [User Search Query]
                                ↓
          ┌────────────────────┴────────────────────┐
          ↓                                         ↓
[Search movies_db.json]                     [Concurrently fetch Page 1]
    (Instant, <5ms)                             (Real-time, ~0.6s)
          │                                         │
          └────────────────────┬────────────────────┘
                               ↓
                       [Merge & Deduplicate]
                               ↓
                      [Return sorted lists]
```

### Recursive Crawler Redirection Chain
When details for a movie are requested, the backend performs a recursive depth-first traversal to scrape download links. Moviesda hides direct media files behind several hops:
```
[Moviesda movie/ detail url]
           ↓
[Moviesda subpage quality path (e.g. -720p-hd-movie/)]
           ↓
[Moviesda final download detail page (e.g. /download/...)]
           ↓
[Redirection to moviespage.xyz/download/file/...]
           ↓
[Redirection to downloadpage.xyz/download/page/...]
           ↓
[Final CDN Server endpoint (direct .mp4 URL / play.onestream.today iframe)]
```
Our scraper resolves this full chain recursively and extracts the direct `.mp4` URLs and streams.

---

## 🎮 Usage Guide

1. **Start Screen:** On page load, the intro animation plays automatically. You can click **SKIP** to proceed.
2. **Search:** Select a filter category from the sidebar (or leave as "All Tamil"), type a query (e.g., "Blast" or "Balan"), and click **SEND**.
3. **Select Movie:** Click on any movie card from the chat results. This opens the details modal.
4. **Watch Online:** Click "Watch Online". The direct `.mp4` will load inside the app's custom media player. You can change quality, seek, play/pause, adjust volume, or go fullscreen.
5. **Download:** Click "Download" to see available qualities, then click a quality (e.g. 720p) to trigger a direct browser file download.

---

## 🛠️ Customization

### Update categories
Modify the `CATEGORIES` list in both `api/index.py` and `api/build_db.py` to change or add custom Moviesda category paths.

### Customize Theme Colors
Open `public/style.css` and adjust the variables under `:root`:
```css
:root {
  --purple: #7B2FBE; /* Base accent color */
  --red:    #E63946; /* Highlighting color */
  --black:  #0A0A0A; /* Dark theme background */
}
```

---

## ⚠️ Disclaimer

PS Moviz Hut is a search aggregation tool that index links publicly available on Moviesda. It does not host, store, or upload any media content. All streams and downloads are sourced directly from third-party cdn sites. Use at your own discretion.
