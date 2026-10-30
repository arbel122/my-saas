import { getSupabaseAdmin } from './supabase-admin';

// מקור האמת היחיד לסטטוס Pro: הטבלה pro_users, שנכתבת רק מהשרת.
export async function setProStatus(userId: string, subscriptionId: string, active: boolean) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('pro_users').upsert({
    user_id: userId,
    paypal_subscription_id: subscriptionId,
    is_active: active,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  const { error: sitesError } = await supabaseAdmin
    .from('sites')
    .update({ is_pro: active })
    .eq('user_id', userId);
  if (sitesError) throw sitesError;
}
