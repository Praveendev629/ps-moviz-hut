'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Film, Globe, Languages, Tv, ChevronRight, Sparkles } from 'lucide-react'
import IntroAnimation from '@/components/IntroAnimation'
import MovieCard from '@/components/MovieCard'
import VideoPlayer from '@/components/VideoPlayer'
import DownloadPanel from '@/components/DownloadPanel'

type Provider = 'tamil' | 'dubbed' | 'global'

interface Movie {
  id: string
  title: string
  year: string
  poster: string
  rating?: string
  language?: string
  genre?: string
  description?: string
  movieUrl: string
  provider: Provider
  watchLinks?: { quality: string; url: string; type: 'embed' | 'direct' }[]
  downloadLinks?: { quality: string; url: string; size?: string }[]
}

export interface ChatMessage {
  id: string
  type: 'user' | 'system' | 'loading' | 'movies' | 'error' | 'info'
  content?: string
  movies?: Movie[]
  timestamp: Date
}

const PROVIDER_CONFIG: Record<Provider, { label: string; site: string; color: string; icon: string }> = {
  tamil: { label: 'Tamil Movies', site: 'MoviesDa', color: 'bg-red-600', icon: '🎬' },
  dubbed: { label: 'Tamil Dubbed', site: 'IsaiDub', color: 'bg-purple-600', icon: '🎭' },
  global: { label: 'Global', site: 'CorsFlix / PrimeShows', color: 'bg-emerald-600', icon: '🌍' },
}

