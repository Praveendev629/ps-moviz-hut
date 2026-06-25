"""
PS Moviz Hut - Backend API
Scrapes moviesda32.com for Tamil movies/series using concurrent, recursive traversal.
"""

from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import os
import time
import json
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__, static_folder='../public', static_url_path='')
CORS(app)

BASE_URL = "https://moviesda32.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Referer": "https://moviesda32.com/"
}

CATEGORIES = [
    "tamil-2026-movies", "tamil-2025-movies", "tamil-2024-movies",
    "tamil-2023-movies", "tamil-2022-movies", "tamil-2021-movies",
    "tamil-2020-movies", "tamil-2019-movies", "tamil-2018-movies",
    "tamil-2017-movies", "tamil-2016-movies", "tamil-2015-movies",
    "tamil-2012-movies", "tamil-web-series-download", "tamil-dubbed-movies"
]

# Load compiled movies database
MOVIES_CACHE = []
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'movies_db.json')

if os.path.exists(DB_PATH):
    try:
        with open(DB_PATH, 'r', encoding='utf-8') as f:
            MOVIES_CACHE = json.load(f)
        print(f"Successfully loaded {len(MOVIES_CACHE)} movies from movies_db.json")
    except Exception as e:
        print(f"Error loading movies_db.json: {e}")
else:
    print("Warning: movies_db.json not found! Run build_db.py first.")

def fetch_page_movies(category, page_num):
    """Scrape a listing page for movies."""
    if page_num == 1:
        url = f"{BASE_URL}/{category}/"
    else:
        url = f"{BASE_URL}/{category}/?page={page_num}"
        
    try:
        resp = requests.get(url, headers=HEADERS, timeout=6)
        if resp.status_code != 200:
            return []
            
        soup = BeautifulSoup(resp.text, 'html.parser')
        movies = []
        
        divs = soup.find_all('div', class_='f')
        for div in divs:
            a = div.find('a', href=True)
            if a:
                href = a['href']
                text = a.get_text(strip=True)
                
                # Check for movie or web series links
                if href.endswith('-movie/') or href.endswith('-web-series/') or href.endswith('-dubbed-movie/') or href.endswith('-original/'):
                    movies.append({
                        'title': text,
                        'link': urllib.parse.urljoin(BASE_URL, href),
                        'category': category
                    })
        return movies
    except Exception:
        return []

