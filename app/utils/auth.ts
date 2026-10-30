import { getSupabaseAdmin } from './supabase-admin';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// מזהה את המשתמש לפי ה-token שהדפדפן שולח ב-Authorization. מחזיר null אם לא מחובר.
export async function getUserFromRequest(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
  return error || !user ? null : user;
}