export default function Home() {
  const [showIntro, setShowIntro] = useState(true)
  const [provider, setProvider] = useState<Provider>('global')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'info',
      content: 'Welcome to **PS Moviz Hut**! 🎬\n\nSearch for any movie by typing its name below. I\'ll fetch the poster, description, watch links, and download options for you.',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [playerMode, setPlayerMode] = useState<'watch' | 'download' | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(2)
    setMessages(prev => [...prev, { ...msg, id, timestamp: new Date() }])
    return id
  }

  const updateMessage = (id: string, update: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...update } : m))
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const query = input.trim()
    setInput('')
    setLoading(true)

    addMessage({ type: 'user', content: query })

    const loadId = addMessage({
      type: 'loading',
      content: `Searching for "${query}" on ${PROVIDER_CONFIG[provider].site}...`,
    })

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, provider }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Search failed')

      if (!data.movies || data.movies.length === 0) {
        updateMessage(loadId, {
          type: 'error',
          content: `No results found for "${query}" on ${PROVIDER_CONFIG[provider].site}. Try a different provider or check the spelling.`,
        })
      } else {
        updateMessage(loadId, {
          type: 'movies',
          content: `Found ${data.movies.length} result${data.movies.length !== 1 ? 's' : ''} for "${query}"`,
          movies: data.movies,
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      updateMessage(loadId, {
        type: 'error',
        content: `Failed to search: ${message}. The site may be temporarily unavailable.`,
      })
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleWatch = async (movie: Movie) => {
    setSelectedMovie(movie)
    setPlayerMode('watch')

    if (!movie.watchLinks?.length) {
      // Fetch links if not loaded
      try {
        const res = await fetch('/api/movie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieUrl: movie.movieUrl, provider: movie.provider }),
        })
        const data = await res.json()
        if (data.watchLinks || data.downloadLinks) {
          setSelectedMovie({ ...movie, watchLinks: data.watchLinks, downloadLinks: data.downloadLinks })
        }
      } catch (_e) {
        // Use existing data
      }
    }
  }

  const handleDownload = async (movie: Movie) => {
    setSelectedMovie(movie)
    setPlayerMode('download')

    if (!movie.downloadLinks?.length) {
      try {
        const res = await fetch('/api/movie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieUrl: movie.movieUrl, provider: movie.provider }),
        })
        const data = await res.json()
        if (data.watchLinks || data.downloadLinks) {
          setSelectedMovie({ ...movie, watchLinks: data.watchLinks, downloadLinks: data.downloadLinks })
        }
      } catch (_e) {
        // Use existing data
      }
    }
  }

  if (showIntro) {
    return <IntroAnimation onComplete={() => setShowIntro(false)} />
  }

  return (
    <div className="flex flex-col h-screen grid-bg">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b-2 border-purple-700/30 bg-black/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src="/logo.png" alt="PS Moviz Hut" className="h-10 w-10 object-contain glow-purple" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight gradient-text leading-none">PS MOVIZ HUT</h1>
            <p className="text-xs text-white/40 font-mono">Your Ultimate Movie Companion</p>
          </div>
        </div>

        {/* Provider Selector */}
        <div className="flex items-center gap-1.5">
          {(Object.entries(PROVIDER_CONFIG) as [Provider, typeof PROVIDER_CONFIG[Provider]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setProvider(key)}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all duration-200 flex items-center gap-1.5 ${
                provider === key ? 'provider-tab-active' : 'provider-tab'
              }`}
            >
              {key === 'tamil' && <Film size={12} />}
              {key === 'dubbed' && <Languages size={12} />}
              {key === 'global' && <Globe size={12} />}
              <span className="hidden sm:inline">{cfg.label}</span>
              <span className="sm:hidden">{key === 'tamil' ? 'TM' : key === 'dubbed' ? 'TD' : 'GL'}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Active Provider Banner */}
      <div className="flex-shrink-0 px-4 py-1.5 bg-purple-900/20 border-b border-purple-700/20 flex items-center gap-2 text-xs">
        <Sparkles size={12} className="text-purple-400" />
        <span className="text-white/50">Active:</span>
        <span className="text-purple-300 font-semibold">{PROVIDER_CONFIG[provider].label}</span>
        <span className="text-white/30">via</span>
        <span className="text-white/50 font-mono">{PROVIDER_CONFIG[provider].site}</span>
        <ChevronRight size={10} className="text-white/30 ml-auto" />
        <span className="text-white/30">Type a movie name to search</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 chat-scroll px-4 py-4 space-y-4 overflow-y-auto">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {msg.type === 'user' && (
                <div className="flex justify-end">
                  <div className="chat-user px-4 py-2.5 max-w-xs lg:max-w-md">
                    <p className="text-sm font-medium">{msg.content}</p>
                    <p className="text-xs text-purple-200/50 mt-1 text-right font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}

              {(msg.type === 'info' || msg.type === 'error') && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-purple-700/40">
                      <img src="/logo.png" alt="Bot" className="w-full h-full object-contain bg-black" />
                    </div>
                    <div className={`chat-system px-4 py-2.5 ${msg.type === 'error' ? 'border-red-500/40' : ''}`}>
                      <p className="text-sm text-white/80 whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html: (msg.content || '')
                            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-purple-300">$1</strong>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {msg.type === 'loading' && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-purple-700/40">
                      <img src="/logo.png" alt="Bot" className="w-full h-full object-contain bg-black" />
                    </div>
                    <div className="chat-system px-4 py-3 flex items-center gap-3">
                      <div className="loading-dots flex gap-1.5">
                        <span /><span /><span />
                      </div>
                      <p className="text-sm text-white/60">{msg.content}</p>
                    </div>
                  </div>
                </div>
              )}

              {msg.type === 'movies' && msg.movies && (
                <div className="flex justify-start w-full">
                  <div className="flex gap-2.5 w-full max-w-4xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-purple-700/40">
                      <img src="/logo.png" alt="Bot" className="w-full h-full object-contain bg-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/40 mb-3 font-mono px-1">{msg.content}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {msg.movies.map((movie) => (
                          <MovieCard
                            key={movie.id}
                            movie={movie}
                            onWatch={handleWatch}
                            onDownload={handleDownload}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 py-3 border-t-2 border-purple-700/30 bg-black/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex gap-2.5 items-end">
          <div className="flex-1 relative">
            <Tv size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a movie name... (e.g. Pushpa 2, Interstellar)"
              className="neo-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
              disabled={loading}
              autoFocus
            />
          </div>
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="neo-btn neo-btn-purple px-4 py-3 rounded-xl flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
        <p className="text-center text-xs text-white/20 mt-2 font-mono">
          PS MOVIZ HUT • {PROVIDER_CONFIG[provider].site}
        </p>
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedMovie && playerMode === 'watch' && (
          <VideoPlayer
            movie={selectedMovie}
            onClose={() => { setSelectedMovie(null); setPlayerMode(null); }}
          />
        )}
        {selectedMovie && playerMode === 'download' && (
          <DownloadPanel
            movie={selectedMovie}
            onClose={() => { setSelectedMovie(null); setPlayerMode(null); }}
            onWatch={() => setPlayerMode('watch')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
