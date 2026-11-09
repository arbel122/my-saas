'use client';

import { useId, useState } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  hint?: string;
  required?: boolean;
};

// שדה סיסמה עם כפתור "הצג סיסמה", כדי שאפשר יהיה לראות מה הוקלד. העיצוב ב-app/ui.css.
export default function PasswordField({ label, value, onChange, autoComplete, hint, required = true }: Props) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="ui-field">
      <label htmlFor={id} className="ui-label">{label}</label>
      <div className="ui-pw">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          autoComplete={autoComplete}
          className="ui-input"
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'הסתר סיסמה' : 'הצג סיסמה'}
          aria-pressed={visible}
          className="ui-eye"
        >
          {visible ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 3l18 18" />
              <path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c5.5 0 9 6 9 6a16.7 16.7 0 0 1-3.2 3.9M6.5 7.5C4 9.3 3 12 3 12s3.5 6 9 6c1.3 0 2.5-.3 3.6-.8" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {hint && <p className="ui-hint">{hint}</p>}
    </div>
  );
}
