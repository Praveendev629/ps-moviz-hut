import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const decodedUrl = decodeURIComponent(url)

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(decodedUrl).origin,
        'Origin': new URL(decodedUrl).origin,
      },
    })

    const contentType = response.headers.get('content-type') || 'video/mp4'

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
