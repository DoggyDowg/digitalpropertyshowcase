import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Function to create a Supabase client specifically for Server Components.
// This client will have access to the request's cookies.
export async function createClient() {
  const cookieStore = cookies();

  // Create and return the Supabase client for server-side operations.
  // Use createServerComponentClient from @supabase/ssr
  return createServerComponentClient({
    cookies: () => cookieStore,
  });
}; 