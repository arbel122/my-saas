'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import { PASSWORD_RULE_TEXT, passwordProblem } from '../utils/password';
import Logo from '../components/Logo';
import PasswordField from '../components/PasswordField';

type State = 'checking' | 'ready' | 'invalid';

// הדף שאליו מוביל הקישור מהמייל "שכחתי סיסמה": בוחרים סיסמה חדשה ונכנסים לחשבון.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<State>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // קישור שפג תוקפו או שכבר נוצל חוזר עם שגיאה בכתובת
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hash.get('error') || hash.get('error_code')) {
      setState('invalid');
      return;
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) setState('ready');
    });
    // אם האירוע כבר עבר לפני שהדף נרשם אליו, בודקים אם יש חיבור פעיל
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setState('ready');
    });
    const timer = setTimeout(() => setState((s) => (s === 'checking' ? 'invalid' : s)), 6000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirm) return setError('שתי הסיסמאות לא זהות.');

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'לא הצלחנו להחליף את הסיסמה. נסו שוב.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="w-full max-w-md p-8 m-4 bg-white rounded-[2rem] shadow-xl border border-gray-100 space-y-6">
        <h1 className="flex justify-center pr-3">
          <Logo size={48} tone="light" />
        </h1>

        {state === 'checking' && (
          <p className="text-center text-gray-600 font-bold" role="status">בודקים את הקישור...</p>
        )}

        {state === 'invalid' && (
          <div className="space-y-5 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900">הקישור לא תקף</h2>
            <p className="text-gray-600 text-sm">ייתכן שהוא פג תוקף או שכבר נעשה בו שימוש. אפשר לבקש קישור חדש.</p>
            <Link href="/login" className="block w-full py-4 px-6 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-colors">
              חזרה להתחברות
            </Link>
          </div>
        )}

        {state === 'ready' && (
          <form onSubmit={save} className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-gray-900">בחרו סיסמה חדשה</h2>
              <p className="text-gray-600 mt-2 text-sm">אחרי השמירה תיכנסו לחשבון.</p>
            </div>
            {error && (
              <div role="alert" className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold text-center">
                {error}
              </div>
            )}
            <PasswordField label="סיסמה חדשה" value={password} onChange={setPassword} autoComplete="new-password" hint={PASSWORD_RULE_TEXT} />
            <PasswordField label="אימות סיסמה" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            <button
              type="submit"
              disabled={busy}
              className="w-full py-4 px-6 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'שומר...' : 'החלפת סיסמה'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
