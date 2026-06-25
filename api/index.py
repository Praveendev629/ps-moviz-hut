"""
PS Moviz Hut - Backend API
Flask-based movie scraper for Vercel deployment
"""

import os
import re
import json
import time
import requests
from urllib.parse import quote, urljoin, urlparse, parse_qs, urlencode
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify, Response

app = Flask(__name__)

# ─── CORS headers on every response ───────────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

# ─── Shared HTTP session ───────────────────────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0",
}

S = requests.Session()
S.headers.update(HEADERS)


def safe_get(url, referer=None, timeout=12):
    try:
        h = {}
        if referer:
            h["Referer"] = referer
        resp = S.get(url, headers=h, timeout=timeout, allow_redirects=True)
        return resp
    except Exception as exc:
        print(f"[GET ERR] {url} → {exc}")
        return None


def extract_year(text):
    m = re.search(r"\b(19|20)\d{2}\b", str(text))
    return m.group() if m else "N/A"


def extract_quality(text):
    for q in ["2160p", "4K", "1080p", "720p", "480p", "360p",
              "HDRip", "BluRay", "WEBRip", "DVDRip", "HDTV", "WEB-DL"]:
        if q.lower() in str(text).lower():
            return q
    t = re.sub(r'\s+', ' ', str(text)).strip()
    return t[:40] if t else "Unknown"


def clean_poster(url, base=""):
    if not url:
        return ""
    url = url.strip()
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return urljoin(base, url)
    return url


# ══════════════════════════════════════════════════════════════════════════════
#  MOVIESDA  (Tamil movies)
# ══════════════════════════════════════════════════════════════════════════════
MOVIESDA_BASE = "https://moviesda32.com"

def _parse_moviesda_cards(soup, source="moviesda"):
    results = []
    # WordPress article cards
    cards = (soup.select("article") or
             soup.select(".post") or
             soup.select("li.post"))
    for card in cards[:10]:
        a = (card.select_one("h2.entry-title a") or
             card.select_one("h3.entry-title a") or
             card.select_one(".entry-title a") or
             card.select_one("h2 a") or
             card.select_one("h3 a"))
        img = card.select_one("img")
        if not a:
            continue
        title = a.get_text(strip=True)
        href  = a.get("href", "")
        poster = ""
        if img:
            poster = clean_poster(
                img.get("data-lazy-src") or img.get("data-src") or img.get("src") or "",
                MOVIESDA_BASE
            )
        results.append({
            "title":  title,
            "url":    href,
            "poster": poster,
            "year":   extract_year(title + " " + card.get_text()[:300]),
            "source": source,
        })
    return results


def search_moviesda(query):
    # 1) Try search
    url = f"{MOVIESDA_BASE}/?s={quote(query)}"
    resp = safe_get(url, referer=MOVIESDA_BASE)
    if resp and resp.status_code == 200:
        soup = BeautifulSoup(resp.text, "lxml")
        results = _parse_moviesda_cards(soup, "moviesda")
        if results:
            return results

    # 2) Try /page/1/?s=query
    url2 = f"{MOVIESDA_BASE}/page/1/?s={quote(query)}"
    resp2 = safe_get(url2, referer=MOVIESDA_BASE)
    if resp2 and resp2.status_code == 200:
        soup2 = BeautifulSoup(resp2.text, "lxml")
        return _parse_moviesda_cards(soup2, "moviesda")
    return []


def get_moviesda_links(movie_url):
    watch_links, download_links = [], []
    resp = safe_get(movie_url, referer=MOVIESDA_BASE)
    if not resp:
        return {"watch": [], "download": []}

    soup = BeautifulSoup(resp.text, "lxml")

    # iframes → watch online
    for iframe in soup.find_all("iframe", src=True):
        src = iframe.get("src", "").strip()
        if src and src.startswith("http"):
            watch_links.append({"label": "Watch Online", "url": src, "type": "iframe"})

    # anchor tags
    for a in soup.find_all("a", href=True):
        href = a.get("href", "").strip()
        text = a.get_text(strip=True)
        if not href or href.startswith("javascript") or href == "#":
            continue
        tl = text.lower()
        hl = href.lower()

        if any(k in tl for k in ["watch online", "play online", "watch now", "stream"]):
            watch_links.append({"label": text or "Watch Online", "url": href, "type": "embed"})
        elif any(k in tl or k in hl for k in ["download", "480p", "720p", "1080p",
                                                "2160p", "hdrip", "bluray", "webrip", "dvdrip"]):
            q = extract_quality(text) if text else extract_quality(href)
            download_links.append({"quality": q, "url": href})

    # video / source tags
    for src_tag in soup.find_all("source", src=True):
        src = src_tag.get("src", "")
        if src:
            watch_links.append({"label": "Watch Online", "url": src, "type": "video"})

    # m3u8 in scripts
    for script in soup.find_all("script"):
        body = script.string or ""
        for m in re.finditer(r'https?://[^\s\'"<>]+\.m3u8[^\s\'"<>]*', body):
            watch_links.append({"label": "Watch HLS", "url": m.group(), "type": "hls"})
        for m in re.finditer(r'https?://[^\s\'"<>]+\.mp4[^\s\'"<>]*', body):
            watch_links.append({"label": "Watch MP4", "url": m.group(), "type": "video"})

    # deduplicate
    seen = set()
    w2, d2 = [], []
    for item in watch_links:
        if item["url"] not in seen:
            seen.add(item["url"])
            w2.append(item)
    for item in download_links:
        if item["url"] not in seen:
            seen.add(item["url"])
            d2.append(item)

    return {"watch": w2, "download": d2}


