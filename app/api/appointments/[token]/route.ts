import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE } from '@/app/utils/auth';
import { getClientIp, isRateLimited } from '@/app/utils/rate-limit';
import { hasStarted } from '@/app/utils/schedule';

type Ctx = { params: Promise<{ token: string }> };

async function findByToken(token: string) {
  const { data } = await getSupabaseAdmin()
    .from('appointments')
    .select('id, site_id, customer_name, date, starts_at')
    .eq('token', token)
    .maybeSingle();
  return data;
}

// פרטי התור לפי המזהה האקראי מהקישור (ביטול / ביקורת).
export async function GET(req: Request, { params }: Ctx) {
  const { token } = await params;
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: 'התור לא נמצא' }, { status: 404 });
  }
  if (isRateLimited(`appt-get:${getClientIp(req)}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'יותר מדי ניסיונות' }, { status: 429 });
  }

  const appointment = await findByToken(token);
  if (!appointment) {
    return NextResponse.json({ error: 'התור לא נמצא' }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const [{ data: site }, { data: review }] = await Promise.all([
    supabase.from('sites').select('name').eq('id', appointment.site_id).maybeSingle(),
    supabase.from('reviews').select('id').eq('appointment_id', appointment.id).limit(1),
  ]);

  return NextResponse.json({
    customerName: appointment.customer_name,
    date: appointment.date,
    siteName: site?.name ?? null,
    reviewed: !!review && review.length > 0,
    // ביקורת אפשרית רק אחרי שהתור התקיים
    canReview: hasStarted(appointment.starts_at),
  });
}

// ביטול תור לפי המזהה האקראי מהקישור.
export async function DELETE(req: Request, { params }: Ctx) {
  const { token } = await params;
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: 'התור לא נמצא' }, { status: 404 });
  }
  if (isRateLimited(`appt-del:${getClientIp(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'יותר מדי ניסיונות' }, { status: 429 });
  }

  const supabase = getSupabaseAdmin();

  // תור שנכתבה עליו ביקורת כבר התקיים, ולכן אי אפשר לבטל אותו (וגם המסד חוסם מחיקה כזו).
  const appointment = await findByToken(token);
  if (appointment) {
    const { data: review } = await supabase
      .from('reviews')
      .select('id')
      .eq('appointment_id', appointment.id)
      .limit(1);
    if (review && review.length > 0) {
      return NextResponse.json({ error: 'לא ניתן לבטל תור שכבר נכתבה עליו ביקורת.' }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from('appointments')
    .delete()
    .eq('token', token)
    .select('id');

  if (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json({ error: 'שגיאה בביטול התור' }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'התור לא נמצא. ייתכן שכבר בוטל.' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
