'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { PASSWORD_RULE_TEXT, passwordProblem } from '../utils/password';
import Logo from './Logo';
import PasswordField from './PasswordField';

type Props = {
  initialEmail: string;
  onBack: () => void;
  /** נקרא אחרי שהסיסמה הוחלפה והמשתמש מחובר */
  onDone: () => void;
};

type Step = 'email' | 'code' | 'newpass';

const RESEND_SECONDS = 60;
const inputCls = 'w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
const primaryCls = 'w-full py-4 px-6 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

// שחזור סיסמה: שולחים קוד למייל, בודקים אותו, ואז קובעים סיסמה חדשה.
// צריך שבתבנית המייל "Reset Password" ב-Supabase יופיע הקוד ({{ .Token }}).
export default function ForgotPassword({ initialEmail, onBack, onDone }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    setBusy(true);
    setError('');
    try {
      // לא מגלים אם הכתובת רשומה: ההודעה זהה בכל מקרה
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error && error.status === 429) throw new Error('נשלחו יותר מדי בקשות. נסו שוב בעוד כמה דקות.');
      setStep('code');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'לא הצלחנו לשלוח קוד. נסו שוב.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
      if (error) throw error;
      setStep('newpass');
    } catch {
      setError('הקוד שגוי או שפג תוקפו. אפשר לבקש קוד חדש.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirm) return setError('שתי הסיסמאות לא זהות.');

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onDone();
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

        {error && (
          <div role="alert" className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold text-center">
            {error}
          </div>
        )}

        {step === 'email' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendCode();
            }}
            className="space-y-5"
          >
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-gray-900">שכחתם סיסמה?</h2>
              <p className="text-gray-600 mt-2 text-sm">נשלח קוד לכתובת המייל שלכם, ואז תוכלו לבחור סיסמה חדשה.</p>
            </div>
            <div>
              <label htmlFor="fp-email" className="block text-sm font-bold text-gray-700 mb-2">כתובת אימייל</label>
              <input id="fp-email" type="email" required className={inputCls} placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" autoComplete="email" />
            </div>
            <button type="submit" disabled={busy} className={primaryCls}>{busy ? 'שולח...' : 'שלחו לי קוד'}</button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verifyCode} className="space-y-5">
            <div className="text-center">
              <div className="text-5xl mb-2" aria-hidden="true">✉️</div>
              <h2 className="text-2xl font-extrabold text-gray-900">הזינו את הקוד</h2>
              <p className="text-gray-600 mt-2 text-sm">
                אם הכתובת <span className="font-bold text-gray-900" dir="ltr">{email}</span> רשומה אצלנו, שלחנו אליה קוד. הוא תקף לזמן קצר.
              </p>
            </div>
            <div>
              <label htmlFor="fp-code" className="block text-sm font-bold text-gray-700 mb-2">קוד מהמייל</label>
              <input
                id="fp-code"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                maxLength={10}
                className={`${inputCls} text-center text-2xl tracking-[0.3em] font-mono`}
                placeholder="12345678"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                dir="ltr"
              />
            </div>
            <button type="submit" disabled={busy || code.length < 6} className={primaryCls}>{busy ? 'בודק...' : 'אימות קוד'}</button>
            <button
              type="button"
              onClick={sendCode}
              disabled={busy || cooldown > 0}
              className="w-full text-sm font-bold text-blue-600 hover:text-blue-700 disabled:text-gray-400 py-2"
            >
              {cooldown > 0 ? `לא הגיע קוד? אפשר לשלוח שוב בעוד ${cooldown} שניות` : 'לא הגיע קוד? שלחו שוב'}
            </button>
          </form>
        )}

        {step === 'newpass' && (
          <form onSubmit={savePassword} className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-gray-900">בחרו סיסמה חדשה</h2>
              <p className="text-gray-600 mt-2 text-sm">הקוד אומת. עוד צעד אחד.</p>
            </div>
            <PasswordField label="סיסמה חדשה" value={password} onChange={setPassword} autoComplete="new-password" hint={PASSWORD_RULE_TEXT} />
            <PasswordField label="אימות סיסמה" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            <button type="submit" disabled={busy} className={primaryCls}>{busy ? 'שומר...' : 'החלפת סיסמה'}</button>
          </form>
        )}

        <button type="button" onClick={onBack} className="w-full text-sm font-bold text-gray-500 hover:text-gray-800 py-2">
          חזרה להתחברות
        </button>
      </div>
    </div>
  );
}
