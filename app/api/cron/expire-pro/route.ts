import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { setProStatus } from '@/app/utils/pro';

// משימה יומית (Vercel Cron): מורידה מהאוויר אתרים של מנויים שהתקופה ששולמה להם נגמרה.
// Vercel שולח את CRON_SECRET בכותרת Authorization, ובלעדיו הנתיב סגור.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('pro_users')
    .select('user_id, paypal_subscription_id')
    .eq('is_active', true)
    .lt('ends_at', new Date().toISOString());

  if (error) {
    console.error('Expire pro error:', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  for (const row of data ?? []) {
    await setProStatus(row.user_id, row.paypal_subscription_id, false);
  }
  return NextResponse.json({ expired: data?.length ?? 0 });
}
