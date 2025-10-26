import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zazzau Properties',
  description: 'NMS Zazzau Property Management System',
  generator: 'nk',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
