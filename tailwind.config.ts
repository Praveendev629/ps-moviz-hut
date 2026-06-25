import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          DEFAULT: '#7B2FBE',
          dark: '#5A1F8E',
          light: '#9B4FDE',
        },
        red: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
          light: '#EF4444',
        },
        brutBg: '#0D0D0D',
        brutCard: '#1A1A1A',
        brutBorder: '#FFFFFF',
      },
      fontFamily: {
        brut: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        brut: '4px 4px 0px #FFFFFF',
        brutPurple: '4px 4px 0px #7B2FBE',
        brutRed: '4px 4px 0px #DC2626',
        brutLg: '6px 6px 0px #FFFFFF',
        brutPurpleLg: '6px 6px 0px #7B2FBE',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-purple': 'pulsePurple 2s ease-in-out infinite',
        'intro-logo': 'introLogo 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'intro-text': 'introText 0.8s ease-out 0.6s forwards',
        'intro-bg': 'introBg 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'chat-bubble': 'chatBubble 0.3s ease-out forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        pulsePurple: {
          '0%, 100%': { boxShadow: '0 0 10px #7B2FBE, 0 0 20px #7B2FBE' },
          '50%': { boxShadow: '0 0 20px #7B2FBE, 0 0 40px #7B2FBE, 0 0 60px #7B2FBE' },
        },
        introLogo: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '60%': { transform: 'scale(1.2) rotate(10deg)' },
          '80%': { transform: 'scale(0.95) rotate(-5deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        introText: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        introBg: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        chatBubble: {
          '0%': { transform: 'scale(0.8) translateY(10px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px #7B2FBE)' },
          '50%': { filter: 'drop-shadow(0 0 20px #7B2FBE) drop-shadow(0 0 40px #DC2626)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
