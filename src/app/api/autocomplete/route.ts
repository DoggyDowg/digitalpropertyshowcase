import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');

  if (!input) {
    return NextResponse.json({ error: 'Input is required' }, { status: 400 });
  }

  try {
    const apiKey = process.env.CLIENT_GOOGLE_MAPS_API_KEY; // Use the new server-side API key

    if (!apiKey) {
      console.error('Server-side Google Maps API key is not configured');
      return NextResponse.json({ predictions: [] }, { status: 500 });
    }

    const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      new URLSearchParams({
        input: input,
        types: 'address', // Restrict to address predictions
        componentRestrictions: 'country:au', // Restrict to Australia
        key: apiKey,
      });
    console.log('Fetching Google Places Autocomplete:', apiUrl); // Log the API URL
    const response = await fetch(apiUrl);
    console.log('Google Places Autocomplete API response status:', response.status); // Log response status

    if (!response.ok) {
      console.error('Google Places Autocomplete API error:', response.status);
      return NextResponse.json({ predictions: [] }, { status: response.status });
    }

    const data = await response.json();
    console.log('Google Places Autocomplete API response data:', data); // Log response data

    if (data.status !== 'OK') {
      console.error('Google Places Autocomplete API returned non-OK status:', data.status);
      return NextResponse.json({ predictions: [] }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error: any) { // Add type annotation for error
    console.error('Error fetching autocomplete predictions:', error.message || error); // Log error message
    // Log the full error object if needed for more details
    // console.error('Full error object:', error);
    return NextResponse.json({ predictions: [] }, { status: 500 });
  }
}