import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { getSubscription } from '@/app/utils/paypal';
import { setProStatus } from '@/app/utils/pro';

export async function POST(req: Request) {
  try {
    const accessToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!accessToken) {
      return NextResponse.json({ error: 'יש להתחבר כדי להמשיך' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'יש להתחבר כדי להמשיך' }, { status: 401 });
    }

    const { subscriptionId } = (await req.json().catch(() => null)) ?? {};
    if (typeof subscriptionId !== 'string' || !subscriptionId) {
      return NextResponse.json({ error: 'חסר מזהה מנוי' }, { status: 400 });
    }

    // אימות מול PayPal עצמו, לא סומכים על מה שהדפדפן אומר
    const subscription = await getSubscription(subscriptionId);

    if (
      subscription.plan_id !== process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID ||
      subscription.custom_id !== user.id
    ) {
      return NextResponse.json({ error: 'המנוי לא תואם למשתמש' }, { status: 403 });
    }

    if (subscription.status !== 'ACTIVE') {
      // PayPal עדיין מעבד את התשלום. ה-webhook יפעיל את המנוי ברגע שיאושר.
      return NextResponse.json({ pending: true }, { status: 202 });
    }

    await setProStatus(user.id, subscription.id, true);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('PayPal activate error:', err);
    return NextResponse.json({ error: 'שגיאה באימות התשלום' }, { status: 500 });
  }
}
