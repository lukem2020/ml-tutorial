import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Drug Discovery AI - TRON Interface',
  description: 'AI-powered drug discovery and redesign platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

