import * as cheerio from 'cheerio'
import { fetchPage, cleanTitle, extractYear, extractQuality, extractSize, absoluteUrl } from './utils'
import type { Movie } from '@/app/page'

const BASE = 'https://primeshows.uk'

export async function searchPrimeShows(query: string): Promise<Movie[]> {
  const movies: Movie[] = []

  const searchUrls = [
    `${BASE}/?s=${encodeURIComponent(query)}`,
    `${BASE}/search?q=${encodeURIComponent(query)}`,
    `${BASE}/search/${encodeURIComponent(query)}`,
  ]

  let html = ''
  for (const url of searchUrls) {
    try {
      html = await fetchPage(url, BASE)
      if (html && html.length > 500) break
    } catch (_e) { continue }
  }

  if (!html) return movies

  try {
    const $ = cheerio.load(html)

    const selectors = ['article.post', 'article', '.post', '.movie-item', '.film-card', '.item']
    for (const sel of selectors) {
      const found = $(sel)
      if (!found.length) continue
      found.slice(0, 9).each((_, el) => {
        const linkEl = $(el).find('h2 a, h3 a, .entry-title a, a').first()
        const title = linkEl.text().trim() || $(el).find('img').attr('alt') || ''
        const href = linkEl.attr('href') || ''
        let poster = $(el).find('img').attr('src') ||
          $(el).find('img').attr('data-src') ||
          $(el).find('img').attr('data-lazy-src') || ''
        if (poster.includes('data:image')) poster = ''
        if (!title || !href) return
        movies.push({
          id: Math.random().toString(36).substring(2),
          title: cleanTitle(title),
          year: extractYear(href + $(el).text()),
          poster: absoluteUrl(poster, BASE),
          movieUrl: absoluteUrl(href, BASE),
          provider: 'global',
        })
      })
      if (movies.length > 0) break
    }
  } catch (e) {
    console.error('PrimeShows search error:', e)
  }

  return movies
}

export async function getPrimeShowsLinks(movieUrl: string) {
  const watchLinks: { quality: string; url: string; type: 'embed' | 'direct' }[] = []
  const downloadLinks: { quality: string; url: string; size?: string }[] = []
  let description = ''

  try {
    const html = await fetchPage(movieUrl, BASE)
    const $ = cheerio.load(html)

    description = $('meta[name="description"]').attr('content') ||
      $('.entry-content p, .post-content p').first().text().trim() || ''

    $('iframe').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || ''
      if (src) watchLinks.push({ quality: 'HD', url: src, type: 'embed' })
    })

    $('.entry-content a, .post-content a, article a').each((_, el) => {
      const href = $(el).attr('href') || ''
      const text = $(el).text().trim()
      if (!href || href === '#') return
      const quality = extractQuality(text + ' ' + href)
      const size = extractSize(text)
      const isDownload = href.includes('drive.google') || href.includes('mega') ||
        href.includes('mediafire') || text.toLowerCase().includes('download')
      const isWatch = text.toLowerCase().includes('watch') || href.includes('embed')
      if (isDownload) downloadLinks.push({ quality, url: href, size })
      else if (isWatch) watchLinks.push({ quality, url: href, type: 'embed' })
    })
  } catch (e) {
    console.error('PrimeShows links error:', e)
  }

  return { watchLinks, downloadLinks, description }
}
