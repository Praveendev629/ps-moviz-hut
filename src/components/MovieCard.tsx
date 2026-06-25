'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Download, Star, Calendar, Globe2, ImageOff } from 'lucide-react'
import type { Movie } from '@/app/page'

interface MovieCardProps {
  movie: Movie
  onWatch: (movie: Movie) => void
  onDownload: (movie: Movie) => void
}

export default function MovieCard({ movie, onWatch, onDownload }: MovieCardProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [hovering, setHovering] = useState(false)

  const hasDownload = movie.downloadLinks && movie.downloadLinks.length > 0

  return (
    <motion.div
      className="neo-card rounded-xl overflow-hidden flex flex-col"
      onHoverStart={() => setHovering(true)}
      onHoverEnd={() => setHovering(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-gray-900 overflow-hidden">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {imgError || !movie.poster ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/20">
            <ImageOff size={32} />
            <span className="text-xs font-mono">No Poster</span>
          </div>
        ) : (
          <img
            src={movie.poster}
            alt={movie.title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            } ${hovering ? 'scale-105' : 'scale-100'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 ${hovering ? 'opacity-100' : 'opacity-60'}`} />

        {/* Year badge */}
        {movie.year && (
          <div className="absolute top-2 left-2">
            <span className="quality-badge quality-720 flex items-center gap-1">
              <Calendar size={9} />
              {movie.year}
            </span>
          </div>
        )}

        {/* Rating */}
        {movie.rating && (
          <div className="absolute top-2 right-2">
            <span className="quality-badge quality-1080 flex items-center gap-1">
              <Star size={9} />
              {movie.rating}
            </span>
          </div>
        )}

        {/* Language */}
        {movie.language && (
          <div className="absolute bottom-2 left-2">
            <span className="quality-badge quality-480 flex items-center gap-1">
              <Globe2 size={9} />
              {movie.language}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <h3 className="font-bold text-sm text-white leading-tight line-clamp-2">
          {movie.title}
        </h3>

        {movie.genre && (
          <p className="text-xs text-white/40 font-mono line-clamp-1">{movie.genre}</p>
        )}

        {movie.description && (
          <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{movie.description}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={() => onWatch(movie)}
            className="neo-btn neo-btn-purple flex-1 py-2 px-2 text-xs rounded-lg flex items-center justify-center gap-1.5"
          >
            <Play size={12} />
            Watch
          </button>
          {hasDownload !== false && (
            <button
              onClick={() => onDownload(movie)}
              className="neo-btn neo-btn-red flex-1 py-2 px-2 text-xs rounded-lg flex items-center justify-center gap-1.5"
            >
              <Download size={12} />
              Download
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
