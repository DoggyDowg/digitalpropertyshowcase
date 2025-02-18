import { Metadata } from "next";

const siteConfig = {
  name: "Digital Property Showcase",
  description: "Experience luxury living at its finest.",
  url: process.env.NEXT_PUBLIC_BASE_URL || "https://digipropshow.com",
};

// Only include essential site-wide defaults
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}; 