# 🎬 PS Moviz Hut

A sleek, chat-style movie search application with **Neo Brutalism** UI — built for finding, watching, and downloading movies from Tamil and global sources.

---

## ✨ Features

- 💬 **Chat Interface** — Search movies conversationally
- 🎨 **Neo Brutalism Design** — Purple & red theme with bold borders
- 🌐 **Multiple Providers** — Tamil Movies, Tamil Dubbed, Global (CorsFlix + PrimeShows)
- 🎬 **Built-in Video Player** — Watch without leaving the app
- ⬇️ **Download Links** — Quality selection with direct download
- 🔄 **Auto Fallback** — CorsFlix → PrimeShows if no results
- 🎭 **Intro Animation** — Logo reveal on first load
- 📱 **Responsive** — Works on mobile, tablet, and desktop

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **npm** or **yarn**

### 2. Install Dependencies

```bash
cd ps-moviz-hut
npm install
```

### 3. Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local` (optional — app works without it):

```env
# Optional: TMDB API key for poster fallback
TMDB_API_KEY=your_key_here
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Deploy to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel will auto-detect Next.js.

### Option B: Vercel Dashboard

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Click **Deploy**

> ✅ No build configuration needed — Vercel auto-detects Next.js

---

## 🔧 Configuration

### Provider URLs

Edit the scraper files in `src/lib/scrapers/` to update site URLs if they change:

| File | Provider | Site |
|------|----------|------|
| `moviesda.ts` | Tamil Movies | moviesda32.com |
| `isaidub.ts` | Tamil Dubbed | isaidub.ceo |
| `corsflix.ts` | Global (Primary) | watch.corsflix.dpdns.org |
| `primeshows.ts` | Global (Fallback) | primeshows.uk |

### Vercel Timeout

API routes have a `maxDuration = 60` seconds (requires Vercel Pro for >10s on Hobby plan).

For Hobby plan, reduce scraping attempts or add TMDB API for faster results.

---

## 📁 Project Structure

```
ps-moviz-hut/
├── public/
│   └── logo.png                    # App logo
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main chat page
│   │   ├── globals.css             # Neo brutalism styles
│   │   └── api/
│   │       ├── search/route.ts     # Movie search API
│   │       ├── movie/route.ts      # Movie detail/links API
│   │       └── proxy/route.ts      # Video stream proxy
│   ├── components/
│   │   ├── IntroAnimation.tsx      # Logo intro animation
│   │   ├── MovieCard.tsx           # Movie result card
│   │   ├── VideoPlayer.tsx         # Built-in video player
│   │   └── DownloadPanel.tsx       # Download quality selector
│   └── lib/
│       └── scrapers/
│           ├── utils.ts            # Shared scraping utilities
│           ├── moviesda.ts         # MoviesDa scraper
│           ├── isaidub.ts          # IsaiDub scraper
│           ├── corsflix.ts         # CorsFlix scraper
│           └── primeshows.ts       # PrimeShows scraper
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── vercel.json
└── README.md
```

---

## 🎯 How to Use

1. **Select Provider** — Choose Tamil Movies, Tamil Dubbed, or Global (top right)
2. **Type Movie Name** — Enter any movie name in the chat input
3. **Press Enter or Send** — Results appear as movie cards
4. **Watch Online** — Click Watch → select quality → enjoy in built-in player
5. **Download** — Click Download → select quality → opens download link

---

## ⚠️ Notes

- **Scraping Limitations**: These sites may change their HTML structure. If search stops working, check the site's current HTML and update selectors in `src/lib/scrapers/`.
- **CORS**: The proxy API at `/api/proxy` handles cross-origin video streams.
- **Vercel Hobby**: The 10-second function timeout may cause timeouts on slow scrapes. Consider upgrading to Pro or adding a TMDB API key for faster metadata fetching.

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| No results found | Try different spelling or switch provider |
| Search timeout | Site may be down, try again later |
| Video won't play | Click "Open externally" to view on source site |
| Build fails | Run `npm install` then `npm run build` |

---

## 📄 License

This project is for educational purposes only.

---

*Built with ❤️ for PS Moviz Hut*