# ══════════════════════════════════════════════════════════════════════════════
#  ISAIDUB  (Tamil Dubbed)
# ══════════════════════════════════════════════════════════════════════════════
ISAIDUB_BASE = "https://isaidub.ceo"

def search_isaidub(query):
    url = f"{ISAIDUB_BASE}/?s={quote(query)}"
    resp = safe_get(url, referer=ISAIDUB_BASE)
    if not resp or resp.status_code != 200:
        return []
    soup = BeautifulSoup(resp.text, "lxml")

    results = []
    cards = (soup.select("article") or
             soup.select(".post") or
             soup.select("li.post"))
    for card in cards[:10]:
        a = (card.select_one(".entry-title a") or
             card.select_one("h2 a") or
             card.select_one("h3 a"))
        img = card.select_one("img")
        if not a:
            continue
        title = a.get_text(strip=True)
        href  = a.get("href", "")
        poster = ""
        if img:
            poster = clean_poster(
                img.get("data-lazy-src") or img.get("data-src") or img.get("src") or "",
                ISAIDUB_BASE
            )
        results.append({
            "title":  title,
            "url":    href,
            "poster": poster,
            "year":   extract_year(title + " " + card.get_text()[:300]),
            "source": "isaidub",
        })
    return results


def get_isaidub_links(movie_url):
    # Same WordPress structure as Moviesda
    watch_links, download_links = [], []
    resp = safe_get(movie_url, referer=ISAIDUB_BASE)
    if not resp:
        return {"watch": [], "download": []}

    soup = BeautifulSoup(resp.text, "lxml")

    for iframe in soup.find_all("iframe", src=True):
        src = iframe.get("src", "").strip()
        if src and src.startswith("http"):
            watch_links.append({"label": "Watch Online", "url": src, "type": "iframe"})

    for a in soup.find_all("a", href=True):
        href = a.get("href", "").strip()
        text = a.get_text(strip=True)
        if not href or href.startswith("javascript") or href == "#":
            continue
        tl = text.lower()
        hl = href.lower()
        if any(k in tl for k in ["watch online", "play online", "stream"]):
            watch_links.append({"label": text or "Watch Online", "url": href, "type": "embed"})
        elif any(k in tl or k in hl for k in ["download", "480p", "720p", "1080p", "hdrip"]):
            q = extract_quality(text) if text else extract_quality(href)
            download_links.append({"quality": q, "url": href})

    seen = set()
    w2, d2 = [], []
    for item in watch_links:
        if item["url"] not in seen:
            seen.add(item["url"])
            w2.append(item)
    for item in download_links:
        if item["url"] not in seen:
            seen.add(item["url"])
            d2.append(item)

    return {"watch": w2, "download": d2}


# ══════════════════════════════════════════════════════════════════════════════
#  PRIMESHOWS  (Global)
# ══════════════════════════════════════════════════════════════════════════════
PRIMESHOWS_BASE = "https://primeshows.uk"

def search_primeshows(query):
    results = []

    # Try multiple search endpoints
    for search_url in [
        f"{PRIMESHOWS_BASE}/?s={quote(query)}",
        f"{PRIMESHOWS_BASE}/search/{quote(query)}/",
        f"{PRIMESHOWS_BASE}/?search={quote(query)}",
    ]:
        resp = safe_get(search_url, referer=PRIMESHOWS_BASE)
        if not resp or resp.status_code != 200:
            continue

        soup = BeautifulSoup(resp.text, "lxml")

        cards = (soup.select("article") or
                 soup.select(".post") or
                 soup.select(".item") or
                 soup.select(".movie-item") or
                 soup.select(".film-poster"))

        for card in cards[:10]:
            a = (card.select_one(".entry-title a") or
                 card.select_one("h2 a") or
                 card.select_one("h3 a") or
                 card.select_one("a"))
            img = card.select_one("img")
            if not a:
                continue
            title = a.get_text(strip=True)
            href  = a.get("href", "")
            poster = ""
            if img:
                poster = clean_poster(
                    img.get("data-lazy-src") or img.get("data-src") or img.get("src") or "",
                    PRIMESHOWS_BASE
                )
            results.append({
                "title":  title,
                "url":    href,
                "poster": poster,
                "year":   extract_year(title + " " + card.get_text()[:300]),
                "source": "primeshows",
            })

        if results:
            return results

    return results


