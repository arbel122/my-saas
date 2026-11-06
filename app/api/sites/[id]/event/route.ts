import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE } from '@/app/utils/auth';
import { cleanSource } from '@/app/utils/source';
import { getClientIp, isRateLimited } from '@/app/utils/rate-limit';

// רישום לחיצה על וואטסאפ או טלפון באתר (לסטטיסטיקות). רק באתרים שפורסמו, עם הגבלה לכל IP.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return new NextResponse(null, { status: 404 });
  if (isRateLimited(`event:${getClientIp(req)}:${id}`, 10, 10 * 60 * 1000)) return new NextResponse(null, { status: 204 });

  const body = await req.json().catch(() => null);
  const type = body?.type === 'whatsapp' || body?.type === 'phone' ? body.type : null;
  if (!type) return new NextResponse(null, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: site } = await supabase.from('sites').select('is_pro').eq('id', id).maybeSingle();
  if (!site || site.is_pro !== true) return new NextResponse(null, { status: 204 });

  // אם הטבלה עוד לא נוצרה (SQL לא הורץ), מתעלמים בשקט
  const { error } = await supabase.from('site_events').insert({ site_id: id, type, source: cleanSource(body?.source) });
  if (error && error.code !== '42P01' && error.code !== 'PGRST205') console.error('Site event error:', error);

  return new NextResponse(null, { status: 204 });
}
