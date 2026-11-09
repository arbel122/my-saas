import Link from 'next/link';
import Logo from './Logo';
import '../ui.css';

export function MailIcon() {
  return (
    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7.5 12 13l8.5-5.5" />
    </svg>
  );
}

// מעטפת משותפת לדפי הכניסה (התחברות, שחזור סיסמה, סיסמה חדשה): אותו לילה כמו דף הבית.
// בדסקטופ מוצג לצד הטופס אתר הדוגמה האמיתי של המספרה, כדי שיהיה ברור מה מקבלים.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="ui auth">
      <div className="auth-main">
        <Link href="/" className="auth-logo" aria-label="Opnyx, דף הבית">
          <Logo size={36} />
        </Link>
        <div className="auth-box">{children}</div>
      </div>
      <aside className="auth-panel" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/salon.jpg" alt="" width={560} height={1120} className="auth-panel-img" />
        <div>
          <h2>האתר של העסק שלך, מוכן ב-10 שניות.</h2>
          <p>ה-AI שלנו מתאים את העיצוב והתמונות בדיוק למקצוע שלך.</p>
        </div>
      </aside>
    </div>
  );
}
