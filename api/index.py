"""
PS Moviz Hut - Backend API
Scrapes moviesda32.com for Tamil movies
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import os
import time
import urllib.parse

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

# Year categories available on moviesda32.com
YEAR_CATEGORIES = [
    "tamil-2026-movies", "tamil-2025-movies", "tamil-2024-movies",
    "tamil-2023-movies", "tamil-2022-movies", "tamil-2021-movies",
    "tamil-2020-movies", "tamil-2019-movies", "tamil-2018-movies",
    "tamil-2017-movies", "tamil-2016-movies", "tamil-2015-movies",
    "tamil-2012-movies", "latest-tamil-web-series", "tamil-dubbed-movies"
]

def fetch_page(url, timeout=15):
    """Fetch a page with error handling."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            return BeautifulSoup(resp.text, 'html.parser')
        return None
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def get_max_pages(category_url):
    """Get the number of pagination pages for a category."""
    soup = fetch_page(category_url)
    if not soup:
        return 1
    # Look for pagination
    pagination = soup.find('div', class_=re.compile(r'nav|pagination|page', re.I))
    if not pagination:
        pagination = soup.find('a', string=re.compile(r'Last|»|›'))
    
    max_page = 1
    # Try to find page links
    page_links = soup.find_all('a', href=re.compile(r'/page/\d+'))
    for link in page_links:
        m = re.search(r'/page/(\d+)', link.get('href', ''))
        if m:
            max_page = max(max_page, int(m.group(1)))
    return max_page

def extract_movies_from_page(soup):
    """Extract movie cards from a listing page."""
    movies = []
    if not soup:
        return movies
    
    # Common patterns for movie listing pages
    # Look for article/post items
    items = soup.find_all(['article', 'div'], class_=re.compile(r'post|movie|item|entry', re.I))
    
    if not items:
        # Try finding links with images
        items = soup.find_all('div', class_=re.compile(r'thumbnail|card|movie-thumb', re.I))
    
    for item in items:
        try:
            # Get title
            title_tag = item.find(['h2', 'h3', 'h1', 'a'], class_=re.compile(r'title|entry-title|post-title', re.I))
            if not title_tag:
                title_tag = item.find(['h2', 'h3'])
            if not title_tag:
                continue
            
            title = title_tag.get_text(strip=True)
            if not title or len(title) < 3:
                continue
            
            # Get link
            link = None
            a_tag = title_tag.find('a') or item.find('a')
            if a_tag:
                link = a_tag.get('href', '')
            
            # Get poster
            img_tag = item.find('img')
            poster = ''
            if img_tag:
                poster = img_tag.get('src') or img_tag.get('data-src') or img_tag.get('data-lazy-src', '')
            
            if title and link:
                movies.append({
                    'title': title,
                    'link': link,
                    'poster': poster
                })
        except Exception:
            continue
    
    return movies

def get_movie_details(movie_url):
    """Fetch full movie details from its detail page."""
    soup = fetch_page(movie_url)
    if not soup:
        return None
    
    details = {
        'title': '',
        'year': '',
        'poster': '',
        'description': '',
        'watch_links': [],
        'download_links': {}
    }
    
    # Title
    title_tag = soup.find(['h1', 'h2'], class_=re.compile(r'title|entry-title', re.I))
    if not title_tag:
        title_tag = soup.find('h1')
    if title_tag:
        details['title'] = title_tag.get_text(strip=True)
    
    # Poster
    # Try Open Graph image first
    og_img = soup.find('meta', property='og:image')
    if og_img:
        details['poster'] = og_img.get('content', '')
    else:
        img = soup.find('img', class_=re.compile(r'poster|thumb|feature', re.I))
        if not img:
            img = soup.find('img', src=re.compile(r'\.jpg|\.jpeg|\.png|\.webp', re.I))
        if img:
            details['poster'] = img.get('src') or img.get('data-src', '')
    
    # Year - extract from title or meta or page content
    year_match = re.search(r'\b(20\d{2})\b', details['title'])
    if not year_match:
        # Try page content
        text_content = soup.get_text()
        year_match = re.search(r'Year\s*[:\|]\s*(20\d{2})', text_content)
        if not year_match:
            year_match = re.search(r'\b(20\d{2})\b', text_content)
    if year_match:
        details['year'] = year_match.group(1)
    
    # Description / One Line
    desc_tag = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', property='og:description')
    if desc_tag:
        details['description'] = desc_tag.get('content', '')
    if not details['description']:
        # Try first paragraph
        p = soup.find('p')
        if p:
            details['description'] = p.get_text(strip=True)[:300]
    
    # Find all links on page
    all_links = soup.find_all('a', href=True)
    
    download_qualities = {}
    watch_links = []
    
    for link in all_links:
        href = link.get('href', '')
        text = link.get_text(strip=True).lower()
        
        # Skip navigation links
        if not href or href == '#' or 'moviesda32.com' in href and '/category/' in href:
            continue
        
        # Watch Online detection
        if any(kw in text for kw in ['watch online', 'watch now', 'stream', 'online', 'play']):
            if href.startswith('http'):
                watch_links.append({'label': link.get_text(strip=True), 'url': href})
        
        # Download link detection
        elif any(kw in text for kw in ['download', '480p', '720p', '1080p', '4k', 'hdrip', 'bluray', 'webrip']):
            quality = '720p'
            if '480p' in text or '480p' in href:
                quality = '480p'
            elif '1080p' in text or '1080p' in href:
                quality = '1080p'
            elif '4k' in text or '2160p' in href:
                quality = '4K'
            elif '720p' in text or '720p' in href:
                quality = '720p'
            
            if href.startswith('http'):
                if quality not in download_qualities:
                    download_qualities[quality] = []
                download_qualities[quality].append({'label': link.get_text(strip=True), 'url': href})
        
        # Check for iframe embed sources (streaming)
        elif any(ext in href for ext in ['.mp4', '.m3u8', 'embed', 'player', 'video']):
            watch_links.append({'label': link.get_text(strip=True) or 'Watch Online', 'url': href})
    
    # Also check iframes for embedded players
    iframes = soup.find_all('iframe', src=True)
    for iframe in iframes:
        src = iframe.get('src', '')
        if src and src.startswith('http'):
            watch_links.append({'label': 'Embedded Player', 'url': src})
    
    details['watch_links'] = watch_links
    details['download_links'] = download_qualities
    
    return details

