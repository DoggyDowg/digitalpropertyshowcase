import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Remove any default favicon links here */}
        {/* The actual favicon will be set by the metadata API in the property page */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 