import Link from 'next/link';
import HomeNavActions from '@/app/components/HomeNavActions';
import Logo from '@/app/components/Logo';

export default function HomePage() {
  return (
    <div dir="rtl" className="relative overflow-x-hidden min-h-screen bg-[#070b19] text-white font-sans scroll-smooth">
      {/* תפריט ניווט עליון */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 cursor-pointer">
          <Link href="/">
            <Logo size={34} />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#how-it-works" className="hover:text-white transition-colors cursor-pointer">
            איך זה עובד?
          </a>
          <a href="#templates" className="hover:text-white transition-colors cursor-pointer">
            דוגמאות לאתרים
          </a>
          <a href="#guide" className="hover:text-white transition-colors cursor-pointer">
            מדריך
          </a>
          <Link href="/terms" className="hover:text-white transition-colors">
            תקנון
          </Link>
        </div>

        <HomeNavActions />
      </nav>

      {/* אזור התוכן המרכזי (Hero) */}
      <main className="flex flex-col items-center justify-center pt-24 pb-32 px-6 text-center relative z-10">
        <div className="border border-blue-500/30 bg-blue-500/10 text-blue-300 px-5 py-1.5 rounded-full text-sm font-medium mb-8 flex items-center gap-2">
          <span>✨</span> המהפכה של בניית האתרים בישראל
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-slate-100">
          האתר של העסק שלך, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            מוכן ב-10 שניות.
          </span>
        </h1>
        
        <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl mb-12 font-light leading-relaxed">
          למה לשלם אלפי שקלים ולחכות חודשים? פשוט תגיד לבינה המלאכותית שלנו מה העסק שלך, ותקבל אתר מעוצב, מהיר ומוכן להביא לקוחות.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <Link 
            href="/create" 
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-full shadow-xl shadow-blue-600/30 transition-transform hover:scale-105 text-lg"
          >
            צור אתר בחינם עכשיו
          </Link>
          <a href="#how-it-works" className="text-slate-500 text-sm flex items-center gap-2 hover:text-slate-300 transition-colors mt-2 cursor-pointer">
            ↓ איך זה עובד?
          </a>
        </div>
      </main>

      {/* אזור איך זה עובד */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/5 scroll-mt-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-slate-100">
          איך זה עובד? <span className="text-blue-500">ב-3 שלבים פשוטים</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="text-7xl font-black text-white/5 absolute -top-4 left-4 group-hover:text-blue-500/10 transition-colors">1</div>
            <h3 className="text-xl font-bold mb-3 text-white">מספרים על העסק</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              מקלידים משפט אחד או שניים על העסק, השירותים שאתה נותן ואיפה אתה נמצא. זהו, זה כל מה שאנחנו צריכים.
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="text-7xl font-black text-white/5 absolute -top-4 left-4 group-hover:text-blue-500/10 transition-colors">2</div>
            <h3 className="text-xl font-bold mb-3 text-white">ה-AI נכנס לפעולה</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              המערכת שלנו כותבת תוכן שיווקי, מוצאת תמונות מדהימות ויוקרתיות, ומעצבת הכל לאתר מודרני בשניות בודדות.
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="text-7xl font-black text-white/5 absolute -top-4 left-4 group-hover:text-blue-500/10 transition-colors">3</div>
            <h3 className="text-xl font-bold mb-3 text-white">האתר באוויר (ולידים!)</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              מקבלים אתר מוכן הכולל מחירון, אזור שירות, וכפתור חיבור ישיר לוואטסאפ שלך כדי להתחיל לקבל פניות מיד.
            </p>
          </div>
        </div>
      </section>

      {/* אזור דוגמאות לאתרים */}
      <section id="templates" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/5 scroll-mt-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
            דוגמאות לאתרים <span className="text-purple-400">שנוצרו בשניות</span>
          </h2>
          <p className="text-slate-400">ה-AI שלנו מתאים את העיצוב והתמונות בדיוק למקצוע שלך.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/demo/salon" className="block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:scale-105 transition-transform group">
            <div className="h-48 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80" alt="עיצוב שיער" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">מספרה ועיצוב שיער</h3>
              <p className="text-sm text-slate-400">תמונות אווירה איכותיות, רשימת טיפולים וקביעת תורים אונליין.</p>
              <span className="inline-block mt-4 text-sm font-bold text-purple-400">צפה באתר הדוגמה ←</span>
            </div>
          </Link>

          <Link href="/demo/lawyer" className="block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:scale-105 transition-transform group">
            <div className="h-48 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80" alt="משרד עורכי דין" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">משרד עורכי דין</h3>
              <p className="text-sm text-slate-400">עיצוב יוקרתי ונקי, פירוט תחומי התמחות ויצירת קשר מיידית לייעוץ.</p>
              <span className="inline-block mt-4 text-sm font-bold text-purple-400">צפה באתר הדוגמה ←</span>
            </div>
          </Link>

          <Link href="/demo/home-services" className="block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:scale-105 transition-transform group">
            <div className="h-48 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80" alt="שירותי ניקיון ושיפוץ" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">שירותים לבית ושיפוצים</h3>
              <p className="text-sm text-slate-400">הצגת השירות, מחירון וקליטת פניות מהירה ישר מהשטח.</p>
              <span className="inline-block mt-4 text-sm font-bold text-purple-400">צפה באתר הדוגמה ←</span>
            </div>
          </Link>
        </div>
      </section>

      {/* מדריך: איך יוצרים אתר */}
      <section id="guide" className="py-24 px-6 max-w-4xl mx-auto relative z-10 border-t border-white/5 scroll-mt-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
            מדריך: <span className="text-blue-400">איך יוצרים אתר לעסק</span>
          </h2>
          <p className="text-slate-400">מההרשמה ועד אתר חי עם קישור ללקוחות. לוקח כמה דקות.</p>
        </div>

        <ol className="space-y-5">
          {[
            {
              title: 'נכנסים וצוללים ישר פנימה',
              text: 'לוחצים על "צור אתר בחינם עכשיו". אפשר ליצור ולערוך את האתר בלי לשלם. תשלום נדרש רק ברגע הפרסום.',
            },
            {
              title: 'מתארים את העסק',
              text: 'כותבים כמה משפטים: מה העסק עושה, אילו שירותים יש ובאיזה אזור. ככל שהתיאור מדויק יותר, האתר יצא טוב יותר.',
            },
            {
              title: 'עונים על שתי שאלות קצרות',
              text: 'האם הלקוחות יכולים לקבוע תור אונליין? האם יש לך מוצרים למכירה? לפי התשובות האתר יכלול יומן תורים, קטלוג מוצרים, או את שניהם.',
            },
            {
              title: 'ה-AI בונה את האתר',
              text: 'תוך שניות מקבלים אתר שלם: כותרת, טקסט על העסק, שירותים עם מחירים, תמונות וכפתור וואטסאפ.',
            },
            {
              title: 'עורכים ומתאימים',
              text: 'משנים טקסטים ומחירים ישירות באתר, בוחרים צבע שמתאים למותג, וקובעים שעות פעילות וימי חופש. כך הלקוחות יראו רק שעות פנויות אמיתיות.',
            },
            {
              title: 'מפרסמים ומקבלים קישור',
              text: 'המנוי עולה 29 ₪ לחודש בתשלום מאובטח דרך PayPal, ואפשר לבטל בכל רגע. מיד אחרי התשלום האתר באוויר ומקבלים קישור לשלוח ללקוחות, לשים בביו באינסטגרם או בסטטוס בוואטסאפ.',
            },
            {
              title: 'מנהלים מהדשבורד',
              text: 'בדשבורד רואים את התורים שנקבעו, כמה אנשים ביקרו באתר, ואת הביקורות מהלקוחות. אפשר להסתיר ביקורת, לערוך את האתר ולנהל את המנוי.',
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-5 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">
                {i + 1}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <h3 className="font-bold text-blue-300 mb-3">טיפים לאתר שמביא לקוחות</h3>
          <ul className="space-y-2 text-sm text-slate-300 list-disc pr-5">
            <li>כתבו בתיאור את העיר או האזור שבו אתם עובדים.</li>
            <li>הכניסו מחירים אמיתיים. לקוחות סומכים יותר על מחיר ברור.</li>
            <li>הגדירו מספר וואטסאפ שאתם עונים בו, כדי לקבל פניות ותורים ישר לטלפון.</li>
            <li>בקשו מלקוחות מרוצים לכתוב ביקורת אחרי התור. ביקורות מגדילות אמון.</li>
          </ul>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/create"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-full shadow-xl shadow-blue-600/30 transition-transform hover:scale-105 text-lg"
          >
            מתחילים ליצור את האתר
          </Link>
        </div>
      </section>

      {/* פוטר */}
      <footer className="border-t border-white/10 py-8 text-center text-slate-500 text-sm relative z-10 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-6 gap-4">
        <p>© 2026 Opnyx. כל הזכויות שמורות.</p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-slate-300 transition-colors">תקנון ותנאי שימוש</Link>
          <Link href="/login" className="hover:text-slate-300 transition-colors">התחברות</Link>
        </div>
      </footer>
      
      {/* אפקט תאורה ברקע */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
    </div>
  );
} 