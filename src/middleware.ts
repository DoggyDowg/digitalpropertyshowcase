import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams.toString()
  const fullUrl = searchParams ? `${request.url}?${searchParams}` : request.url

  // Log every request in detail
  console.log(JSON.stringify({
    message: '🔍 MIDDLEWARE REQUEST',
    timestamp: new Date().toISOString(),
    hostname,
    pathname,
    fullUrl,
    headers: Object.fromEntries(request.headers.entries())
  }))

  // Skip middleware for Next.js internals and static files
  if (
    pathname.startsWith('/_next') || 
    pathname.includes('favicon') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')  // Skip files with extensions
  ) {
    console.log(JSON.stringify({
      message: '⏭️ SKIPPING INTERNAL PATH',
      pathname
    }))
    return NextResponse.next()
  }

  // Skip if we're already on a property page
  if (pathname.startsWith('/properties/')) {
    console.log(JSON.stringify({
      message: '⏭️ ALREADY ON PROPERTIES PATH',
      pathname
    }))
    return NextResponse.next()
  }

  // Create a response that we'll modify based on conditions
  const res = NextResponse.next()

  // Handle auth for admin routes
  if (pathname.startsWith('/admin')) {
    const supabase = createMiddlewareClient({ req: request, res })
    const { data: { session } } = await supabase.auth.getSession()

    // Protect all admin routes except login
    if (pathname !== '/admin/login') {
      if (!session) {
        // Redirect to login if not authenticated
        const redirectUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } else if (session) {
      // If we're on the login page and already authenticated, redirect to admin dashboard
      const redirectUrl = new URL('/admin', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Handle custom domains
  if (hostname && !hostname.includes('localhost') && !hostname.includes('vercel.app')) {
    try {
      // Create Supabase client
      const supabase = createRouteHandlerClient({ cookies })
      
      // Query the properties table to find the property with this custom domain
      const { data: property, error } = await supabase
        .from('properties')
        .select('id, status')
        .eq('custom_domain', hostname)
        .eq('status', 'published')
        .single()

      if (error || !property) {
        console.log(JSON.stringify({
          message: '❌ NO PROPERTY FOUND FOR DOMAIN',
          hostname,
          error: error?.message
        }))
        return res
      }

      // Rewrite to the property page while keeping the URL clean
      const newUrl = request.nextUrl.clone()
      newUrl.pathname = `/properties/${property.id}`
      
      // Preserve any query parameters
      if (searchParams) {
        newUrl.search = searchParams
      }
      
      console.log(JSON.stringify({
        message: '↪️ REWRITING URL',
        from: pathname,
        to: newUrl.pathname,
        hostname,
        fullFrom: fullUrl,
        fullTo: `${newUrl.origin}${newUrl.pathname}${newUrl.search}`
      }))
      
      const response = NextResponse.rewrite(newUrl)
      
      // Add custom domain detection header
      response.headers.set('x-custom-domain', 'true')
      
      // Add debug headers
      response.headers.set('x-debug-rewrite-from', pathname)
      response.headers.set('x-debug-rewrite-to', newUrl.pathname)
      response.headers.set('x-debug-hostname', hostname)
      
      return response
    } catch (err) {
      console.error('Middleware error:', err)
      return res
    }
  }

  return res
}

// Match all routes except static files and API routes
export const config = {
  matcher: ['/:path*']
} 