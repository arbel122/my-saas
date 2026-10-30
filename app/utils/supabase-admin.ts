import { createClient } from '@supabase/supabase-js';

// שימוש בצד שרת בלבד! המפתח עוקף את חוקי ה-RLS ואסור שיגיע לדפדפן.
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
