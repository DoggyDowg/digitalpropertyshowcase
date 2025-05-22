import { createClient } from '@supabase/supabase-js';

// Retrieve the environment variables for the Supabase URL and the anon key.
// We use non-null assertion (!) because we expect these to be defined in the .env.local file.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a new Supabase client instance.
// This client object will be used throughout the application to interact with Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 