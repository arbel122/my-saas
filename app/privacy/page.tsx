export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">מדיניות פרטיות 🔒</h1>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          אנו מכבדים את פרטיות המשתמשים בשירותינו. מסמך זה מסביר איזה מידע אנו אוספים, כיצד אנו משתמשים בו ומהן הזכויות שלך בנוגע למידע זה.
        </p>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">1. איסוף המידע</h2>
        <p className="text-slate-600 mb-4 leading-relaxed">
          בעת הרשמה ויצירת אתר במערכת, אנו עשויים לאסוף פרטים מזהים כגון: שם מלא, כתובת אימייל, מספר טלפון, שם העסק ופרטי התקשרות. פרטי תשלום (כגון כרטיס אשראי או פייפאל) מבוצעים ומעובדים באופן מאובטח ישירות דרך ספקי התשלום המורשים (PayPal) ואינם נשמרים בשרתים שלנו.
        </p>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">2. השימוש במידע</h2>
        <p className="text-slate-600 mb-4 leading-relaxed">
          המידע שנאסף משמש אותנו לצורך:
        </p>
        <ul className="list-disc list-inside text-slate-600 space-y-2 mb-6">
          <li>אספקת השירות ותפעול האתרים שנבנו במערכת.</li>
          <li>ניהול חיובים ומנויים חודשיים.</li>
          <li>מתן תמיכה טכנית ושירות לקוחות.</li>
          <li>שליחת עדכונים קריטיים לגבי השירות.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">3. עוגיות (Cookies) וזיכרון מקומי</h2>
        <p className="text-slate-600 mb-4 leading-relaxed">
          המערכת משתמשת בעוגיות וב-LocalStorage לשמירת העדפות גלישה, שמירת טיוטות האתר בעת עריכה ואבטחת ההתחברות. ניתן לנטרל עוגיות בהגדרות הדפדפן, אך חלק מרכיבי השירות עלולים שלא לפעול כראוי.
        </p>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">4. צור קשר</h2>
        <p className="text-slate-600">
          לכל שאלה, בקשה לעיון במידע או מחיקת מידע, ניתן לפנות אלינו במייל:
          <br />
          📧 support@yourdomain.com
        </p>
      </div>
    </div>
  );
}