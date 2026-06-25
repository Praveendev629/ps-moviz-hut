import * as cheerio from 'cheerio'
import { fetchPage, cleanTitle, extractYear, absoluteUrl } from './utils'
import type { MovieResult, MovieLinks } from '../types'

const BASE = 'https://watch.corsflix.dpdns.org'

export async function searchCorsFlix(query: string): Promise<MovieResult[]> {
  const movies: MovieResult[] = []

  const searchUrls = [
    `${BASE}/search?q=${encodeURIComponent(query)}`,
    `${BASE}/?s=${encodeURIComponent(query)}`,
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

    if (html.trim().startsWith('{') || html.trim().startsWith('[')) {
      const data = JSON.parse(html) as Record<string, unknown>
      const items = (data.results || data.movies || data.data || (Array.isArray(data) ? data : [])) as Record<string, unknown>[]
      items.slice(0, 9).forEach((item) => {
        movies.push({
          id: String(item.id || Math.random()),
          title: String(item.title || item.name || ''),
          year: String(item.year || item.release_date || '').substring(0, 4),
          poster: String(item.poster || item.poster_path || item.image || ''),
          rating: item.vote_average ? String(Math.round(Number(item.vote_average) * 10) / 10) : undefined,
          movieUrl: `${BASE}/movie/${item.id || item.slug}`,
          provider: 'global',
        })
      })
      return movies
    }

    const selectors = ['.film-poster', '.movie-card', '.flw-item', 'article', '.item', '.movie']
    for (const sel of selectors) {
      const found = $(sel)
      if (found.length === 0) continue
      found.slice(0, 9).each((_, el) => {
        const link = $(el).find('a').first().attr('href') || ''
        const title = $(el).find('img').attr('alt') ||
          $(el).find('.film-name, .title, h3, h2').text().trim() || ''
        let poster = $(el).find('img').attr('data-src') ||
          $(el).find('img').attr('src') || ''
        if (poster.includes('data:image')) poster = ''
        if (!title) return
        movies.push({
          id: Math.random().toString(36).substring(2),
          title: cleanTitle(title),
          year: extractYear(link + title),
          poster: absoluteUrl(poster, BASE),
          movieUrl: absoluteUrl(link, BASE),
          provider: 'global',
        })
      })
      if (movies.length > 0) break
    }
  } catch (e) {
    console.error('CorsFlix search error:', e)
  }

  return movies
}

export async function getCorsFLixLinks(movieUrl: string): Promise<MovieLinks> {
  const watchLinks: MovieLinks['watchLinks'] = []
  const downloadLinks: MovieLinks['downloadLinks'] = []
  let description = ''

  try {
    const html = await fetchPage(movieUrl, BASE)
    const $ = cheerio.load(html)

    description = $('meta[name="description"]').attr('content') ||
      $('.description, .overview, .plot').first().text().trim() || ''

    $('iframe, [data-src]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || ''
      if (src && !src.includes('google.com/maps') && !src.includes('facebook')) {
        watchLinks.push({ quality: 'HD', url: src, type: 'embed' })
      }
    })

    $('source').each((_, el) => {
      const src = $(el).attr('src') || ''
      const label = $(el).attr('label') || $(el).attr('size') || 'HD'
      if (src) watchLinks.push({ quality: label, url: src, type: 'direct' })
    })

    $('a[href*=".mp4"], a[href*="m3u8"]').each((_, el) => {
      const href = $(el).attr('href') || ''
      const label = $(el).text().trim() || 'HD'
      watchLinks.push({ quality: label, url: href, type: 'direct' })
    })
  } catch (e) {
    console.error('CorsFlix links error:', e)
  }

  return { watchLinks, downloadLinks, description }
}
