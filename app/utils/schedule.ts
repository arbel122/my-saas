// לוגיקת שעות פעילות וחלונות תור. קוד טהור, משותף לשרת ולדפדפן.

export type Schedule = { days: number[]; open: string; close: string };
export type Closure = { date: string; from?: string; to?: string };

export const DEFAULT_SCHEDULE: Schedule = { days: [0, 1, 2, 3, 4], open: '09:00', close: '19:00' };
export const SLOT_STEP_MIN = 30;

const DAY_NAMES = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function toTime(minutes: number): string {
  const m = Math.max(0, Math.min(minutes, 24 * 60 - 1));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// "60 דקות" / "45" / "שעה" / "שעה וחצי" / "1.5 שעות" -> דקות. ברירת מחדל: 60.
export function parseDurationMinutes(text?: string): number {
  if (!text) return 60;
  const t = String(text).replace(',', '.');
  const num = parseFloat(t.match(/\d+(\.\d+)?/)?.[0] ?? '');
  let minutes = 60;

  if (/שעתיים/.test(t)) minutes = 120;
  else if (/שעה|שעות|hour/i.test(t)) {
    if (!Number.isNaN(num)) minutes = Math.round(num * 60);
    else minutes = /וחצי/.test(t) ? 90 : 60;
  } else if (!Number.isNaN(num)) minutes = Math.round(num);

  const rounded = Math.ceil(minutes / 15) * 15;
  return Math.max(15, Math.min(rounded, 480));
}

export function getSchedule(content: unknown): Schedule {
  const raw = (content as { schedule?: Partial<Schedule> } | null)?.schedule;
  if (!raw) return DEFAULT_SCHEDULE;

  const days = Array.isArray(raw.days)
    ? Array.from(new Set(raw.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))).sort()
    : [];
  const open = typeof raw.open === 'string' && TIME_RE.test(raw.open) ? raw.open : DEFAULT_SCHEDULE.open;
  const close = typeof raw.close === 'string' && TIME_RE.test(raw.close) ? raw.close : DEFAULT_SCHEDULE.close;

  if (days.length === 0 || toMinutes(open) >= toMinutes(close)) return DEFAULT_SCHEDULE;
  return { days, open, close };
}

export function getClosures(content: unknown): Closure[] {
  const raw = (content as { closures?: unknown } | null)?.closures;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is Closure =>
      !!c &&
      typeof c.date === 'string' &&
      DATE_RE.test(c.date) &&
      (c.from === undefined || c.from === '' || TIME_RE.test(c.from)) &&
      (c.to === undefined || c.to === '' || TIME_RE.test(c.to))
  );
}

export function isBookingEnabled(content: unknown): boolean {
  return (content as { bookingEnabled?: boolean } | null)?.bookingEnabled !== false;
}

// 0 = ראשון ... 6 = שבת
export function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

// "ימים א'-ה': 09:00 - 19:00"
export function formatSchedule(schedule: Schedule): string {
  const runs: string[] = [];
  let i = 0;
  while (i < schedule.days.length) {
    let j = i;
    while (j + 1 < schedule.days.length && schedule.days[j + 1] === schedule.days[j] + 1) j++;
    runs.push(j - i >= 2 ? `${DAY_NAMES[schedule.days[i]]}-${DAY_NAMES[schedule.days[j]]}` : schedule.days.slice(i, j + 1).map((d) => DAY_NAMES[d]).join(', '));
    i = j + 1;
  }
  return `ימים ${runs.join(', ')}: ${schedule.open} - ${schedule.close}`;
}

// התאריך והשעה עכשיו בישראל, בלי תלות באזור הזמן של השרת.
export function israelNow(): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

// האם התור כבר התחיל (שעון ישראל). תורים ישנים בלי שעת התחלה נחשבים כמי שהתקיימו.
export function hasStarted(startsAt?: string | null): boolean {
  if (!startsAt) return true;
  const now = israelNow();
  return startsAt.slice(0, 19) <= `${now.date}T${toTime(now.minutes)}:00`;
}

// כל שעות ההתחלה האפשריות ביום נתון לפי השעות והחריגות, לפני בדיקת תורים תפוסים.
export function generateSlots(content: unknown, date: string, durationMin: number): string[] {
  const schedule = getSchedule(content);
  if (!DATE_RE.test(date) || !schedule.days.includes(dayOfWeek(date))) return [];

  const closedRanges: Array<[number, number]> = [];
  for (const closure of getClosures(content)) {
    if (closure.date !== date) continue;
    if (!closure.from || !closure.to) return [];
    closedRanges.push([toMinutes(closure.from), toMinutes(closure.to)]);
  }

  const slots: string[] = [];
  const closeMin = toMinutes(schedule.close);
  for (let start = toMinutes(schedule.open); start + durationMin <= closeMin; start += SLOT_STEP_MIN) {
    const end = start + durationMin;
    if (closedRanges.some(([from, to]) => start < to && end > from)) continue;
    slots.push(toTime(start));
  }
  return slots;
}

// מסנן שעות שכבר עברו (אם התאריך הוא היום) ושעות שחופפות לתורים קיימים.
export function freeSlots(
  content: unknown,
  date: string,
  durationMin: number,
  booked: Array<{ start: number; end: number }>
): string[] {
  const now = israelNow();
  if (date < now.date) return [];

  return generateSlots(content, date, durationMin).filter((time) => {
    const start = toMinutes(time);
    const end = start + durationMin;
    if (date === now.date && start <= now.minutes) return false;
    return !booked.some((b) => start < b.end && end > b.start);
  });
}
