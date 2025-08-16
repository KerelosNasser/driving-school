import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            return cookieStore.get(name)?.value;
          } catch (error) {
            console.error('Cookie access error:', error);
            return null;
          }
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error('Cookie set error:', error);
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              maxAge: 0
            });
          } catch (error) {
            console.error('Cookie remove error:', error);
          }
        },
      },
    }
  );
};
import { CookieOptions } from '@supabase/ssr';