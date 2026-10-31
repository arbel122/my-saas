// אתרי הדוגמה שמופיעים בדף הבית (/demo/[slug]). תוכן קבוע, לא נשמר במסד הנתונים.

export type DemoSite = {
  slug: string;
  content: Record<string, unknown>;
};

export const DEMO_SITES: DemoSite[] = [
  {
    slug: 'salon',
    content: {
      businessName: 'סטודיו נועה',
      heroTitle: 'שיער שמרגיש כמו בבית',
      heroSubtitle: 'תספורות, צבע וטיפולי שיער בסטודיו אישי ורגוע בלב תל אביב',
      aboutText:
        'סטודיו נועה הוא מספרה קטנה ואישית שמתמחה בצבע, תספורות ושיקום שיער.\nאצלנו כל לקוחה מקבלת זמן, ייעוץ כנה ותוצאה שמתאימה לה באמת.',
      workingHours: 'א׳-ה׳ 09:00-19:00',
      themeColor: '#be185d',
      generatedImageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1600&q=80',
      contactPhone: '',
      bookingEnabled: true,
      showServices: true,
      services: [
        { name: 'תספורת ועיצוב', description: 'ייעוץ, חפיפה, תספורת וייבוש בפן.', duration: '45 דקות', price: 'החל מ-120 ₪' },
        { name: 'צבע ושיער בהיר', description: 'צבע מלא, גוונים או החלקה בצבע, עם חומרים איכותיים.', duration: '120 דקות', price: 'החל מ-380 ₪' },
        { name: 'טיפול שיקום וקרטין', description: 'טיפול עמוק לשיער יבש ופגום להחזרת הברק והרכות.', duration: '90 דקות', price: 'החל מ-300 ₪' },
      ],
      catalog: [
        {
          id: 'care',
          name: 'מוצרי טיפוח',
          items: [
            { name: 'שמפו לשיער צבוע', description: 'שומר על הצבע ועל הברק', price: '85 ₪' },
            { name: 'מסכה מזינה', description: 'טיפול שבועי לשיער יבש', price: '110 ₪' },
          ],
        },
      ],
    },
  },
  {
    slug: 'lawyer',
    content: {
      businessName: 'כהן ושות׳ משרד עורכי דין',
      heroTitle: 'ייצוג משפטי מקצועי, בגובה העיניים',
      heroSubtitle: 'דיני משפחה, נדל״ן וחוזים. פגישת ייעוץ ראשונה ללא עלות',
      aboutText:
        'משרדנו מלווה לקוחות פרטיים ועסקים כבר למעלה מ-15 שנה.\nאנחנו מאמינים בשקיפות מלאה, בתקשורת פתוחה ובפתרונות שמתאימים למצב האמיתי שלך.',
      workingHours: 'א׳-ה׳ 09:00-17:00',
      themeColor: '#1e3a8a',
      generatedImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=80',
      contactPhone: '',
      bookingEnabled: true,
      showServices: true,
      services: [
        { name: 'פגישת ייעוץ ראשונה', description: 'היכרות עם המקרה והצגת האפשרויות העומדות בפניך.', duration: '30 דקות', price: 'ללא עלות' },
        { name: 'דיני משפחה', description: 'גירושין, משמורת, הסכמי ממון וצוואות.', duration: '60 דקות', price: 'לפי הצעת מחיר' },
        { name: 'נדל״ן וחוזים', description: 'ליווי בעסקאות מקרקעין, בדיקת חוזים וניסוח הסכמים.', duration: '60 דקות', price: 'לפי הצעת מחיר' },
      ],
    },
  },
  {
    slug: 'home-services',
    content: {
      businessName: 'שיפוצי דוד',
      heroTitle: 'שיפוצים ותיקונים לבית, בלי כאב ראש',
      heroSubtitle: 'צביעה, ריצוף, אינסטלציה וחשמל. הצעת מחיר מהירה וגמר נקי',
      aboutText:
        'מעל 20 שנה שאנחנו משפצים בתים ודירות בכל אזור המרכז.\nעבודה נקייה, עמידה בזמנים ומחיר שקוף מההתחלה.',
      workingHours: 'א׳-ו׳ 07:00-18:00',
      themeColor: '#ea580c',
      generatedImageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=80',
      contactPhone: '',
      bookingEnabled: false,
      showServices: true,
      services: [
        { name: 'צביעה ושיפוץ דירות', description: 'צביעה, תיקוני קירות ושיפוץ מלא של דירה או חדר.', price: 'הצעת מחיר חינם' },
        { name: 'אינסטלציה', description: 'תיקון נזילות, החלפת ברזים וחיבור מכשירים.', price: 'החל מ-250 ₪' },
        { name: 'חשמל וריצוף', description: 'תיקוני חשמל, החלפת שקעים והנחת ריצוף.', price: 'הצעת מחיר חינם' },
      ],
    },
  },
];

export function getDemoSite(slug: string): DemoSite | undefined {
  return DEMO_SITES.find((d) => d.slug === slug);
}