def get_primeshows_links(movie_url):
    watch_links, download_links = [], []
    resp = safe_get(movie_url, referer=PRIMESHOWS_BASE)
    if not resp:
        return {"watch": [], "download": []}

    soup = BeautifulSoup(resp.text, "lxml")

    for iframe in soup.find_all("iframe", src=True):
        src = iframe.get("src", "").strip()
        if src and src.startswith("http"):
            watch_links.append({"label": "Watch Online", "url": src, "type": "iframe"})

    for a in soup.find_all("a", href=True):
        href = a.get("href", "").strip()
        text = a.get_text(strip=True)
        if not href or href.startswith("javascript") or href == "#":
            continue
        tl = text.lower()
        hl = href.lower()
        if any(k in tl for k in ["watch online", "stream", "play"]):
            watch_links.append({"label": text or "Watch Online", "url": href, "type": "embed"})
        elif any(k in tl or k in hl for k in ["download", "480p", "720p", "1080p"]):
            q = extract_quality(text) if text else extract_quality(href)
            download_links.append({"quality": q, "url": href})

    for script in soup.find_all("script"):
        body = script.string or ""
        for m in re.finditer(r'https?://[^\s\'"<>]+\.m3u8[^\s\'"<>]*', body):
            watch_links.append({"label": "Watch HLS", "url": m.group(), "type": "hls"})
        for m in re.finditer(r'https?://[^\s\'"<>]+\.mp4[^\s\'"<>]*', body):
            watch_links.append({"label": "Watch MP4", "url": m.group(), "type": "video"})

    seen = set()
    w2, d2 = [], []
    for item in watch_links:
        if item["url"] not in seen:
            seen.add(item["url"])
            w2.append(item)
    for item in download_links:
        if item["url"] not in seen:
            seen.add(item["url"])
            d2.append(item)

    return {"watch": w2, "download": d2}


# ══════════════════════════════════════════════════════════════════════════════
#  CORSFLIX  (Global – fallback)
# ══════════════════════════════════════════════════════════════════════════════
CORSFLIX_BASE = "https://watch.corsflix.dpdns.org"

def search_corsflix(query):
    results = []

    # Try JSON API first
    for api_url in [
        f"{CORSFLIX_BASE}/api/search?q={quote(query)}",
        f"{CORSFLIX_BASE}/search?q={quote(query)}",
        f"{CORSFLIX_BASE}/?s={quote(query)}",
    ]:
        resp = safe_get(api_url, referer=CORSFLIX_BASE)
        if not resp or resp.status_code != 200:
            continue

        # Try JSON
        try:
            data = resp.json()
            items = data if isinstance(data, list) else data.get("results", data.get("data", []))
            for item in items[:10]:
                if isinstance(item, dict):
                    title = item.get("title") or item.get("name") or item.get("original_title") or ""
                    poster = item.get("poster") or item.get("poster_path") or item.get("image") or ""
                    if poster and poster.startswith("/"):
                        poster = "https://image.tmdb.org/t/p/w342" + poster
                    movie_id = item.get("id") or ""
                    slug = item.get("slug") or ""
                    href = item.get("url") or (f"{CORSFLIX_BASE}/movie/{movie_id}" if movie_id else "")
                    year_raw = item.get("year") or item.get("release_date") or ""
                    year = str(year_raw)[:4] if year_raw else "N/A"
                    if title:
                        results.append({
                            "title":  title,
                            "url":    href,
                            "poster": poster,
                            "year":   year,
                            "source": "corsflix",
                        })
            if results:
                return results
        except Exception:
            pass

        # Try HTML
        soup = BeautifulSoup(resp.text, "lxml")
        selectors = [".movie-card", ".film-poster", ".item", "article", ".result-item"]
        for sel in selectors:
            cards = soup.select(sel)
            if cards:
                for card in cards[:10]:
                    a = card.select_one("a")
                    img = card.select_one("img")
                    title_el = card.select_one(".title, h2, h3, .name, a")
                    if not a:
                        continue
                    title = (title_el.get_text(strip=True) if title_el else a.get_text(strip=True))
                    href = a.get("href", "")
                    if href and not href.startswith("http"):
                        href = urljoin(CORSFLIX_BASE, href)
                    poster = ""
                    if img:
                        poster = clean_poster(
                            img.get("data-src") or img.get("src") or "",
                            CORSFLIX_BASE
                        )
                    if title:
                        results.append({
                            "title":  title,
                            "url":    href,
                            "poster": poster,
                            "year":   extract_year(title),
                            "source": "corsflix",
                        })
                if results:
                    return results

    return results


