import Link from 'next/link';
import HomeNavActions from '@/app/components/HomeNavActions';
import Logo from '@/app/components/Logo';
import './home.css';

const SHOPS = [
  {
    href: '/demo/salon',
    img: '/home/salon.jpg',
    alt: 'אתר הדוגמה של מספרה: כותרת, תמונה וכפתור לקביעת תור',
    title: 'מספרה ועיצוב שיער',
    text: 'תמונות אווירה איכותיות, רשימת טיפולים וקביעת תורים אונליין.',
  },
  {
    href: '/demo/lawyer',
    img: '/home/lawyer.jpg',
    alt: 'אתר הדוגמה של משרד עורכי דין: כותרת בסריף ותמונה כהה',
    title: 'משרד עורכי דין',
    text: 'עיצוב יוקרתי ונקי, פירוט תחומי התמחות ויצירת קשר מיידית לייעוץ.',
  },
  {
    href: '/demo/home-services',
    img: '/home/home-services.jpg',
    alt: 'אתר הדוגמה של שיפוצים: כותרת בולטת ותמונת חדר רחצה',
    title: 'שירותים לבית ושיפוצים',
    text: 'הצגת השירות, מחירון וקליטת פניות מהירה ישר מהשטח.',
  },
];

const STEPS = [
  {
    title: 'מספרים על העסק',
    text: 'מקלידים משפט אחד או שניים על העסק, השירותים שאתה נותן ואיפה אתה נמצא. זהו, זה כל מה שאנחנו צריכים.',
  },
  {
    title: 'ה-AI נכנס לפעולה',
    text: 'המערכת שלנו כותבת תוכן שיווקי, מוצאת תמונות מדהימות ויוקרתיות, ומעצבת הכל לאתר מודרני בשניות בודדות.',
  },
  {
    title: 'האתר באוויר (ולידים!)',
    text: 'מקבלים אתר מוכן הכולל מחירון, אזור שירות, וכפתור חיבור ישיר לוואטסאפ שלך כדי להתחיל לקבל פניות מיד.',
  },
];

const GUIDE = [
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
    price: true,
  },
  {
    title: 'מנהלים מהדשבורד',
    text: 'בדשבורד רואים את התורים שנקבעו, כמה אנשים ביקרו באתר, ואת הביקורות מהלקוחות. אפשר להסתיר ביקורת, לערוך את האתר ולנהל את המנוי.',
  },
];

const TIPS = [
  'כתבו בתיאור את העיר או האזור שבו אתם עובדים.',
  'הכניסו מחירים אמיתיים. לקוחות סומכים יותר על מחיר ברור.',
  'הגדירו מספר וואטסאפ שאתם עונים בו, כדי לקבל פניות ותורים ישר לטלפון.',
  'בקשו מלקוחות מרוצים לכתוב ביקורת אחרי התור. ביקורות מגדילות אמון.',
];

export default function HomePage() {
  return (
    <div dir="rtl" className="home">
      {/* ניווט */}
      <div className="home-wrap">
        <nav className="home-nav" aria-label="ניווט ראשי">
          <Link href="/" aria-label="Opnyx, דף הבית">
            <Logo size={36} />
          </Link>

          <div className="home-nav__links">
            <a href="#how-it-works">איך זה עובד?</a>
            <a href="#templates">דוגמאות לאתרים</a>
            <a href="#guide">מדריך</a>
            <Link href="/terms">תקנון</Link>
          </div>

          <HomeNavActions />
        </nav>
      </div>

      <main>
        {/* פתיחה */}
        <div className="home-wrap home-hero">
          <h1>האתר של העסק שלך, מוכן ב-10 שניות.</h1>
          <p className="home-hero__sub">
            למה לשלם אלפי שקלים ולחכות חודשים? פשוט תגיד לבינה המלאכותית שלנו מה העסק שלך, ותקבל אתר מעוצב, מהיר ומוכן להביא לקוחות.
          </p>
          <div className="home-actions">
            <Link href="/create" className="home-btn home-btn--lg">
              צור אתר בחינם עכשיו
            </Link>
            <a href="#how-it-works" className="home-textlink">
              איך זה עובד?
            </a>
          </div>
        </div>

        {/* רחוב החנויות: אתרי דוגמה אמיתיים */}
        <section id="templates" className="home-street">
          <div className="home-wrap home-street__grid">
            <div>
              <h2>דוגמאות לאתרים שנוצרו בשניות</h2>
              <p className="home-street__lead">ה-AI שלנו מתאים את העיצוב והתמונות בדיוק למקצוע שלך.</p>
            </div>
            <div className="home-street__row">
              {SHOPS.map((shop) => (
                <Link key={shop.href} href={shop.href} className="home-shop">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shop.img} alt={shop.alt} width={560} height={1120} className="home-shop__img" loading="lazy" />
                  <h3>{shop.title}</h3>
                  <p>{shop.text}</p>
                  <span className="home-shop__go">צפה באתר הדוגמה</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* איך זה עובד */}
        <section id="how-it-works" className="home-how">
          <div className="home-wrap">
            <h2>איך זה עובד? ב-3 שלבים פשוטים</h2>
            <ol className="home-how__list">
              {STEPS.map((step, i) => (
                <li key={step.title} className="home-how__item">
                  <span className="home-how__n" aria-hidden="true">{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* מדריך: איך יוצרים אתר */}
        <section id="guide" className="home-guide">
          <div className="home-wrap home-guide__grid">
            <div className="home-guide__head">
              <h2>מדריך: איך יוצרים אתר לעסק</h2>
              <p className="home-guide__lead">מההרשמה ועד אתר חי עם קישור ללקוחות. לוקח כמה דקות.</p>
              <div className="home-guide__cta">
                <Link href="/create" className="home-btn home-btn--lg">
                  מתחילים ליצור את האתר
                </Link>
              </div>
            </div>

            <div>
              <ol className="home-guide__steps">
                {GUIDE.map((step) => (
                  <li key={step.title} className="home-step">
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                    {step.price && (
                      <span className="home-step__price" aria-hidden="true">
                        29<span className="cur">₪</span><small>לחודש</small>
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              <div className="home-tips">
                <h3>טיפים לאתר שמביא לקוחות</h3>
                <ul>
                  {TIPS.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* פוטר */}
      <footer className="home-footer">
        <div className="home-wrap home-footer__inner">
          <p>© 2026 Opnyx. כל הזכויות שמורות.</p>
          <div className="home-footer__links">
            <Link href="/terms">תקנון ותנאי שימוש</Link>
            <Link href="/login">התחברות</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
