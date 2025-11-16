import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase admin client with proper error handling
 * This client uses the service role key and should only be used in server-side code
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-client-info': 'driving-school-admin'
      }
    }
  });
}

/**
 * Test the Supabase connection
 */
export async function testSupabaseConnection() {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
}
