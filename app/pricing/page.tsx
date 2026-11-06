'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

const FAQ: Array<{ q: string; a: string }> = [
  { q: 'צריך לשלם כדי לנסות?', a: 'לא. אפשר ליצור ולערוך את האתר בחינם. תשלום נדרש רק כשמפרסמים.' },
  { q: 'אפשר לבטל?', a: 'כן, בכל רגע, מהדשבורד או מחשבון ה-PayPal. האתר נשאר באוויר עד סוף התקופה ששולמה.' },
  { q: 'מה קורה לאתר אחרי ביטול?', a: 'הוא יורד מהאוויר, אבל האתר והנתונים שלכם נשמרים. אפשר לחדש את המנוי ולהעלות אותו שוב.' },
  { q: 'איך משלמים?', a: 'בתשלום מאובטח דרך PayPal, 29 ₪ בחודש.' },
];

export default function PricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = () => {
    setIsLoading(true);
    router.push('/checkout');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* תפריט ניווט עליון חזר לדשבורד */}
      <nav className="p-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-500 hover:text-gray-900 transition font-medium flex items-center gap-2"
        >
          <span>→</span>
          חזרה לדשבורד
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            שדרג את העסק שלך ל-<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Pro</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            אתר שמקבל תורים, ביקורות ופניות במקום אחד, ב-29 ₪ בלבד לחודש.
          </p>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mt-3">
            אם תור אחד אצלכם שווה יותר מ-29 ₪, מספיק תור אחד נוסף בחודש שמגיע דרך האתר כדי שהמנוי ישתלם.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto justify-center items-center md:items-stretch">

          {/* כרטיס חינם */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm w-full max-w-md flex flex-col">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">מסלול בסיסי</h3>
            <p className="text-gray-500 mb-6">לבנות, לערוך ולראות איך האתר ייראה</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-gray-900">0₪</span>
              <span className="text-gray-500 font-medium"> / לחודש</span>
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-gray-700">
                <span className="text-green-500">✓</span> יצירת אתר בעזרת AI בכמה שניות
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <span className="text-green-500">✓</span> עריכת טקסטים, מחירים, צבעים ושעות פעילות
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <span className="text-green-500">✓</span> שמירת האתר כטיוטה, בלי הגבלת זמן
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <span className="text-gray-500">✖</span> האתר לא גלוי ללקוחות ולא באוויר
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <span className="text-gray-500">✖</span> בלי קביעת תורים, ביקורות וסטטיסטיקות
              </li>
            </ul>

            <button
              disabled
              className="w-full py-4 rounded-xl font-bold bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed"
            >
              המסלול הנוכחי שלך
            </button>
          </div>

          {/* כרטיס Pro */}
          <div className="bg-gradient-to-b from-blue-900 to-indigo-900 rounded-3xl p-1 border border-blue-700 shadow-2xl shadow-blue-900/30 w-full max-w-md flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-400 to-indigo-400 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
              הכי משתלם
            </div>

            <div className="bg-white rounded-[23px] p-8 flex flex-col h-full">
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">מסלול Pro</h3>
              <p className="text-gray-500 mb-6">לבעלי עסקים שרוצים לקוחות</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-gray-900">29₪</span>
                <span className="text-gray-500 font-medium"> / לחודש</span>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature.title} className="flex items-start gap-3">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>
                      <span className="block text-gray-800 font-bold">{feature.title}</span>
                      <span className="block text-sm text-gray-500 leading-relaxed">{feature.text}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-transform ${
                  isLoading
                    ? 'bg-blue-400 cursor-not-allowed opacity-70'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:scale-105'
                }`}
              >
                {isLoading ? 'פותח דף סליקה...' : 'שדרג עכשיו ל-Pro'}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">ביטול בכל רגע, בלי התחייבות.</p>
            </div>
          </div>

        </div>

        <section className="max-w-3xl mx-auto mt-24" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-8">שאלות נפוצות</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-1">{item.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
