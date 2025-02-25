import { NextResponse } from 'next/server'

// 1x1 transparent ICO file base64 encoded
const EMPTY_FAVICON = Buffer.from('AAABAAEAAQEAAAEAIAAwAAAAFgAAACgAAAABAAAAAgAAAAEAIAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAA==', 'base64')

export async function GET() {
  return new NextResponse(EMPTY_FAVICON, {
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  })
} 