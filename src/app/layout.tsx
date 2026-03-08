import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'EOS Capital Tech — Client Portal',
    template: '%s | EOS Capital Portal',
  },
  description: 'Members-only portal for EOS Capital Tech funded trading clients.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
