import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface InstagramToken {
  access_token: string;
  token_type: string;
  expires_in: number; // Seconds until expiration
  last_refreshed: number; // Unix timestamp of last refresh
}

const REFRESH_THRESHOLD_DAYS = 7; // Refresh token when it has 7 days left
const SECONDS_IN_DAY = 86400;

export async function getInstagramToken(): Promise<string> {
  try {
    // Try to get the most recent valid token from Supabase
    const { data: tokenData, error } = await supabase
      .from('instagram_tokens')
      .select('access_token, expires_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching token from Supabase:', error)
      // Fall back to environment variable if no token in database
      return process.env.INSTAGRAM_ACCESS_TOKEN!
    }

    if (tokenData && new Date(tokenData.expires_at) > new Date()) {
      return tokenData.access_token
    }

    // If no valid token found, fall back to environment variable
    return process.env.INSTAGRAM_ACCESS_TOKEN!
  } catch (error) {
    console.error('Error in getInstagramToken:', error)
    // Fall back to environment variable if anything goes wrong
    return process.env.INSTAGRAM_ACCESS_TOKEN!
  }
}

async function refreshToken(currentToken: string): Promise<string> {
  try {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store new token in database
    const { error: insertError } = await supabase
      .from('instagram_tokens')
      .insert({
        access_token: data.access_token,
        token_type: 'Bearer',
        expires_in: data.expires_in,
        last_refreshed: Date.now()
      });

    if (insertError) {
      throw insertError;
    }

    return data.access_token;
  } catch (error) {
    console.error('Error refreshing Instagram token:', error);
    throw error;
  }
}

// Function to check token status - useful for monitoring
export async function checkTokenStatus(): Promise<{
  isValid: boolean;
  daysUntilExpiry: number;
  needsRefresh: boolean;
}> {
  try {
    const { data: tokenData, error } = await supabase
      .from('instagram_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      throw error;
    }

    if (!tokenData) {
      return {
        isValid: false,
        daysUntilExpiry: 0,
        needsRefresh: true
      };
    }

    const secondsSinceRefresh = (Date.now() - tokenData.last_refreshed) / 1000;
    const secondsUntilExpiry = tokenData.expires_in - secondsSinceRefresh;
    const daysUntilExpiry = Math.floor(secondsUntilExpiry / SECONDS_IN_DAY);

    return {
      isValid: daysUntilExpiry > 0,
      daysUntilExpiry,
      needsRefresh: daysUntilExpiry <= REFRESH_THRESHOLD_DAYS
    };
  } catch (error) {
    console.error('Error checking token status:', error);
    throw error;
  }
} 