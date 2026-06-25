import * as cheerio from 'cheerio'
import { fetchPage, extractQuality, extractYear, extractSize, cleanTitle, absoluteUrl } from './utils'
import type { Movie } from '@/app/page'

const BASE = 'https://isaidub.ceo'

export async function searchIsaiDub(query: string): Promise<Movie[]> {
  const movies: Movie[] = []

  try {
    const searchUrls = [
      `${BASE}/?s=${encodeURIComponent(query)}`,
      `${BASE}/search/${encodeURIComponent(query)}`,
    ]

    let html = ''
    for (const url of searchUrls) {
      try {
        html = await fetchPage(url, BASE)
        if (html) break
      } catch (_e) { continue }
    }

    if (!html) return movies

    const $ = cheerio.load(html)

    const articleSels = ['article.post', 'article', '.post', '.movie-item', '.entry']
    let items: cheerio.Cheerio<cheerio.Element> | null = null
    for (const sel of articleSels) {
      const found = $(sel)
      if (found.length) { items = found; break }
    }

    if (!items || items.length === 0) {
      $('a').each((_, el) => {
        const href = $(el).attr('href') || ''
        const img = $(el).find('img')
        const title = img.attr('alt') || $(el).text().trim()
        const poster = img.attr('src') || img.attr('data-src') || ''
        if (title && href && href.includes(BASE) && !href.includes('category')) {
          movies.push({
            id: Math.random().toString(36).substring(2),
            title: cleanTitle(title),
            year: extractYear(href + title),
            poster: absoluteUrl(poster, BASE),
            movieUrl: absoluteUrl(href, BASE),
            provider: 'dubbed',
            language: 'Tamil Dubbed',
          })
        }
      })
      return movies.slice(0, 9)
    }

    items.slice(0, 9).each((_, el) => {
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
        provider: 'dubbed',
        language: 'Tamil Dubbed',
      })
    })
  } catch (e) {
    console.error('IsaiDub search error:', e)
  }

  return movies
}

export async function getIsaiDubLinks(movieUrl: string) {
  const watchLinks: { quality: string; url: string; type: 'embed' | 'direct' }[] = []
  const downloadLinks: { quality: string; url: string; size?: string }[] = []
  let description = ''

  try {
    const html = await fetchPage(movieUrl, BASE)
    const $ = cheerio.load(html)

    description = $('.entry-content p, .post-content p').first().text().trim() ||
      $('meta[name="description"]').attr('content') || ''

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
      if (href.includes('drive.google') || href.includes('mega') || href.includes('mediafire') ||
          text.toLowerCase().includes('download')) {
        downloadLinks.push({ quality, url: href, size })
      } else if (text.toLowerCase().includes('watch') || href.includes('embed')) {
        watchLinks.push({ quality, url: href, type: 'embed' })
      }
    })
  } catch (e) {
    console.error('IsaiDub links error:', e)
  }

  return { watchLinks, downloadLinks, description }
}
