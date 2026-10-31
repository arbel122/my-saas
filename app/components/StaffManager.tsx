'use client';

import { useState } from 'react';
import { getAuthHeader } from '../utils/auth-client';

export type StaffMember = {
  id: string;
  siteId: string;
  name: string;
  services: string[];
  status: 'invited' | 'active';
  inviteToken: string | null;
};

type Props = {
  siteId: string;
  businessName: string;
  serviceNames: string[];
  staff: StaffMember[];
  onRefresh: () => void;
  onClose: () => void;
};

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'שגיאה. נסו שוב.');
  return data;
}

const inputCls = 'w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-blue-500 focus:bg-white text-sm';

function ServicePicker({ all, value, onChange }: { all: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((name) => {
        const on = value.includes(name);
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(on ? value.filter((v) => v !== name) : [...value, name])}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            {on ? '✓ ' : ''}{name}
          </button>
        );
      })}
    </div>
  );
}

// ניהול צוות של עסק: הוספת מטפל, קישור הזמנה, ובחירת השירותים שכל מטפל עושה.
export default function StaffManager({ siteId, businessName, serviceNames, staff, onRefresh, onClose }: Props) {
  const mine = staff.filter((s) => s.siteId === siteId);
  const [name, setName] = useState('');
  const [services, setServices] = useState<string[]>(serviceNames);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editServices, setEditServices] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    setMessage('');
    try {
      await fn();
      if (success) setMessage(success);
      onRefresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const inviteUrl = (token: string) => `${window.location.origin}/join/${token}`;
  const inviteText = (member: StaffMember) =>
    `היי ${member.name}, הוזמנת להצטרף כמטפל/ת ב${businessName}. כדי לראות את היומן שלך ולהתחיל לקבל תורים, היכנס/י לקישור והירשם/י:\n${inviteUrl(member.inviteToken as string)}`;

  const add = () =>
    run(async () => {
      await api('/api/staff', 'POST', { siteId, name, services });
      setName('');
      setServices(serviceNames);
    }, 'המטפל נוסף. עכשיו שלחו לו את קישור ההזמנה.');

  return (
    <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0">
          <h3 className="text-xl font-extrabold text-gray-800">הצוות של {businessName} 👥</h3>
          <button onClick={onClose} aria-label="סגור" className="text-gray-400 hover:text-gray-800 text-3xl">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            כשיש צוות, הלקוחות בוחרים אצל מי לקבוע תור, ולכל מטפל יש יומן ודשבורד משלו. אם גם אתם מטפלים, הוסיפו את עצמכם ואשרו את ההזמנה בקישור.
          </p>

          {mine.length > 0 && (
            <ul className="space-y-3">
              {mine.map((m) => (
                <li key={m.id} className="border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{m.name}</p>
                      <p className={`text-xs font-bold ${m.status === 'active' ? 'text-green-700' : 'text-amber-700'}`}>
                        {m.status === 'active' ? '✓ הצטרף/ה' : '⏳ מחכה לאישור ההזמנה'}
                      </p>
                    </div>
                    <button
                      disabled={busy}
                      onClick={() => confirm(`להסיר את ${m.name} מהצוות? תורים שכבר נקבעו יישארו ביומן שלכם.`) && run(() => api(`/api/staff/${m.id}`, 'DELETE'))}
                      className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-full px-3 py-1.5"
                    >
                      הסר
                    </button>
                  </div>

                  {editingId === m.id ? (
                    <div className="space-y-2">
                      <ServicePicker all={serviceNames} value={editServices} onChange={setEditServices} />
                      <div className="flex gap-2">
                        <button
                          disabled={busy}
                          onClick={() => run(async () => { await api(`/api/staff/${m.id}`, 'PATCH', { services: editServices }); setEditingId(null); })}
                          className="bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-xl"
                        >
                          שמור
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-sm font-bold text-gray-500 px-3">ביטול</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {m.services.map((s) => (
                        <span key={s} className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                      <button onClick={() => { setEditingId(m.id); setEditServices(m.services); }} className="text-xs font-bold text-gray-500 underline">שינוי שירותים</button>
                    </div>
                  )}

                  {m.status === 'invited' && m.inviteToken && (
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-bold text-gray-600">קישור הזמנה (למטפל בלבד)</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(inviteUrl(m.inviteToken as string));
                              setCopiedId(m.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            } catch {
                              setMessage('לא הצלחנו להעתיק. סמנו והעתיקו ידנית: ' + inviteUrl(m.inviteToken as string));
                            }
                          }}
                          className="bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-100"
                        >
                          {copiedId === m.id ? '✓ הועתק' : '📋 העתק קישור'}
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(inviteText(m))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#15803d] hover:bg-[#166534] text-white text-sm font-bold px-4 py-2 rounded-xl"
                        >
                          💬 שלח בוואטסאפ
                        </a>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="font-bold text-gray-800">➕ הוספת מטפל</p>
            <input className={inputCls} placeholder="שם המטפל (למשל דני)" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">אילו שירותים הוא עושה?</p>
              <ServicePicker all={serviceNames} value={services} onChange={setServices} />
            </div>
            <button onClick={add} disabled={busy || name.trim().length < 2} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50">
              הוסף וצור קישור הזמנה
            </button>
          </div>

          {message && <p className="text-sm font-bold text-blue-800 bg-blue-50 rounded-xl p-3">{message}</p>}
        </div>
      </div>
    </div>
  );
}
