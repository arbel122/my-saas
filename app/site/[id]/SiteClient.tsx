'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/utils/supabase';
import SiteView from '../../components/SiteView';

// initialContent: אתר מפורסם שכבר נטען בשרת (מהיר יותר, וגוגל רואה את התוכן).
export default function PublicSiteClient({ initialContent }: { initialContent?: any }) {
  const params = useParams();
  const [siteData, setSiteData] = useState<any>(initialContent ?? null);
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState(false);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  // אתר שלא שולם עליו: גולשים רואים "עוד לא פורסם", ובעל האתר המחובר רואה תצוגה מקדימה
  const [unpublished, setUnpublished] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // הלקוח הגיע מקישור אישי לתור: פותחים לו את "התורים שלי"
  const [openMyAppointments, setOpenMyAppointments] = useState(false);

  // טעינת האתר ובדיקה אם הלקוח הגיע מלינק ביטול
  useEffect(() => {
    if (!params?.id) return;

    const countView = () => {
      if (hasIncrementedView) return;
      setHasIncrementedView(true);
      try {
        // מונים צפייה אחת לכל גולש בסשן. הספירה עצמה נעשית בשרת.
        const viewedKey = `viewed:${params.id}`;
        if (!sessionStorage.getItem(viewedKey)) {
          sessionStorage.setItem(viewedKey, '1');
          fetch(`/api/sites/${params.id}/view`, { method: 'POST' }).catch(() => {});
        }
      } catch {
        // sessionStorage לא זמין (למשל גלישה פרטית חסומה). מדלגים על הספירה.
      }
    };

    const fetchSiteAndIncrementView = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('sites')
          .select('*')
          .eq('id', params.id as string)
          .single();

        if (supabaseError) throw supabaseError;

        if (data && data.content) {
          if (data.is_pro !== true) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.id === data.user_id) {
              setIsPreview(true);
            } else {
              setUnpublished(true);
              return;
            }
          }
          setSiteData(data.content);

          if (data.is_pro === true) countView();
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('שגיאה בשליפת האתר:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (initialContent) {
      countView();
    } else {
      fetchSiteAndIncrementView();
    }

    const searchParams = new URLSearchParams(window.location.search);
    const cancelId = searchParams.get('cancel');
    if (cancelId && /^[0-9a-f-]{36}$/i.test(cancelId)) {
      // קישורים ישנים מההודעות: פותחים את "התורים שלי" (מהחשבון)
      setOpenMyAppointments(true);
    }
}, [params, hasIncrementedView, initialContent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (unpublished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-6 text-center" dir="rtl">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">האתר הזה עדיין לא פורסם</h1>
        <p className="text-gray-500 max-w-md">בעל העסק עדיין עובד עליו. נסו שוב מאוחר יותר.</p>
      </div>
    );
  }

  if (error || !siteData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">אופס! האתר לא נמצא</h1>
      </div>
    );
  }

  return (
    <SiteView
      siteData={siteData}
      siteId={params?.id as string}
      isPreview={isPreview}
      openMyAppointments={openMyAppointments}
    />
  );
}
