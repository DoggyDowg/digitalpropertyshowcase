'use client'

import { useProperty } from '@/contexts/PropertyContext'
import Head from 'next/head'

export function PropertyMetadata() {
  const { property } = useProperty()

  if (!property) return null

  return (
    <Head>
      <title>{property.content.seo.title || 'Luxury Property Showcase'}</title>
      <meta
        name="description"
        content={property.content.seo.description || 'Discover luxury properties'}
      />
      <meta
        property="og:title"
        content={property.content.og.title || 'Luxury Property Showcase'}
      />
      <meta
        property="og:description"
        content={property.content.og.description || 'Discover luxury properties'}
      />
    </Head>
  )
} 