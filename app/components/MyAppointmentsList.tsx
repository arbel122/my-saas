'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuthHeader } from '@/app/utils/auth-client';

type Item = {
  token: string;
  siteId: string;
  businessName: string;
  staffName?: string | null;
  date: string;
  reviewed: boolean;
  canCancel: boolean;
  canReview: boolean;
};

// "2026-11-10 בשעה 11:30 (שירות)" -> "10/11/2026 בשעה 11:30 (שירות)"
const formatApiDate = (text: string) => text.replace(/^(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1');

// רשימת התורים של הלקוח המחובר, מהחשבון שלו. אפשר לסנן לפי אתר.
export default function MyAppointmentsList({ siteId, themeColor = '#2563eb' }: { siteId?: string; themeColor?: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [busyToken, setBusyToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const auth = await getAuthHeader();
      if (!auth) {
        setNeedsLogin(true);
        return;
      }
      try {
        const res = await fetch(`/api/my-appointments${siteId ? `?siteId=${encodeURIComponent(siteId)}` : ''}`, { headers: auth });
        if (res.status === 401) {
          setNeedsLogin(true);
          return;
        }
        const data = await res.json().catch(() => ({}));
        setItems(res.ok ? data.appointments ?? [] : []);
        if (!res.ok) setMessage(data.error || 'שגיאה בטעינת התורים.');
      } catch {
        setItems([]);
        setMessage('שגיאה בטעינת התורים. בדקו את החיבור ונסו שוב.');
      }
    }
    load();
  }, [siteId]);

  async function cancel(item: Item) {
    if (!confirm(`לבטל את התור: ${formatApiDate(item.date)}?`)) return;
    setBusyToken(item.token);
    setMessage('');
    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(item.token)}`, {
        method: 'DELETE',
        headers: { ...(await getAuthHeader()) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || 'שגיאה בביטול התור.');
        return;
      }
      setItems((prev) => (prev ? prev.filter((i) => i.token !== item.token) : prev));
      setMessage('התור בוטל והשעה התפנתה.');
    } catch {
      setMessage('שגיאה בביטול התור. בדקו את החיבור ונסו שוב.');
    } finally {
      setBusyToken(null);
    }
  }

  const loginHref = `/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/my-appointments')}`;

  if (needsLogin) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-sm text-gray-600 space-y-3 text-center">
        <p className="font-bold text-gray-800">כדי לראות את התורים שלך צריך להתחבר.</p>
        <Link href={loginHref} className="inline-block text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-90" style={{ backgroundColor: themeColor }}>
          התחברות / הרשמה
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {message && <p className="text-sm font-bold text-blue-800 bg-blue-50 rounded-xl p-3">{message}</p>}

      {items === null ? (
        <p className="text-gray-400 text-sm">טוען את התורים...</p>
      ) : items.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-sm text-gray-600">
          <p className="font-bold text-gray-800">עדיין אין לך תורים.</p>
          <p className="mt-1">תורים שתקבע באתרים יישמרו כאן, בכל מכשיר שתתחבר ממנו.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.token} className="border border-gray-200 rounded-2xl p-4 space-y-3">
              <div>
                {!siteId && <p className="text-sm text-gray-500">{item.businessName}</p>}
                <p className="font-bold text-gray-900">{formatApiDate(item.date)}</p>
                {item.staffName && <p className="text-sm text-gray-500">אצל {item.staffName}</p>}
              </div>

              {item.canCancel ? (
                <button
                  onClick={() => cancel(item)}
                  disabled={busyToken === item.token}
                  className="w-full bg-red-50 text-red-600 font-bold py-2.5 rounded-xl hover:bg-red-100 disabled:opacity-60"
                >
                  {busyToken === item.token ? 'מבטל...' : 'בטל תור'}
                </button>
              ) : item.reviewed ? (
                <p className="text-sm font-bold text-green-700 bg-green-50 rounded-xl p-2.5 text-center">✓ תודה על הביקורת</p>
              ) : (
                <a
                  href={`/review/${item.token}`}
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
    </div>
  );
}
