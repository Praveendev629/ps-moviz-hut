'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface IntroAnimationProps {
  onComplete: () => void
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'exit'>('logo')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 800)
    const t2 = setTimeout(() => setPhase('exit'), 2800)
    const t3 = setTimeout(() => onComplete(), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 2,
    color: i % 2 === 0 ? '#7B2FBE' : '#DC2626',
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 2,
  }))

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          className="intro-overlay scanlines"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: p.color,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}

          {/* Grid background */}
          <div className="absolute inset-0 grid-bg opacity-30" />

          {/* Purple glow orb */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, #7B2FBE 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative"
            >
              <div
                className="absolute inset-0 rounded-2xl blur-2xl opacity-60"
                style={{ background: 'linear-gradient(135deg, #7B2FBE, #DC2626)' }}
              />
              <motion.img
                src="/logo.png"
                alt="PS Moviz Hut"
                className="relative w-36 h-36 object-contain"
                style={{ filter: 'drop-shadow(0 0 30px rgba(123,47,190,0.9))' }}
                animate={{ filter: [
                  'drop-shadow(0 0 20px rgba(123,47,190,0.8))',
                  'drop-shadow(0 0 40px rgba(123,47,190,1)) drop-shadow(0 0 60px rgba(220,38,38,0.5))',
                  'drop-shadow(0 0 20px rgba(123,47,190,0.8))',
                ]}}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Ring animation */}
              <motion.div
                className="absolute inset-0 border-2 border-purple-500 rounded-2xl"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 border-2 border-red-500 rounded-2xl"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
              />
            </motion.div>

            {/* Text */}
            <AnimatePresence>
              {phase === 'text' && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="text-center"
                >
                  <motion.h1
                    className="text-5xl font-black tracking-tight gradient-text"
                    initial={{ letterSpacing: '0.5em', opacity: 0 }}
                    animate={{ letterSpacing: '-0.02em', opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    PS MOVIZ HUT
                  </motion.h1>
                  <motion.p
                    className="text-white/40 font-mono text-sm mt-2 tracking-widest uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    Your Ultimate Movie Companion
                  </motion.p>

                  {/* Loading bar */}
                  <motion.div
                    className="mt-6 mx-auto h-1 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.1)', width: 200 }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #7B2FBE, #DC2626)' }}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                    />
                  </motion.div>

                  <motion.p
                    className="mt-3 text-xs text-white/30 font-mono"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0, 1] }}
                    transition={{ duration: 1, delay: 0.5 }}
                  >
                    Loading...
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-purple-500/40" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-purple-500/40" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-red-500/40" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-red-500/40" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
