import Link from 'next/link';
import HomeNavActions from '@/app/components/HomeNavActions';

export default function HomePage() {
  return (
    <div dir="rtl" className="relative overflow-x-hidden min-h-screen bg-[#070b19] text-white font-sans scroll-smooth">
      {/* תפריט ניווט עליון */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 cursor-pointer">
          <Link href="/">
            <span className="text-2xl font-black tracking-tight">
              Site<span className="text-purple-400">-AI</span>
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#how-it-works" className="hover:text-white transition-colors cursor-pointer">
            איך זה עובד?
          </a>
          <a href="#templates" className="hover:text-white transition-colors cursor-pointer">
            דוגמאות לאתרים
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
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:scale-105 transition-transform cursor-pointer group">
            <div className="h-48 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80" alt="עיצוב שיער" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">מספרה ועיצוב שיער</h3>
              <p className="text-sm text-slate-400">תמונות אווירה איכותיות, רשימת טיפולים וכפתור תור בוואטסאפ מובנה.</p>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:scale-105 transition-transform cursor-pointer group">
            <div className="h-48 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80" alt="משרד עורכי דין" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">משרד עורכי דין</h3>
              <p className="text-sm text-slate-400">עיצוב יוקרתי ונקי, פירוט תחומי התמחות ויצירת קשר מיידית לייעוץ.</p>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:scale-105 transition-transform cursor-pointer group hidden lg:block">
            <div className="h-48 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80" alt="שירותי ניקיון ושיפוץ" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">שירותים לבית ושיפוצים</h3>
              <p className="text-sm text-slate-400">הצגת השירות, אזורי פעילות בארץ וקליטת לידים מהירה ישר מהשטח.</p>
            </div>
          </div>
        </div>
      </section>

      {/* פוטר */}
      <footer className="border-t border-white/10 py-8 text-center text-slate-500 text-sm relative z-10 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-6 gap-4">
        <p>© 2026 Site-AI. כל הזכויות שמורות.</p>
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