import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { getUserFromRequest } from '@/app/utils/auth';

const hiddenSet = (content: unknown) =>
  new Set<string>(
    Array.isArray((content as { hiddenReviewIds?: unknown })?.hiddenReviewIds)
      ? ((content as { hiddenReviewIds: unknown[] }).hiddenReviewIds).map(String)
      : []
  );

// כל הביקורות על האתרים של המשתמש המחובר, כולל מוסתרות ופרטים מלאים (רק לבעל העסק).
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: sites } = await supabase.from('sites').select('id, name, content').eq('user_id', user.id);
  if (!sites || sites.length === 0) {
    return NextResponse.json({ reviews: [] });
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, site_id, appointment_id, client_name, rating, comment, created_at')
    .in('site_id', sites.map((s) => s.id))
    .order('created_at', { ascending: false })
    .limit(200);

  const appointmentIds = Array.from(new Set((reviews ?? []).map((r) => r.appointment_id).filter(Boolean)));
  const { data: appointments } = appointmentIds.length
    ? await supabase.from('appointments').select('id, date').in('id', appointmentIds)
    : { data: [] as Array<{ id: number; date: string }> };

  const siteById = new Map(sites.map((s) => [s.id, s]));
  const dateByAppointment = new Map((appointments ?? []).map((a) => [String(a.id), a.date]));

  return NextResponse.json({
    reviews: (reviews ?? []).map((r) => {
      const site = siteById.get(r.site_id);
      return {
        id: String(r.id),
        siteId: r.site_id,
        siteName: site?.name ?? '',
        name: r.client_name,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        appointmentDate: dateByAppointment.get(String(r.appointment_id)) ?? null,
        hidden: hiddenSet(site?.content).has(String(r.id)),
      };
    }),
  });
}

// הסתרה או החזרה של ביקורת באתר הציבורי. רק בעל האתר.
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    const { reviewId, hidden } = (await req.json().catch(() => null)) ?? {};
    if ((typeof reviewId !== 'string' && typeof reviewId !== 'number') || typeof hidden !== 'boolean') {
      return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: review } = await supabase.from('reviews').select('id, site_id').eq('id', reviewId).maybeSingle();
    if (!review) {
      return NextResponse.json({ error: 'הביקורת לא נמצאה' }, { status: 404 });
    }

    // הביקורת חייבת להיות על אתר של המשתמש הזה
    const { data: site } = await supabase
      .from('sites')
      .select('id, content')
      .eq('id', review.site_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!site) {
      return NextResponse.json({ error: 'הביקורת לא נמצאה' }, { status: 404 });
    }

    const ids = hiddenSet(site.content);
    if (hidden) ids.add(String(review.id));
    else ids.delete(String(review.id));

    const { error } = await supabase
      .from('sites')
      .update({ content: { ...site.content, hiddenReviewIds: Array.from(ids) } })
      .eq('id', site.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Manage review error:', err);
    return NextResponse.json({ error: 'שגיאה בעדכון הביקורת' }, { status: 500 });
  }
}
