'use client';

import { useState } from 'react';
import { Closure, Schedule, toMinutes } from '@/app/utils/schedule';

const DAY_LABELS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

type Props = {
  schedule: Schedule;
  closures: Closure[];
  onSave: (schedule: Schedule, closures: Closure[]) => void;
  onClose: () => void;
};

export default function ScheduleEditor({ schedule, closures, onSave, onClose }: Props) {
  const [days, setDays] = useState<number[]>(schedule.days);
  const [open, setOpen] = useState(schedule.open);
  const [close, setClose] = useState(schedule.close);
  const [list, setList] = useState<Closure[]>(closures);
  const [date, setDate] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const addClosure = () => {
    setError('');
    if (!date) return setError('נא לבחור תאריך לסגירה.');
    if ((from && !to) || (!from && to)) return setError('כדי לסגור טווח שעות צריך למלא גם "משעה" וגם "עד שעה".');
    if (from && to && toMinutes(from) >= toMinutes(to)) return setError('שעת הסיום חייבת להיות אחרי שעת ההתחלה.');
    setList((prev) => [...prev, { date, ...(from && to ? { from, to } : {}) }].sort((a, b) => a.date.localeCompare(b.date)));
    setDate('');
    setFrom('');
    setTo('');
  };

  const save = () => {
    setError('');
    if (days.length === 0) return setError('צריך לבחור לפחות יום פעילות אחד.');
    if (toMinutes(open) >= toMinutes(close)) return setError('שעת הפתיחה חייבת להיות לפני שעת הסגירה.');
    onSave({ days, open, close }, list);
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-extrabold text-gray-800">ניהול שעות פעילות ⏰</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl transition-colors">&times;</button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-4">
            <p className="text-sm font-bold text-blue-900">ימי ושעות פעילות קבועים</p>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((label, d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${days.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1">פתיחה</label>
                <input type="time" value={open} onChange={(e) => setOpen(e.target.value)} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1">סגירה</label>
                <input type="time" value={close} onChange={(e) => setClose(e.target.value)} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 space-y-4">
            <p className="text-sm font-bold text-orange-900">סגירה חד-פעמית (חג, חופש, אירוע)</p>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">באיזה תאריך?</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1">משעה (אם לא כל היום)</label>
                <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1">עד שעה</label>
                <input type="time" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <button type="button" onClick={addClosure} className="w-full bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700 transition-all">הוסף סגירה</button>

            {list.length > 0 && (
              <ul className="space-y-2">
                {list.map((c, i) => (
                  <li key={`${c.date}-${i}`} className="flex items-center justify-between bg-white border border-orange-100 rounded-xl px-4 py-2 text-sm">
                    <span className="font-medium text-gray-700">
                      {c.date.split('-').reverse().join('/')} {c.from && c.to ? `· ${c.from}–${c.to}` : '· כל היום'}
                    </span>
                    <button type="button" onClick={() => setList((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-500 font-bold" aria-label="הסר סגירה">✖</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}

          <button type="button" onClick={save} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all">שמור</button>
        </div>
      </div>
    </div>
  );
}
