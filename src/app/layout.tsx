import "./globals.css"
import Providers from '@/components/shared/Providers'
import { siteConfig } from '@/config/site'
import Script from 'next/script'

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
        <meta property="fb:app_id" content={siteConfig.facebookAppId} />
        
        {/* Use our custom favicon API route */}
        <link rel="icon" href="/api/favicon" />
        <link rel="shortcut icon" href="/api/favicon" />
        <link rel="apple-touch-icon" href="/api/favicon" />
        
        <script src="//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js" async></script>
      </head>
      <body>
        {children}
        <Providers />
        <Script
          id="facebook-jssdk"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId: '${siteConfig.facebookAppId}',
                  xfbml: true,
                  version: 'v18.0'
                });
              };
              (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
              }(document, 'script', 'facebook-jssdk'));
            `,
          }}
        />
      </body>
    </html>
  )
}
