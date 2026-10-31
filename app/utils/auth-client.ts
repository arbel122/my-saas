import { supabase } from './supabase';

// הכותרת שמזהה את המשתמש המחובר מול ה-API. אם אין משתמש מחובר מחזיר null.
export async function getAuthHeader(): Promise<{ Authorization: string } | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : null;
}
