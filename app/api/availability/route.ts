import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE } from '@/app/utils/auth';
import { getClientIp, isRateLimited } from '@/app/utils/rate-limit';
import { freeSlots, isBookingEnabled, parseDurationMinutes, toMinutes } from '@/app/utils/schedule';
import { getActiveStaff, staffForService } from '@/app/utils/staff';

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

  const toBooked = (rows: Array<{ starts_at: string | null; ends_at: string | null }> | null) =>
    (rows ?? [])
      .filter((r) => r.starts_at && r.ends_at)
      .map((r) => ({ start: toMinutes((r.starts_at as string).slice(11, 16)), end: toMinutes((r.ends_at as string).slice(11, 16)) }));

  // עסק עם צוות: שעה פנויה אם לפחות מטפל אחד שעושה את השירות פנוי בה (או המטפל שנבחר)
  const staff = await getActiveStaff(supabase, siteId);
  if (staff.length > 0) {
    let candidates = staffForService(staff, service);
    const staffId = searchParams.get('staffId') ?? '';
    if (staffId && staffId !== 'any') candidates = candidates.filter((s) => s.id === staffId);
    if (candidates.length === 0) {
      return NextResponse.json({ error: 'אין מטפל שעושה את השירות הזה' }, { status: 400 });
    }

    const { data: rows } = await supabase
      .from('appointments')
      .select('staff_id, starts_at, ends_at')
      .in('staff_id', candidates.map((c) => c.id))
      .gte('starts_at', `${date}T00:00:00`)
      .lt('starts_at', `${date}T23:59:59`);

    const union = new Set<string>();
    for (const c of candidates) {
      const mine = toBooked((rows ?? []).filter((r) => r.staff_id === c.id));
      for (const slot of freeSlots(site.content, date, duration, mine)) union.add(slot);
    }
    return NextResponse.json({ slots: [...union].sort(), duration });
  }

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
