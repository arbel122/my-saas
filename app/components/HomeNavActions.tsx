'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/utils/supabase';
import { getAuthHeader } from '@/app/utils/auth-client';

// כפתורי הניווט בדף הבית: משתמש שמחובר רואה כפתור לדשבורד, אורח רואה הרשמה והתחברות.
export default function HomeNavActions() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setLoggedIn(!!data.session);
      // מטפל בצוות של עסק רואה גם קישור ליומן שלו
      if (data.session) {
        try {
          const res = await fetch('/api/staff/me', { headers: { ...(await getAuthHeader()) } });
          const body = await res.json().catch(() => ({}));
          setIsStaff(res.ok && Array.isArray(body.memberships) && body.memberships.length > 0);
        } catch {
          // בלי הקישור הנוסף ממשיכים כרגיל
        }
      }
    });
  }, []);

  // עד שהבדיקה מסתיימת לא מציגים כלום, כדי שהכפתורים לא יקפצו
  if (loggedIn === null) return <div className="h-10" />;

  if (loggedIn) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/my-appointments"
          className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-2 py-2"
        >
          התורים שלי
        </Link>
        {isStaff && (
          <Link href="/staff" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-2 py-2">
            היומן שלי כמטפל
          </Link>
        )}
        <Link
          href="/dashboard"
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 py-2 text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
        >
          לדשבורד שלי
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 dir-ltr">
      <Link
        href="/login"
        className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 py-2 text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
      >
        צור חשבון חינם
      </Link>
      <Link
        href="/login"
        className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block px-2"
      >
        התחבר
      </Link>
    </div>
  );
}
