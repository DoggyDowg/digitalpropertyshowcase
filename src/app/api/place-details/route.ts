import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');
  
  if (!placeId) {
    return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Server-side Google Maps API key is not configured');
      return NextResponse.json({ result: null });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
      new URLSearchParams({
        place_id: placeId,
        fields: 'name,rating,user_ratings_total,price_level,types,business_status',
        key: apiKey
      })
    );

    if (!response.ok) {
      console.error('Google Places API error:', response.status);
      return NextResponse.json({ result: null });
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Google Places API returned non-OK status:', data.status);
      return NextResponse.json({ result: null });
    }

    return NextResponse.json(data.result);
    
  } catch (error) {
    console.error('Error fetching place details:', error);
    return NextResponse.json({ result: null });
  }
} 