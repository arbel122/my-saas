'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReviewsSection from './ReviewsSection';
import BookingModal from './BookingModal';
import CatalogSection from './CatalogSection';
import MyAppointmentsModal from './MyAppointmentsModal';
import { CalendarIcon, ClockIcon, PhoneIcon, PinIcon, WhatsappIcon } from './SiteIcons';
import { accessibleColor } from '../utils/color';
import { SITE_BODY_FONT, siteLook, tintColor } from '../utils/site-theme';
import { getVisitSource, trackSiteEvent } from '../utils/source';
import type { StaffCatalog } from '../utils/staff';

type Props = {
  siteData: any;
  siteId: string;
  /** בעל האתר רואה אתר שעוד לא פורסם */
  isPreview?: boolean;
  /** אתר דוגמה מדף הבית: אין שמירה אמיתית, והפעולות מציגות הסבר */
  demo?: boolean;
  /** פתיחה אוטומטית של "התורים שלי" (קישור אישי מלקוח) */
  openMyAppointments?: boolean;
  /** מוצרים שמטפלים בצוות מוכרים, מוצגים על שמם */
  staffCatalogs?: StaffCatalog[];
};

const DEMO_REVIEWS = [
  { name: 'מיכל ל.', rating: 5, comment: 'שירות מעולה ויחס אישי. ממליצה בחום!' },
  { name: 'דנה כ.', rating: 5, comment: 'הכול היה מדויק ובזמן, בטוח אחזור.' },
  { name: 'יוסי א.', rating: 4, comment: 'מקצועי ואדיב, מאוד מרוצה מהתוצאה.' },
];

