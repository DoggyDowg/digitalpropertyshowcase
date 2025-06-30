import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PostgrestError } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Add timeout wrapper
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

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

    // First check if the property exists and is accessible - with timeout
    const { data: propertyData, error: propertyError } = await withTimeout(
      supabase
        .from('properties')
        .select('id, name, street_address, maps_address, landmarks, updated_at, latitude, longitude')
        .eq('id', propertyId)
        .single()
        .throwOnError(),
      15000, // 15 second timeout for database query
      'Database query timeout'
    );

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
    console.log('Property address from DB:', {
      maps_address: propertyData.maps_address,
      street_address: propertyData.street_address,
      using_address: address,
      stored_coords: {
        lat: propertyData.latitude,
        lng: propertyData.longitude
      }
    });

    let propertyPosition;

    // Use stored coordinates if available
    if (propertyData.latitude !== null && propertyData.longitude !== null) {
      propertyPosition = {
        lat: propertyData.latitude,
        lng: propertyData.longitude
      };
      console.log('Using stored coordinates:', propertyPosition);
    } else {
      // Geocode the address if no stored coordinates - with timeout and fallback
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
        
        const geocodeResponse = await withTimeout(
          fetch(geocodeUrl),
          8000, // 8 second timeout for geocoding
          'Geocoding API timeout'
        );
        
        const geocodeData = await geocodeResponse.json();
        
        console.log('Geocoding response:', {
          status: geocodeData.status,
          results: geocodeData.results?.[0]?.formatted_address,
          location: geocodeData.results?.[0]?.geometry?.location
        });

        if (geocodeData.status === 'OK' && geocodeData.results[0]?.geometry?.location) {
          propertyPosition = geocodeData.results[0].geometry.location;
        } else {
          throw new Error(`Geocoding failed: ${geocodeData.status}`);
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed, using fallback coordinates:', geocodeError);
        // Fallback to first landmark's position or default Melbourne coordinates
        propertyPosition = landmarks[0]?.position || { lat: -37.8136, lng: 144.9631 };
        console.log('Using fallback coordinates:', propertyPosition);
      }
    }

    // Format the response
    const response = {
      property: {
        name: propertyData.street_address,
        address: address,
        position: propertyPosition,
        id: propertyData.id,
        is_demo: false
      },
      landmarks: landmarks
    };

    console.log('Sending response:', {
      property_name: response.property.name,
      property_address: response.property.address,
      property_position: response.property.position
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minute cache
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in get-landmarks:', error);
    
    // Return a more specific error based on the type
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { 
          error: 'Request timeout',
          details: 'The request took too long to complete. Please try again.'
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to load landmarks data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 