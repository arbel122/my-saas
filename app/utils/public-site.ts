import { getSupabaseAdmin } from './supabase-admin';
import { UUID_RE } from './auth';

// האתר הציבורי של עסק, רק אם פורסם (שולם). אתר שלא פורסם לא נחשף בשרת לאף אחד.
export async function getPublishedSite(id: string): Promise<Record<string, any> | null> {
  if (!UUID_RE.test(id)) return null;
  try {
    const { data } = await getSupabaseAdmin().from('sites').select('is_pro, content').eq('id', id).maybeSingle();
    return data && data.is_pro === true && data.content ? data.content : null;
  } catch {
    return null;
  }
}

// כתובת האתר בייצור (Vercel מגדיר אותה אוטומטית). בפיתוח מקומי: localhost.
export function siteOrigin() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}` : 'http://localhost:3000';
}
