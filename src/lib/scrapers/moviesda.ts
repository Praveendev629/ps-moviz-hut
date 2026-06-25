import * as cheerio from 'cheerio'
import { fetchPage, extractQuality, extractYear, extractSize, cleanTitle, absoluteUrl } from './utils'
import type { MovieResult, MovieLinks } from '../types'

const BASE = 'https://moviesda32.com'

export async function searchMoviesDA(query: string): Promise<MovieResult[]> {
  const movies: MovieResult[] = []

  try {
    const searchUrls = [
      `${BASE}/?s=${encodeURIComponent(query)}`,
      `${BASE}/search/${encodeURIComponent(query.replace(/\s+/g, '+'))}`,
    ]

    let html = ''
    for (const url of searchUrls) {
      try {
        html = await fetchPage(url, BASE)
        if (html && html.length > 500) break
      } catch (_e) { continue }
    }

    if (!html) return movies

    const $ = cheerio.load(html)

    const resultSelectors = [
      'article.post', '.post-item', '.movie-card', 'article', '.post', '.entry',
    ]

    let results: cheerio.Cheerio<cheerio.AnyNode> | null = null
    for (const sel of resultSelectors) {
      const found = $(sel)
      if (found.length > 0) { results = found; break }
    }

    if (!results || results.length === 0) {
      $('a[href*="/20"]').each((_, el) => {
        const href = $(el).attr('href') || ''
        const title = $(el).find('img').attr('alt') || $(el).text().trim()
        const poster = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || ''
        if (title && href && !href.includes('category') && !href.includes('tag')) {
          movies.push({
            id: Math.random().toString(36).substring(2),
            title: cleanTitle(title),
            year: extractYear(href + title),
            poster: absoluteUrl(poster, BASE),
            movieUrl: absoluteUrl(href, BASE),
            provider: 'tamil',
          })
        }
      })
      return movies.slice(0, 9)
    }

    results.slice(0, 9).each((_, el) => {
      const titleEl = $(el).find('h2.entry-title a, h2 a, h3 a, .entry-title a, .title a').first()
      const title = titleEl.text().trim() || $(el).find('img').attr('alt') || ''
      const link = titleEl.attr('href') || $(el).find('a').first().attr('href') || ''
      let poster = $(el).find('img').attr('src') ||
        $(el).find('img').attr('data-src') ||
        $(el).find('img').attr('data-lazy-src') || ''
      if (poster.includes('data:image')) poster = ''
      if (!title || !link) return

      movies.push({
        id: Math.random().toString(36).substring(2),
        title: cleanTitle(title),
        year: extractYear(link + $(el).text()),
        poster: absoluteUrl(poster, BASE),
        movieUrl: absoluteUrl(link, BASE),
        provider: 'tamil',
        language: 'Tamil',
      })
    })
  } catch (e) {
    console.error('MoviesDa search error:', e)
  }

  return movies
}

export async function getMoviesDaLinks(movieUrl: string): Promise<MovieLinks> {
  const watchLinks: MovieLinks['watchLinks'] = []
  const downloadLinks: MovieLinks['downloadLinks'] = []
  let description = ''

  try {
    const html = await fetchPage(movieUrl, BASE)
    const $ = cheerio.load(html)

    description = $('.entry-content p').first().text().trim() ||
      $('meta[name="description"]').attr('content') || ''

    $('.entry-content a, .post-content a, article a').each((_, el) => {
      const href = $(el).attr('href') || ''
      const text = $(el).text().trim()
      const combinedText = text + ' ' + href

      if (!href || href === '#' || href === movieUrl) return

      const quality = extractQuality(combinedText)
      const size = extractSize(combinedText)

      const isDownload = href.includes('drive.google') || href.includes('mega.nz') ||
        href.includes('telegram') || href.includes('mediafire') ||
        href.includes('1fichier') || href.includes('uptobox') ||
        href.includes('dropbox') || text.toLowerCase().includes('download')

      const isWatch = href.includes('embed') || href.includes('iframe') ||
        href.includes('player') || href.includes('watch') ||
        text.toLowerCase().includes('watch') || text.toLowerCase().includes('online')

      if (isDownload) {
        downloadLinks.push({ quality, url: href, size })
      } else if (isWatch) {
        watchLinks.push({ quality, url: href, type: 'embed' })
      }
    })

    $('iframe').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || ''
      if (src && !src.includes('google.com/maps')) {
        watchLinks.push({ quality: 'HD', url: src, type: 'embed' })
      }
    })
  } catch (e) {
    console.error('MoviesDa links error:', e)
  }

  return { watchLinks, downloadLinks, description }
}
