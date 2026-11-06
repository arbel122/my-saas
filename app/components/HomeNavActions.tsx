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
  if (loggedIn === null) return <div className="home-nav-actions" aria-hidden="true" style={{ height: 44 }} />;

  if (loggedIn) {
    return (
      <div className="home-nav-actions">
        <Link
          href="/my-appointments"
          className="home-nav-link"
        >
          התורים שלי
        </Link>
        {isStaff && (
          <Link href="/staff" className="home-nav-link">
            היומן שלי כמטפל
          </Link>
        )}
        <Link
          href="/dashboard"
          className="home-btn"
        >
          לדשבורד שלי
        </Link>
      </div>
    );
  }

  return (
    <div className="home-nav-actions">
      <Link
        href="/login?mode=signup"
        className="home-btn"
      >
        צור חשבון חינם
      </Link>
      <Link
        href="/login"
        className="home-nav-link home-nav-link--hide"
      >
        התחבר
      </Link>
    </div>
  );
}
