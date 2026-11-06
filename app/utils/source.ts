// מקור ההגעה של גולש לאתר העסק (אינסטגרם, גוגל, ישיר...), לסטטיסטיקות של בעל העסק.

const MAX = 40;

// ניקוי בצד השרת: טקסט קצר וללא תווים מוזרים
export function cleanSource(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase().replace(/[^a-z0-9א-ת._-]/g, '').slice(0, MAX);
  return text || null;
}

const KNOWN: Array<[RegExp, string]> = [
  [/instagram|^l\.instagram/, 'instagram'],
  [/facebook|^l\.facebook|^m\.facebook|fb\.com/, 'facebook'],
  [/google|goo\.gl|g\.page/, 'google'],
  [/whatsapp|wa\.me/, 'whatsapp'],
  [/tiktok/, 'tiktok'],
  [/t\.co$|twitter|x\.com/, 'x'],
];

function fromHost(host: string) {
  const clean = host.replace(/^www\./, '');
  for (const [re, name] of KNOWN) if (re.test(clean)) return name;
  return clean;
}

// נקבע פעם אחת בכניסה לאתר ונשמר בדפדפן: utm_source, אחרת האתר שממנו הגיעו, אחרת "ישיר"
export function getVisitSource(): string {
  if (typeof window === 'undefined') return 'direct';
  try {
    const saved = sessionStorage.getItem('opnyx_src');
    if (saved) return saved;
    const params = new URLSearchParams(window.location.search);
    let source = cleanSource(params.get('utm_source')) || '';
    if (!source && document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) source = cleanSource(fromHost(host)) || '';
    }
    source = source || 'direct';
    sessionStorage.setItem('opnyx_src', source);
    return source;
  } catch {
    return 'direct';
  }
}

export function trackSiteEvent(siteId: string, type: 'whatsapp' | 'phone') {
  try {
    const body = JSON.stringify({ type, source: getVisitSource() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`/api/sites/${encodeURIComponent(siteId)}/event`, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(`/api/sites/${encodeURIComponent(siteId)}/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    }
  } catch {
    // סטטיסטיקה היא רק תוספת, לא חוסמים את הלקוח
  }
}

export const SOURCE_LABELS: Record<string, string> = {
  direct: 'כניסה ישירה',
  instagram: 'אינסטגרם',
  facebook: 'פייסבוק',
  google: 'גוגל',
  whatsapp: 'וואטסאפ',
  tiktok: 'טיקטוק',
  x: 'X',
};
