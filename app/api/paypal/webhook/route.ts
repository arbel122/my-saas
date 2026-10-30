import { NextResponse } from 'next/server';
import { getSubscription, verifyWebhookSignature } from '@/app/utils/paypal';
import { setProStatus } from '@/app/utils/pro';

const ACTIVATING_EVENTS = ['BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.RE-ACTIVATED'];
const DEACTIVATING_EVENTS = [
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.EXPIRED',
];

export async function POST(req: Request) {
  try {
    const event = JSON.parse(await req.text());

    if (!(await verifyWebhookSignature(req.headers, event))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const eventType: string = event.event_type;
    if (!ACTIVATING_EVENTS.includes(eventType) && !DEACTIVATING_EVENTS.includes(eventType)) {
      return NextResponse.json({ received: true });
    }

    // מושכים את המצב העדכני מ-PayPal במקום לסמוך על תוכן האירוע
    const subscription = await getSubscription(event.resource.id);

    if (subscription.plan_id !== process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || !subscription.custom_id) {
      return NextResponse.json({ received: true });
    }

    await setProStatus(subscription.custom_id, subscription.id, subscription.status === 'ACTIVE');
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('PayPal webhook error:', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
