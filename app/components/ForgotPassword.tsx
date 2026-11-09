'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import AuthShell, { MailIcon } from './AuthShell';

type Props = {
  initialEmail: string;
  onBack: () => void;
};

const RESEND_SECONDS = 60;

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
    <AuthShell>
      {!sent ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <h1>שכחתם סיסמה?</h1>
          <p className="auth-sub">נשלח לכתובת המייל שלכם קישור, ובו תוכלו לבחור סיסמה חדשה.</p>
          {error && <div role="alert" className="ui-alert ui-alert--error">{error}</div>}
          <div className="ui-field">
            <label htmlFor="fp-email" className="ui-label">כתובת אימייל</label>
            <input id="fp-email" type="email" required className="ui-input" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" autoComplete="email" />
          </div>
          <button type="submit" disabled={busy} className="ui-btn ui-btn--lg ui-btn--block auth-submit">
            {busy ? <span className="ui-spin" aria-hidden="true" /> : null}
            {busy ? 'שולח...' : 'שלחו לי קישור'}
          </button>
        </form>
      ) : (
        <div>
          <MailIcon />
          <h1>בדקו את תיבת הדואר</h1>
          <p className="auth-sub">
            אם הכתובת <span dir="ltr" style={{ fontWeight: 700 }}>{email}</span> רשומה אצלנו, שלחנו אליה קישור לבחירת סיסמה חדשה. אם לא הגיע, בדקו בספאם.
          </p>
          {error && <div role="alert" className="ui-alert ui-alert--error">{error}</div>}
          <button type="button" onClick={send} disabled={busy || cooldown > 0} className="ui-link">
            {cooldown > 0 ? `אפשר לשלוח שוב בעוד ${cooldown} שניות` : 'לא הגיע? שלחו שוב'}
          </button>
        </div>
      )}

      <p className="auth-switch">
        <button type="button" onClick={onBack} className="ui-link">חזרה להתחברות</button>
      </p>
    </AuthShell>
  );
}
