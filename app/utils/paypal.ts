// שימוש בצד שרת בלבד.
const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

type BillingCycle = {
  tenure_type?: string;
  pricing_scheme?: { fixed_price?: { value?: string; currency_code?: string } };
};

export type PayPalSubscription = {
  id: string;
  status: string;
  plan_id: string;
  custom_id?: string;
  plan_overridden?: boolean;
  plan?: { billing_cycles?: BillingCycle[] };
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { time?: string };
  };
};

const EXPECTED_PRICE = '29.00';
const EXPECTED_CURRENCY = 'ILS';

// בודק שהמנוי שייך לתוכנית שלנו ושהמחיר לא שונה בצד הלקוח.
// PayPal מאפשר לדפדפן "לדרוס" את התוכנית ביצירת המנוי (מחיר, תקופת ניסיון וכו'),
// ולכן בלי הבדיקה הזו אפשר היה לקבל Pro ב-1 ₪.
export function isGenuineSubscription(sub: PayPalSubscription): boolean {
  if (sub.plan_id !== process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID) return false;
  // כל דריסה של התוכנית (מחיר, תקופת ניסיון חינם, מספר חיובים) נדחית
  if (sub.plan_overridden === true) return false;

  // הגנה נוספת: המחיר החודשי בפועל חייב להיות המחיר שלנו
  const regular = sub.plan?.billing_cycles?.filter((c) => c.tenure_type === 'REGULAR') ?? [];
  for (const c of regular) {
    const p = c.pricing_scheme?.fixed_price;
    if (p?.currency_code !== EXPECTED_CURRENCY || Number(p.value) < Number(EXPECTED_PRICE)) return false;
  }
  return true;
}

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error('PayPal auth failed');
  const data = await res.json();
  return data.access_token;
}

export async function getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}?fields=plan`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
  );

  if (!res.ok) throw new Error('Subscription not found');
  return res.json();
}

// ביטול מנוי אצל PayPal. 422 אומר שהמנוי כבר מבוטל, וזה בסדר (הפעולה אידמפוטנטית).
export async function cancelSubscription(subscriptionId: string, reason: string) {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }
  );
  if (!res.ok && res.status !== 422) throw new Error(`PayPal cancel failed (${res.status})`);
}

export async function verifyWebhookSignature(headers: Headers, event: unknown): Promise<boolean> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: event,
    }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}
