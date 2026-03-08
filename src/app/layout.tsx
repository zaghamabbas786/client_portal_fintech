import type { Metadata } from 'next'
import NextTopLoader from 'nextjs-toploader'
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
      <body>
        <NextTopLoader
          color="#E53935"
          height={2}
          shadow="0 0 8px #E53935,0 0 4px #E53935"
          showSpinner={false}
          crawlSpeed={200}
          speed={400}
        />
        {children}
      </body>
    </html>
  )
}
