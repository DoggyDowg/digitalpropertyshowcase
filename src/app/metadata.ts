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
  manifest: '/site.webmanifest',
  title: 'Digital Property Showcase - Property Showcase Solution',
  description: 'Digital Property Showcase helps real estate professionals create beautiful online property showcases with custom domains in minutes.',
  openGraph: {
    title: 'Digital Property Showcase - Property Showcase Solution',
    description: 'Digital Property Showcase helps real estate professionals create beautiful online property showcases with custom domains in minutes.',
    url: 'https://digitalpropertyshowcase.com',
    images: [
      {
        url: '/assets/logo/logo.png',
        width: 800,
        height: 600,
        alt: 'Digital Property Showcase logo',
      },
    ],
  },
  icons: {
    icon: '/assets/logo/logo.png',
  },
};

// Basic JSON-LD for the website
export const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
}; 