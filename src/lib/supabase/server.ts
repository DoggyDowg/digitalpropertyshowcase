import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Function to create a Supabase client specifically for Server Components.
// This client will have access to the request's cookies.
export async function createClient() {
  const cookieStore = cookies();

  // Create and return the Supabase client for server-side operations.
  // Use createServerClient from @supabase/ssr
  // We need to provide the Supabase URL and Anon Key from environment variables
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // The Supabase project URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // The Supabase project's public Anon Key
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // If it's running in a Server Component, just ignore
          }
        },
      },
    }
  );
}; 