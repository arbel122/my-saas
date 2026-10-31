import { israelNow } from './schedule';

// "2026-11-10 בשעה 11:30 (תספורת)" -> "10/11/2026 בשעה 11:30 (תספורת)"
export function formatApptDate(text: string) {
  return (text || '').replace(/^(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1');
}

// מספר ישראלי (050..., +972...) לפורמט בינלאומי בלי + ובלי 0, או '' אם לא תקין
export function toWhatsappNumber(phone: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 9) return '';
  if (digits.startsWith('972')) return digits;
  return digits.startsWith('0') ? `972${digits.slice(1)}` : `972${digits}`;
}

// ההודעה המוכנה שהעסק שולח ללקוח. הקישור מוביל לאתר, ושם "התורים שלי" מאפשר לבטל.
export function reminderMessage(opts: { customerName: string; businessName: string; date: string; siteUrl: string }) {
  const name = opts.customerName ? ` ${opts.customerName}` : '';
  return (
    `שלום${name}, תזכורת לתור שלך ב${opts.businessName}: ${formatApptDate(opts.date)}.\n` +
    `נשמח לראות אותך! אם צריך לבטל, אפשר דרך "התורים שלי" באתר:\n${opts.siteUrl}`
  );
}

export function reminderUrl(phone: string, message: string) {
  const number = toWhatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '';
}

// "היום" / "מחר" לתור, לפי שעון ישראל. מחזיר null לשאר התאריכים.
export function dayLabel(startsAt: string | null | undefined) {
  if (!startsAt) return null;
  const day = startsAt.slice(0, 10);
  const today = israelNow().date;
  if (day === today) return 'היום';
  const tomorrow = new Date(`${today}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return day === tomorrow.toISOString().slice(0, 10) ? 'מחר' : null;
}
