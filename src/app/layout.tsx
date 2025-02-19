import "./globals.css"
import Providers from '@/components/shared/Providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID as string

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {fbAppId && (
          <meta property="fb:app_id" content={fbAppId} />
        )}
        <script src="//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js" async></script>
      </head>
      <body>
        {children}
        <Providers />
      </body>
    </html>
  )
}
