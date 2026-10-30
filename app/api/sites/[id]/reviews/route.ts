import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE } from '@/app/utils/auth';
import { getClientIp, isRateLimited } from '@/app/utils/rate-limit';

// "דנה כהן" -> "דנה כ." כדי לא לחשוף שם מלא של לקוח באתר ציבורי.
function publicName(fullName: unknown) {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'לקוח';
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[1][0]}.`;
}

// ביקורות של אתר מפורסם, רק שדות ציבוריים. עוברות בשרת כי הטבלה עצמה לא קריאה לאורחים.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ reviews: [] });
  }
  if (isRateLimited(`reviews-list:${getClientIp(req)}`, 120, 60 * 60 * 1000)) {
    return NextResponse.json({ reviews: [] }, { status: 429 });
  }

  const supabase = getSupabaseAdmin();
  const { data: site } = await supabase.from('sites').select('is_pro, content').eq('id', id).maybeSingle();
  if (!site || site.is_pro !== true) {
    return NextResponse.json({ reviews: [] });
  }

  // ביקורות שבעל העסק הסתיר לא מוצגות לגולשים
  const hidden = new Set<string>(
    Array.isArray(site.content?.hiddenReviewIds) ? site.content.hiddenReviewIds.map(String) : []
  );

  const { data } = await supabase
    .from('reviews')
    .select('id, client_name, rating, comment, created_at')
    .eq('site_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    reviews: (data ?? []).filter((r) => !hidden.has(String(r.id))).map((r) => ({
      id: r.id,
      name: publicName(r.client_name),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    })),
  });
}
