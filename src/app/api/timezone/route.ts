import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const timestamp = searchParams.get('timestamp')

    if (!lat || !lng || !timestamp) {
      console.error('Missing parameters:', { lat, lng, timestamp });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not configured');
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    // Call Google Maps Time Zone API
    const apiUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat}%2C${lng}&timestamp=${timestamp}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    console.log('Calling Google Maps Time Zone API:', { lat, lng, timestamp });
    
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    console.log('Google Maps Time Zone API raw response:', data);

    if (data.status === 'REQUEST_DENIED') {
      console.error('Time Zone request denied. Make sure you have enabled Google Maps Platform and have billing set up.');
      return NextResponse.json(
        { error: 'REQUEST_DENIED', message: 'Time Zone request denied. Please check Google Maps Platform settings and billing.' },
        { status: 403 }
      )
    }

    if (data.status !== 'OK') {
      console.error('Google Maps API returned non-OK status:', data)
      return NextResponse.json(
        { error: data.status, message: data.errorMessage || 'Time Zone lookup failed' },
        { status: 400 }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Maps API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      return NextResponse.json(
        { error: 'API_ERROR', message: 'Failed to fetch time zone data' },
        { status: response.status }
      )
    }

    if (!data.timeZoneId) {
      console.error('No timeZoneId in response:', data);
      return NextResponse.json(
        { error: 'NO_TIMEZONE', message: 'No time zone found for this location' },
        { status: 404 }
      )
    }

    const result = {
      timeZoneId: data.timeZoneId,
      timeZoneName: data.timeZoneName
    };
    console.log('Returning time zone data:', result);

    return NextResponse.json(result)
  } catch (error) {
    console.error('Time Zone API error:', error)
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch time zone data'
      },
      { status: 500 }
    )
  }
} 