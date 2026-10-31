import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE, getUserFromRequest } from '@/app/utils/auth';
import { MAX_STAFF_PER_SITE, cleanStaffName, cleanStaffServices } from '@/app/utils/staff';

// כל המטפלים באתרים של בעל העסק המחובר (כולל קישורי ההזמנה), לניהול הצוות בדשבורד.
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'יש להתחבר.' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: sites } = await supabase.from('sites').select('id').eq('user_id', user.id);
  const siteIds = (sites ?? []).map((s) => s.id);
  if (siteIds.length === 0) return NextResponse.json({ staff: [] });

  const { data, error } = await supabase
    .from('site_staff')
    .select('id, site_id, user_id, name, services, invite_token, status')
    .in('site_id', siteIds)
    .order('created_at', { ascending: true });
  // הטבלה עוד לא קיימת: אין צוות
  if (error) return NextResponse.json({ staff: [] });

  return NextResponse.json({
    staff: (data ?? []).map((s) => ({
      id: s.id,
      siteId: s.site_id,
      name: s.name,
      services: s.services,
      status: s.status,
      inviteToken: s.status === 'invited' ? s.invite_token : null,
    })),
  });
}

// הוספת מטפל והזמנה: נוצר קישור שבעל העסק שולח למטפל (למשל בוואטסאפ).
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'יש להתחבר.' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const siteId = body?.siteId;
    const name = cleanStaffName(body?.name);
    if (typeof siteId !== 'string' || !UUID_RE.test(siteId)) {
      return NextResponse.json({ error: 'אתר לא תקין' }, { status: 400 });
    }
    if (name.length < 2) {
      return NextResponse.json({ error: 'נא לכתוב שם למטפל.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: site } = await supabase.from('sites').select('id, content').eq('id', siteId).eq('user_id', user.id).maybeSingle();
    if (!site) return NextResponse.json({ error: 'האתר לא נמצא' }, { status: 404 });

    const { count } = await supabase.from('site_staff').select('id', { count: 'exact', head: true }).eq('site_id', siteId);
    if ((count ?? 0) >= MAX_STAFF_PER_SITE) {
      return NextResponse.json({ error: 'הגעת למספר המטפלים המקסימלי.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('site_staff')
      .insert({ site_id: siteId, name, services: cleanStaffServices(body?.services, site.content), status: 'invited' })
      .select('id, site_id, name, services, invite_token, status')
      .single();
    if (error) throw error;

    return NextResponse.json({
      staff: { id: data.id, siteId: data.site_id, name: data.name, services: data.services, status: data.status, inviteToken: data.invite_token },
    });
  } catch (err) {
    console.error('Add staff error:', err);
    return NextResponse.json({ error: 'שגיאה בהוספת המטפל. ודאו שהצוות הופעל (הרצת ה-SQL).' }, { status: 500 });
  }
}
