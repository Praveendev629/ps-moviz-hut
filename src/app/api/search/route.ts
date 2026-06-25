import { NextRequest, NextResponse } from 'next/server'
import { searchMoviesDA } from '@/lib/scrapers/moviesda'
import { searchIsaiDub } from '@/lib/scrapers/isaidub'
import { searchCorsFlix } from '@/lib/scrapers/corsflix'
import { searchPrimeShows } from '@/lib/scrapers/primeshows'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { query, provider } = await req.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const trimmedQuery = query.trim()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let movies: any[] = []

    if (provider === 'tamil') {
      movies = await searchMoviesDA(trimmedQuery)
    } else if (provider === 'dubbed') {
      movies = await searchIsaiDub(trimmedQuery)
    } else {
      movies = await searchCorsFlix(trimmedQuery)
      if (!movies || movies.length === 0) {
        console.log('CorsFlix returned no results, falling back to PrimeShows')
        movies = await searchPrimeShows(trimmedQuery)
        movies = movies.map((m) => ({ ...m, provider: 'global' }))
      }
    }

    return NextResponse.json({ movies: movies || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed'
    console.error('Search API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
