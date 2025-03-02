import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PostgrestError } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // First check if the property exists and is accessible
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, street_address, maps_address, landmarks, updated_at')
      .eq('id', propertyId)
      .single()
      .throwOnError();

    if (propertyError) {
      console.error('Database error:', propertyError);
      return NextResponse.json(
        { 
          error: 'Failed to load property data',
          details: (propertyError as PostgrestError).message,
          code: (propertyError as PostgrestError).code
        },
        { status: 500 }
      );
    }

    if (!propertyData) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Ensure landmarks is an array and has the correct structure
    const landmarks = Array.isArray(propertyData.landmarks) ? propertyData.landmarks : [];

    // Get the property's address
    const address = propertyData.maps_address || propertyData.street_address;

    // Get coordinates for the property's address
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    let propertyPosition;
    if (geocodeData.status === 'OK' && geocodeData.results[0]?.geometry?.location) {
      propertyPosition = geocodeData.results[0].geometry.location;
    } else {
      // Fallback to first landmark's position or default Melbourne coordinates
      propertyPosition = landmarks[0]?.position || { lat: -37.8136, lng: 144.9631 };
    }

    // Format the response
    const response = {
      property: {
        name: propertyData.name,
        address: address,
        position: propertyPosition,
        id: propertyData.id,
        is_demo: false
      },
      landmarks: landmarks
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in get-landmarks:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load landmarks data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 