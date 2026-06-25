import axios from 'axios'

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

export function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

export async function fetchPage(url: string, referer?: string) {
  const { data } = await axios.get(url, {
    timeout: 20000,
    headers: {
      'User-Agent': getRandomUA(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,ta;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': referer || url,
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    },
  })
  return data
}

export function extractQuality(text: string): string {
  const t = text.toUpperCase()
  if (t.includes('4K') || t.includes('2160P')) return '4K'
  if (t.includes('1080P') || t.includes('1080')) return '1080p'
  if (t.includes('720P') || t.includes('720')) return '720p'
  if (t.includes('480P') || t.includes('480')) return '480p'
  if (t.includes('360P') || t.includes('360')) return '360p'
  if (t.includes('HQ')) return 'HQ'
  if (t.includes('HD')) return 'HD'
  if (t.includes('CAM')) return 'CAM'
  return 'SD'
}

export function extractYear(text: string): string {
  const match = text.match(/\b(19|20)\d{2}\b/)
  return match ? match[0] : ''
}

export function extractSize(text: string): string {
  const match = text.match(/(\d+(\.\d+)?\s*(MB|GB|gb|mb|Mb|Gb))/i)
  return match ? match[1] : ''
}

export function cleanTitle(title: string): string {
  return title
    .replace(/Download/gi, '')
    .replace(/Watch Online/gi, '')
    .replace(/Free/gi, '')
    .replace(/Full Movie/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function absoluteUrl(url: string, base: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('//')) return 'https:' + url
  if (url.startsWith('/')) {
    const u = new URL(base)
    return u.origin + url
  }
  return base.replace(/\/[^\/]*$/, '/') + url
}
