import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הצהרת נגישות | Opnyx',
  description: 'הצהרת הנגישות והתאמות הנגישות שבוצעו באתר Opnyx',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">הצהרת נגישות ♿</h1>

        <p className="text-slate-600 mb-6 leading-relaxed">
          אנו פועלים רבות על מנת להנגיש את האתר והשירותים שלנו לאנשים עם מוגבלות, במטרה לאפשר לכלל האוכלוסייה גלישה נוחה ונגישה.
        </p>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">התאמות הנגישות שבוצעו באתר:</h2>
        <ul className="list-disc list-inside text-slate-600 space-y-2 mb-6">
          <li>סרגל נגישות המאפשר הגדלת טקסט ושינוי ניגודיות.</li>
          <li>התאמה מלאה לגלישה באמצעות מקלדת.</li>
          <li>תמיכה בקוראי מסך ומבנה נתונים תקני.</li>
          <li>עיצוב מותאם למכשירים ניידים וטאבלטים.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">פרטי רכז/ת נגישות ליצירת קשר:</h2>
        <p className="text-slate-600">
          אם נתקלתם בבעיית נגישות או שיש לכם הצעה לשיפור, נשמח שתפנו אלינו:
          <br />
          📧 דוא"ל: arbelmo2012@gmail.com
        </p>
      </div>
    </div>
  );
}