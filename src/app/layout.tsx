import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PS Moviz Hut',
  description: 'Your ultimate movie companion — Search, Watch & Download movies',
  icons: { icon: '/logo.png' },
  openGraph: {
    title: 'PS Moviz Hut',
    description: 'Your ultimate movie companion',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="noise">{children}</body>
    </html>
  )
}
