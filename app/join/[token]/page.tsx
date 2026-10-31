'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/app/components/Logo';
import { getAuthHeader } from '@/app/utils/auth-client';

type Invite = { businessName: string; staffName: string; claimed: boolean };

// קישור ההזמנה שבעל עסק שולח למטפל: מציג את ההזמנה, דורש התחברות, ומצרף את המטפל לצוות.
export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/staff/invite?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) return setNotFound(true);
        setInvite(await r.json());
      })
      .catch(() => setNotFound(true));
    getAuthHeader().then((a) => setLoggedIn(!!a));
  }, [token]);

  const join = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'שגיאה באישור ההזמנה.');
        return;
      }
      setJoined(true);
    } catch {
      setError('שגיאה באישור ההזמנה. בדקו את החיבור ונסו שוב.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl border border-gray-100 text-center space-y-5">
        <div className="flex justify-center pr-3"><Logo size={36} tone="light" /></div>

        {notFound ? (
          <>
            <h1 className="text-2xl font-extrabold text-gray-900">ההזמנה לא נמצאה</h1>
            <p className="text-gray-600">ייתכן שהקישור שגוי או שבעל העסק ביטל אותו. בקשו קישור חדש.</p>
          </>
        ) : !invite ? (
          <p className="text-gray-400">טוען...</p>
        ) : joined ? (
          <>
            <div className="text-5xl">🎉</div>
            <h1 className="text-2xl font-extrabold text-gray-900">הצטרפת לצוות של {invite.businessName}!</h1>
            <p className="text-gray-600">מעכשיו לקוחות יכולים לקבוע אצלך תורים, ואת היומן שלך תראה בדשבורד שלך.</p>
            <Link href="/staff" className="block bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black">לדשבורד שלי</Link>
          </>
        ) : invite.claimed ? (
          <>
            <h1 className="text-2xl font-extrabold text-gray-900">ההזמנה כבר נוצלה</h1>
            <p className="text-gray-600">אם זו ההזמנה שלך, היכנסו לחשבון שבו אישרתם אותה.</p>
            <Link href="/staff" className="block bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black">לדשבורד שלי</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-gray-900">הוזמנת להצטרף לצוות</h1>
            <p className="text-gray-600">
              <strong>{invite.businessName}</strong> הזמינו אותך כמטפל/ת בשם <strong>{invite.staffName}</strong>. אחרי האישור יהיה לך יומן ודשבורד משלך.
            </p>
            {loggedIn === false ? (
              <Link href={`/login?next=${encodeURIComponent(`/join/${token}`)}`} className="block bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700">
                התחברות / הרשמה כדי להצטרף
              </Link>
            ) : (
              <button onClick={join} disabled={busy || loggedIn === null} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-60">
                {busy ? 'מצרף...' : 'אשר והצטרף'}
              </button>
            )}
            {error && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