def get_corsflix_links(movie_url):
    watch_links = []
    resp = safe_get(movie_url, referer=CORSFLIX_BASE)
    if not resp:
        return {"watch": [], "download": []}

    soup = BeautifulSoup(resp.text, "lxml")

    for source_tag in soup.find_all("source", src=True):
        src = source_tag.get("src", "").strip()
        if src:
            t = "hls" if ".m3u8" in src else "video"
            watch_links.append({"label": "Watch Online", "url": src, "type": t})

    for iframe in soup.find_all("iframe", src=True):
        src = iframe.get("src", "").strip()
        if src and src.startswith("http"):
            watch_links.append({"label": "Watch Online", "url": src, "type": "iframe"})

    for script in soup.find_all("script"):
        body = script.string or ""
        for m in re.finditer(r'https?://[^\s\'"<>]+\.m3u8[^\s\'"<>]*', body):
            watch_links.append({"label": "Watch HLS", "url": m.group(), "type": "hls"})
        for m in re.finditer(r'https?://[^\s\'"<>]+\.mp4[^\s\'"<>]*', body):
            watch_links.append({"label": "Watch MP4", "url": m.group(), "type": "video"})

    seen = set()
    w2 = []
    for item in watch_links:
        if item["url"] not in seen:
            seen.add(item["url"])
            w2.append(item)

    return {"watch": w2, "download": []}


# ══════════════════════════════════════════════════════════════════════════════
#  FLASK ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/search")
def api_search():
    query = request.args.get("q", "").strip()
    source = request.args.get("source", "global").lower()

    if not query:
        return jsonify({"error": "Query is required", "results": []}), 400

    results = []
    fallback_used = None

    if source == "tamil":
        results = search_moviesda(query)

    elif source == "dubbed":
        results = search_isaidub(query)

    elif source == "global":
        results = search_primeshows(query)
        if not results:
            results = search_corsflix(query)
            fallback_used = "corsflix" if results else None
        else:
            # Also try corsflix if primeshows found nothing
            pass

    return jsonify({
        "results": results,
        "query": query,
        "source": source,
        "count": len(results),
        "fallback": fallback_used,
    })


@app.route("/api/links")
def api_links():
    url    = request.args.get("url", "").strip()
    source = request.args.get("source", "").lower()

    if not url:
        return jsonify({"error": "URL is required"}), 400

    if source == "moviesda" or "moviesda" in url:
        data = get_moviesda_links(url)
    elif source == "isaidub" or "isaidub" in url:
        data = get_isaidub_links(url)
    elif source == "primeshows" or "primeshows" in url:
        data = get_primeshows_links(url)
    elif source == "corsflix" or "corsflix" in url:
        data = get_corsflix_links(url)
    else:
        # auto-detect
        data = get_primeshows_links(url)
        if not data["watch"] and not data["download"]:
            data = get_corsflix_links(url)

    return jsonify(data)


@app.route("/api/proxy")
def api_proxy():
    """Proxy a video/HLS stream to avoid CORS blocks."""
    url = request.args.get("url", "").strip()
    if not url:
        return jsonify({"error": "URL required"}), 400

    # Only allow http/https
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return jsonify({"error": "Invalid URL scheme"}), 400

    try:
        proxy_headers = {**HEADERS, "Referer": url}
        # Forward Range header if present
        if "Range" in request.headers:
            proxy_headers["Range"] = request.headers["Range"]

        upstream = requests.get(
            url, headers=proxy_headers,
            stream=True, timeout=30, allow_redirects=True
        )

        content_type = upstream.headers.get("Content-Type", "application/octet-stream")

        def generate():
            for chunk in upstream.iter_content(chunk_size=8192):
                if chunk:
                    yield chunk

        resp = Response(generate(), status=upstream.status_code, content_type=content_type)
        resp.headers["Accept-Ranges"] = "bytes"
        resp.headers["Access-Control-Allow-Origin"] = "*"
        if "Content-Length" in upstream.headers:
            resp.headers["Content-Length"] = upstream.headers["Content-Length"]
        if "Content-Range" in upstream.headers:
            resp.headers["Content-Range"] = upstream.headers["Content-Range"]

        return resp

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "PS Moviz Hut"})


# Local dev
if __name__ == "__main__":
    app.run(debug=True, port=5000)
