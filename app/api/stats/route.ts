import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { getUserFromRequest } from '@/app/utils/auth';
import { israelNow } from '@/app/utils/schedule';

const DAYS = 30;

function addCount(map: Map<string, number>, key: string | null | undefined) {
  const k = key || 'direct';
  map.set(k, (map.get(k) ?? 0) + 1);
}

// סטטיסטיקות לבעל העסק על כל האתרים שלו: צפיות, פניות (וואטסאפ וטלפון), תורים, ומאיפה הגיעו.
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: sites } = await supabase.from('sites').select('id, views, is_pro').eq('user_id', user.id);
  const siteIds = (sites ?? []).map((s) => s.id);
  const views = (sites ?? []).reduce((sum, s) => sum + (s.views ?? 0), 0);
  if (siteIds.length === 0) {
    return NextResponse.json({ views: 0, whatsapp: 0, phone: 0, appointmentsMonth: 0, appointments30: 0, sources: [], tracking: true });
  }

  const sinceDate = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const month = israelNow().date.slice(0, 7);

  // תורים: מהחודש הקודם והלאה, כדי לכסות גם חודש וגם 30 יום אחרונים
  const monthStart = `${month}-01T00:00:00`;
  const sinceLocal = sinceDate.toISOString().slice(0, 19);
  const from = sinceLocal < monthStart ? sinceLocal : monthStart;

  let appts: Array<{ starts_at: string | null; source?: string | null }> = [];
  const withSource = await supabase.from('appointments').select('starts_at, source').in('site_id', siteIds).gte('starts_at', from);
  if (withSource.error) {
    // העמודה source עוד לא קיימת (SQL לא הורץ)
    const plain = await supabase.from('appointments').select('starts_at').in('site_id', siteIds).gte('starts_at', from);
    appts = plain.data ?? [];
  } else {
    appts = withSource.data ?? [];
  }

  const sources = new Map<string, number>();
  let appointmentsMonth = 0;
  let appointments30 = 0;
  for (const a of appts) {
    const start = a.starts_at ?? '';
    if (start.startsWith(month)) appointmentsMonth++;
    if (start >= sinceLocal) {
      appointments30++;
      if (a.source) addCount(sources, a.source);
    }
  }

  // לחיצות על וואטסאפ וטלפון
  let whatsapp = 0;
  let phone = 0;
  let tracking = true;
  const events = await supabase.from('site_events').select('type, source').in('site_id', siteIds).gte('created_at', sinceDate.toISOString());
  if (events.error) {
    tracking = false;
  } else {
    for (const e of events.data ?? []) {
      if (e.type === 'whatsapp') whatsapp++;
      if (e.type === 'phone') phone++;
      addCount(sources, e.source);
    }
  }

  return NextResponse.json({
    views,
    whatsapp,
    phone,
    appointmentsMonth,
    appointments30,
    sources: [...sources.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([source, count]) => ({ source, count })),
    tracking,
  });
}
