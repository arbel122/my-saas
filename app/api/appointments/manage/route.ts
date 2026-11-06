import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { getUserFromRequest } from '@/app/utils/auth';
import { hasStarted } from '@/app/utils/schedule';

// ביטול תור על ידי בעל העסק. השעה מתפנה ללקוחות אחרים.
export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = body?.id;
  if (typeof id !== 'string' && typeof id !== 'number') {
    return NextResponse.json({ error: 'תור לא תקין' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: appt } = await supabase.from('appointments').select('id, site_id, starts_at').eq('id', id).maybeSingle();
  if (!appt) return NextResponse.json({ error: 'התור לא נמצא' }, { status: 404 });

  // רק בעל האתר רשאי לבטל תור שלו
  const { data: site } = await supabase.from('sites').select('id').eq('id', appt.site_id).eq('user_id', user.id).maybeSingle();
  if (!site) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });

  if (hasStarted(appt.starts_at)) {
    return NextResponse.json({ error: 'אי אפשר לבטל תור שכבר התקיים.' }, { status: 409 });
  }

  const { error } = await supabase.from('appointments').delete().eq('id', appt.id);
  if (error) {
    console.error('Owner cancel error:', error);
    return NextResponse.json({ error: 'שגיאה בביטול התור' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