def fetch_soup_page(url):
    """Fetch and parse a webpage."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
        if resp.status_code == 200:
            return BeautifulSoup(resp.text, 'html.parser')
    except Exception as e:
        print(f"Error fetching detail page {url}: {e}")
    return None

def detect_quality(text, href):
    """Detect movie quality string from link text or URL path."""
    combined = (text + " " + href).lower()
    if '1080' in combined:
        return '1080p'
    elif '720' in combined:
        return '720p'
    elif '480' in combined:
        return '480p'
    elif '360' in combined:
        return '360p'
    elif '4k' in combined or '2160' in combined:
        return '4K UHD'
    return 'HD'

def crawl_movie_details(start_url):
    """Recursively crawl the subpages of a movie to find final streaming/download URLs."""
    visited = set()
    download_links = {}
    watch_links = []
    
    movie_details = {
        'title': '',
        'year': '',
        'poster': '',
        'description': '',
        'watch_links': [],
        'download_links': {}
    }
    
    # 1. Scrape metadata from first page
    soup = fetch_soup_page(start_url)
    if not soup:
        return None
        
    # Title
    title_tag = soup.find(['h1', 'h2'])
    if title_tag:
        movie_details['title'] = title_tag.get_text(strip=True)
    else:
        # Fallback to formatting url slug
        slug = start_url.rstrip('/').split('/')[-1]
        movie_details['title'] = slug.replace('-', ' ').title()
        
    # Year extraction
    year_match = re.search(r'\b(20\d{2})\b', movie_details['title'])
    if year_match:
        movie_details['year'] = year_match.group(1)
        
    # Poster image
    img_tags = soup.find_all('img')
    for img in img_tags:
        src = img.get('src', '')
        alt = img.get('alt', '')
        # Ignore screenshot images or icons
        if 'screenshot' not in alt.lower() and ('jpg' in src or 'png' in src or 'jpeg' in src or 'webp' in src):
            if not src.startswith('/assets/img/'):
                movie_details['poster'] = urllib.parse.urljoin(start_url, src)
                break
                
    # One line description
    desc_tag = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', property='og:description')
    if desc_tag:
        movie_details['description'] = desc_tag.get('content', '')
    else:
        p = soup.find('p')
        if p:
            movie_details['description'] = p.get_text(strip=True)[:300]
            
    # If no description was extracted, create a generic one
    if not movie_details['description'] or len(movie_details['description']) < 10:
        movie_details['description'] = f"Download or stream {movie_details['title']} online in high quality. Select from multiple servers and resolutions below."
        
    # 2. Define recursive traversal function
    def recurse(url, quality=None, depth=0):
        if url in visited or depth > 5:
            return
        visited.add(url)
        
        soup_page = fetch_soup_page(url)
        if not soup_page:
            return
            
        a_tags = soup_page.find_all('a', href=True)
        
        # Check for media content URLs
        for a in a_tags:
            href = a['href']
            text = a.get_text(strip=True)
            abs_href = urllib.parse.urljoin(url, href)
            
            # Direct MP4 video download detection
            if '.mp4' in abs_href.lower() or '.mp4' in text.lower():
                if 'cdnserver' in abs_href or 'download' in abs_href or abs_href.endswith('.mp4'):
                    q = quality or detect_quality(text, abs_href)
                    if q not in download_links:
                        download_links[q] = []
                    # Avoid duplicate link insertion
                    if not any(dl['url'] == abs_href for dl in download_links[q]):
                        download_links[q].append({
                            'label': text or f"Server {len(download_links[q])+1}",
                            'url': abs_href
                        })
                        
            # Streaming (Watch Online) detection
            if 'onestream' in abs_href or 'play' in abs_href or 'stream' in abs_href or 'embed' in abs_href:
                if not abs_href.endswith('.css') and not abs_href.endswith('.js') and abs_href != '#':
                    q = quality or detect_quality(text, abs_href)
                    label = f"Stream ({q})" if q else (text or f"Server {len(watch_links)+1}")
                    if not any(wl['url'] == abs_href for wl in watch_links):
                        watch_links.append({
                            'label': label,
                            'url': abs_href,
                            'quality': q
                        })
                        
        # Traverse down links matching movie structure
        for a in a_tags:
            href = a['href']
            text = a.get_text(strip=True)
            abs_href = urllib.parse.urljoin(url, href)
            
            # Ignore standard UI / site links
            if abs_href in visited or abs_href == '#' or abs_href == BASE_URL or abs_href == BASE_URL + '/':
                continue
            if any(social in abs_href.lower() for social in ['telegram', 'facebook', 'twitter', 'whatsapp']):
                continue
            if '/tamil-movies/' in abs_href or '/category/' in abs_href:
                continue
                
            is_subpage = False
            parsed = urllib.parse.urlparse(abs_href)
            domain = parsed.netloc
            path = parsed.path
            
            if 'moviesda32.com' in domain:
                if (path.endswith('-movie/') or 
                    path.endswith('-web-series/') or 
                    path.endswith('-hd/') or 
                    '/download/' in path or
                    path.endswith('-dubbed-movie/') or
                    path.endswith('-original/')):
                    is_subpage = True
            elif any(d in domain for d in ['moviespage.xyz', 'downloadpage.xyz', 'onestream.today']):
                is_subpage = True
                
            if is_subpage:
                next_q = quality or detect_quality(text, abs_href)
                recurse(abs_href, next_q, depth + 1)
                
    recurse(start_url)
    
    movie_details['download_links'] = download_links
    movie_details['watch_links'] = watch_links
    return movie_details

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/search', methods=['GET'])
def api_search():
    query = request.args.get('q', '').strip()
    category = request.args.get('cat', 'all').strip()
    
    if not query or len(query) < 2:
        return jsonify({'error': 'Please enter a movie name (at least 2 characters).'}), 400
        
    try:
        query_lower = query.lower()
        words = query_lower.split()
        
        # 1. Instant search on local cached database
        cached_results = []
        for m in MOVIES_CACHE:
            if category != 'all' and m['category'] != category:
                continue
            title = m['title'].lower()
            if query_lower in title or all(w in title for w in words):
                cached_results.append(m)
                
        # 2. Concurrently scrape first 2 pages of relevant categories for real-time additions
        categories_to_scan = [category] if category != 'all' else CATEGORIES
        scan_tasks = []
        for cat in categories_to_scan:
            scan_tasks.append((cat, 1))
            scan_tasks.append((cat, 2))
            
        live_results = []
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = {executor.submit(fetch_page_movies, cat, p): (cat, p) for cat, p in scan_tasks}
            for future in as_completed(futures):
                movies = future.result()
                for m in movies:
                    title = m['title'].lower()
                    if query_lower in title or all(w in title for w in words):
                        live_results.append(m)
                        
        # 3. Merge and deduplicate by movie link
        combined = []
        seen = set()
        for r in live_results + cached_results:
            link = r['link']
            if link not in seen:
                seen.add(link)
                combined.append(r)
                
        # Return merged list
        return jsonify({'results': combined, 'total': len(combined)})
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@app.route('/api/movie', methods=['GET'])
def api_movie():
    url = request.args.get('url', '').strip()
    if not url:
        return jsonify({'error': 'Movie URL is required.'}), 400
        
    # Security/domain verification
    allowed_domains = ['moviesda32.com', 'moviesda', 'isaimini']
    if not any(d in url for d in allowed_domains):
        return jsonify({'error': 'Invalid movie details URL.'}), 400
        
    try:
        details = crawl_movie_details(url)
        if not details:
            return jsonify({'error': 'Could not scrape movie details.'}), 500
        return jsonify(details)
    except Exception as e:
        return jsonify({'error': f'Failed to crawl details: {str(e)}'}), 500

@app.route('/api/proxy', methods=['GET'])
def api_proxy():
    """Proxy small requests (e.g. posters/styling) to bypass CORS blocks."""
    url = request.args.get('url', '').strip()
    if not url:
        return jsonify({'error': 'URL required'}), 400
        
    allowed_domains = ['moviesda32.com', 'moviesda', 'isaimini', 'cdnserver']
    if not any(d in url for d in allowed_domains):
        return jsonify({'error': 'Domain not allowed for proxy.'}), 403
        
    try:
        resp = requests.get(url, headers=HEADERS, stream=True, timeout=15)
        # Avoid proxying huge video files through serverless lambda
        content_length = int(resp.headers.get('Content-Length', 0))
        if content_length > 10 * 1024 * 1024:  # 10 MB limit
            return jsonify({'error': 'File too large to proxy. Stream direct link instead.'}), 400
            
        return Response(
            resp.iter_content(chunk_size=8192),
            content_type=resp.headers.get('Content-Type', 'application/octet-stream'),
            headers={'Content-Disposition': resp.headers.get('Content-Disposition', '')}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