// התצוגה של אתר עסק, משותפת לאתר האמיתי (/site/[id]) ולאתרי הדוגמה (/demo/[slug]).
export default function SiteView({ siteData, siteId, isPreview = false, demo = false, openMyAppointments = false, staffCatalogs = [] }: Props) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [isMyAppointmentsOpen, setIsMyAppointmentsOpen] = useState(openMyAppointments);
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  const bookingEnabled = siteData.bookingEnabled !== false;
  const theme = accessibleColor(siteData.themeColor);
  const look = siteLook(siteData);
  const tint = tintColor(theme, look.tint);
  const waDigits = (siteData.contactPhone || '').replace(/\D/g, '');
  const waLink = !demo && waDigits ? `https://wa.me/${waDigits.startsWith('0') ? `972${waDigits.slice(1)}` : waDigits}` : '';
  const isPhysical = siteData.businessType === 'physical';
  const centered = look.heroAlign === 'center';

  // קובעים את מקור ההגעה בכניסה (לפני שהכתובת משתנה), ורושמים לחיצות על וואטסאפ וטלפון
  useEffect(() => {
    if (!demo) getVisitSource();
  }, [demo]);
  const track = (type: 'whatsapp' | 'phone') => {
    if (!demo && !isPreview) trackSiteEvent(siteId, type);
  };

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
    <div dir="rtl" className={`min-h-screen bg-white relative ${SITE_BODY_FONT}`}>
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
      <header className="bg-white/95 backdrop-blur border-b border-gray-200 py-3.5 px-5 md:px-8 flex justify-between items-center sticky top-0 z-[100]">
        <h1 className={`${look.heading} !text-lg md:!text-2xl leading-tight text-gray-900`}>{siteData.businessName || 'שם העסק'}</h1>

        <div className="flex items-center gap-1 md:gap-3">
          {bookingEnabled && (
            <button onClick={openMyAppointmentsModal} className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2.5 transition-colors">
              התורים שלי
            </button>
          )}
          {bookingEnabled && (
            <button onClick={() => openBookingModal()} className={`hidden md:inline-flex items-center gap-2 text-white px-5 py-2.5 font-bold text-sm ${look.button}`} style={{ backgroundColor: theme }}>
              <CalendarIcon className="w-4 h-4" /> קביעת תור
            </button>
          )}
          <button onClick={scrollToContact} className={`px-5 py-2.5 font-bold text-sm border border-gray-300 text-gray-800 hover:bg-gray-50 ${look.button}`}>
            צור קשר
          </button>
        </div>
      </header>

      {/* -------------------- פתיחה -------------------- */}
      <div className="pt-6 pb-14 px-4 max-w-6xl mx-auto">
        <div className={`relative w-full h-[420px] md:h-[560px] overflow-hidden bg-gray-900 flex flex-col justify-end ${look.hero}`}>
          <img src={siteData.generatedImageUrl || `https://image.pollinations.ai/prompt/${siteData.imageKeywords || 'modern business'}?width=1920&height=1080&nologo=true`} alt="תמונת רקע" className="absolute inset-0 w-full h-full object-cover" />
          <div className={`absolute inset-0 ${centered ? 'bg-gradient-to-t from-black/75 via-black/25 to-black/5' : 'bg-gradient-to-l from-black/75 via-black/40 to-black/10'}`} />
          <div className={`relative z-10 w-full max-w-3xl p-6 md:p-12 flex flex-col ${centered ? 'items-center text-center mx-auto' : 'items-start text-right'}`}>
            {siteData.industry && (
              <p className="text-sm font-bold text-white/80 tracking-wide mb-3 flex items-center gap-2">
                <span className="inline-block w-8 h-px bg-white/60" />
                {siteData.industry}
              </p>
            )}
            <h2 className={`${look.heading} text-4xl md:text-6xl text-white leading-[1.1] !mt-0 !mb-0`}>{siteData.heroTitle}</h2>
            <p className="text-lg md:text-xl mt-5 text-white/90 max-w-xl leading-relaxed !mb-0">{siteData.heroSubtitle}</p>
            <div className={`mt-8 flex flex-wrap gap-3 ${centered ? 'justify-center' : ''}`}>
              {bookingEnabled && (
                <button onClick={() => openBookingModal()} className={`px-7 py-3.5 font-bold text-white ${look.button}`} style={{ backgroundColor: theme }}>
                  קביעת תור
                </button>
              )}
              <button onClick={scrollToContact} className={`px-7 py-3.5 font-bold text-white border border-white/70 hover:bg-white/10 ${look.button}`}>
                דברו איתנו
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- על העסק -------------------- */}
      <section className="py-14 md:py-20 px-4" style={{ backgroundColor: tint }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-10 md:gap-14 items-start">
          <div className="md:col-span-3">
            <h2 className={`${look.heading} text-3xl md:text-4xl text-gray-900 !mt-0 !mb-5`}>על העסק</h2>
            <p className="text-lg text-gray-700 leading-8 whitespace-pre-wrap !mb-0">{siteData.aboutText}</p>
          </div>
          <div className={`md:col-span-2 bg-white border border-gray-200 p-6 space-y-5 ${look.card}`}>
            {siteData.workingHours && (
              <div className="flex gap-3">
                <ClockIcon className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900 !mb-0.5">שעות פעילות</p>
                  <p className="text-gray-600 text-sm !mb-0">{siteData.workingHours}</p>
                </div>
              </div>
            )}
            {siteData.location && (
              <div className="flex gap-3">
                <PinIcon className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900 !mb-0.5">{isPhysical ? 'כתובת' : 'אזורי שירות'}</p>
                  <p className="text-gray-600 text-sm !mb-2">{siteData.location}</p>
                  {isPhysical && (
                    <div className="flex flex-wrap gap-2">
                      <a href={`https://waze.com/ul?q=${encodeURIComponent(siteData.location)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-full">Waze</a>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteData.location)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-full">Google Maps</a>
                    </div>
                  )}
                </div>
              </div>
            )}
            {siteData.contactPhone && !demo && (
              <div className="flex gap-3">
                <PhoneIcon className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900 !mb-0.5">טלפון</p>
                  <a href={`tel:${siteData.contactPhone}`} onClick={() => track('phone')} dir="ltr" className="text-gray-600 text-sm hover:underline">{siteData.contactPhone}</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* -------------------- שירותים -------------------- */}
      {siteData.showServices !== false && (
        <section className="py-14 md:py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className={`${look.heading} text-3xl md:text-4xl text-gray-900 !mt-0 !mb-10 ${centered ? 'text-center' : ''}`}>השירותים והמחירון</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {siteData.services?.map((service: any, index: number) => (
                <article key={index} className={`border border-gray-200 bg-white overflow-hidden flex flex-col h-full ${look.card}`}>
                  {service.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={service.image} alt={service.name} loading="lazy" className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className={`${look.heading} text-xl text-gray-900 !mb-2`}>{service.name}</h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed flex-grow whitespace-pre-wrap !mb-0">{service.description}</p>
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-xl font-extrabold" style={{ color: theme }}>{service.price}</span>
                        {bookingEnabled && (
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-1"><ClockIcon className="w-3.5 h-3.5" />{service.duration || '60 דקות'}</span>
                        )}
                      </div>
                      {bookingEnabled && (
                        <button onClick={() => openBookingModal(service.name)} className={`px-5 py-2.5 font-bold text-sm text-white ${look.button}`} style={{ backgroundColor: theme }}>
                          קבעו תור
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <CatalogSection
        catalog={siteData.catalog}
        themeColor={theme}
        phone={siteData.contactPhone}
        businessName={siteData.businessName}
        headingClass={look.heading}
        cardClass={look.card}
        buttonClass={look.button}
        background={tint}
        onWhatsapp={() => track('whatsapp')}
      />

      {staffCatalogs.map((member) => (
        <CatalogSection
          key={member.id}
          catalog={member.catalog}
          themeColor={theme}
          phone={siteData.contactPhone}
          businessName={siteData.businessName}
          title={`המוצרים של ${member.name}`}
          contextName={member.name}
          headingClass={look.heading}
          cardClass={look.card}
          buttonClass={look.button}
          background={tint}
          onWhatsapp={() => track('whatsapp')}
        />
      ))}

      {bookingEnabled && (
        <div className="py-10 px-4 text-center bg-white border-t border-gray-100">
          <p className="text-gray-600 mb-3 !mb-3">כבר קבעתם תור אצלנו? אפשר לבטל לפני התור, ולכתוב ביקורת אחריו.</p>
          <button
            onClick={openMyAppointmentsModal}
            className={`px-7 py-3 font-bold text-white hover:opacity-90 ${look.button}`}
            style={{ backgroundColor: theme }}
          >
            התורים שלי: ביטול וביקורת
          </button>
        </div>
      )}

      {/* -------------------- ביקורות -------------------- */}
      {demo ? (
        <section className="py-14 px-4 border-t" style={{ backgroundColor: tint }}>
          <div className="max-w-5xl mx-auto">
            <h2 className={`${look.heading} text-3xl text-gray-900 !mt-0 !mb-8 ${centered ? 'text-center' : ''}`}>מה הלקוחות אומרים</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DEMO_REVIEWS.map((r) => (
                <div key={r.name} className={`bg-white p-6 border border-gray-200 text-right ${look.card}`}>
                  <div className="text-amber-500 text-lg mb-2" aria-label={`${r.rating} כוכבים`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  <p className="text-gray-700 mb-3">{r.comment}</p>
                  <p className="text-sm font-bold text-gray-500 !mb-0">{r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <ReviewsSection siteId={siteId} headingClass={look.heading} cardClass={look.card} background={tint} googleReviewUrl={siteData.googleReviewUrl} />
      )}

      {/* -------------------- צור קשר -------------------- */}
      <section id="contact-section" className="py-16 md:py-24 px-4 bg-gray-900 text-white">
        <div className={`max-w-3xl mx-auto ${centered ? 'text-center' : ''}`}>
          <h2 className={`${look.heading} text-3xl md:text-4xl !text-white !mt-0 !mb-4`}>דברו איתנו</h2>
          <p className="text-gray-300 text-lg !mb-8">{siteData.contactText || 'נשמח לשמוע מכם.'}</p>
          <div className={`flex flex-col sm:flex-row gap-3 ${centered ? 'justify-center' : ''}`}>
            <a
              href={waLink || '#'}
              target={waLink ? '_blank' : '_self'}
              rel="noopener noreferrer"
              onClick={demo ? (e) => { e.preventDefault(); setShowDemoNotice(true); } : () => track('whatsapp')}
              className={`inline-flex items-center justify-center gap-2.5 bg-[#15803d] hover:bg-[#166534] text-white px-8 py-4 font-bold text-lg ${look.button}`}
            >
              <WhatsappIcon className="w-5 h-5" /> וואטסאפ לבעל העסק
            </a>
            {siteData.contactPhone && !demo && (
              <a href={`tel:${siteData.contactPhone}`} onClick={() => track('phone')} className={`inline-flex items-center justify-center gap-2.5 border border-white/40 hover:bg-white/10 text-white px-8 py-4 font-bold text-lg ${look.button}`}>
                <PhoneIcon className="w-5 h-5" /> התקשרו
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="pt-6 pb-28 md:pb-10 px-4 text-center text-xs text-gray-500 border-t border-gray-100 bg-white">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/privacy" className="underline hover:text-gray-800 py-1">מדיניות פרטיות</Link>
          <Link href="/terms" className="underline hover:text-gray-800 py-1">תקנון</Link>
          <Link href="/accessibility" className="underline hover:text-gray-800 py-1">הצהרת נגישות</Link>
          <span>נבנה ב-<Link href="/" className="underline hover:text-gray-800">Opnyx</Link></span>
        </div>
      </footer>

      {/* -------------------- סרגל פעולה צמוד בנייד -------------------- */}
      {(bookingEnabled || waLink) && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-[150] bg-white/95 backdrop-blur border-t border-gray-200 p-3 flex gap-3">
          {bookingEnabled && (
            <button onClick={() => openBookingModal()} className={`flex-1 py-3 font-bold text-white flex items-center justify-center gap-2 ${look.button}`} style={{ backgroundColor: theme }}>
              <CalendarIcon className="w-4 h-4" /> קביעת תור
            </button>
          )}
          {waLink && (
            <a href={waLink} onClick={() => track('whatsapp')} target="_blank" rel="noopener noreferrer" className={`flex-1 py-3 font-bold text-white bg-[#15803d] flex items-center justify-center gap-2 ${look.button}`}>
              <WhatsappIcon className="w-4 h-4" /> וואטסאפ
            </a>
          )}
        </div>
      )}
    </div>
  );
}
