'use client';

import { useState } from 'react';
import { reminderMessage, reminderUrl } from '../utils/reminders';

type Appt = { id: string; site_id: string; customer_name: string; customer_phone: string; date: string };

const storageKey = (id: string) => `reminded:${id}`;

// כפתור "שלח תזכורת": פותח וואטסאפ עם הודעה מוכנה ללקוח. הסימון "נשלחה" נשמר רק בדפדפן הזה.
export default function ReminderButton({ appt, businessName }: { appt: Appt; businessName: string }) {
  const [sent, setSent] = useState(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(storageKey(appt.id)) === '1';
    } catch {
      return false;
    }
  });

  const url = reminderUrl(
    appt.customer_phone,
    reminderMessage({
      customerName: appt.customer_name,
      businessName,
      date: appt.date,
      siteUrl: typeof window !== 'undefined' ? `${window.location.origin}/site/${appt.site_id}` : '',
    })
  );

  if (!url) return <span className="text-xs text-gray-400">אין מספר תקין</span>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        setSent(true);
        try {
          localStorage.setItem(storageKey(appt.id), '1');
        } catch {
          // הסימון הוא רק נוחות
        }
      }}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${sent ? 'bg-gray-100 text-gray-600' : 'bg-[#15803d] text-white hover:bg-[#166534]'}`}
    >
      {sent ? '✓ נשלחה, שלח שוב' : '💬 שלח תזכורת'}
    </a>
  );
}
