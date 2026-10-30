import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE } from '@/app/utils/auth';
import { getClientIp, isRateLimited } from '@/app/utils/rate-limit';
import { freeSlots, isBookingEnabled, parseDurationMinutes, toMinutes } from '@/app/utils/schedule';

type ServiceItem = { name?: string; duration?: string };

// שעות פנויות ביום נתון לשירות נתון, לפי שעות הפעילות, החריגות והתורים הקיימים.
export async function GET(req: Request) {
  if (isRateLimited(`avail:${getClientIp(req)}`, 300, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get('siteId') ?? '';
  const date = searchParams.get('date') ?? '';
  const service = searchParams.get('service') ?? '';

  if (!UUID_RE.test(siteId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: site } = await supabase.from('sites').select('content, is_pro').eq('id', siteId).maybeSingle();
  if (!site) {
    return NextResponse.json({ error: 'האתר לא נמצא' }, { status: 404 });
  }
  if (site.is_pro !== true) {
    return NextResponse.json({ error: 'האתר עדיין לא פורסם' }, { status: 403 });
  }
  if (!isBookingEnabled(site.content)) {
    return NextResponse.json({ error: 'קביעת תורים לא פעילה באתר הזה' }, { status: 403 });
  }

  const services: ServiceItem[] = Array.isArray(site.content?.services) ? site.content.services : [];
  const selected = services.find((s) => s.name === service);
  if (!selected) {
    return NextResponse.json({ error: 'שירות לא נמצא' }, { status: 400 });
  }
  const duration = parseDurationMinutes(selected.duration);

  const { data: rows } = await supabase
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('site_id', siteId)
    .gte('starts_at', `${date}T00:00:00`)
    .lt('starts_at', `${date}T23:59:59`);

  const booked = (rows ?? [])
    .filter((r) => r.starts_at && r.ends_at)
    .map((r) => ({ start: toMinutes(r.starts_at.slice(11, 16)), end: toMinutes(r.ends_at.slice(11, 16)) }));

  return NextResponse.json({ slots: freeSlots(site.content, date, duration, booked), duration });
}
