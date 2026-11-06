'use client';

import { useMemo, useState } from 'react';
import ReminderButton from './ReminderButton';
import { getAuthHeader } from '../utils/auth-client';
import { formatApptDate, reminderUrl } from '../utils/reminders';
import { hasStarted, israelNow } from '../utils/schedule';
import type { StaffMember } from './StaffManager';

export type CalendarAppt = {
  id: string;
  site_id: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  starts_at?: string | null;
  staff_id?: string | null;
};

type Props = {
  appointments: CalendarAppt[];
  sites: any[];
  staff: StaffMember[];
  onCancelled: (id: string) => void;
};

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function weekStart(date: string) {
  return addDays(date, -new Date(`${date}T00:00:00Z`).getUTCDay());
}

const short = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
const timeOf = (a: CalendarAppt) => (a.starts_at ? a.starts_at.slice(11, 16) : '');
const dayOf = (a: CalendarAppt) => (a.starts_at ? a.starts_at.slice(0, 10) : '');

// יומן שבועי של התורים, סיכום של היום, מחר והחודש, תזכורות למחר וביטול תור על ידי בעל העסק.
export default function AppointmentsCalendar({ appointments, sites, staff, onCancelled }: Props) {
  const today = israelNow().date;
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<CalendarAppt | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [cancelledAppt, setCancelledAppt] = useState<CalendarAppt | null>(null);

  const start = addDays(weekStart(today), offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const tomorrow = addDays(today, 1);
  const month = today.slice(0, 7);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarAppt[]>();
    for (const a of appointments) {
      const d = dayOf(a);
      if (!d) continue;
      map.set(d, [...(map.get(d) ?? []), a].sort((x, y) => (x.starts_at ?? '').localeCompare(y.starts_at ?? '')));
    }
    return map;
  }, [appointments]);

  const countToday = byDay.get(today)?.length ?? 0;
  const tomorrowList = byDay.get(tomorrow) ?? [];
  const countMonth = appointments.filter((a) => dayOf(a).startsWith(month)).length;

  const siteOf = (a: CalendarAppt) => sites.find((s) => s.id === a.site_id);
  const businessOf = (a: CalendarAppt) => siteOf(a)?.content?.businessName || siteOf(a)?.name || 'העסק';
  const staffName = (a: CalendarAppt) => staff.find((m) => m.id === a.staff_id)?.name;

  const cancel = async (a: CalendarAppt) => {
    if (!confirm(`לבטל את התור של ${a.customer_name}? השעה תתפנה ללקוחות אחרים.`)) return;
    setCancelling(true);
    setError('');
    try {
      const res = await fetch('/api/appointments/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ id: a.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'שגיאה בביטול התור');
      onCancelled(a.id);
      setSelected(null);
      setCancelledAppt(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בביטול התור');
    } finally {
      setCancelling(false);
    }
  };

  const cancelNoticeUrl = (a: CalendarAppt) =>
    reminderUrl(
      a.customer_phone,
      `שלום ${a.customer_name}, התור שלך ב${businessOf(a)} (${formatApptDate(a.date)}) בוטל, ואנחנו מתנצלים. נשמח לתאם איתך תור חדש בקישור: ${typeof window !== 'undefined' ? `${window.location.origin}/site/${a.site_id}` : ''}`
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          ['היום', countToday],
          ['מחר', tomorrowList.length],
          ['החודש', countMonth],
        ].map(([label, count]) => (
          <div key={label as string} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-gray-900">{count}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">תורים {label}</p>
          </div>
        ))}
      </div>

      {cancelledAppt && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-orange-900">התור של {cancelledAppt.customer_name} בוטל. כדאי להודיע לו.</p>
          <div className="flex items-center gap-2">
            {cancelNoticeUrl(cancelledAppt) && (
              <a href={cancelNoticeUrl(cancelledAppt)} target="_blank" rel="noopener noreferrer" className="bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold px-4 py-2 rounded-full">
                הודע בוואטסאפ
              </a>
            )}
            <button onClick={() => setCancelledAppt(null)} className="text-xs font-bold text-gray-500 px-2 py-2">סגור</button>
          </div>
        </div>
      )}

      {tomorrowList.length > 0 && (
        <section className="bg-green-50 border border-green-200 rounded-3xl p-5">
          <h3 className="font-black text-green-900 mb-1">תזכורות למחר ({tomorrowList.length})</h3>
          <p className="text-xs text-green-800 mb-4">רוב הלקוחות לא קוראים מיילים, ולכן ההודעה הכי יעילה היא בוואטסאפ. לחיצה פותחת הודעה מוכנה.</p>
          <ul className="space-y-2">
            {tomorrowList.map((a) => (
              <li key={a.id} className="bg-white rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-gray-900">{timeOf(a)} · {a.customer_name}</span>
                  <span className="block text-xs text-gray-500">{formatApptDate(a.date).replace(/^[^(]*\(/, '(')}</span>
                </div>
                <ReminderButton appt={a} businessName={businessOf(a)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => setOffset((o) => o - 1)} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">→ שבוע קודם</button>
        <div className="text-center">
          <p className="font-black text-gray-900">{short(days[0])} - {short(days[6])}</p>
          {offset !== 0 && <button onClick={() => setOffset(0)} className="text-xs font-bold text-blue-600">חזרה לשבוע הנוכחי</button>}
        </div>
        <button onClick={() => setOffset((o) => o + 1)} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">שבוע הבא ←</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map((day, i) => {
          const list = byDay.get(day) ?? [];
          const isToday = day === today;
          return (
            <div key={day} className={`rounded-2xl border p-3 min-h-[110px] ${isToday ? 'border-blue-400 bg-blue-50/40' : 'border-gray-100 bg-white'}`}>
              <p className={`text-xs font-black mb-2 ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                {DAY_NAMES[i]} · {short(day)}
              </p>
              {list.length === 0 ? (
                <p className="text-xs text-gray-300">אין תורים</p>
              ) : (
                <ul className="space-y-1.5">
                  {list.map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => { setSelected(a); setError(''); }}
                        className={`w-full text-right rounded-xl px-2.5 py-2 text-xs font-bold border transition-colors ${hasStarted(a.starts_at) ? 'bg-gray-50 text-gray-500 border-gray-100' : 'bg-white text-gray-900 border-gray-200 hover:border-blue-400'}`}
                      >
                        <span className="block text-blue-700">{timeOf(a)}</span>
                        <span className="block truncate">{a.customer_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <button onClick={() => setSelected(null)} aria-label="סגור" className="absolute top-4 left-4 w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">✖</button>
            <h3 className="text-xl font-black text-gray-900">{selected.customer_name}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-bold">מועד:</span> {formatApptDate(selected.date)}</p>
              {sites.length > 1 && <p><span className="font-bold">אתר:</span> {businessOf(selected)}</p>}
              {staffName(selected) && <p><span className="font-bold">מטפל:</span> {staffName(selected)}</p>}
              <p>
                <span className="font-bold">טלפון:</span>{' '}
                <a href={`tel:${selected.customer_phone}`} dir="ltr" className="text-blue-600 font-bold">{selected.customer_phone}</a>
              </p>
            </div>
            {error && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <ReminderButton appt={selected} businessName={businessOf(selected)} />
              {!hasStarted(selected.starts_at) && (
                <button onClick={() => cancel(selected)} disabled={cancelling} className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-4 py-2 rounded-full disabled:opacity-60">
                  {cancelling ? 'מבטל...' : 'ביטול התור'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
