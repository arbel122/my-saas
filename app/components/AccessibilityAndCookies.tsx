'use client';

import { useState, useEffect } from 'react';
import '../consent.css';

export default function AccessibilityAndCookies() {
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [showAccessMenu, setShowAccessMenu] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowCookieBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShowCookieBanner(false);
  };

  return (
    <div className="consent">
      {/* === באנר קוקיז === */}
      {showCookieBanner && (
        <div className="consent-bar" dir="rtl" role="region" aria-label="הודעת עוגיות">
          <p>
            אתר זה משתמש בעוגיות (Cookies) ובזיכרון מקומי כדי להבטיח את חווית המשתמש הטובה ביותר, ניתוח תנועה ושמירת הגדרות.
          </p>
          <button type="button" onClick={acceptCookies} className="consent-ok">
            אני מאשר/ת
          </button>
        </div>
      )}

      {/* === כפתור ותפריט נגישות === */}
      {/* מתחת לחלונות (z-200) כדי שלא יכסה שדות בטפסים, ומעל לכותרת */}
      <div className="consent-access" dir="rtl">
        <button
          type="button"
          onClick={() => setShowAccessMenu(!showAccessMenu)}
          className="consent-fab"
          title="תפריט נגישות"
          aria-label="תפריט נגישות"
          aria-expanded={showAccessMenu}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="4.5" r="1.6" />
            <path d="M5 8.5l7 1.5 7-1.5" />
            <path d="M12 10v4.5" />
            <path d="M8.5 20l3.5-5.5 3.5 5.5" />
          </svg>
        </button>

        {showAccessMenu && (
          <div className="consent-menu">
            <h4>התאמות נגישות</h4>
            <button
              type="button"
              onClick={() => {
                setHighContrast(!highContrast);
                document.documentElement.classList.toggle('invert', !highContrast);
              }}
            >
              {highContrast ? 'ביטול ניגודיות' : 'ניגודיות גבוהה'}
            </button>
            <button
              type="button"
              onClick={() => {
                setLargeText(!largeText);
                document.documentElement.style.fontSize = !largeText ? '18px' : '16px';
              }}
            >
              {largeText ? 'טקסט רגיל' : 'הגדלת טקסט'}
            </button>
            <a href="/accessibility">הצהרת נגישות</a>
          </div>
        )}
      </div>
    </div>
  );
}
