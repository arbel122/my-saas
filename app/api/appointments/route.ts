import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE } from '@/app/utils/auth';
import { getClientIp, isRateLimited } from '@/app/utils/rate-limit';
import {
  generateSlots,
  isBookingEnabled,
  israelNow,
  parseDurationMinutes,
  toMinutes,
  toTime,
} from '@/app/utils/schedule';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type ServiceItem = { name?: string; duration?: string };

// קביעת תור מהאתר הציבורי. השרת מחליט אם השעה חוקית (ימי פעילות, חריגות, משך השירות),
// ואילוץ במסד מונע חפיפה עם תור אחר גם אם שתי בקשות הגיעו באותו רגע.
export async function POST(req: Request) {
  try {
    if (isRateLimited(`book:${getClientIp(req)}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'יותר מדי ניסיונות. נסו שוב מאוחר יותר.' }, { status: 429 });
    }

    const body = await req.json();
    const { siteId, service, date, time, customerName, customerPhone } = body ?? {};

    if (typeof siteId !== 'string' || !UUID_RE.test(siteId)) {
      return NextResponse.json({ error: 'אתר לא תקין' }, { status: 400 });
    }
    if (typeof service !== 'string' || !service.trim() || service.length > 100) {
      return NextResponse.json({ error: 'נא לבחור שירות' }, { status: 400 });
    }
    if (typeof date !== 'string' || !DATE_RE.test(date) || typeof time !== 'string' || !TIME_RE.test(time)) {
      return NextResponse.json({ error: 'תאריך או שעה לא תקינים' }, { status: 400 });
    }

    const name = typeof customerName === 'string' ? customerName.trim().replace(/\s+/g, ' ') : '';
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: 'נא להזין שם מלא' }, { status: 400 });
    }

    const phone = typeof customerPhone === 'string' ? customerPhone.replace(/[^\d]/g, '') : '';
    if (phone.length < 9 || phone.length > 15) {
      return NextResponse.json({ error: 'מספר הטלפון לא תקין' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: site } = await supabase
      .from('sites')
      .select('id, content')
      .eq('id', siteId)
      .maybeSingle();
    if (!site) {
      return NextResponse.json({ error: 'האתר לא נמצא' }, { status: 404 });
    }
    if (!isBookingEnabled(site.content)) {
      return NextResponse.json({ error: 'קביעת תורים לא פעילה באתר הזה' }, { status: 403 });
    }

    // משך השירות נקבע לפי האתר, לא לפי מה שהדפדפן שולח
    const services: ServiceItem[] = Array.isArray(site.content?.services) ? site.content.services : [];
    const selected = services.find((s) => s.name === service.trim());
    if (!selected) {
      return NextResponse.json({ error: 'השירות לא נמצא' }, { status: 400 });
    }
    const duration = parseDurationMinutes(selected.duration);

    const now = israelNow();
    const startMin = toMinutes(time);
    if (date < now.date || (date === now.date && startMin <= now.minutes)) {
      return NextResponse.json({ error: 'המועד שבחרת כבר עבר' }, { status: 400 });
    }

    if (!generateSlots(site.content, date, duration).includes(time)) {
      return NextResponse.json({ error: 'העסק לא פעיל בשעה הזו. אנא בחרו שעה אחרת.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        site_id: siteId,
        customer_name: name,
        customer_phone: phone,
        date: `${date} בשעה ${time} (${service.trim()})`,
        slot_key: `${date} ${time}`,
        starts_at: `${date}T${time}:00`,
        ends_at: `${date}T${toTime(startMin + duration)}:00`,
      })
      .select('id, token')
      .single();

    if (error) {
      // 23P01 = חפיפה עם תור אחר, 23505 = אותה שעת התחלה
      if (error.code === '23P01' || error.code === '23505') {
        return NextResponse.json({ error: 'השעה הזו כבר תפוסה. אנא בחרו שעה אחרת.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ id: data.id, token: data.token, duration });
  } catch (err) {
    console.error('Book appointment error:', err);
    return NextResponse.json({ error: 'שגיאה בקביעת התור' }, { status: 500 });
  }
}
