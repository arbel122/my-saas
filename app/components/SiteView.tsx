'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReviewsSection from './ReviewsSection';
import BookingModal from './BookingModal';
import CatalogSection from './CatalogSection';
import MyAppointmentsModal from './MyAppointmentsModal';
import { accessibleColor } from '../utils/color';

type Props = {
  siteData: any;
  siteId: string;
  /** בעל האתר רואה אתר שעוד לא פורסם */
  isPreview?: boolean;
  /** אתר דוגמה מדף הבית: אין שמירה אמיתית, והפעולות מציגות הסבר */
  demo?: boolean;
  /** פתיחה אוטומטית של "התורים שלי" (קישור אישי מלקוח) */
  openMyAppointments?: boolean;
};

const DEMO_REVIEWS = [
  { name: 'מיכל ל.', rating: 5, comment: 'שירות מעולה ויחס אישי. ממליצה בחום!' },
  { name: 'דנה כ.', rating: 5, comment: 'הכול היה מדויק ובזמן, בטוח אחזור.' },
  { name: 'יוסי א.', rating: 4, comment: 'מקצועי ואדיב, מאוד מרוצה מהתוצאה.' },
];

// התצוגה של אתר עסק, משותפת לאתר האמיתי (/site/[id]) ולאתרי הדוגמה (/demo/[slug]).
export default function SiteView({ siteData, siteId, isPreview = false, demo = false, openMyAppointments = false }: Props) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [isMyAppointmentsOpen, setIsMyAppointmentsOpen] = useState(openMyAppointments);
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  const bookingEnabled = siteData.bookingEnabled !== false;
  const theme = accessibleColor(siteData.themeColor);

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openBookingModal = (serviceName = '') => {
    if (demo) {
      setShowDemoNotice(true);
      return;
    }
    setSelectedService(serviceName);
    setIsBookingModalOpen(true);
  };

  const openMyAppointmentsModal = () => {
    if (demo) {
      setShowDemoNotice(true);
      return;
    }
    setIsMyAppointmentsOpen(true);
  };

  return (
    <div dir="rtl" className="min-h-screen font-sans bg-white relative">
      {demo && (
        <div className="bg-gray-900 text-white px-4 py-3 flex flex-wrap items-center justify-center gap-3 text-sm font-bold">
          <span>זהו אתר דוגמה שנוצר ב-Opnyx.</span>
          <Link href="/create" className="bg-white text-gray-900 px-4 py-1.5 rounded-full hover:bg-gray-100">צור אתר כזה לעסק שלך</Link>
          <Link href="/#templates" className="text-gray-300 underline">חזרה לדוגמאות</Link>
        </div>
      )}

      {isPreview && (
        <div className="bg-orange-500 text-white px-4 py-3 flex flex-wrap items-center justify-center gap-3 text-sm font-bold sticky top-0 z-[300]">
          <span>תצוגה מקדימה: האתר עדיין לא פורסם, ורק אתה רואה אותו. אי אפשר לקבוע בו תורים.</span>
          <a href="/checkout" className="bg-white text-orange-600 px-4 py-1.5 rounded-full hover:bg-orange-50">פרסם את האתר</a>
        </div>
      )}

      {showDemoNotice && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDemoNotice(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="text-5xl mb-3">✨</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">זו רק דוגמה</h2>
            <p className="text-gray-600 mb-6">
              באתר אמיתי כאן הלקוחות בוחרים שעה פנויה מהיומן שלך וקובעים תור, והכול מגיע אליך לדשבורד ולוואטסאפ.
            </p>
            <Link href="/create" className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold mb-3">
              צור אתר כזה לעסק שלך
            </Link>
            <button onClick={() => setShowDemoNotice(false)} className="text-gray-500 text-sm underline">
              המשך לראות את הדוגמה
            </button>
          </div>
        </div>
      )}

      {!demo && isMyAppointmentsOpen && bookingEnabled && (
        <MyAppointmentsModal
          siteId={siteId}
          businessName={siteData.businessName}
          contactPhone={siteData.contactPhone}
          themeColor={theme}
          onClose={() => setIsMyAppointmentsOpen(false)}
        />
      )}

      {!demo && isBookingModalOpen && bookingEnabled && (
        <BookingModal
          siteId={siteId}
          businessName={siteData.businessName}
          services={siteData.services || []}
          themeColor={theme}
          title={siteData.bookingTitle}
          text={siteData.bookingText}
          contactPhone={siteData.contactPhone}
          initialService={selectedService}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}

      {/* -------------------- תפריט ניווט -------------------- */}
      <header className={`bg-white shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-[100]`}>
        <h1 className="text-2xl font-black text-gray-800">{siteData.businessName || 'שם העסק'}</h1>

        <div className="flex items-center gap-2 md:gap-4">
          {bookingEnabled && (
            <>
              <button onClick={openMyAppointmentsModal} className="text-sm text-gray-600 hover:text-gray-900 font-bold px-3 py-2.5 transition-colors">
                התורים שלי
              </button>
              <button onClick={() => openBookingModal()} className="hidden md:block bg-gray-100 text-gray-800 px-5 py-2.5 rounded-full font-bold shadow-sm">
                קביעת תור
              </button>
            </>
          )}
          <button onClick={scrollToContact} className="text-white px-6 py-2.5 rounded-full font-bold shadow-md" style={{ backgroundColor: theme }}>
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
        {siteData.location && (
          <p className="mt-6 text-gray-700 font-bold">📍 {siteData.businessType === 'mobile' ? 'אזורי שירות' : 'כתובת'}: <span className="font-normal">{siteData.location}</span></p>
        )}
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
                    {bookingEnabled ? (
                      <>
                        <div className="text-sm text-gray-500 mb-3 font-medium">⏱️ זמן משוער: {service.duration || '60 דקות'}</div>
                        <button onClick={() => openBookingModal(service.name)} className="inline-block px-6 py-3 rounded-full font-bold text-white w-full max-w-[250px] shadow-sm" style={{ backgroundColor: theme }}>
                          {service.price}
                        </button>
                      </>
                    ) : (
                      <div className="inline-block px-6 py-3 rounded-full font-bold text-white w-full max-w-[250px] shadow-sm" style={{ backgroundColor: theme }}>
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
        themeColor={theme}
        phone={siteData.contactPhone}
        businessName={siteData.businessName}
      />

      {bookingEnabled && (
        <div className="py-10 px-4 text-center bg-white border-t border-gray-100">
          <p className="text-gray-600 mb-3">כבר קבעתם תור אצלנו? אפשר לבטל לפני התור, ולכתוב ביקורת אחריו.</p>
          <button
            onClick={openMyAppointmentsModal}
            className="px-8 py-3 rounded-full font-bold text-white shadow-md hover:opacity-90"
            style={{ backgroundColor: theme }}
          >
            התורים שלי: ביטול וביקורת
          </button>
        </div>
      )}

      {/* -------------------- אזור הצגת ביקורות -------------------- */}
      {demo ? (
        <div className="py-16 px-4 bg-gray-50 border-t">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">מה הלקוחות אומרים</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DEMO_REVIEWS.map((r) => (
                <div key={r.name} className="bg-white p-6 rounded-2xl shadow-sm border text-right">
                  <div className="text-yellow-400 text-xl mb-2">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  <p className="text-gray-700 mb-3">{r.comment}</p>
                  <p className="text-sm font-bold text-gray-500">{r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ReviewsSection siteId={siteId} />
      )}

      {/* -------------------- אזור צור קשר -------------------- */}
      <div id="contact-section" className="py-24 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-8">דברו איתנו</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <a
              href={!demo && siteData.contactPhone ? `https://wa.me/972${siteData.contactPhone.replace(/^0/, '')}` : '#'}
              target={!demo && siteData.contactPhone ? '_blank' : '_self'}
              onClick={demo ? (e) => { e.preventDefault(); setShowDemoNotice(true); } : undefined}
              className="inline-flex items-center justify-center gap-3 bg-[#15803d] text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-[#166534] shadow-lg w-full md:w-auto"
            >
              <span>וואטסאפ לבעל העסק</span><span className="text-2xl">💬</span>
            </a>
          </div>
        </div>
      </div>

      <footer className="pt-6 pb-24 px-4 text-center text-xs text-gray-500 border-t border-gray-100 bg-white">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/privacy" className="underline hover:text-gray-800 py-1">מדיניות פרטיות</Link>
          <Link href="/terms" className="underline hover:text-gray-800 py-1">תקנון</Link>
          <Link href="/accessibility" className="underline hover:text-gray-800 py-1">הצהרת נגישות</Link>
          <span>נבנה ב-<Link href="/" className="underline hover:text-gray-800">Opnyx</Link></span>
        </div>
      </footer>
    </div>
  );
}
