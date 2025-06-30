import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Add timeout wrapper
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

export async function POST(request: Request) {
  const headersList = await headers()
  const origin = headersList.get('origin') || '*'

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }

  try {
    const { listing_url, listing_text, user } = await request.json()
    console.log('Received request:', { listing_url, listing_text, user })

    const difyApiKey = process.env.NEXT_PUBLIC_DIFY_PROPCOPY_API_KEY
    if (!difyApiKey) {
      throw new Error('Dify API key not configured')
    }

    // Add timeout to Dify API call
    const response = await withTimeout(
      fetch('https://api.dify.ai/v1/workflows/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${difyApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            listing_url: listing_url || '',
            listing_text: listing_text || ''
          },
          response_mode: 'blocking',
          user: user || 'property-scraper'
        }),
        signal: AbortSignal.timeout(45000) // 45 second timeout
      }),
      45000 // 45 second timeout wrapper
    );

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Dify API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Dify API response:', data)

    if (!data.data?.outputs?.text) {
      console.error('Invalid Dify response structure:', data)
      throw new Error('Invalid response from Dify API')
    }

    return NextResponse.json({ text: data.data.outputs.text }, { headers: corsHeaders })

  } catch (error) {
    console.error('API route error:', error)
    
    // Handle timeout specifically
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout - the property scraping took too long to complete' },
        { status: 504, headers: corsHeaders }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}