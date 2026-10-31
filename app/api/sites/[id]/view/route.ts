import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE } from '@/app/utils/auth';
import { getClientIp, isRateLimited } from '@/app/utils/rate-limit';

// הגדלת מונה הצפיות באופן אטומי (פונקציית SQL), עם הגבלה לכל IP לכל אתר.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return new NextResponse(null, { status: 404 });
  }
  if (isRateLimited(`view:${getClientIp(req)}:${id}`, 3, 10 * 60 * 1000)) {
    return new NextResponse(null, { status: 204 });
  }

  // סופרים צפיות רק באתרים שפורסמו
  const supabase = getSupabaseAdmin();
  const { data: site } = await supabase.from('sites').select('is_pro').eq('id', id).maybeSingle();
  if (!site || site.is_pro !== true) {
    return new NextResponse(null, { status: 204 });
  }

  const { error } = await supabase.rpc('increment_site_views', { p_site_id: id });
  if (error) console.error('Increment views error:', error);

  return new NextResponse(null, { status: 204 });
}
