import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE } from '@/app/utils/auth';
import { getClientIp, isRateLimited } from '@/app/utils/rate-limit';
import { hasStarted } from '@/app/utils/schedule';
import { denyIfNotOwner } from '@/app/utils/appointment-access';

// ביקורת אחת לכל תור, רק למי שמחזיק במזהה האקראי של התור.
export async function POST(req: Request) {
  try {
    if (isRateLimited(`review:${getClientIp(req)}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'יותר מדי ניסיונות' }, { status: 429 });
    }

    const { token, rating, comment } = (await req.json().catch(() => null)) ?? {};

    if (typeof token !== 'string' || !UUID_RE.test(token)) {
      return NextResponse.json({ error: 'התור לא נמצא' }, { status: 404 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'דירוג לא תקין' }, { status: 400 });
    }
    const text = typeof comment === 'string' ? comment.trim().slice(0, 1000) : '';

    const supabase = getSupabaseAdmin();

    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, site_id, customer_name, customer_user_id, starts_at')
      .eq('token', token)
      .maybeSingle();
    if (!appointment) {
      return NextResponse.json({ error: 'התור לא נמצא' }, { status: 404 });
    }
    const denied = await denyIfNotOwner(req, appointment);
    if (denied) return denied;
    if (!hasStarted(appointment.starts_at)) {
      return NextResponse.json({ error: 'אפשר להשאיר ביקורת רק אחרי שהתור התקיים.' }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('appointment_id', appointment.id)
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'כבר השארת ביקורת על התור הזה' }, { status: 409 });
    }

    const { error } = await supabase.from('reviews').insert({
      appointment_id: appointment.id,
      site_id: appointment.site_id,
      client_name: appointment.customer_name || 'לקוח',
      rating,
      comment: text || null,
    });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Save review error:', err);
    return NextResponse.json({ error: 'שגיאה בשמירת הביקורת' }, { status: 500 });
  }
}
