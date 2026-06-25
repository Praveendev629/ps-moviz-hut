'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, ExternalLink, ChevronDown, Loader
} from 'lucide-react'
import type { Movie } from '@/app/page'

interface VideoPlayerProps {
  movie: Movie
  onClose: () => void
}

export default function VideoPlayer({ movie, onClose }: VideoPlayerProps) {
  const [selectedLink, setSelectedLink] = useState<{quality: string; url: string; type: string} | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [loadingPlayer, setLoadingPlayer] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const watchLinks = movie.watchLinks || []

  useEffect(() => {
    if (watchLinks.length > 0 && !selectedLink) {
      // Auto-select best quality
      const priority = ['1080p', '720p', '480p', '360p']
      const best = priority.map(q => watchLinks.find(l => l.quality.includes(q))).find(Boolean)
      setSelectedLink(best || watchLinks[0])
    }
  }, [watchLinks, selectedLink])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000)
  }, [playing])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (playing) { videoRef.current.pause(); setPlaying(false) }
    else { videoRef.current.play(); setPlaying(true) }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = ratio * duration
  }

  const toggleFullscreen = async () => {
    if (!playerRef.current) return
    if (!fullscreen) {
      await playerRef.current.requestFullscreen?.()
      setFullscreen(true)
    } else {
      await document.exitFullscreen?.()
      setFullscreen(false)
    }
  }

  const isEmbed = selectedLink?.type === 'embed' ||
    selectedLink?.url?.includes('iframe') ||
    selectedLink?.url?.includes('embed') ||
    selectedLink?.url?.includes('drive.google') ||
    selectedLink?.url?.match(/\.(html|php)$/)

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="w-full max-w-5xl bg-black rounded-2xl border-2 border-purple-700/50 overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(123,47,190,0.3), 8px 8px 0px #7B2FBE' }}
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/60">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
            <div>
              <h2 className="text-sm font-bold text-white line-clamp-1">{movie.title}</h2>
              {movie.year && <p className="text-xs text-white/40 font-mono">{movie.year}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quality selector */}
            {watchLinks.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowQuality(!showQuality)}
                  className="neo-btn px-3 py-1.5 text-xs rounded-lg bg-purple-900/40 border-purple-700/60 flex items-center gap-1.5"
                >
                  <Settings size={12} />
                  {selectedLink?.quality || 'Quality'}
                  <ChevronDown size={12} />
                </button>
                <AnimatePresence>
                  {showQuality && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full right-0 mt-1 bg-gray-900 border-2 border-purple-700/50 rounded-xl overflow-hidden z-50 min-w-32"
                    >
                      {watchLinks.map((link) => (
                        <button
                          key={link.quality}
                          onClick={() => { setSelectedLink(link); setShowQuality(false); setLoadingPlayer(true) }}
                          className={`w-full px-4 py-2 text-xs text-left flex items-center gap-2 hover:bg-purple-900/30 transition-colors ${
                            selectedLink?.quality === link.quality ? 'text-purple-400 bg-purple-900/20' : 'text-white/70'
                          }`}
                        >
                          <span className={`quality-badge ${
                            link.quality.includes('1080') ? 'quality-1080' :
                            link.quality.includes('720') ? 'quality-720' :
                            link.quality.includes('4K') ? 'quality-4k' : 'quality-480'
                          }`}>{link.quality}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-red-600/20 rounded-lg transition-colors">
              <X size={18} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Player Area */}
        <div className="relative bg-black" style={{ minHeight: 400 }}>
          {!selectedLink ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              {watchLinks.length === 0 ? (
                <>
                  <div className="text-white/20">
                    <Play size={48} />
                  </div>
                  <p className="text-white/40 text-sm">No streaming links available for this movie.</p>
                  <p className="text-white/20 text-xs font-mono">Try the Download option instead.</p>
                </>
              ) : (
                <div className="loading-dots flex gap-2">
                  <span /><span /><span />
                </div>
              )}
            </div>
          ) : isEmbed ? (
            /* Embed player */
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              {loadingPlayer && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                  <Loader className="animate-spin text-purple-400" size={32} />
                </div>
              )}
              <iframe
                key={selectedLink.url}
                src={selectedLink.url}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen"
                frameBorder="0"
                onLoad={() => setLoadingPlayer(false)}
              />
            </div>
          ) : (
            /* Native video player */
            <div
              ref={playerRef}
              className="video-container w-full"
              onMouseMove={handleMouseMove}
              style={{ aspectRatio: '16/9' }}
            >
              {loadingPlayer && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                  <Loader className="animate-spin text-purple-400" size={32} />
                </div>
              )}
              <video
                ref={videoRef}
                key={selectedLink.url}
                src={selectedLink.url}
                className="w-full h-full object-contain"
                onClick={togglePlay}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime)
                    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100 || 0)
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration)
                  setLoadingPlayer(false)
                }}
                onWaiting={() => setLoadingPlayer(true)}
                onCanPlay={() => setLoadingPlayer(false)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
              {/* Controls overlay */}
              <AnimatePresence>
                {showControls && (
                  <motion.div
                    className="player-controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Progress bar */}
                    <div className="progress-bar-container" onClick={seek}>
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                    {/* Control buttons */}
                    <div className="flex items-center gap-3">
                      <button onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10 }} className="text-white/70 hover:text-white transition-colors">
                        <SkipBack size={18} />
                      </button>
                      <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-colors">
                        {playing ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <button onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10 }} className="text-white/70 hover:text-white transition-colors">
                        <SkipForward size={18} />
                      </button>
                      <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted }} className="text-white/70 hover:text-white transition-colors">
                        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                      <input
                        type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                        onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; if (v > 0) setMuted(false) }}
                        className="w-20 h-1 accent-purple-500"
                      />
                      <span className="text-xs text-white/50 font-mono ml-auto">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                      <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                        {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Open externally */}
        {selectedLink && (
          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-white/30 font-mono">
              Streaming via PS Moviz Hut • {selectedLink.quality}
            </p>
            <a
              href={selectedLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <ExternalLink size={12} />
              Open externally
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
