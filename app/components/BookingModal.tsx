'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { israelNow } from '@/app/utils/schedule';
import { getAuthHeader } from '@/app/utils/auth-client';

type Service = { name: string; duration?: string; price?: string };

type Props = {
  siteId: string;
  businessName?: string;
  services: Service[];
  themeColor?: string;
  title?: string;
  text?: string;
  contactPhone?: string;
  initialService?: string;
  // true כשבעל העסק בודק מתוך העורך: מוסיף הסברים שרלוונטיים רק לו
  preview?: boolean;
  onClose: () => void;
};

function whatsappNumber(phone?: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
}

function formatDate(date: string) {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

export default function BookingModal({
  siteId,
  businessName,
  services,
  themeColor = '#2563eb',
  title,
  text,
  contactPhone,
  initialService = '',
  preview = false,
  onClose,
}: Props) {
  const [service, setService] = useState(initialService);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [booked, setBooked] = useState<{ token: string; service: string; date: string; time: string; name: string; phone: string } | null>(null);

  const today = israelNow().date;

  // קביעת תור דורשת חשבון לקוח: כך התור נשמר ב"התורים שלי" בכל מכשיר
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    getAuthHeader().then((auth) => setLoggedIn(!!auth));
  }, []);
  const loginHref = `/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')}`;

  async function loadSlots(nextService: string, nextDate: string) {
    setTime('');
    setSlots(null);
    setError('');
    if (!nextService || !nextDate) return;

    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/availability?siteId=${encodeURIComponent(siteId)}&date=${nextDate}&service=${encodeURIComponent(nextService)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'שגיאה בטעינת השעות');
        setSlots([]);
      } else {
        setSlots(data.slots);
      }
    } catch {
      setError('שגיאה בטעינת השעות. בדקו את החיבור ונסו שוב.');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function submit() {
    setError('');
    if (!service || !date || !time || !name.trim() || !phone.trim()) {
      setError('אנא מלאו את כל השדות ובחרו שעה.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ siteId, service, date, time, customerName: name, customerPhone: phone }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setLoggedIn(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || 'שגיאה בקביעת התור. נסו שוב.');
        // השעה אולי נתפסה בינתיים: מרעננים את הרשימה
        if (res.status === 409) await loadSlots(service, date);
        return;
      }
      setBooked({ token: data.token, service, date, time, name: name.trim(), phone: phone.trim() });
    } catch {
      setError('שגיאה בקביעת התור. בדקו את החיבור ונסו שוב.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const waNumber = whatsappNumber(contactPhone);
  const waText = booked
    ? `שלום${businessName ? ` ${businessName}` : ''}, קבעתי תור באתר:\n${booked.service}\nבתאריך ${formatDate(booked.date)} בשעה ${booked.time}\nשם: ${booked.name}\nטלפון: ${booked.phone}`
    : '';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={onClose}></div>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto relative z-10 p-6 md:p-8">
        <button onClick={onClose} aria-label="סגור" className="absolute top-4 left-4 bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full text-xl">✖</button>

        {loggedIn === false && !booked ? (
          <div className="py-10 text-center space-y-4 max-w-md mx-auto">
            <div className="text-5xl">🔐</div>
            <h2 className="text-2xl font-black text-gray-900">כדי לקבוע תור צריך להתחבר</h2>
            <p className="text-gray-600">
              התחברו (או הירשמו בחינם), ואז כל התורים שלכם יישמרו ב&quot;התורים שלי&quot;, בכל מכשיר, עם אפשרות לבטל ולכתוב ביקורת.
            </p>
            <Link href={loginHref} className="inline-block text-white font-bold px-8 py-3 rounded-xl hover:opacity-90" style={{ backgroundColor: themeColor }}>
              התחברות / הרשמה
            </Link>
          </div>
        ) : booked ? (
          <div className="py-6 text-center space-y-5 max-w-lg mx-auto">
            <div className="text-5xl">🎉</div>
            <h2 className="text-3xl font-black text-emerald-900">התור נשמר!</h2>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 font-bold">
              {booked.service}<br />
              {formatDate(booked.date)} בשעה {booked.time}
            </div>

            {waNumber ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 space-y-3">
                <p className="font-extrabold text-green-900 text-lg">שלב אחרון: שלחו הודעה לעסק</p>
                <p className="text-sm text-green-800">כדי שהעסק יידע שהגעתם, לחצו על אחד הכפתורים ושלחו את ההודעה המוכנה.</p>
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#25D366] hover:bg-[#1ebe57] text-white font-extrabold text-lg py-4 rounded-xl shadow-lg transition-all"
                >
                  💬 שלח הודעה בוואטסאפ
                </a>
                <a
                  href={`sms:+${waNumber}?&body=${encodeURIComponent(waText)}`}
                  className="block bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 font-bold py-3 rounded-xl transition-all"
                >
                  ✉️ או שלח SMS
                </a>
              </div>
            ) : preview ? (
              <p className="text-sm font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-xl p-3">
                לא הגדרתם מספר טלפון לעסק, ולכן הלקוחות לא יראו כאן שלב של שליחת הודעה. הגדירו אותו בתחתית העורך, בשדה &quot;הגדרת וואטסאפ לעסק&quot;.
              </p>
            ) : (
              <p className="text-sm text-gray-600">העסק יראה את התור שלכם ביומן שלו.</p>
            )}
            {preview && (
              <p className="text-xs text-gray-500">זה תור אמיתי לבדיקה: הוא נשמר ויופיע ביומן בדשבורד. אפשר לבטל אותו ב&quot;התורים שלי&quot;.</p>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-600 space-y-2 text-right">
              <p className="font-bold text-gray-800">צריכים לבטל? ורוצים לכתוב ביקורת אחרי התור?</p>
              <p>התור נשמר בחשבון שלכם. תמצאו אותו ב<strong>&quot;התורים שלי&quot;</strong> בראש האתר ובעמוד <Link href="/my-appointments" className="text-blue-600 underline">התורים שלי</Link>, מכל מכשיר שתתחברו ממנו: ביטול עד שהתור מתחיל, וביקורת אחרי שהוא התקיים.</p>
            </div>
            <div>
              <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-2.5 rounded-full text-sm transition-colors">סגור</button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center pt-4 pb-6 border-b border-gray-100">
              <h2 className="text-3xl font-bold text-gray-800">{title || 'קביעת תור אונליין 📅'}</h2>
              {text && <p className="text-gray-500 mt-2">{text}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">שירות</label>
                  <select
                    className="w-full p-4 rounded-xl border-2 bg-gray-50"
                    value={service}
                    onChange={(e) => { setService(e.target.value); loadSlots(e.target.value, date); }}
                  >
                    <option value="" disabled>בחרו שירות...</option>
                    {services.map((s, i) => (
                      <option key={i} value={s.name}>{s.name} ({s.duration || '60 דקות'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">תאריך</label>
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => { setDate(e.target.value); loadSlots(service, e.target.value); }}
                    className="w-full p-4 rounded-xl border-2 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">שעה פנויה</label>
                  {!service || !date ? (
                    <p className="text-sm text-gray-400">בחרו שירות ותאריך כדי לראות שעות פנויות.</p>
                  ) : loadingSlots ? (
                    <p className="text-sm text-gray-400">טוען שעות פנויות...</p>
                  ) : slots && slots.length === 0 ? (
                    <p className="text-sm font-bold text-orange-600 bg-orange-50 rounded-xl p-3">אין שעות פנויות בתאריך הזה. נסו תאריך אחר.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {(slots ?? []).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTime(s)}
                          className={`py-2 rounded-lg text-sm font-bold border-2 transition-all ${time === s ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}
                          style={time === s ? { backgroundColor: themeColor } : undefined}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 bg-gray-50/70 rounded-2xl p-5">
                <input type="text" placeholder="שם מלא" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 rounded-xl border bg-white" />
                <input type="tel" placeholder="מספר נייד" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-4 rounded-xl border bg-white text-right" dir="rtl" />
                {error && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
                <button
                  disabled={isSubmitting}
                  onClick={submit}
                  className="w-full py-4 rounded-xl font-bold text-white disabled:opacity-60"
                  style={{ backgroundColor: themeColor }}
                >
                  {isSubmitting ? 'שומר תור...' : 'שריין לי את התור'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
