export interface WatchLink {
  quality: string
  url: string
  type: 'embed' | 'direct'
}

export interface DownloadLink {
  quality: string
  url: string
  size?: string
}

export interface MovieLinks {
  watchLinks: WatchLink[]
  downloadLinks: DownloadLink[]
  description: string
}

export interface MovieResult {
  id: string
  title: string
  year: string
  poster: string
  rating?: string
  language?: string
  genre?: string
  description?: string
  movieUrl: string
  provider: 'tamil' | 'dubbed' | 'global'
  watchLinks?: WatchLink[]
  downloadLinks?: DownloadLink[]
}
