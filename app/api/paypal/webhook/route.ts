import { NextResponse } from 'next/server';
import { getSubscription, isGenuineSubscription, verifyWebhookSignature } from '@/app/utils/paypal';
import { isStillPaid, periodEnd, setProStatus } from '@/app/utils/pro';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';

const ACTIVATING_EVENTS = ['BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.RE-ACTIVATED'];
const CANCELLED_EVENT = 'BILLING.SUBSCRIPTION.CANCELLED';
const DEACTIVATING_EVENTS = ['BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.EXPIRED'];

export async function POST(req: Request) {
  try {
    const event = JSON.parse(await req.text());

    if (!(await verifyWebhookSignature(req.headers, event))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const eventType: string = event.event_type;
    const known = [...ACTIVATING_EVENTS, ...DEACTIVATING_EVENTS, CANCELLED_EVENT];
    if (!known.includes(eventType)) {
      return NextResponse.json({ received: true });
    }

    // מושכים את המצב העדכני מ-PayPal במקום לסמוך על תוכן האירוע
    const subscription = await getSubscription(event.resource.id);

    if (!isGenuineSubscription(subscription) || !subscription.custom_id) {
      return NextResponse.json({ received: true });
    }
    const userId = subscription.custom_id;

    if (ACTIVATING_EVENTS.includes(eventType)) {
      await setProStatus(userId, subscription.id, subscription.status === 'ACTIVE');
    } else if (eventType === CANCELLED_EVENT) {
      // מנוי שבוטל נשאר פעיל עד סוף התקופה ששולמה. אם כבר קבענו תאריך סיום (ביטול מהדשבורד), לא דורסים אותו.
      const { data: row } = await getSupabaseAdmin()
        .from('pro_users')
        .select('ends_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!isStillPaid(row?.ends_at)) {
        const end = periodEnd(subscription);
        await setProStatus(userId, subscription.id, isStillPaid(end), isStillPaid(end) ? end : null);
      }
    } else {
      await setProStatus(userId, subscription.id, false);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('PayPal webhook error:', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
