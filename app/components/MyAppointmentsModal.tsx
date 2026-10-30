'use client';

import { useEffect, useState } from 'react';
import { forgetAppointment, getSavedAppointments, SavedAppointment } from '@/app/utils/my-appointments';

type Info = { date: string; canReview: boolean; canCancel: boolean; reviewed: boolean };
type Item = { saved: SavedAppointment; info: Info };

type Props = {
  siteId: string;
  businessName?: string;
  contactPhone?: string;
  themeColor?: string;
  onClose: () => void;
};

function whatsappNumber(phone?: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
}

// "2026-11-10 בשעה 11:30 (שירות)" -> "10/11/2026 בשעה 11:30 (שירות)"
const formatApiDate = (text: string) => text.replace(/^(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1');

// "התורים שלי": ביטול לפני התור, וביקורת אחרי שהתור התקיים. לפי התורים ששמורים במכשיר.
export default function MyAppointmentsModal({ siteId, businessName, contactPhone, themeColor = '#2563eb', onClose }: Props) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [busyToken, setBusyToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const results = await Promise.all(
        getSavedAppointments(siteId).map(async (saved): Promise<Item | null> => {
          try {
            const res = await fetch(`/api/appointments/${encodeURIComponent(saved.token)}`);
            if (res.status === 404) {
              // התור בוטל או נמחק: מפסיקים לזכור אותו
              forgetAppointment(siteId, saved.token);
              return null;
            }
            if (!res.ok) return null;
            const info = await res.json();
            return { saved, info: { date: info.date, canReview: info.canReview, canCancel: info.canCancel, reviewed: info.reviewed } };
          } catch {
            return null;
          }
        })
      );
      const loaded = results.filter((r): r is Item => r !== null);
      loaded.sort((a, b) => b.info.date.localeCompare(a.info.date));
      setItems(loaded);
    }
    load();
  }, [siteId]);

  async function cancel(item: Item) {
    if (!confirm(`לבטל את התור: ${formatApiDate(item.info.date)}?`)) return;
    setBusyToken(item.saved.token);
    setMessage('');
    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(item.saved.token)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || 'שגיאה בביטול התור.');
        return;
      }
      forgetAppointment(siteId, item.saved.token);
      setItems((prev) => (prev ? prev.filter((i) => i.saved.token !== item.saved.token) : prev));
      setMessage('התור בוטל והשעה התפנתה.');
    } catch {
      setMessage('שגיאה בביטול התור. בדקו את החיבור ונסו שוב.');
    } finally {
      setBusyToken(null);
    }
  }

  const wa = whatsappNumber(contactPhone);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={onClose}></div>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto relative z-10 p-6 md:p-8 space-y-5">
        <button onClick={onClose} aria-label="סגור" className="absolute top-4 left-4 bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full text-xl">✖</button>
        <div className="pt-2">
          <h2 className="text-2xl font-extrabold text-gray-900">התורים שלי 📅</h2>
          <p className="text-sm text-gray-500 mt-1">כאן אפשר לבטל תור לפני שהוא מתקיים, ולכתוב ביקורת אחרי שהגעתם.</p>
        </div>

        {message && <p className="text-sm font-bold text-blue-800 bg-blue-50 rounded-xl p-3">{message}</p>}

        {items === null ? (
          <p className="text-gray-400 text-sm">טוען את התורים...</p>
        ) : items.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-sm text-gray-600 space-y-2">
            <p className="font-bold text-gray-800">לא מצאנו תורים במכשיר הזה.</p>
            <p>אם קבעתם תור ממכשיר אחר, השתמשו בקישור האישי שקיבלתם אחרי הקביעה, או פנו לעסק.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.saved.token} className="border border-gray-200 rounded-2xl p-4 space-y-3">
                <p className="font-bold text-gray-900">{formatApiDate(item.info.date)}</p>

                {item.info.canCancel ? (
                  <button
                    onClick={() => cancel(item)}
                    disabled={busyToken === item.saved.token}
                    className="w-full bg-red-50 text-red-600 font-bold py-2.5 rounded-xl hover:bg-red-100 disabled:opacity-60"
                  >
                    {busyToken === item.saved.token ? 'מבטל...' : 'בטל תור'}
                  </button>
                ) : item.info.reviewed ? (
                  <p className="text-sm font-bold text-green-700 bg-green-50 rounded-xl p-2.5 text-center">✓ תודה על הביקורת</p>
                ) : (
                  <a
                    href={`/review/${item.saved.token}`}
                    className="block text-center text-white font-bold py-2.5 rounded-xl hover:opacity-90"
                    style={{ backgroundColor: themeColor }}
                  >
                    ⭐ השאירו ביקורת
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        {wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(`שלום${businessName ? ` ${businessName}` : ''}, אני צריך עזרה עם תור שקבעתי באתר.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-green-700 font-bold underline"
          >
            💬 צריכים עזרה? דברו עם העסק בוואטסאפ
          </a>
        )}
      </div>
    </div>
  );
}
