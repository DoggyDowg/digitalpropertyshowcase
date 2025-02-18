import "./globals.css"
import { Metadata } from 'next'
import Providers from '@/components/shared/Providers'

export const metadata: Metadata = {
  title: {
    default: 'Digital Property Showcase',
    template: '%s | Digital Property Showcase'
  },
  description: 'Discover amazing properties with our digital showcase platform.',
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    siteName: 'Digital Property Showcase',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <script src="//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js" async></script>
      </head>
      <body>
        {children}
        <Providers />
      </body>
    </html>
  )
}
