'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/utils/supabase';
import ReviewsSection from '../../components/ReviewsSection';
import BookingModal from '../../components/BookingModal';
import CatalogSection from '../../components/CatalogSection';

export default function PublicSitePage() {
  const params = useParams(); 
  const [siteData, setSiteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  
  // שומר האם האתר הוא פרו
  const [isProSite, setIsProSite] = useState(false);

  // חלונית קביעת תור
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  
  // שומר את פרטי התור שנקבע בהצלחה עבור הודעת האישור והדירוג

  // חלונית ביטול תור
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelToken, setCancelToken] = useState<string | null>(null);
  const [cancelData, setCancelData] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

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
          setSiteData(data.content);
          setIsProSite(data.is_pro || false);
          
          if (!hasIncrementedView) {
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
    if (cancelId) {
      setCancelToken(cancelId);
      setIsCancelModalOpen(true);
      fetchAppointmentForCancel(cancelId);
    }
  }, [params, hasIncrementedView]);

  const fetchAppointmentForCancel = async (token: string) => {
    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(token)}`);
      if (!res.ok) {
        setCancelMessage('לא מצאנו את התור. ייתכן שהוא כבר בוטל.');
        return;
      }
      const data = await res.json();
      setCancelData({ customer_name: data.customerName, date: data.date });
    } catch {
      setCancelMessage('שגיאה בטעינת נתוני התור.');
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelData || !cancelToken) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(cancelToken)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'שגיאה בביטול התור');
      setCancelMessage('התור בוטל בהצלחה! השעה התפנתה ביומן.');
      setCancelData(null);
    } catch (err) {
      setCancelMessage(err instanceof Error ? err.message : 'שגיאה בביטול התור');
    } finally {
      setIsCancelling(false);
    }
  };

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

  if (error || !siteData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">אופס! האתר לא נמצא</h1>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen font-sans bg-white relative pb-32">
      
      {/* -------------------- מודל ביטול תור -------------------- */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCancelModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 text-center animate-in fade-in zoom-in-95">
            <button onClick={() => setIsCancelModalOpen(false)} className="absolute top-4 right-4 bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full text-xl">✖</button>
            
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">📅</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">ניהול תור</h2>
            
            {!cancelToken && !cancelMessage ? (
               <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                 <p className="font-bold text-blue-800 mb-2 text-lg">איך מבטלים או מנהלים תור?</p>
                 <p className="text-sm text-blue-700 leading-relaxed">
                   הקישור לניהול וביטול התור נמצא <strong>בהודעת הוואטסאפ</strong> שקיבלתם כשקבעתם את התור. <br/><br/>
                   אנא חזרו לוואטסאפ ולחצו על הקישור האישי שלכם.
                 </p>
               </div>
            ) : cancelMessage ? (
              <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-xl font-medium">{cancelMessage}</div>
            ) : cancelData ? (
              <div className="mt-6">
                <div className="bg-gray-50 p-4 rounded-xl text-right mb-6 border border-gray-100">
                  <p className="text-gray-500 text-sm mb-1">שם הלקוח</p>
                  <p className="font-bold text-gray-800 mb-3">{cancelData.customer_name}</p>
                  <p className="text-gray-500 text-sm mb-1">מועד התור</p>
                  <p className="font-bold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">{cancelData.date}</p>
                </div>
                <button 
                  onClick={handleCancelAppointment} disabled={isCancelling}
                  className="w-full py-3 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'מבטל...' : 'בטל את התור הזה'}
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-500 mt-4">טוען פרטי תור...</p>
              </div>
            )}
          </div>
        </div>
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
              <button onClick={() => setIsCancelModalOpen(true)} className="hidden md:block text-sm text-gray-500 hover:text-red-500 font-medium ml-4 transition-colors">
                ביטול תור
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
            
            {isProSite ? (
              <a 
                href="https://wa.me/972509388865?text=היי ארבל, אני מנוי Pro ואשמח לעזרה טכנית אישית!" 
                target="_blank" 
                className="inline-flex items-center justify-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-purple-700 shadow-lg w-full md:w-auto"
              >
                <span>תמיכה טכנית VIP (אישית מול ארבל)</span><span className="text-2xl">🛠️</span>
              </a>
            ) : (
              <a 
                href="https://wa.me/972509388865?text=היי, אשמח לשמוע פרטים נוספים על חבילת ה-Pro של SiteAI" 
                target="_blank" 
                className="inline-flex items-center justify-center gap-3 bg-gray-800 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-gray-900 shadow-lg w-full md:w-auto"
              >
                <span>תמיכה כללית / שדרוג ל-Pro</span><span className="text-2xl">💬</span>
              </a>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}