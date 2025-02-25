import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Define the structure of the agency settings
interface AgencySettings {
  id: string;
  branding?: {
    favicon?: string;
    logo?: {
      dark?: string;
      light?: string;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Favicon API route called');
    
    // Get the host from the request
    const host = request.headers.get('host') || '';
    console.log(`Host: ${host}`);
    
    // Skip processing for localhost or development environments
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      console.log('Development environment detected, returning default response');
      return new Response(null, { status: 404 });
    }
    
    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });
    
    // First, try to find a property with this custom domain
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id,
        agency_id,
        agency_settings:agency_id (
          id,
          branding
        )
      `)
      .eq('custom_domain', host)
      .single();
    
    if (propertyError) {
      console.log(`No property found with custom domain ${host}. Error: ${propertyError.message}`);
      
      // If no exact match, try with www. prefix removed or added
      const alternativeHost = host.startsWith('www.') 
        ? host.replace('www.', '') 
        : `www.${host}`;
      
      console.log(`Trying alternative host: ${alternativeHost}`);
      
      const { data: altPropertyData, error: altPropertyError } = await supabase
        .from('properties')
        .select(`
          id,
          agency_id,
          agency_settings:agency_id (
            id,
            branding
          )
        `)
        .eq('custom_domain', alternativeHost)
        .single();
      
      if (altPropertyError) {
        console.log(`No property found with alternative domain ${alternativeHost}. Error: ${altPropertyError.message}`);
        return new Response(null, { status: 404 });
      }
      
      // Use the alternative property data
      console.log(`Found property with alternative domain: ${alternativeHost}`);
      
      // Check if we have a favicon URL
      const agencySettings = altPropertyData?.agency_settings as unknown as AgencySettings;
      if (agencySettings?.branding?.favicon) {
        const faviconUrl = agencySettings.branding.favicon;
        console.log(`Favicon URL: ${faviconUrl}`);
        
        // Fetch the favicon
        const faviconResponse = await fetch(faviconUrl);
        if (!faviconResponse.ok) {
          console.log(`Failed to fetch favicon from ${faviconUrl}. Status: ${faviconResponse.status}`);
          return new Response(null, { status: 404 });
        }
        
        // Get the favicon data
        const faviconData = await faviconResponse.arrayBuffer();
        
        // Return the favicon with appropriate headers
        return new Response(faviconData, {
          headers: {
            'Content-Type': faviconResponse.headers.get('Content-Type') || 'image/x-icon',
            'Cache-Control': 'public, max-age=3600, must-revalidate',
          },
        });
      }
    }
    
    // If we found a property with this domain
    if (propertyData) {
      // Check if we have a favicon URL
      const agencySettings = propertyData.agency_settings as unknown as AgencySettings;
      if (agencySettings?.branding?.favicon) {
        const faviconUrl = agencySettings.branding.favicon;
        console.log(`Favicon URL: ${faviconUrl}`);
        
        // Fetch the favicon
        const faviconResponse = await fetch(faviconUrl);
        if (!faviconResponse.ok) {
          console.log(`Failed to fetch favicon from ${faviconUrl}. Status: ${faviconResponse.status}`);
          return new Response(null, { status: 404 });
        }
        
        // Get the favicon data
        const faviconData = await faviconResponse.arrayBuffer();
        
        // Return the favicon with appropriate headers
        return new Response(faviconData, {
          headers: {
            'Content-Type': faviconResponse.headers.get('Content-Type') || 'image/x-icon',
            'Cache-Control': 'public, max-age=3600, must-revalidate',
          },
        });
      }
    }
    
    // If no favicon found, return 404
    console.log('No favicon found for this domain');
    return new Response(null, { status: 404 });
  } catch (error) {
    console.error('Error in favicon API route:', error);
    return new Response(null, { status: 500 });
  }
} 