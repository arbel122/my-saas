'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import { PASSWORD_RULE_TEXT, passwordProblem } from '../utils/password';
import AuthShell from '../components/AuthShell';
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
    <AuthShell>
      {state === 'checking' && (
        <div>
          <h1>בודקים את הקישור</h1>
          <div className="auth-wait" role="status">
            <span className="ui-spin ui-spin--blue" aria-hidden="true" />
            רגע אחד...
          </div>
        </div>
      )}

      {state === 'invalid' && (
        <div>
          <h1>הקישור לא תקף</h1>
          <p className="auth-sub">ייתכן שהוא פג תוקף או שכבר נעשה בו שימוש. אפשר לבקש קישור חדש.</p>
          <Link href="/login" className="ui-btn ui-btn--lg ui-btn--block">
            חזרה להתחברות
          </Link>
        </div>
      )}

      {state === 'ready' && (
        <form onSubmit={save}>
          <h1>בחרו סיסמה חדשה</h1>
          <p className="auth-sub">אחרי השמירה תיכנסו לחשבון.</p>
          {error && <div role="alert" className="ui-alert ui-alert--error">{error}</div>}
          <PasswordField label="סיסמה חדשה" value={password} onChange={setPassword} autoComplete="new-password" hint={PASSWORD_RULE_TEXT} />
          <PasswordField label="אימות סיסמה" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          <button type="submit" disabled={busy} className="ui-btn ui-btn--lg ui-btn--block auth-submit">
            {busy ? <span className="ui-spin" aria-hidden="true" /> : null}
            {busy ? 'שומר...' : 'החלפת סיסמה'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
