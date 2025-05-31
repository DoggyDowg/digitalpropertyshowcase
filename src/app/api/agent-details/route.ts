import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { agentId, propertyId } = await request.json();

    if (!agentId && !propertyId) {
      return NextResponse.json(
        { error: 'Either Agent ID or Property ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with proper cookie handling
    const supabase = createRouteHandlerClient({ cookies });

    let agentData;
    let agencyData;

    // If we have an agent ID, get the agent's data and agency data
    if (agentId) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          email,
          phone,
          position,
          agency_id
        `)
        .eq('id', agentId)
        .single();

      if (agentError) {
        console.error('Error fetching agent:', agentError);
        return NextResponse.json(
          { error: 'Error fetching agent information' },
          { status: 500 }
        );
      }

      agentData = agent;

      // Get agency data
      if (agent.agency_id) {
        const { data: agency, error: agencyError } = await supabase
          .from('agency_settings')
          .select(`
            id,
            name,
            website,
            branding,
            copyright
          `)
          .eq('id', agent.agency_id)
          .single();

        if (agencyError) {
          console.error('Error fetching agency:', agencyError);
          return NextResponse.json(
            { error: 'Error fetching agency information' },
            { status: 500 }
          );
        }

        agencyData = agency;
      }
    }
    // If we only have a property ID, fetch its agent and agency data
    else if (propertyId) {
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select(`
          id,
          agent_id,
          agency_id,
          agency_name
        `)
        .eq('id', propertyId)
        .single();

      if (propertyError) {
        console.error('Error fetching property:', propertyError);
        return NextResponse.json(
          { error: 'Error fetching property information' },
          { status: 500 }
        );
      }

      if (property.agent_id) {
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select(`
            id,
            name,
            email,
            phone,
            position,
            agency_id
          `)
          .eq('id', property.agent_id)
          .single();

        if (agentError) {
          console.error('Error fetching agent:', agentError);
          return NextResponse.json(
            { error: 'Error fetching agent information' },
            { status: 500 }
          );
        }

        agentData = agent;
      }

      if (property.agency_id) {
        const { data: agency, error: agencyError } = await supabase
          .from('agency_settings')
          .select(`
            id,
            name,
            website,
            branding,
            copyright
          `)
          .eq('id', property.agency_id)
          .single();

        if (agencyError) {
          console.error('Error fetching agency:', agencyError);
          return NextResponse.json(
            { error: 'Error fetching agency information' },
            { status: 500 }
          );
        }

        agencyData = agency;
      }
    }

    return NextResponse.json({
      agent: agentData || null,
      agency: agencyData || null
    });
  } catch (error) {
    console.error('Error in agent-details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 