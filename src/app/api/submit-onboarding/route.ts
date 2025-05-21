import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const {
    tier,
    user_name,
    user_email,
    user_phone,
    is_selling_agent,
    agent_name,
    agent_email,
    agent_phone,
    agency_name,
    agency_office,
    street_address,
    property_name,
    price,
    sale_type,
    auction_date,
    auction_time,
    preferred_domain,
  } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('onboarding_submissions')
      .insert([
        {
          tier,
          user_name,
          user_email,
          user_phone,
          is_selling_agent,
          agent_name: is_selling_agent ? null : agent_name, // Only insert if not selling agent
          agent_email: is_selling_agent ? null : agent_email, // Only insert if not selling agent
          agent_phone: is_selling_agent ? null : agent_phone, // Only insert if not selling agent
          agency_name,
          agency_office,
          street_address,
          property_name,
          price,
          sale_type,
          auction_date: sale_type === 'auction' ? auction_date : null, // Only insert if auction
          auction_time: sale_type === 'auction' ? auction_time : null, // Only insert if auction
          preferred_domain,
        },
      ]);

    if (error) {
      console.error('Error inserting onboarding submission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Submission successful', data });

  } catch (error) {
    console.error('Unexpected error during onboarding submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}