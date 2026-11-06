// מראה האתר לפי תחום העסק. כך מספרה, משרד עורכי דין וקצביה לא נראים אותו דבר.
// משמש גם את האתר הציבורי (SiteView) וגם את העורך (create), כדי שמה שרואים בעריכה הוא מה שהלקוחות רואים.

export type SitePreset = 'beauty' | 'professional' | 'food' | 'trades' | 'fitness' | 'general';

export type SiteLook = {
  preset: SitePreset;
  /** מחלקת גופן לכותרות */
  heading: string;
  /** רדיוס כרטיסים */
  card: string;
  /** רדיוס תמונת הפתיחה */
  hero: string;
  /** רדיוס כפתורים */
  button: string;
  /** יישור טקסט הפתיחה */
  heroAlign: 'center' | 'start';
  /** כמה צבע המותג נמהל ברקעים בהירים (0-1) */
  tint: number;
};

const KEYWORDS: Array<[SitePreset, RegExp]> = [
  ['professional', /עורך דין|עורכת דין|עו"ד|משרד|רואה חשבון|רו"ח|יועץ|יועצת|ייעוץ|נוטריון|תיווך|ביטוח|אדריכל|פסיכולוג|מס הכנסה|הנהלת חשבונות|משפט/],
  ['beauty', /מספר|שיער|קוסמט|ציפורנ|איפור|יופי|ספא|עיסוי|מניקור|פדיקור|גבות|קליניק|טיפוח|הסרת שיער/],
  ['food', /קצב|מאפי|מסעד|קפה|בשר|קונדיטור|קייטרינג|פיצ|אוכל|שף|בר |מזון|ירקות|דגים|חלב/],
  ['trades', /שיפוצ|אינסטלצ|חשמל|מזגנ|שרברב|מנעולן|הובלות|ניקיון|גינון|צבעי|נגר|טכנאי|תיקונ|גגות|איטום|הדברה|שירותים לבית/],
  ['fitness', /כושר|אימון|מאמן|יוגה|פילאטיס|ספורט|קרוספיט|ריצה|אומנויות לחימה/],
];

export function detectPreset(siteData: any): SitePreset {
  const text = [siteData?.industry, siteData?.businessName, ...(siteData?.services ?? []).map((s: any) => s?.name)].filter(Boolean).join(' ');
  for (const [preset, re] of KEYWORDS) if (re.test(text)) return preset;
  return 'general';
}

const SERIF = 'font-[family-name:var(--font-serif-he)]';
const DISPLAY = 'font-[family-name:var(--font-display-he)]';
const BOLD = 'font-[family-name:var(--font-bold-he)]';
const BODY = 'font-[family-name:var(--font-body-he)]';

const LOOKS: Record<SitePreset, Omit<SiteLook, 'preset'>> = {
  beauty: { heading: `${SERIF} font-medium`, card: 'rounded-3xl', hero: 'rounded-[2rem]', button: 'rounded-full', heroAlign: 'center', tint: 0.07 },
  professional: { heading: `${SERIF} font-bold`, card: 'rounded-md', hero: 'rounded-lg', button: 'rounded-md', heroAlign: 'start', tint: 0.04 },
  food: { heading: `${DISPLAY}`, card: 'rounded-xl', hero: 'rounded-2xl', button: 'rounded-xl', heroAlign: 'center', tint: 0.09 },
  trades: { heading: `${BOLD} font-extrabold`, card: 'rounded-lg', hero: 'rounded-xl', button: 'rounded-lg', heroAlign: 'start', tint: 0.06 },
  fitness: { heading: `${BOLD} font-extrabold`, card: 'rounded-xl', hero: 'rounded-xl', button: 'rounded-lg', heroAlign: 'start', tint: 0.08 },
  general: { heading: `${BODY} font-extrabold`, card: 'rounded-2xl', hero: 'rounded-3xl', button: 'rounded-full', heroAlign: 'center', tint: 0.06 },
};

export function siteLook(siteData: any): SiteLook {
  const preset = detectPreset(siteData);
  return { preset, ...LOOKS[preset] };
}

// גופן הגוף של האתר
export const SITE_BODY_FONT = BODY;

// מערבב את צבע המותג עם לבן, לרקע בהיר עם גוון של העסק במקום אפור גנרי
export function tintColor(hex: string | undefined, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return '#f8fafc';
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(255 - (255 - c) * amount);
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('');
}
