import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE, getUserFromRequest } from '@/app/utils/auth';
import { getClientIp, isRateLimited } from '@/app/utils/rate-limit';

async function findInvite(token: string) {
  if (!UUID_RE.test(token)) return null;
  const supabase = getSupabaseAdmin();
  const { data: staff } = await supabase.from('site_staff').select('id, site_id, user_id, name, status').eq('invite_token', token).maybeSingle();
  if (!staff) return null;
  const { data: site } = await supabase.from('sites').select('id, name, content').eq('id', staff.site_id).maybeSingle();
  return { supabase, staff, businessName: (site?.content?.businessName as string) || site?.name || 'העסק' };
}

// פרטי ההזמנה (בלי להתחבר): לאיזה עסק מזמינים ומה שמך שם.
export async function GET(req: Request) {
  if (isRateLimited(`invite-get:${getClientIp(req)}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
  }
  const invite = await findInvite(new URL(req.url).searchParams.get('token') ?? '');
  if (!invite) return NextResponse.json({ error: 'ההזמנה לא נמצאה או שבוטלה.' }, { status: 404 });
  return NextResponse.json({ businessName: invite.businessName, staffName: invite.staff.name, claimed: invite.staff.status === 'active' });
}

// אישור ההזמנה: המשתמש המחובר הופך למטפל באתר. כל הזמנה מתאימה למשתמש אחד.
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'יש להתחבר כדי לאשר את ההזמנה.', needsLogin: true }, { status: 401 });
  if (isRateLimited(`invite-claim:${user.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const invite = await findInvite(typeof body?.token === 'string' ? body.token : '');
  if (!invite) return NextResponse.json({ error: 'ההזמנה לא נמצאה או שבוטלה.' }, { status: 404 });

  if (invite.staff.status === 'active') {
    if (invite.staff.user_id === user.id) return NextResponse.json({ success: true, businessName: invite.businessName });
    return NextResponse.json({ error: 'ההזמנה כבר נוצלה על ידי משתמש אחר.' }, { status: 409 });
  }

  // משתמש לא יכול להיות מטפל פעמיים באותו אתר
  const { data: existing } = await invite.supabase
    .from('site_staff')
    .select('id')
    .eq('site_id', invite.staff.site_id)
    .eq('user_id', user.id)
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'אתם כבר רשומים כמטפלים בעסק הזה.' }, { status: 409 });
  }

  // התנאי status=invited מבטיח שרק בקשה אחת תצליח גם אם שתיים מגיעות יחד
  const { data, error } = await invite.supabase
    .from('site_staff')
    .update({ user_id: user.id, status: 'active' })
    .eq('id', invite.staff.id)
    .eq('status', 'invited')
    .select('id');
  if (error) {
    console.error('Claim invite error:', error);
    return NextResponse.json({ error: 'שגיאה באישור ההזמנה' }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'ההזמנה כבר נוצלה.' }, { status: 409 });
  }
  return NextResponse.json({ success: true, businessName: invite.businessName });
}
