import { NextResponse } from 'next/server';

export async function GET() {
  // This endpoint no longer exposes the API key directly.
  // Frontend should now use specific backend endpoints for map data.
  console.log('Maps API route accessed - direct API key exposure removed.');
  return NextResponse.json({ message: 'Maps API route accessed' });
}