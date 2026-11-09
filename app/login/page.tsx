'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';
import AuthShell, { MailIcon } from '../components/AuthShell';
import PasswordField from '../components/PasswordField';
import ForgotPassword from '../components/ForgotPassword';
import { PASSWORD_RULE_TEXT, passwordProblem } from '../utils/password';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<{ email: string; password: string } | null>(null);
  const [forgot, setForgot] = useState(false);
  const router = useRouter();

  // חזרה לדף שממנו הגיעו (רק נתיב פנימי באתר, למניעת הפניה לאתר זר)
  const goNext = () => {
    const next = new URLSearchParams(window.location.search).get('next');
    router.push(next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
  };

  // אחרי הרשמה: מחכים לאימות המייל, גם אם הקישור נפתח בדפדפן או במשתמש אחר, ואז מתחברים לבד
  useEffect(() => {
    if (!pending) return;
    let done = false;
    let last = 0;
    const started = Date.now();
    const check = async () => {
      if (done || Date.now() - last < 4000) return;
      last = Date.now();
      const { error } = await supabase.auth.signInWithPassword(pending);
      if (!error) {
        done = true;
        goNext();
      } else if (Date.now() - started > 15 * 60 * 1000) {
        done = true;
        setPending(null);
        setIsLogin(true);
        setNotice('עבר זמן רב. אם אימתם את המייל, התחברו כאן.');
      }
    };
    const timer = setInterval(check, 15000);
    const onFocus = () => document.visibilityState === 'visible' && check();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      done = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  // קישור "צור חשבון" מדף הבית פותח ישר את מצב ההרשמה
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') setIsLogin(false);
    if (params.get('confirmed') === '1') {
      // חזרה מקישור האימות במייל: אם נפתחה התחברות מהקישור נכנסים ישר, אחרת מבקשים להתחבר
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) router.push('/dashboard');
        else setNotice('האימייל אומת בהצלחה. עכשיו אפשר להתחבר.');
      });
    }
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        goNext();
      } else {
        const problem = passwordProblem(password);
        if (problem) throw new Error(problem);

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/login?confirmed=1` },
        });
        if (error) throw error;

        setPending({ email, password });
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'אירעה שגיאה. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  if (forgot) {
    return (
      <ForgotPassword initialEmail={email} onBack={() => setForgot(false)} />
    );
  }

  if (pending) {
    return (
      <AuthShell>
        <MailIcon />
        <h1>שלחנו לכם מייל לאימות</h1>
        <p className="auth-sub">
          שלחנו קישור אל <span dir="ltr" style={{ fontWeight: 700 }}>{pending.email}</span>. פתחו אותו ולחצו על הקישור, באותו דפדפן או בכל מקום אחר. אם לא הגיע, בדקו בספאם.
        </p>
        <p className="ui-hint">העמוד הזה ימשיך אוטומטית ברגע שהמייל יאומת, אין צורך לחזור ולהתחבר.</p>
        <div className="auth-wait" role="status">
          <span className="ui-spin ui-spin--blue" aria-hidden="true" />
          ממתינים לאימות...
        </div>
        <p className="auth-switch">
          <button type="button" onClick={() => { setPending(null); setIsLogin(true); }} className="ui-link">
            חזרה להתחברות
          </button>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1>{isLogin ? 'ברוכים השבים' : 'פותחים חשבון חינם'}</h1>
      <p className="auth-sub">
        {isLogin ? 'התחברו כדי לנהל את האתר, התורים והביקורות.' : 'אפשר ליצור ולערוך את האתר בלי לשלם. תשלום רק בפרסום.'}
      </p>

      {notice && <div role="status" className="ui-alert ui-alert--good">{notice}</div>}
      {error && <div role="alert" className="ui-alert ui-alert--error">{error}</div>}

      <form onSubmit={handleAuth}>
        <div className="ui-field">
          <label htmlFor="login-email" className="ui-label">כתובת אימייל</label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            className="ui-input"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
          />
        </div>

        <PasswordField
          label="סיסמה"
          value={password}
          onChange={setPassword}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          hint={isLogin ? undefined : PASSWORD_RULE_TEXT}
        />
        {isLogin && (
          <div className="auth-aux">
            <button type="button" onClick={() => { setError(''); setForgot(true); }} className="ui-link">
              שכחתי סיסמה
            </button>
          </div>
        )}

        <button type="submit" disabled={loading} className="ui-btn ui-btn--lg ui-btn--block auth-submit">
          {loading ? <span className="ui-spin" aria-hidden="true" /> : null}
          {isLogin ? 'היכנס לחשבון' : 'צור חשבון חדש'}
        </button>
      </form>

      <p className="auth-switch">
        {isLogin ? 'עדיין אין לך חשבון?' : 'כבר יש לך חשבון?'}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="ui-link"
        >
          {isLogin ? 'הרשם עכשיו' : 'התחבר כאן'}
        </button>
      </p>
    </AuthShell>
  );
}
