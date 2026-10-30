export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">תקנון ותנאי שימוש 📜</h1>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          ברוכים הבאים לפלטפורמה לבניית אתרים. השימוש בשירות מותנה בהסכמתך לתנאים המפורטים בתקנון זה.
        </p>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">1. תשלומים ומנוי חודשי</h2>
        <p className="text-slate-600 mb-4 leading-relaxed">
          השימוש במערכת והעלאת האתר לאוויר כרוכים בתשלום מנוי חודשי מתחדש (29 ₪ / חודש). החיוב מבוצע מראש בכל חודש באמצעות פייפאל או אמצעי תשלום מורשה אחר.
        </p>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">2. ביטול מנוי והפסקת תשלום</h2>
        <p className="text-slate-600 mb-4 leading-relaxed">
          הלקוח רשאי לבטל את המנוי בכל עת דרך הגדרות החשבון או הפורטל. בעת ביטול המנוי, החיוב החודשי יופסק ולא יבוצעו חיובים נוספים. האתר יישאר פעיל עד לתום תקופת החיוב ששולמה.
        </p>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">3. אחריות על תוכן האתר</h2>
        <p className="text-slate-600 mb-4 leading-relaxed">
          המשתמש נושא באחריות הבלעדית לכל התוכן (טקסטים, תמונות, מחירים, פרטי התקשרות) שמועלים על ידו לאתר. חל איסור מוחלט להעלות תוכן בלתי חוקי, מפר זכויות יוצרים, פוגעני או מטעה.
        </p>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">4. הגבלת אחריות</h2>
        <p className="text-slate-600 mb-4 leading-relaxed">
          אנו עושים את מירב המאמצים להבטיח זמינות מרבית של האתרים והשרתים, אך איננו אחראים לנזק ישיר או עקיף שעלול להיגרם עקב תקלות רשת, נפילת שרתים או שיבושים מחוץ לשליטתנו.
        </p>

        <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">5. יצירת קשר ותמיכה</h2>
        <p className="text-slate-600">
          לפניות בנושאי תקנון, חיובים ותמיכה טכנית:
          <br />
          📧 support@yourdomain.com
        </p>
      </div>
    </div>
  );
}