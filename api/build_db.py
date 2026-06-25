import requests
from bs4 import BeautifulSoup
import re
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.parse
import os

BASE_URL = "https://moviesda32.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": BASE_URL + "/"
}

CATEGORIES = [
    "tamil-2026-movies", "tamil-2025-movies", "tamil-2024-movies",
    "tamil-2023-movies", "tamil-2022-movies", "tamil-2021-movies",
    "tamil-2020-movies", "tamil-2019-movies", "tamil-2018-movies",
    "tamil-2017-movies", "tamil-2016-movies", "tamil-2015-movies",
    "tamil-2012-movies", "tamil-web-series-download", "tamil-dubbed-movies"
]

def fetch_page_movies(category, page_num):
    if page_num == 1:
        url = f"{BASE_URL}/{category}/"
    else:
        url = f"{BASE_URL}/{category}/?page={page_num}"
        
    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
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
                
                # Filter for valid movie or series links
                if href.endswith('-movie/') or href.endswith('-web-series/') or href.endswith('-dubbed-movie/') or href.endswith('-original/'):
                    movies.append({
                        'title': text,
                        'link': urllib.parse.urljoin(BASE_URL, href),
                        'category': category
                    })
        return movies
    except Exception as e:
        print(f"Error scanning {category} page {page_num}: {e}")
        return []

def build_database(max_pages=10):
    print("Starting database build...")
    start_time = time.time()
    
    tasks = []
    for cat in CATEGORIES:
        for p in range(1, max_pages + 1):
            tasks.append((cat, p))
            
    all_movies = []
    seen_links = set()
    
    # Run requests in parallel using thread pool
    with ThreadPoolExecutor(max_workers=30) as executor:
        futures = {executor.submit(fetch_page_movies, cat, p): (cat, p) for cat, p in tasks}
        
        for idx, future in enumerate(as_completed(futures)):
            movies = future.result()
            for movie in movies:
                link = movie['link']
                if link not in seen_links:
                    seen_links.add(link)
                    all_movies.append(movie)
            
            if (idx + 1) % 15 == 0 or (idx + 1) == len(tasks):
                print(f"Progress: Completed {idx + 1}/{len(tasks)} page scans...")
                
    # Sort movies by title
    all_movies.sort(key=lambda x: x['title'])
    
    # Save to JSON
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, 'movies_db.json')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_movies, f, indent=2, ensure_ascii=False)
        
    elapsed = time.time() - start_time
    print(f"Database build complete! Scanned {len(tasks)} pages in {elapsed:.2f} seconds.")
    print(f"Saved {len(all_movies)} unique movies to {output_path}")

if __name__ == '__main__':
    build_database()
