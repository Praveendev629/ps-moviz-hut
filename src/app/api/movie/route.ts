import { NextRequest, NextResponse } from 'next/server'
import { getMoviesDaLinks } from '@/lib/scrapers/moviesda'
import { getIsaiDubLinks } from '@/lib/scrapers/isaidub'
import { getCorsFLixLinks } from '@/lib/scrapers/corsflix'
import { getPrimeShowsLinks } from '@/lib/scrapers/primeshows'

export const maxDuration = 60

interface WatchLink {
  quality: string
  url: string
  type: 'embed' | 'direct'
}

interface DownloadLink {
  quality: string
  url: string
  size?: string
}

interface MovieLinks {
  watchLinks: WatchLink[]
  downloadLinks: DownloadLink[]
  description: string
}

export async function POST(req: NextRequest) {
  try {
    const { movieUrl, provider } = await req.json()

    if (!movieUrl) {
      return NextResponse.json({ error: 'movieUrl is required' }, { status: 400 })
    }

    let result: MovieLinks = { watchLinks: [], downloadLinks: [], description: '' }

    if (provider === 'tamil') {
      result = await getMoviesDaLinks(movieUrl)
    } else if (provider === 'dubbed') {
      result = await getIsaiDubLinks(movieUrl)
    } else {
      result = await getCorsFLixLinks(movieUrl)
      if (!result.watchLinks?.length && !result.downloadLinks?.length) {
        const primeUrl = movieUrl.replace('watch.corsflix.dpdns.org', 'primeshows.uk')
        result = await getPrimeShowsLinks(primeUrl)
      }
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch movie links'
    console.error('Movie API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
