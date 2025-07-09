import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cache for domain-to-property mappings
const domainCache = new Map<string, { propertyId: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = new URL(request.url)
  
  // Skip middleware for API routes, static files, and admin routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.') ||
    hostname === 'localhost' ||
    hostname.includes('vercel.app') ||
    hostname.includes('127.0.0.1')
  ) {
    return NextResponse.next()
  }

  // Check if this is the main site (your primary domain)
  const isMainSite = hostname === 'digitalpropertyshowcase.com' || 
                    hostname === 'digipropshow.com' ||
                    hostname === 'www.digitalpropertyshowcase.com' ||
                    hostname === 'www.digipropshow.com'

  if (isMainSite) {
    // For main site, serve the public landing page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/index.html', request.url))
    }
    return NextResponse.next()
  }

  // This is a custom domain - check if it's mapped to a property
  try {
    // Check cache first
    const cached = domainCache.get(hostname)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Rewrite to the property page with the cached property ID
      return NextResponse.rewrite(new URL(`/properties/${cached.propertyId}`, request.url))
    }

    // Not in cache or expired, query database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: property, error } = await supabase
      .from('properties')
      .select('id')
      .eq('custom_domain', hostname)
      .eq('status', 'published')
      .single()

    if (error || !property) {
      // Domain not found or property not published
      // Redirect to main site
      return NextResponse.redirect(new URL('https://digitalpropertyshowcase.com', request.url))
    }

    // Cache the result
    domainCache.set(hostname, {
      propertyId: property.id,
      timestamp: Date.now()
    })

    // Rewrite to the property page
    return NextResponse.rewrite(new URL(`/properties/${property.id}`, request.url))
  } catch (error) {
    // On error, redirect to main site
    return NextResponse.redirect(new URL('https://digitalpropertyshowcase.com', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 