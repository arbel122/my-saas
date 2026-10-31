'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/app/components/Logo';
import ReminderButton from '@/app/components/ReminderButton';
import CatalogEditor from '@/app/components/CatalogEditor';
import type { CatalogCategory } from '@/app/components/CatalogSection';
import { getAuthHeader } from '@/app/utils/auth-client';
import { dayLabel, formatApptDate } from '@/app/utils/reminders';

type Appt = { id: string; customerName: string; customerPhone: string; date: string; startsAt: string };
type Membership = {
  staffId: string;
  siteId: string;
  businessName: string;
  myName: string;
  allServices: string[];
  services: string[];
  industry: string;
  catalog: CatalogCategory[];
  appointments: Appt[];
};

// הדשבורד של המטפל: היומן שלו, ובחירת השירותים שהוא עושה.
export default function StaffDashboardPage() {
  const [memberships, setMemberships] = useState<Membership[] | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const auth = await getAuthHeader();
    if (!auth) return setNeedsLogin(true);
    try {
      const res = await fetch('/api/staff/me', { headers: auth });
      if (res.status === 401) return setNeedsLogin(true);
      const data = await res.json().catch(() => ({}));
      setMemberships(data.memberships ?? []);
    } catch {
      setMemberships([]);
      setMessage('שגיאה בטעינה. בדקו את החיבור ונסו שוב.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveServices = async (m: Membership, services: string[]) => {
    setMessage('');
    const res = await fetch(`/api/staff/${m.staffId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
      body: JSON.stringify({ services }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage(data.error || 'שגיאה בשמירה.');
    setMemberships((prev) => prev && prev.map((x) => (x.staffId === m.staffId ? { ...x, services: data.services } : x)));
    setMessage('השירותים נשמרו.');
  };

  const saveCatalog = async (m: Membership, catalog: CatalogCategory[]) => {
    setMessage('');
    const res = await fetch(`/api/staff/${m.staffId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
      body: JSON.stringify({ catalog }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage(data.error || 'שגיאה בשמירת המוצרים. ייתכן שהאפשרות עוד לא הופעלה.');
    setMemberships((prev) => prev && prev.map((x) => (x.staffId === m.staffId ? { ...x, catalog: data.catalog } : x)));
    setMessage('המוצרים נשמרו ויוצגו באתר על שמכם.');
  };

  const leave = async (m: Membership) => {
    if (!confirm(`לעזוב את הצוות של ${m.businessName}? תורים שכבר נקבעו יישארו אצל בעל העסק.`)) return;
    const res = await fetch(`/api/staff/${m.staffId}`, { method: 'DELETE', headers: { ...(await getAuthHeader()) } });
    if (res.ok) setMemberships((prev) => prev && prev.filter((x) => x.staffId !== m.staffId));
    else setMessage('שגיאה בעזיבה.');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Opnyx"><Logo size={28} tone="light" /></Link>
          <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
            <Link href="/my-appointments" className="hover:text-gray-900 px-1 py-2">התורים שלי כלקוח</Link>
            <Link href="/dashboard" className="hover:text-gray-900 px-1 py-2">העסק שלי</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">היומן שלי 💈</h1>
          <p className="text-gray-500 mt-1">התורים שלקוחות קבעו אצלך, והשירותים שאתה עושה.</p>
        </div>

        {message && <p className="text-sm font-bold text-blue-800 bg-blue-50 rounded-xl p-3">{message}</p>}

        {needsLogin ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-3">
            <p className="font-bold text-gray-800">כדי לראות את היומן שלך צריך להתחבר.</p>
            <Link href="/login?next=/staff" className="inline-block bg-gray-900 text-white font-bold px-6 py-2.5 rounded-xl">התחברות / הרשמה</Link>
          </div>
        ) : memberships === null ? (
          <p className="text-gray-400">טוען...</p>
        ) : memberships.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-600">
            <p className="font-bold text-gray-800">עוד לא הצטרפת לצוות של אף עסק.</p>
            <p className="mt-1 text-sm">בקשו מבעל העסק קישור הזמנה, ופתחו אותו כשאתם מחוברים.</p>
          </div>
        ) : (
          memberships.map((m) => (
            <section key={m.staffId} className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-sm">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">{m.businessName}</h2>
                <p className="text-sm text-gray-500">את/ה רשום/ה כ{m.myName}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2">השירותים שאני עושה</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {m.allServices.map((name) => {
                    const on = m.services.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => saveServices(m, on ? m.services.filter((s) => s !== name) : [...m.services, name])}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                      >
                        {on ? '✓ ' : ''}{name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400">לקוחות יוכלו לקבוע אצלך רק שירותים מסומנים.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-3">התורים הקרובים שלי ({m.appointments.length})</h3>
                {m.appointments.length === 0 ? (
                  <p className="text-gray-400 text-sm">אין תורים קרובים.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                    {m.appointments.map((a) => (
                      <li key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900">{a.customerName}</p>
                          <p className="text-sm text-gray-600">
                            {dayLabel(a.startsAt) && <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">{dayLabel(a.startsAt)}</span>}
                            {formatApptDate(a.date)}
                          </p>
                          <a href={`tel:${a.customerPhone}`} className="text-sm text-blue-600 font-bold">{a.customerPhone} 📞</a>
                        </div>
                        <ReminderButton
                          appt={{ id: a.id, site_id: m.siteId, customer_name: a.customerName, customer_phone: a.customerPhone, date: a.date }}
                          businessName={m.businessName}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="-mx-6 rounded-2xl overflow-hidden border border-gray-100">
                <CatalogEditor
                  catalog={m.catalog}
                  onChange={(catalog) => saveCatalog(m, catalog)}
                  businessName={m.businessName}
                  industry={m.industry}
                  title="המוצרים שלי"
                  subtitle="אם אתם מוכרים מוצרים (שמפו, מוצרי טיפוח וכדומה), הוסיפו אותם כאן. הם יוצגו באתר העסק על שמכם."
                />
              </div>

              <button onClick={() => leave(m)} className="text-xs font-bold text-red-500 underline">עזיבת הצוות</button>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
