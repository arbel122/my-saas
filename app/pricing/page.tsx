'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import '../ui.css';

const PRO_FEATURES: Array<{ title: string; text: string }> = [
  { title: 'האתר באוויר, עם כתובת קריאה', text: 'כתובת קצרה לפי שם העסק והעיר, לשליחה ללקוחות, לביו באינסטגרם ולסטטוס בוואטסאפ.' },
  { title: 'קביעת תורים אונליין', text: 'לקוחות קובעים לבד לפי השעות והחופשות שלכם, בלי כפל תורים. התור נשמר גם בחשבון הלקוח.' },
  { title: 'צוות ויומן לכל עובד', text: 'מזמינים עובדים בקישור, ולכל אחד יומן, שירותים ומוצרים משלו.' },
  { title: 'ביקורות מלקוחות אמיתיים', text: 'לקוחות שהגיעו לתור מדרגים אותו מהחשבון שלהם, ואתם יכולים להסתיר ביקורת פוגענית.' },
  { title: 'קטלוג מוצרים ושירותים', text: 'תמונות, מחירים, ואשף AI שבונה את רשימת השירותים והמוצרים מכמה שאלות קצרות.' },
  { title: 'תזכורות ללקוחות בוואטסאפ', text: 'לחיצה אחת פותחת הודעת תזכורת מוכנה, כדי שפחות לקוחות ישכחו להגיע.' },
  { title: 'מוכן לגוגל', text: 'כותרות עם התחום והעיר, סימון לגוגל ומפת אתר, כדי שיהיה קל למצוא אתכם.' },
  { title: 'כפתור וואטסאפ וסטטיסטיקות צפיות', text: 'לקוחות פונים אליכם ישירות, ואתם רואים כמה אנשים ביקרו בכל אתר.' },
  { title: 'תמיכה בוואטסאפ', text: 'שואלים ומקבלים עזרה מאיתנו עם האתר.' },
];

const FREE_ON = ['יצירת אתר בעזרת AI בכמה שניות', 'עריכת טקסטים, מחירים, צבעים ושעות פעילות', 'שמירת האתר כטיוטה, בלי הגבלת זמן'];
const FREE_OFF = ['האתר לא גלוי ללקוחות ולא באוויר', 'בלי קביעת תורים, ביקורות וסטטיסטיקות'];

const FAQ: Array<{ q: string; a: string }> = [
  { q: 'צריך לשלם כדי לנסות?', a: 'לא. אפשר ליצור ולערוך את האתר בחינם. תשלום נדרש רק כשמפרסמים.' },
  { q: 'אפשר לבטל?', a: 'כן, בכל רגע, מהדשבורד או מחשבון ה-PayPal. האתר נשאר באוויר עד סוף התקופה ששולמה.' },
  { q: 'מה קורה לאתר אחרי ביטול?', a: 'הוא יורד מהאוויר, אבל האתר והנתונים שלכם נשמרים. אפשר לחדש את המנוי ולהעלות אותו שוב.' },
  { q: 'איך משלמים?', a: 'בתשלום מאובטח דרך PayPal, 29 ₪ בחודש.' },
];

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}
function Dash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 12h12" />
    </svg>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = () => {
    setIsLoading(true);
    router.push('/checkout');
  };

  return (
    <div dir="rtl" className="ui price">
      <div className="price-wrap">
        <nav className="price-top" aria-label="ניווט">
          <button type="button" onClick={() => router.push('/dashboard')} className="ui-link">
            חזרה לדשבורד
          </button>
        </nav>

        <header className="price-head">
          <h1>
            שדרג את העסק שלך ל-<em>Pro</em>
          </h1>
          <p>אתר שמקבל תורים, ביקורות ופניות במקום אחד, ב-29 ₪ בלבד לחודש.</p>
          <p className="price-roi">אם תור אחד אצלכם שווה יותר מ-29 ₪, מספיק תור אחד נוסף בחודש שמגיע דרך האתר כדי שהמנוי ישתלם.</p>
        </header>

        <div className="price-plans">
          <section className="price-plan" aria-labelledby="plan-free">
            <h2 id="plan-free">מסלול בסיסי</h2>
            <p className="price-plan-note">לבנות, לערוך ולראות איך האתר ייראה</p>
            <p className="price-num">
              0<span className="cur">₪</span><small>לחודש</small>
            </p>
            <ul className="price-list">
              {FREE_ON.map((t) => (
                <li key={t}>
                  <Check />
                  <b>{t}</b>
                </li>
              ))}
            </ul>
            <ul className="price-list price-list--off" style={{ marginTop: '-0.6rem' }}>
              {FREE_OFF.map((t) => (
                <li key={t}>
                  <Dash />
                  <b style={{ fontWeight: 500 }}>{t}</b>
                </li>
              ))}
            </ul>
            <button type="button" disabled className="ui-btn ui-btn--quiet ui-btn--block">
              המסלול הנוכחי שלך
            </button>
          </section>

          <section className="price-plan price-plan--pro" aria-labelledby="plan-pro">
            <span className="price-plan-best">הכי משתלם</span>
            <h2 id="plan-pro">מסלול Pro</h2>
            <p className="price-plan-note">לבעלי עסקים שרוצים לקוחות</p>
            <p className="price-num">
              29<span className="cur">₪</span><small>לחודש</small>
            </p>
            <ul className="price-list">
              {PRO_FEATURES.map((feature) => (
                <li key={feature.title}>
                  <Check />
                  <div>
                    <b>{feature.title}</b>
                    <span>{feature.text}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" onClick={handleUpgrade} disabled={isLoading} className="ui-btn ui-btn--lg ui-btn--block">
              {isLoading ? 'פותח דף סליקה...' : 'שדרג עכשיו ל-Pro'}
            </button>
            <p className="price-fine">ביטול בכל רגע, בלי התחייבות.</p>
          </section>
        </div>

        <section className="price-faq" aria-labelledby="faq-title">
          <h2 id="faq-title">שאלות נפוצות</h2>
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}
