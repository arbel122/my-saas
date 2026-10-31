import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE, getUserFromRequest } from '@/app/utils/auth';
import { hasStarted } from '@/app/utils/schedule';

// כל התורים של הלקוח המחובר (אפשר לסנן לפי אתר). מגיעים מהחשבון, לא מהמכשיר.
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'יש להתחבר כדי לראות את התורים שלך.', needsLogin: true }, { status: 401 });
  }

  const siteId = new URL(req.url).searchParams.get('siteId');
  if (siteId && !UUID_RE.test(siteId)) {
    return NextResponse.json({ appointments: [] });
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('appointments')
    .select('id, token, site_id, date, starts_at')
    .eq('customer_user_id', user.id)
    .order('starts_at', { ascending: false })
    .limit(100);
  if (siteId) query = query.eq('site_id', siteId);

  const { data: rows, error } = await query;
  if (error) {
    console.error('My appointments error:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת התורים' }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ appointments: [] });
  }

  const siteIds = [...new Set(rows.map((r) => r.site_id))];
  const [{ data: sites }, { data: reviews }] = await Promise.all([
    supabase.from('sites').select('id, name, content').in('id', siteIds),
    supabase.from('reviews').select('appointment_id').in('appointment_id', rows.map((r) => r.id)),
  ]);

  const businessNames = new Map<string, string>();
  for (const s of sites ?? []) {
    businessNames.set(s.id, s.content?.businessName || s.name || 'עסק');
  }
  const reviewed = new Set((reviews ?? []).map((r) => r.appointment_id));

  return NextResponse.json({
    appointments: rows.map((r) => {
      const started = hasStarted(r.starts_at);
      return {
        token: r.token,
        siteId: r.site_id,
        businessName: businessNames.get(r.site_id) ?? 'עסק',
        date: r.date,
        reviewed: reviewed.has(r.id),
        canCancel: !started,
        canReview: started,
      };
    }),
  });
}
