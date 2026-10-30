import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { getUserFromRequest } from '@/app/utils/auth';
import { cancelSubscription, getSubscription } from '@/app/utils/paypal';
import { isStillPaid, periodEnd, setProStatus } from '@/app/utils/pro';

// ביטול מנוי של המשתמש המחובר. האתר נשאר באוויר עד סוף התקופה ששולמה.
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'יש להתחבר כדי לבטל מנוי' }, { status: 401 });
    }

    const { data: row } = await getSupabaseAdmin()
      .from('pro_users')
      .select('paypal_subscription_id, is_active, ends_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!row?.is_active) {
      return NextResponse.json({ error: 'לא נמצא מנוי פעיל' }, { status: 404 });
    }
    if (isStillPaid(row.ends_at)) {
      // כבר בוטל קודם
      return NextResponse.json({ endsAt: row.ends_at });
    }

    // קוראים את מועד החיוב הבא לפני הביטול, כי אחריו PayPal מוחק אותו
    const subscription = await getSubscription(row.paypal_subscription_id);
    const end = periodEnd(subscription);

    await cancelSubscription(row.paypal_subscription_id, 'Cancelled by the customer from the dashboard');

    const keepUntil = isStillPaid(end) ? end : null;
    await setProStatus(user.id, row.paypal_subscription_id, !!keepUntil, keepUntil);

    return NextResponse.json({ endsAt: keepUntil });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return NextResponse.json({ error: 'שגיאה בביטול המנוי. נסו שוב או פנו לתמיכה.' }, { status: 500 });
  }
}
