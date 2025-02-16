import Script from 'next/script'
import { headers } from 'next/headers'

interface LayoutProps {
  children: React.ReactNode
  params: { id: string }
}

export default async function PropertyLayout({
  children,
  params
}: LayoutProps) {
  const headersList = await headers()
  const isCustomDomain = headersList.get('x-custom-domain') === 'true'

  return (
    <>
      <Script id="custom-domain-detector" strategy="beforeInteractive">
        {`window.__CUSTOM_DOMAIN__ = ${isCustomDomain};`}
      </Script>
      {children}
    </>
  )
}