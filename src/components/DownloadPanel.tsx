'use client'

import { motion } from 'framer-motion'
import { X, Download, Play, HardDrive, Loader, ExternalLink } from 'lucide-react'
import type { Movie } from '@/app/page'
import { useState } from 'react'

interface DownloadPanelProps {
  movie: Movie
  onClose: () => void
  onWatch: () => void
}

export default function DownloadPanel({ movie, onClose, onWatch }: DownloadPanelProps) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const downloadLinks = movie.downloadLinks || []
  const watchLinks = movie.watchLinks || []

  const getQualityClass = (quality: string) => {
    if (quality.includes('4K') || quality.includes('2160')) return 'quality-4k'
    if (quality.includes('1080')) return 'quality-1080'
    if (quality.includes('720')) return 'quality-720'
    return 'quality-480'
  }

  const handleDownload = (url: string, quality: string) => {
    setDownloading(quality)
    window.open(url, '_blank')
    setTimeout(() => setDownloading(null), 2000)
  }

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="w-full max-w-lg bg-gray-950 rounded-2xl border-2 border-red-700/40 overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(220,38,38,0.2), 8px 8px 0px #B91C1C' }}
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/60">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-red-400" />
            <div>
              <h2 className="text-sm font-bold text-white line-clamp-1">{movie.title}</h2>
              <p className="text-xs text-white/40">Choose quality to download</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-red-600/20 rounded-lg transition-colors">
            <X size={18} className="text-white/70" />
          </button>
        </div>

        {/* Movie info strip */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/50 border-b border-white/5">
          {movie.poster && (
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-12 h-16 object-cover rounded-lg border border-white/10"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white line-clamp-1">{movie.title}</p>
            {movie.year && <p className="text-xs text-white/40 font-mono mt-0.5">{movie.year}</p>}
            {movie.description && (
              <p className="text-xs text-white/30 line-clamp-2 mt-1">{movie.description}</p>
            )}
          </div>
        </div>

        {/* Download links */}
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {downloadLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <HardDrive size={32} className="text-white/20" />
              <p className="text-white/40 text-sm">No download links available</p>
              <p className="text-white/20 text-xs">Try watching online instead</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/30 font-mono uppercase tracking-wider mb-3">
                Available Qualities
              </p>
              {downloadLinks.map((link, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleDownload(link.url, link.quality)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-white/10 hover:border-red-500/50 bg-gray-900/50 hover:bg-red-900/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`quality-badge ${getQualityClass(link.quality)}`}>
                      {link.quality}
                    </span>
                    {link.size && (
                      <span className="text-xs text-white/30 font-mono">{link.size}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {downloading === link.quality ? (
                      <Loader size={14} className="animate-spin text-red-400" />
                    ) : (
                      <>
                        <ExternalLink size={12} className="text-white/20 group-hover:text-red-400 transition-colors" />
                        <Download size={14} className="text-white/40 group-hover:text-red-400 transition-colors" />
                      </>
                    )}
                  </div>
                </motion.button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/5 flex gap-2">
          {watchLinks.length > 0 && (
            <button
              onClick={onWatch}
              className="neo-btn neo-btn-purple flex-1 py-2 text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Play size={14} />
              Watch Online Instead
            </button>
          )}
          <button
            onClick={onClose}
            className="neo-btn flex-1 py-2 text-xs rounded-xl bg-gray-800 border-gray-600 flex items-center justify-center gap-2 text-white/60 hover:text-white"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
