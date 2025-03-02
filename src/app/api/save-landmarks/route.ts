import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, landmarks } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    const { error } = await supabase
      .from('properties')
      .update({ 
        landmarks,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId);

    if (error) {
      console.error('Error saving landmarks:', error);
      return NextResponse.json(
        { error: 'Failed to save landmarks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving landmarks:', error);
    return NextResponse.json(
      { error: 'Failed to save landmarks' },
      { status: 500 }
    );
  }
} 