def search_moviesda(query, max_years=3, max_pages_per_year=7):
    """
    Search for a movie across all category pages on moviesda32.com.
    Returns a list of matching movie results.
    """
    query_lower = query.lower().strip()
    results = []
    seen_urls = set()
    
    categories_to_search = YEAR_CATEGORIES
    
    for category in categories_to_search:
        category_url = f"{BASE_URL}/category/{category}/"
        
        # Get max pages (cap at max_pages_per_year for speed)
        max_pg = min(get_max_pages(category_url), max_pages_per_year)
        
        for page_num in range(1, max_pg + 1):
            if page_num == 1:
                page_url = category_url
            else:
                page_url = f"{category_url}page/{page_num}/"
            
            soup = fetch_page(page_url)
            movies = extract_movies_from_page(soup)
            
            for movie in movies:
                title = movie['title'].lower()
                # Fuzzy match: check if query words are in title
                query_words = query_lower.split()
                if any(word in title for word in query_words) or query_lower in title:
                    url = movie['link']
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        results.append(movie)
            
            # If we found good results, we can stop early
            if len(results) >= 10:
                return results
            
            time.sleep(0.3)  # Be polite
        
        if len(results) >= 5:
            break
    
    return results

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/search', methods=['GET'])
def api_search():
    query = request.args.get('q', '').strip()
    if not query or len(query) < 2:
        return jsonify({'error': 'Please enter a movie name (at least 2 characters).'}), 400
    
    try:
        results = search_moviesda(query)
        if not results:
            return jsonify({'results': [], 'message': f'No movies found for "{query}" on Moviesda.'})
        return jsonify({'results': results, 'total': len(results)})
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@app.route('/api/movie', methods=['GET'])
def api_movie():
    url = request.args.get('url', '').strip()
    if not url:
        return jsonify({'error': 'Movie URL is required.'}), 400
    
    # Safety check - only allow moviesda32.com URLs
    if 'moviesda32.com' not in url and 'moviesda' not in url:
        return jsonify({'error': 'Invalid URL.'}), 400
    
    try:
        details = get_movie_details(url)
        if not details:
            return jsonify({'error': 'Could not fetch movie details.'}), 500
        return jsonify(details)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch details: {str(e)}'}), 500

@app.route('/api/proxy', methods=['GET'])
def api_proxy():
    """Proxy streaming content to avoid CORS issues."""
    url = request.args.get('url', '').strip()
    if not url:
        return jsonify({'error': 'URL required'}), 400
    
    # Only proxy from trusted domains
    allowed_domains = ['moviesda32.com', 'moviesda', 'isaimini']
    if not any(d in url for d in allowed_domains):
        return jsonify({'error': 'Domain not allowed for proxy.'}), 403
    
    try:
        resp = requests.get(url, headers=HEADERS, stream=True, timeout=30)
        from flask import Response
        return Response(
            resp.iter_content(chunk_size=8192),
            content_type=resp.headers.get('Content-Type', 'application/octet-stream'),
            headers={'Content-Disposition': resp.headers.get('Content-Disposition', '')}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
