import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { getUserFromRequest } from '@/app/utils/auth';
import { israelNow } from '@/app/utils/schedule';
import { siteServiceNames } from '@/app/utils/staff';

// הדשבורד של המטפל: העסקים שהוא עובד בהם, השירותים שהוא עושה, והתורים הקרובים שלו.
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'יש להתחבר.', needsLogin: true }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase
    .from('site_staff')
    .select('id, site_id, name, services')
    .eq('user_id', user.id)
    .eq('status', 'active');
  if (error || !rows || rows.length === 0) return NextResponse.json({ memberships: [] });

  const { data: sites } = await supabase.from('sites').select('id, name, content').in('id', rows.map((r) => r.site_id));
  const today = israelNow().date;

  const memberships = await Promise.all(
    rows.map(async (row) => {
      const site = (sites ?? []).find((s) => s.id === row.site_id);
      const { data: appts } = await supabase
        .from('appointments')
        .select('id, customer_name, customer_phone, date, starts_at')
        .eq('staff_id', row.id)
        .gte('starts_at', `${today}T00:00:00`)
        .order('starts_at', { ascending: true })
        .limit(200);
      return {
        staffId: row.id,
        siteId: row.site_id,
        businessName: (site?.content?.businessName as string) || site?.name || 'העסק',
        myName: row.name,
        allServices: siteServiceNames(site?.content),
        services: row.services,
        appointments: (appts ?? []).map((a) => ({
          id: a.id,
          customerName: a.customer_name,
          customerPhone: a.customer_phone,
          date: a.date,
          startsAt: a.starts_at,
        })),
      };
    })
  );

  return NextResponse.json({ memberships });
}
