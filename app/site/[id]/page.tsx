'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/utils/supabase';
import ReviewsSection from '../../components/ReviewsSection';
import BookingModal from '../../components/BookingModal';
import CatalogSection from '../../components/CatalogSection';
import MyAppointmentsModal from '../../components/MyAppointmentsModal';
import { rememberAppointment } from '../../utils/my-appointments';

export default function PublicSitePage() {
  const params = useParams(); 
  const [siteData, setSiteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  // אתר שלא שולם עליו: גולשים רואים "עוד לא פורסם", ובעל האתר המחובר רואה תצוגה מקדימה
  const [unpublished, setUnpublished] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  // חלונית קביעת תור
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  
  // שומר את פרטי התור שנקבע בהצלחה עבור הודעת האישור והדירוג

  // חלונית ביטול תור
  const [isMyAppointmentsOpen, setIsMyAppointmentsOpen] = useState(false);

  // טעינת האתר ובדיקה אם הלקוח הגיע מלינק ביטול
  useEffect(() => {
    if (!params?.id) return;

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
          
          if (!hasIncrementedView && data.is_pro === true) {
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
          }
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

    fetchSiteAndIncrementView();

    const searchParams = new URLSearchParams(window.location.search);
    const cancelId = searchParams.get('cancel');
    if (cancelId && /^[0-9a-f-]{36}$/i.test(cancelId)) {
      // קישור אישי (גם ממכשיר אחר): שומרים את התור במכשיר הזה ופותחים את "התורים שלי"
      rememberAppointment(params.id as string, { token: cancelId, service: '', date: '', time: '' });
      setIsMyAppointmentsOpen(true);
    }
}, [params, hasIncrementedView]);

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openBookingModal = (serviceName = '') => {
    setSelectedService(serviceName);
    setIsBookingModalOpen(true);
  };

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
    <div dir="rtl" className="min-h-screen font-sans bg-white relative pb-32">
      {isPreview && (
        <div className="bg-orange-500 text-white px-4 py-3 flex flex-wrap items-center justify-center gap-3 text-sm font-bold sticky top-0 z-[300]">
          <span>תצוגה מקדימה: האתר עדיין לא פורסם, ורק אתה רואה אותו. אי אפשר לקבוע בו תורים.</span>
          <a href="/checkout" className="bg-white text-orange-600 px-4 py-1.5 rounded-full hover:bg-orange-50">פרסם את האתר</a>
        </div>
      )}
      
      {isMyAppointmentsOpen && siteData.bookingEnabled !== false && (
        <MyAppointmentsModal
          siteId={params?.id as string}
          businessName={siteData.businessName}
          contactPhone={siteData.contactPhone}
          themeColor={siteData.themeColor}
          onClose={() => setIsMyAppointmentsOpen(false)}
        />
      )}

{isBookingModalOpen && siteData.bookingEnabled !== false && (
        <BookingModal
          siteId={params?.id as string}
          businessName={siteData.businessName}
          services={siteData.services || []}
          themeColor={siteData.themeColor}
          title={siteData.bookingTitle}
          text={siteData.bookingText}
          contactPhone={siteData.contactPhone}
          initialService={selectedService}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}

{/* -------------------- תפריט ניווט -------------------- */}
      <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-[100]">
        <h1 className="text-2xl font-black text-gray-800">{siteData.businessName || 'שם העסק'}</h1>
        
        <div className="flex items-center gap-2 md:gap-4">
          {siteData.bookingEnabled !== false && (
            <>
              <button onClick={() => setIsMyAppointmentsOpen(true)} className="text-sm text-gray-600 hover:text-gray-900 font-bold px-3 py-2.5 transition-colors">
                התורים שלי
              </button>
              <button onClick={() => openBookingModal()} className="hidden md:block bg-gray-100 text-gray-800 px-5 py-2.5 rounded-full font-bold shadow-sm">
                קביעת תור
              </button>
            </>
          )}
          <button onClick={scrollToContact} className="text-white px-6 py-2.5 rounded-full font-bold shadow-md" style={{ backgroundColor: siteData.themeColor || '#2563eb' }}>
            צור קשר
          </button>
        </div>
      </header>

      {/* אזור ראשי - Hero */}
      <div className="pt-8 pb-20 px-4 max-w-6xl mx-auto">
        <div className="relative w-full h-[400px] md:h-[550px] overflow-hidden rounded-[2rem] shadow-2xl bg-gray-900 flex flex-col justify-center items-center">
          <img src={siteData.generatedImageUrl || `https://image.pollinations.ai/prompt/${siteData.imageKeywords || 'modern business'}?width=1920&height=1080&nologo=true`} alt="תמונת רקע" className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" /> 
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center px-4">
            <h2 className="text-5xl font-extrabold text-white drop-shadow-lg">{siteData.heroTitle}</h2>
            <p className="text-xl mt-6 text-gray-100 drop-shadow-md">{siteData.heroSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="py-20 px-4 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">על העסק</h2>
        <p className="text-lg text-gray-600 whitespace-pre-wrap">{siteData.aboutText}</p>
        {siteData.workingHours && (
          <p className="mt-6 text-gray-700 font-bold">⏰ שעות פעילות: <span className="font-normal">{siteData.workingHours}</span></p>
        )}
      </div>

      {siteData.showServices !== false && (
<div className="py-20 px-4 bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">השירותים שלנו</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {siteData.services?.map((service: any, index: number) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border flex flex-col h-full hover:shadow-md">
                <h3 className="text-xl font-bold text-gray-800 text-center md:text-right mb-3">{service.name}</h3>
                <p className="text-gray-600 text-center md:text-right flex-grow mb-6 whitespace-pre-wrap">{service.description}</p>
                <div className="mt-auto text-center border-t pt-4">
                  {siteData.bookingEnabled !== false ? (
                    <>
                      <div className="text-sm text-gray-500 mb-3 font-medium">⏱️ זמן משוער: {service.duration || '60 דקות'}</div>
                      <button onClick={() => openBookingModal(service.name)} className="inline-block px-6 py-3 rounded-full font-bold text-white w-full max-w-[250px] shadow-sm" style={{ backgroundColor: siteData.themeColor || '#2563eb' }}>
                        {service.price}
                      </button>
                    </>
                  ) : (
                    <div className="inline-block px-6 py-3 rounded-full font-bold text-white w-full max-w-[250px] shadow-sm" style={{ backgroundColor: siteData.themeColor || '#2563eb' }}>
                      {service.price}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
)}

<CatalogSection
        catalog={siteData.catalog}
        themeColor={siteData.themeColor}
        phone={siteData.contactPhone}
        businessName={siteData.businessName}
      />

      {siteData.bookingEnabled !== false && (
        <div className="py-10 px-4 text-center bg-white border-t border-gray-100">
          <p className="text-gray-600 mb-3">כבר קבעתם תור אצלנו? אפשר לבטל לפני התור, ולכתוב ביקורת אחריו.</p>
          <button
            onClick={() => setIsMyAppointmentsOpen(true)}
            className="px-8 py-3 rounded-full font-bold text-white shadow-md hover:opacity-90"
            style={{ backgroundColor: siteData.themeColor || '#2563eb' }}
          >
            התורים שלי: ביטול וביקורת
          </button>
        </div>
      )}

      {/* -------------------- אזור הצגת ביקורות -------------------- */}
      {params?.id && <ReviewsSection siteId={params.id as string} />}

      {/* -------------------- אזור צור קשר -------------------- */}
      <div id="contact-section" className="py-24 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-8">דברו איתנו</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <a href={siteData.contactPhone ? `https://wa.me/972${siteData.contactPhone.replace(/^0/, '')}` : '#'} target={siteData.contactPhone ? "_blank" : "_self"} className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-[#1EBE5A] shadow-lg w-full md:w-auto">
              <span>וואטסאפ לבעל העסק</span><span className="text-2xl">💬</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}