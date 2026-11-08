'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import Logo from './Logo';

type Props = {
  initialEmail: string;
  onBack: () => void;
};

const RESEND_SECONDS = 60;
const inputCls = 'w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
const primaryCls = 'w-full py-4 px-6 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

// שחזור סיסמה: שולחים למייל קישור, והוא מוביל לדף /reset-password שבו בוחרים סיסמה חדשה.
// (קישור ולא קוד, כי תבנית המייל המובנית של Supabase נעולה לעריכה בלי שרת מייל משלנו.)
export default function ForgotPassword({ initialEmail, onBack }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error && error.status === 429) throw new Error('נשלחו יותר מדי בקשות. נסו שוב בעוד כמה דקות.');
      // לא מגלים אם הכתובת רשומה: ההודעה זהה בכל מקרה
      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'לא הצלחנו לשלוח מייל. נסו שוב.');
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

        {!sent ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="space-y-5"
          >
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-gray-900">שכחתם סיסמה?</h2>
              <p className="text-gray-600 mt-2 text-sm">נשלח לכתובת המייל שלכם קישור, ובו תוכלו לבחור סיסמה חדשה.</p>
            </div>
            <div>
              <label htmlFor="fp-email" className="block text-sm font-bold text-gray-700 mb-2">כתובת אימייל</label>
              <input id="fp-email" type="email" required className={inputCls} placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" autoComplete="email" />
            </div>
            <button type="submit" disabled={busy} className={primaryCls}>{busy ? 'שולח...' : 'שלחו לי קישור'}</button>
          </form>
        ) : (
          <div className="space-y-5 text-center">
            <div className="text-5xl" aria-hidden="true">✉️</div>
            <h2 className="text-2xl font-extrabold text-gray-900">בדקו את תיבת הדואר</h2>
            <p className="text-gray-600 text-sm">
              אם הכתובת <span className="font-bold text-gray-900" dir="ltr">{email}</span> רשומה אצלנו, שלחנו אליה קישור לבחירת סיסמה חדשה. אם לא הגיע, בדקו בספאם.
            </p>
            <button
              type="button"
              onClick={send}
              disabled={busy || cooldown > 0}
              className="w-full text-sm font-bold text-blue-600 hover:text-blue-700 disabled:text-gray-400 py-2"
            >
              {cooldown > 0 ? `אפשר לשלוח שוב בעוד ${cooldown} שניות` : 'לא הגיע? שלחו שוב'}
            </button>
          </div>
        )}

        <button type="button" onClick={onBack} className="w-full text-sm font-bold text-gray-500 hover:text-gray-800 py-2">
          חזרה להתחברות
        </button>
      </div>
    </div>
  );
}
