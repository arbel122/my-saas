import { getSupabaseAdmin } from './supabase-admin';
import type { PayPalSubscription } from './paypal';

// מקור האמת היחיד לסטטוס Pro: הטבלה pro_users, שנכתבת רק מהשרת.
// endsAt: מנוי שבוטל נשאר פעיל עד סוף התקופה ששולמה, ואז מוריד אותו המשימה היומית.
export async function setProStatus(
  userId: string,
  subscriptionId: string,
  active: boolean,
  endsAt: string | null = null
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('pro_users').upsert({
    user_id: userId,
    paypal_subscription_id: subscriptionId,
    is_active: active,
    ends_at: active ? endsAt : null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  const { error: sitesError } = await supabaseAdmin
    .from('sites')
    .update({ is_pro: active })
    .eq('user_id', userId);
  if (sitesError) throw sitesError;
}

// מתי נגמרת התקופה ששולמה: מועד החיוב הבא, ואם אין, חודש אחרי התשלום האחרון.
export function periodEnd(subscription: PayPalSubscription): string | null {
  const next = subscription.billing_info?.next_billing_time;
  if (next) return next;

  const last = subscription.billing_info?.last_payment?.time;
  if (!last) return null;
  const end = new Date(last);
  end.setMonth(end.getMonth() + 1);
  return end.toISOString();
}

export function isStillPaid(endsAt: string | null | undefined) {
  return !!endsAt && new Date(endsAt).getTime() > Date.now();
}
