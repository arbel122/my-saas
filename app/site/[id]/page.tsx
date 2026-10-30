'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/utils/supabase';
import ReviewsSection from '../../components/ReviewsSection';

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
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // שומר את פרטי התור שנקבע בהצלחה עבור הודעת האישור והדירוג
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);

  // חלונית ביטול תור
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState<number | null>(null);
  const [cancelData, setCancelData] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  const todayString = new Date().toLocaleDateString('en-CA'); 

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
            const currentViews = data.views || 0;
            await supabase.from('sites').update({ views: currentViews + 1 }).eq('id', params.id as string);
            setHasIncrementedView(true);
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
      setCancelAppointmentId(Number(cancelId));
      setIsCancelModalOpen(true);
      fetchAppointmentForCancel(Number(cancelId));
    }
  }, [params, hasIncrementedView]);

  const fetchAppointmentForCancel = async (id: number) => {
    try {
      const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single();
      if (error || !data) {
        setCancelMessage('לא מצאנו את התור. ייתכן שהוא כבר בוטל.');
      } else {
        setCancelData(data);
      }
    } catch (err) {
      setCancelMessage('שגיאה בטעינת נתוני התור.');
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelData) return;
    setIsCancelling(true);
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', cancelData.id);
      if (error) throw error;
      setCancelMessage('התור בוטל בהצלחה! השעה התפנתה ביומן.');
      setCancelData(null); 
    } catch (err: any) {
      setCancelMessage('שגיאה בביטול התור: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openBookingModal = (serviceName = '') => {
    setSelectedService(serviceName);
    setBookedAppointment(null);
    setIsBookingModalOpen(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedService || !customerName || !customerPhone || !appointmentDate || !appointmentTime) {
      alert('אנא מלאו את כל השדות כדי שנוכל לשריין את התור.');
      return;
    }

    const selectedDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    if (selectedDateTime < now) {
      alert('המועד שבחרת כבר עבר! אנא בחר תאריך עתידי.');
      return; 
    }

    setIsSubmitting(true);
    try {
      const exactDateString = `${appointmentDate} בשעה ${appointmentTime} (${selectedService})`;

      const { data: existingAppts, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('site_id', params?.id)
        .eq('date', exactDateString);

      if (checkError) throw checkError;
      if (existingAppts && existingAppts.length > 0) {
        alert('אופס! התאריך והשעה האלו כבר תפוסים. אנא בחרו שעה אחרת.');
        setIsSubmitting(false);
        return;
      }

      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert([{ site_id: params?.id, customer_name: customerName, customer_phone: customerPhone, date: exactDateString }])
        .select();

      if (insertError) {
        alert('שגיאה מ-Supabase: ' + insertError.message);
        setIsSubmitting(false);
        return;
      }

      const createdAppointment = newAppointment[0];
      setBookedAppointment(createdAppointment);

      // שמירת הפרטים וניקוי הטופס
      setCustomerName(''); 
      setCustomerPhone(''); 
      setAppointmentDate(''); 
      setAppointmentTime('');
    } catch (err: any) {
      alert('שגיאה כללית: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
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
            
            {!cancelAppointmentId && !cancelMessage ? (
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

      {/* -------------------- מודל קביעת תור -------------------- */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsBookingModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto relative z-10 flex flex-col p-6">
            <button onClick={() => setIsBookingModalOpen(false)} className="absolute top-4 right-4 bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full text-xl z-20">✖</button>
            
            {/* אם התור נקבע בהצלחה - מציגים הודעת אישור מיוחדת עם כפתור דירוג */}
            {bookedAppointment ? (
              <div className="py-12 px-6 text-center space-y-6 max-w-lg mx-auto">
                <div className="text-5xl animate-bounce">🎉</div>
                <h2 className="text-3xl font-black text-emerald-900">התור נקבע בהצלחה!</h2>
                <p className="text-gray-600">
                  תודה שקבעת תור! התור שלך נשמר במערכת.
                </p>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
                  <p className="text-sm font-bold text-emerald-800">
                    נשמח לשמוע איך היתה החוויה שלך! תוכל לדרג ולהעלות תמונה:
                  </p>
                  <a
                    href={`/review/${bookedAppointment.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all"
                  >
                    ⭐ לחץ כאן לדירוג והשארת חוות דעת
                  </a>
                </div>

                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-2.5 rounded-full text-sm transition-colors"
                >
                  סגור חלונית
                </button>
              </div>
            ) : (
              /* טופס קביעת התור הרגיל */
              <>
                <div className="text-center pt-8 pb-6 border-b border-gray-100">
                  <h2 className="text-3xl font-bold text-gray-800">{siteData.bookingTitle || 'קביעת תור אונליין 📅'}</h2>
                </div>

                <div className="flex flex-col md:flex-row bg-white pt-6">
                  <div className="w-full md:w-3/5 p-6 border-b md:border-b-0 md:border-l border-gray-100">
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-3">בחרו שירות...</label>
                      <select className="w-full p-4 rounded-xl border-2 bg-gray-50" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                        <option value="" disabled>בחרו שירות...</option>
                        {siteData.services?.map((s: any, i: number) => (
                          <option key={i} value={s.name}>{s.name} ({s.duration || '60 דקות'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">תאריך</label>
                        <input type="date" min={todayString} value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="w-full p-4 rounded-xl border-2 bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">שעה</label>
                        <select value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} className="w-full p-4 rounded-xl border-2 bg-gray-50">
                          <option value="" disabled>בחרו...</option>
                          {Array.from(
                            { length: (siteData.closeHour || 19) - (siteData.openHour || 9) }, 
                            (_, i) => {
                              const hour = (siteData.openHour || 9) + i;
                              const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
                              return <option key={hour} value={formattedHour}>{formattedHour}</option>;
                            }
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-2/5 p-6 bg-gray-50/50 rounded-2xl">
                    <div className="flex flex-col gap-4">
                      <input type="text" placeholder="שם מלא" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-4 rounded-xl border bg-white" />
                      <input type="tel" placeholder="מספר נייד" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-4 rounded-xl border bg-white text-right" dir="rtl" />
                      <button disabled={isSubmitting} onClick={handleBookAppointment} className="w-full py-4 rounded-xl font-bold text-white mt-4" style={{backgroundColor: siteData.themeColor || '#2563eb'}}>
                        {isSubmitting ? 'שומר תור...' : 'שריין לי את התור'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* -------------------- תפריט ניווט -------------------- */}
      <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-[100]">
        <h1 className="text-2xl font-black text-gray-800">{siteData.businessName || 'שם העסק'}</h1>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => setIsCancelModalOpen(true)} className="hidden md:block text-sm text-gray-500 hover:text-red-500 font-medium ml-4 transition-colors">
            ביטול תור
          </button>
          <button onClick={() => openBookingModal()} className="hidden md:block bg-gray-100 text-gray-800 px-5 py-2.5 rounded-full font-bold shadow-sm">
            קביעת תור
          </button>
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
      </div>

      <div className="py-20 px-4 bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">השירותים שלנו</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {siteData.services?.map((service: any, index: number) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border flex flex-col h-full hover:shadow-md">
                <h3 className="text-xl font-bold text-gray-800 text-center md:text-right mb-3">{service.name}</h3>
                <p className="text-gray-600 text-center md:text-right flex-grow mb-6 whitespace-pre-wrap">{service.description}</p>
                <div className="mt-auto text-center border-t pt-4">
                  <div className="text-sm text-gray-500 mb-3 font-medium">⏱️ זמן משוער: {service.duration || '60 דקות'}</div>
                  <button onClick={() => openBookingModal(service.name)} className="inline-block px-6 py-3 rounded-full font-bold text-white w-full max-w-[250px] shadow-sm" style={{ backgroundColor: siteData.themeColor || '#2563eb' }}>
                    {service.price}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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