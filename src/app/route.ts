import { NextResponse } from 'next/server'

// 1x1 transparent ICO file base64 encoded
const EMPTY_FAVICON = Buffer.from('AAABAAEAAQEAAAEAIAAwAAAAFgAAACgAAAABAAAAAgAAAAEAIAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAA==', 'base64')

export async function GET(request: Request) {
  const url = new URL(request.url)
  
  // Only handle favicon.ico requests
  if (url.pathname === '/favicon.ico') {
    return new NextResponse(EMPTY_FAVICON, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      }
    })
  }

  // Let other requests pass through
  return NextResponse.next()
} 