'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';
import Logo from '../components/Logo';
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
        else setNotice('האימייל אומת בהצלחה ✅ עכשיו אפשר להתחבר.');
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
      <ForgotPassword
        initialEmail={email}
        onBack={() => setForgot(false)}
        onDone={() => {
          setForgot(false);
          goNext();
        }}
      />
    );
  }

  if (pending) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="w-full max-w-md p-8 m-4 bg-white rounded-[2rem] shadow-xl border border-gray-100 text-center space-y-5">
          <h1 className="flex justify-center pr-3">
            <Logo size={48} tone="light" />
          </h1>
          <div className="text-5xl" aria-hidden="true">✉️</div>
          <h2 className="text-2xl font-extrabold text-gray-900">שלחנו לכם מייל לאימות</h2>
          <p className="text-gray-600">
            שלחנו קישור אל <span className="font-bold text-gray-900" dir="ltr">{pending.email}</span>. פתחו אותו ולחצו על הקישור, באותו דפדפן או בכל מקום אחר.
          </p>
          <p className="text-sm text-gray-500">העמוד הזה ימשיך אוטומטית ברגע שהמייל יאומת, אין צורך לחזור ולהתחבר.</p>
          <div className="flex items-center justify-center gap-3 text-sm font-bold text-blue-700">
            <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            ממתינים לאימות...
          </div>
          <button
            type="button"
            onClick={() => { setPending(null); setIsLogin(true); }}
            className="text-sm font-bold text-gray-500 underline py-2 px-1"
          >
            חזרה להתחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden font-sans">

      {/* רקע עם צורות מטושטשות סטייל SaaS */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md p-8 m-4 bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 relative z-10">
        
        <div className="text-center mb-10">
          <h1 className="flex justify-center pr-3">
            <Logo size={56} tone="light" />
          </h1>
          <span className="inline-block mt-4 text-[11px] font-bold tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5">
            ✦ INSTANT WEBSITES
          </span>
          <p className="text-gray-500 mt-2 font-medium">
            {isLogin ? 'ברוכים השבים למערכת' : 'הצטרפו למהפכת האתרים'}
          </p>
        </div>

        {notice && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-bold text-center">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">כתובת אימייל</label>
            <input
              type="email"
              required
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>
          
          <div>
            <PasswordField
              label="סיסמה"
              value={password}
              onChange={setPassword}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              hint={isLogin ? undefined : PASSWORD_RULE_TEXT}
            />
            {isLogin && (
              <button
                type="button"
                onClick={() => { setError(''); setForgot(true); }}
                className="mt-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline py-1"
              >
                שכחתי סיסמה
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isLogin ? 'היכנס לחשבון' : 'צור חשבון חדש'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {isLogin ? 'עדיין אין לך חשבון? ' : 'כבר יש לך חשבון? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors ml-1 py-2 px-1"
            >
              {isLogin ? 'הרשם עכשיו' : 'התחבר כאן'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}