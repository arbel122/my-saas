'use client';

import { useEffect, useState } from 'react';
import { getAuthHeader } from '../utils/auth-client';
import { SOURCE_LABELS } from '../utils/source';

type Stats = {
  views: number;
  whatsapp: number;
  phone: number;
  appointmentsMonth: number;
  appointments30: number;
  sources: Array<{ source: string; count: number }>;
  tracking: boolean;
};

// סטטיסטיקות לבעל העסק: צפיות, פניות ותורים, ומאיפה הלקוחות מגיעים (30 הימים האחרונים).
export default function SiteStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/stats', { headers: { ...(await getAuthHeader()) } });
        if (res.ok) setStats(await res.json());
      } catch {
        // לא מציגים את האזור אם הטעינה נכשלה
      }
    })();
  }, []);

  if (!stats) return null;

  const cards: Array<[string, number]> = [
    ['צפיות באתר (מאז ההתחלה)', stats.views],
    ['תורים החודש', stats.appointmentsMonth],
    ...(stats.tracking ? ([['פניות בוואטסאפ (30 יום)', stats.whatsapp], ['לחיצות על חיוג (30 יום)', stats.phone]] as Array<[string, number]>) : []),
  ];
  const maxSource = Math.max(1, ...stats.sources.map((s) => s.count));

  return (
    <section className="mb-12">
      <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-1">סטטיסטיקות 📈</h2>
      <p className="text-gray-500 text-sm mb-6">מה קורה באתר שלך: כמה נכנסו, כמה פנו, וכמה קבעו תור.</p>
      <div className={`grid grid-cols-2 ${cards.length > 2 ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-3`}>
        {cards.map(([label, value]) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-3xl font-black text-gray-900">{value}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      {stats.sources.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mt-3">
          <p className="font-bold text-gray-800 mb-3">מאיפה הגיעו הפניות והתורים (30 יום)</p>
          <ul className="space-y-2">
            {stats.sources.map((s) => (
              <li key={s.source} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 font-bold text-gray-700 truncate">{SOURCE_LABELS[s.source] ?? s.source}</span>
                <span className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <span className="block h-full bg-blue-500 rounded-full" style={{ width: `${(s.count / maxSource) * 100}%` }} />
                </span>
                <span className="w-8 text-left font-black text-gray-900">{s.count}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-3">טיפ: שתפו קישור עם <span dir="ltr">?utm_source=instagram</span> בסוף כדי לראות כמה הגיעו מכל מקום.</p>
        </div>
      )}
    </section>
  );
}
