'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { supportWhatsappUrl } from '../utils/config';
import Link from 'next/link';
import InstallAppButton from '../components/InstallAppButton';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isPro, setIsPro] = useState(false);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  type ManagedReview = {
    id: string;
    siteName: string;
    name: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    appointmentDate: string | null;
    hidden: boolean;
  };
  const [reviews, setReviews] = useState<ManagedReview[]>([]);
  const router = useRouter();

  useEffect(() => {
    const cleanPaymentParamAndFetch = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'success') {
        // מנקים את הפרמטר מהכתובת בלבד. הרשאות Pro נקבעות בשרת.
        window.history.replaceState(null, '', '/dashboard');
      }
      if (params.get('subscription') === '1') {
        setShowSubscription(true);
        window.history.replaceState(null, '', '/dashboard');
      }

      fetchSitesAndAppointments();
    };

    cleanPaymentParamAndFetch();
  }, []);

  const fetchSitesAndAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || 'User');
      const { data: proRow } = await supabase
        .from('pro_users')
        .select('is_active, ends_at')
        .eq('user_id', user.id)
        .maybeSingle();
      setIsPro(proRow?.is_active === true);
      // מציגים תאריך סיום רק אם הוא עדיין בעתיד
      setEndsAt(proRow?.ends_at && new Date(proRow.ends_at).getTime() > Date.now() ? proRow.ends_at : null);

      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sitesError) throw sitesError;
      const userSites = sitesData || [];
      setSites(userSites);
      fetchReviews();

      if (userSites.length > 0) {
        const siteIds = userSites.map((s: any) => s.id);
        const { data: apptsData, error: apptsError } = await supabase
          .from('appointments')
          .select('*')
          .in('site_id', siteIds)
          .order('created_at', { ascending: false });

        if (apptsError) throw apptsError;

        const now = new Date();
        const validAppointments = (apptsData || []).filter((appt: any) => {
          if (!appt.date) return true;
          
          const dateMatch = appt.date.match(/(\d{4}-\d{2}-\d{2})/);
          const timeMatch = appt.date.match(/(\d{2}:\d{2})/);
          
          if (dateMatch) {
            const dateStr = dateMatch[1];
            const timeStr = timeMatch ? timeMatch[1] : '00:00';
            const apptDateTime = new Date(`${dateStr}T${timeStr}:00`);
            
            return apptDateTime >= now;
          }
          return true;
        });

        setAppointments(validAppointments);
      }
    } catch (error: any) {
      alert('שגיאה בשליפת הנתונים: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק אתר זה? לא ניתן לבטל פעולה זו.')) return;
    
    try {
      const { error } = await supabase.from('sites').delete().eq('id', id);
      if (error) throw error;
      
      setSites(sites.filter(site => site.id !== id));
      setAppointments(appointments.filter(appt => appt.site_id !== id));
    } catch (error: any) {
      alert('שגיאה במחיקת האתר: ' + error.message);
    }
  };

  const handleEdit = (site: any) => {
    const siteToEdit = {
      ...site.content,
      id: site.id
    };
    
    localStorage.setItem('generatedSite', JSON.stringify(siteToEdit));
    router.push('/create');
  };

  const fetchReviews = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/reviews/manage', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) setReviews((await res.json()).reviews ?? []);
    } catch {
      // לא מציגים את אזור הביקורות אם הטעינה נכשלה
    }
  };

  const toggleReviewHidden = async (review: ManagedReview) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/reviews/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ reviewId: review.id, hidden: !review.hidden }),
    });
    if (res.ok) {
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, hidden: !r.hidden } : r)));
    } else {
      alert('שגיאה בעדכון הביקורת. נסו שוב.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('לבטל את המנוי? האתר שלך יישאר באוויר עד סוף התקופה ששולמה, ואחר כך יורד מהאוויר.')) return;
    setIsCancelling(true);
    setCancelError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/paypal/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'שגיאה בביטול המנוי');

      setEndsAt(data.endsAt ?? null);
      if (!data.endsAt) setIsPro(false);
      fetchSitesAndAppointments();
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'שגיאה בביטול המנוי');
    } finally {
      setIsCancelling(false);
    }
  };

  const subscriptionEnds = endsAt ? new Date(endsAt) : null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCreateNewSite = () => {
    localStorage.removeItem('generatedSite');
    router.push('/create');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-sans">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-bold text-gray-400">טוען את סביבת העבודה...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#fafafa] font-sans text-gray-900 selection:bg-blue-100 relative">
      
      {showSubscription && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative space-y-5">
            <button onClick={() => setShowSubscription(false)} aria-label="סגור" className="absolute top-4 left-4 bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full text-xl">✖</button>
            <h2 className="text-2xl font-extrabold text-gray-900">ניהול מנוי 💳</h2>

            {subscriptionEnds ? (
              <>
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-orange-900 space-y-1">
                  <p className="font-bold">המנוי בוטל</p>
                  <p className="text-sm">האתר שלך נשאר באוויר עד <strong>{subscriptionEnds.toLocaleDateString('he-IL')}</strong>. אחרי התאריך הזה הוא יורד מהאוויר, והנתונים שלך נשמרים.</p>
                </div>
                <button onClick={() => router.push('/checkout')} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">חדש את המנוי</button>
              </>
            ) : isPro ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-900 space-y-1">
                  <p className="font-bold">מסלול Pro פעיל</p>
                  <p className="text-sm">29 ₪ לחודש. הביטול נכנס לתוקף בסוף התקופה ששולמה, והאתר נשאר באוויר עד אז.</p>
                </div>
                {cancelError && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl p-3">{cancelError}</p>}
                <button onClick={handleCancelSubscription} disabled={isCancelling} className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 disabled:opacity-60">
                  {isCancelling ? 'מבטל...' : 'בטל מנוי'}
                </button>
                <p className="text-xs text-gray-500 text-center">אפשר לבטל גם ישירות מחשבון ה-PayPal שלך.</p>
              </>
            ) : (
              <>
                <p className="text-gray-600 text-sm">אין לך מנוי פעיל. אתרים שלא שולם עליהם נשארים טיוטה, ולא גלויים לגולשים.</p>
                <button onClick={() => router.push('/checkout')} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">שדרג ל-Pro ופרסם</button>
              </>
            )}
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                {userEmail.split('@')[0]}
                {isPro && <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black tracking-widest uppercase">PRO</span>}
              </p>
              <p className="text-xs text-gray-500">ניהול עסק</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
            <InstallAppButton />
            <Link href="/my-appointments" className="hidden sm:block text-sm font-bold text-gray-600 hover:text-gray-900 px-2 py-2">
              התורים שלי
            </Link>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-white px-4 py-2.5 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 hover:scale-105 transition-all z-50 flex items-center gap-2 text-sm font-bold text-gray-700"
              title="הגדרות חשבון"
            >
              <span>הגדרות חשבון</span>
              <span>⚙️</span>
            </button>
            
            {showSettings && (
              <div className="absolute top-14 left-0 bg-white border border-gray-100 shadow-2xl rounded-xl w-48 overflow-hidden flex flex-col z-[100]">
                <button 
                  className="px-4 py-3 text-right hover:bg-gray-50 border-b text-gray-700 transition font-medium flex justify-between items-center"
                  onClick={() => setShowSettings(false)}
                >
                  <span>סגור חלון</span>
                  <span>✖</span>
                </button>
                <button
                  className="px-4 py-3 text-right hover:bg-blue-50 text-blue-700 border-b transition font-medium flex justify-between items-center"
                  onClick={() => { setShowSettings(false); setShowSubscription(true); }}
                >
                  <span>ניהול מנוי</span>
                  <span>💳</span>
                </button>
                <a
                  href={supportWhatsappUrl(isPro ? 'היי, אני מנוי Pro ואשמח לעזרה עם האתר שלי.' : 'היי, אשמח לשמוע פרטים נוספים על חבילת ה-Pro של Opnyx.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 text-right hover:bg-green-50 text-green-700 border-b transition font-medium flex justify-between items-center"
                >
                  <span>תמיכה בוואטסאפ</span>
                  <span>💬</span>
                </a>
                <button
                  className="px-4 py-3 text-right hover:bg-red-50 text-red-600 transition font-medium flex justify-between items-center"
                  onClick={handleLogout}
                >
                  <span>התנתקות</span>
                  <span>🚪</span>
                </button>
              </div>
            )}

            <button 
              onClick={handleCreateNewSite}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 text-sm flex items-center gap-2"
            >
              <span>+ יצירת אתר</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="p-6 md:p-12 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-gray-900 via-gray-700 to-gray-900 mb-3 tracking-tight">
            הדשבורד שלי
          </h1>
          <p className="text-gray-500 text-lg">כאן תוכל לנהל את האתרים שלך ולעקוב אחר התורים של הלקוחות.</p>
        </header>

        {/* --- אזור יומן התורים --- */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">יומן תורים 📅</h2>
              <p className="text-gray-500 text-sm mt-1">כל הלקוחות שקבעו תורים אצל העסקים שלך</p>
            </div>
            <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-bold text-sm border border-blue-100">
              סה"כ: {appointments.length} תורים
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-gray-400 shadow-sm">
              אין תורים להצגה כרגע (או שכל התורים עברו). ברגע שמישהו יקבע תור עתידי, הוא יופיע כאן מיד!
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6">שם הלקוח</th>
                      <th className="py-4 px-6">טלפון נייד</th>
                      <th className="py-4 px-6">מועד התור והשירות</th>
                      <th className="py-4 px-6">שייך לאתר</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                    {appointments.map((appt) => {
                      const matchingSite = sites.find(s => s.id === appt.site_id);
                      return (
                        <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-gray-900">{appt.customer_name}</td>
                          <td className="py-4 px-6">
                            <a href={`tel:${appt.customer_phone}`} className="text-blue-600 hover:underline font-bold">
                              {appt.customer_phone} 📞
                            </a>
                          </td>
                          <td className="py-4 px-6">{appt.date}</td>
                          <td className="py-4 px-6 text-gray-500">
                            {matchingSite?.name || 'אתר עסקי'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* --- אזור ביקורות --- */}
        {reviews.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">ביקורות ⭐</h2>
                <p className="text-gray-500 text-sm mt-1">אפשר להסתיר ביקורת מזויפת או פוגענית. ביקורת מוסתרת לא מוצגת בכלל באתר.</p>
              </div>
              <span className="bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full font-bold text-sm border border-amber-100">
                סה&quot;כ: {reviews.length}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review.id} className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col gap-3 ${review.hidden ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{review.name}</p>
                      <p className="text-xs text-gray-400">{review.siteName}{review.appointmentDate ? ` · ${review.appointmentDate}` : ''}</p>
                    </div>
                    <span className="text-amber-400 text-lg whitespace-nowrap" aria-label={`${review.rating} כוכבים`}>{'★'.repeat(review.rating)}</span>
                  </div>
                  {review.comment && <p className="text-gray-700 text-sm">&quot;{review.comment}&quot;</p>}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                    <span className={`text-xs font-bold ${review.hidden ? 'text-gray-500' : 'text-green-600'}`}>{review.hidden ? 'מוסתרת מהאתר' : 'מוצגת באתר'}</span>
                    <button
                      onClick={() => toggleReviewHidden(review)}
                      className={`text-sm font-bold px-4 py-1.5 rounded-full transition-colors ${review.hidden ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                    >
                      {review.hidden ? 'הצג שוב' : 'הסתר'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- אזור ניהול האתרים --- */}
        <header className="mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">הפרויקטים שלי</h2>
        </header>

        {sites.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-lg rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-20 text-center max-w-3xl mx-auto transition-all">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✨</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4 tracking-tight">הקנבס שלך ריק</h2>
            <p className="text-gray-500 mb-10 text-lg max-w-md mx-auto leading-relaxed">
              הגיע הזמן להפוך את הרעיון שלך למציאות. תן לבינה המלאכותית שלנו לבנות עבורך אתר מושלם תוך פחות מדקה.
            </p>
            <button 
              onClick={handleCreateNewSite}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all hover:-translate-y-1"
            >
              התחל פרויקט חדש
              <span className="text-xl">→</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sites.map((site) => (
              <div 
                key={site.id} 
                className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 group flex flex-col h-full"
              >
                
                {/* אזור לחיץ לעריכה - התמונה העליונה */}
                <div 
                  onClick={() => handleEdit(site)}
                  className="h-48 flex items-center justify-center relative p-6 text-center overflow-hidden cursor-pointer" 
                  style={{ backgroundColor: site.content?.themeColor || '#2563eb' }}
                  title="לחץ כאן כדי להיכנס ולערוך את האתר"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <h3 className="text-2xl font-black text-white drop-shadow-md leading-tight relative z-10 transform group-hover:scale-105 transition-transform duration-500">
                    {site.content?.heroTitle?.substring(0, 40) || 'אתר ללא כותרת'}
                    {site.content?.heroTitle?.length > 40 ? '...' : ''}
                  </h3>
                </div>
                
                <div className="p-8 flex flex-col flex-grow bg-white relative">
                  
                  {site.is_pro ? (
                    <div className="absolute -top-5 right-8 bg-white px-4 py-1.5 rounded-full text-xs font-bold text-green-600 shadow-md border border-gray-100 flex items-center gap-2 pointer-events-none">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      באוויר
                    </div>
                  ) : (
                    <Link href="/checkout" className="absolute -top-5 right-8 bg-orange-50 px-4 py-1.5 rounded-full text-xs font-bold text-orange-600 shadow-md border border-orange-200 flex items-center gap-2 hover:bg-orange-100">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      טיוטה, לחצו לפרסום
                    </Link>
                  )}

                  <h4 
                    onClick={() => handleEdit(site)}
                    className="text-xl font-bold text-gray-900 mb-2 mt-2 cursor-pointer hover:text-blue-600 transition-colors"
                    title="לחץ לעריכת האתר"
                  >
                    {site.name}
                  </h4>
                  
                  {/* --- תוספת הצפיות החכמה והחסימה שלה --- */}
                  <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                    <p className="text-sm text-gray-500 font-medium">
                      עודכן: {new Date(site.created_at).toLocaleDateString('he-IL')}
                    </p>
                    
                    {isPro ? (
                      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        <span className="text-sm">👁️</span>
                        {site.views || 0} צפיות
                      </div>
                    ) : (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/pricing');
                        }}
                        className="flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold shadow-sm cursor-pointer hover:bg-gray-200 transition-colors"
                        title="שדרג ל-Pro כדי לראות סטטיסטיקות"
                      >
                        <span className="text-sm">🔒</span>
                        סטטיסטיקות ב-Pro
                      </div>
                    )}
                  </div>
                  
                  {/* הכפתורים הנקיים למטה */}
                  <div className="flex gap-3 mt-auto pt-2">
                    <Link 
                      href={`/site/${site.id}`} 
                      target="_blank"
                      className="flex-1 bg-gray-50 border border-gray-100 text-gray-700 py-3 rounded-xl font-bold text-center hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                    >
                      צפה באתר
                    </Link>
                    
                    <button 
                      onClick={() => handleDelete(site.id)}
                      className="w-14 flex justify-center items-center bg-white border border-gray-100 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all text-lg shadow-sm"
                      title="מחיקת פרויקט"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}