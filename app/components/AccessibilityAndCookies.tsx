'use client';

import { useState, useEffect } from 'react';

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
    <>
      {/* === באנר קוקיז === */}
      {showCookieBanner && (
        <div className="fixed bottom-0 inset-x-0 bg-gray-900 text-white p-3 sm:p-4 z-[600] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 border-t border-gray-800 shadow-2xl" dir="rtl">
          <p className="text-xs sm:text-sm font-medium text-gray-300 leading-snug">
            אתר זה משתמש בעוגיות (Cookies) ובזיכרון מקומי כדי להבטיח את חווית המשתמש הטובה ביותר, ניתוח תנועה ושמירת הגדרות.
          </p>
          <button
            onClick={acceptCookies}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all whitespace-nowrap shadow-md w-full sm:w-auto"
          >
            אני מאשר/ת 👍
          </button>
        </div>
      )}

      {/* === כפתור ותפריט נגישות === */}
      {/* מתחת לחלונות (z-200) כדי שלא יכסה שדות בטפסים, ומעל לכותרת */}
      <div className="fixed bottom-6 left-6 z-[150]" dir="rtl">
        <button
          onClick={() => setShowAccessMenu(!showAccessMenu)}
          className="bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all text-xl font-bold border-2 border-white"
          title="תפריט נגישות"
          aria-label="תפריט נגישות"
        >
          ♿
        </button>

        {showAccessMenu && (
          <div className="absolute bottom-16 left-0 bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 w-60 flex flex-col gap-3 z-[300]">
            <h4 className="font-extrabold text-gray-800 border-b pb-2 text-sm">התאמות נגישות</h4>
            <button
              onClick={() => {
                setHighContrast(!highContrast);
                document.documentElement.classList.toggle('invert', !highContrast);
              }}
              className="text-right text-xs font-bold text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              {highContrast ? '🔄 ביטול ניגודיות' : '◑ ניגודיות גבוהה'}
            </button>
            <button
              onClick={() => {
                setLargeText(!largeText);
                document.documentElement.style.fontSize = !largeText ? '18px' : '16px';
              }}
              className="text-right text-xs font-bold text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              {largeText ? '🔍 טקסט רגיל' : '🔍 הגדלת טקסט'}
            </button>
            <a
              href="/accessibility"
              className="text-right text-xs font-bold text-blue-600 hover:underline p-2"
            >
              📜 הצהרת נגישות
            </a>
          </div>
        )}
      </div>
    </>
  );
}