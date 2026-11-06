'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadSiteAssetWithError } from '@/app/utils/upload';
import { ClockIcon, ImageIcon, PinIcon } from '@/app/components/SiteIcons';
import { SITE_BODY_FONT, siteLook, tintColor } from '@/app/utils/site-theme';
import { supabase } from '@/app/utils/supabase';
import { getAuthHeader } from '@/app/utils/auth-client';
import ScheduleEditor from '@/app/components/ScheduleEditor';
import CatalogEditor from '@/app/components/CatalogEditor';
import ServiceWizard, { type NewService } from '@/app/components/ServiceWizard';
import BookingModal from '@/app/components/BookingModal';
import { DEFAULT_SCHEDULE, formatSchedule, getClosures, getSchedule, toMinutes, type Schedule } from '@/app/utils/schedule';

export default function CreatePage() {
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    superpower: '',
    services: '',
    location: '',
    businessType: 'physical',
    // 'yes' / 'no' / '' (עוד לא נענה). חובה לענות על שתי השאלות לפני יצירת האתר.
    needsBooking: '',
    sellsProducts: '',
    productCategories: ''
  });

  const [hours, setHours] = useState<Schedule>(DEFAULT_SCHEDULE);

  const [isLoading, setIsLoading] = useState(false);
  const [siteData, setSiteData] = useState<any>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');

  // === אזור הסטוריז ===
  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState<number | null>(null);
  const [activeStoryImageIndex, setActiveStoryImageIndex] = useState<number>(0);
  const [isStoryEditorOpen, setIsStoryEditorOpen] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryImages, setNewStoryImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === ניהול שעות פעילות ===
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  // === מודל הגדרת מבצע ===
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleConfigForm, setSaleConfigForm] = useState({
    serviceIndex: 0,
    discountPercentage: 20,
    urgencyType: 'people',
    peopleLeft: 15,
    endDate: '',
    endTime: '23:59'
  });

  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [showServiceWizard, setShowServiceWizard] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // משתמש Pro לא צריך לשלם שוב, ולכן הכפתור שלו רק שומר.
  useEffect(() => {
    async function loadProStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      // יוצרים אתר רק אחרי הרשמה או התחברות
      if (!user) {
        router.replace('/login?next=/create');
        return;
      }
      const { data } = await supabase.from('pro_users').select('is_active').eq('user_id', user.id).maybeSingle();
      setIsPro(data?.is_active === true);
    }
    loadProStatus();
  }, []);

  const themeColors = [
    '#2563eb', '#16a34a', '#dc2626', '#ca8a04',
    '#9333ea', '#0f766e', '#ea580c', '#111827'
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const nameFromUrl = searchParams.get('name');
      if (nameFromUrl) {
        setFormData((prev) => ({ ...prev, businessName: nameFromUrl }));
      }
    }

    const saved = localStorage.getItem('generatedSite');
    if (saved) {
      setSiteData(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.businessName || !formData.industry) {
      alert('אנא מלאו את שם העסק ותחום הפעילות');
      return;
    }
    if (!formData.needsBooking || !formData.sellsProducts) {
      alert('אנא ענו על השאלות: האם לקוחות קובעים אצלכם תור, והאם אתם מוכרים מוצרים.');
      return;
    }

    if (hours.days.length === 0 || toMinutes(hours.open) >= toMinutes(hours.close)) {
      alert('אנא בחרו לפחות יום פעילות אחד, ושעת פתיחה שקודמת לשעת הסגירה.');
      return;
    }

    const wantsBooking = formData.needsBooking === 'yes';
    const sellsProducts = formData.sellsProducts === 'yes';
    // סעיף השירותים נחוץ כשיש תורים, או כשהעסק לא מוכר מוצרים. עסק של מוצרים בלבד מקבל קטגוריות במקומו.
    const showServices = wantsBooking || !sellsProducts;

    const productCategories = sellsProducts
      ? formData.productCategories
          .split(/[,\n،]/)
          .map((name) => name.trim())
          .filter(Boolean)
          .slice(0, 8)
          .map((name, i) => ({ id: `cat-${Date.now()}-${i}`, name, items: [] }))
      : [];

    setIsLoading(true);

    const combinedDescription = `
      שם העסק: ${formData.businessName}.
      תחום הפעילות: ${formData.industry}.
      סוג שירות: ${formData.businessType === 'physical' ? 'מקום פיזי (הלקוח מגיע לעסק)' : 'עד בית הלקוח'}.
      שעות פעילות: ${formatSchedule(hours)}.
      היתרון המרכזי / למה לבחור בנו: ${formData.superpower}.
      ${showServices ? `שירותים עיקריים: ${formData.services}.` : 'העסק מוכר מוצרים בלבד ואין בו שירותים או תורים. כתוב את הטקסטים סביב המוצרים.'}
      ${sellsProducts ? `העסק מוכר גם מוצרים בקטגוריות: ${formData.productCategories || 'לא צוין'}. אלה מוצרים ולא שירותים, ולכן אל תכלול אותם ברשימת השירותים.` : ''}
      ${wantsBooking ? 'הלקוחות קובעים תור מראש.' : 'הלקוחות מגיעים או מזמינים בלי לקבוע תור, ולכן אל תכתוב על קביעת תור.'}
      אזור/כתובת מתן שירות: ${formData.location}.
    `;

    try {
      const res = await fetch('/api/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ businessDescription: combinedDescription })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה ביצירה');

      const newSiteData = {
        ...data.site,
        heroTitle: data.site.title,
        heroSubtitle: data.site.subtitle,
        generatedImageUrl: data.site.hero_image,
        aboutText: data.site.aboutText || 'אנחנו כאן כדי לתת לכם את השירות הטוב ביותר.',
        location: data.site.location || formData.location,
        industry: formData.industry,
        businessType: formData.businessType,
        workingHours: formatSchedule(hours),
        schedule: hours,
        closures: [],
        bookingEnabled: wantsBooking,
        showServices,
        showProducts: sellsProducts,
        catalog: productCategories,
        services: (data.site.services && data.site.services.length > 0) ? data.site.services : [
          { name: 'שירות ראשון', description: 'תיאור השירות שלך', price: '100 ₪', duration: '60 דקות' }
        ],
        stories: [],
        themeColor: '#2563eb',
        saleBannerActive: false,
        saleBannerText: '🔥 מבצע השקה מיוחד!',
        saleConfig: null,
        contactPhone: ''
      };

      setSiteData(newSiteData);
      setIsEditing(true);
      localStorage.setItem('generatedSite', JSON.stringify(newSiteData));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    if (!isEditing) return;
    const newData = { ...siteData, [field]: value };
    setSiteData(newData);
    localStorage.setItem('generatedSite', JSON.stringify(newData));
  };

  const updateFields = (fields: Record<string, any>) => {
    if (!isEditing) return;
    const newData = { ...siteData, ...fields };
    setSiteData(newData);
    localStorage.setItem('generatedSite', JSON.stringify(newData));
  };
  const calculateDiscount = (originalPriceStr: string, percentage: number) => {
    if (!originalPriceStr) return '0 ₪';
    const numMatch = originalPriceStr.match(/\d+/);
    if (!numMatch) return originalPriceStr;
    const oldPrice = parseInt(numMatch[0], 10);
    const newPrice = Math.round(oldPrice * (1 - percentage / 100));
    return `${newPrice} ₪`;
  };

  const handleSaveSaleConfig = () => {
    if (!saleConfigForm.discountPercentage || saleConfigForm.discountPercentage <= 0 || saleConfigForm.discountPercentage >= 100) {
      alert('נא להזין אחוז הנחה תקין (בין 1 ל-99)');
      return;
    }
    if (saleConfigForm.urgencyType === 'time' && !saleConfigForm.endDate) {
      alert('נא לבחור תאריך סיום למבצע');
      return;
    }

    let urgencyText = '';
    if (saleConfigForm.urgencyType === 'people') {
      urgencyText = `נשארו ${saleConfigForm.peopleLeft} מקומות בלבד!`;
    } else {
      const dateParts = saleConfigForm.endDate.split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : saleConfigForm.endDate;
      urgencyText = `המבצע מסתיים ב-${formattedDate} בשעה ${saleConfigForm.endTime}!`;
    }

    const defaultText = `🔥 מבצע השקה: ב-${saleConfigForm.discountPercentage}% הנחה! - ${urgencyText}`;

    const newData = {
      ...siteData,
      saleBannerActive: true,
      saleBannerText: defaultText,
      saleConfig: { ...saleConfigForm }
    };

    setSiteData(newData);
    localStorage.setItem('generatedSite', JSON.stringify(newData));
    setIsSaleModalOpen(false);
  };

  // העלאת התמונות ישירות ל-Supabase Storage בשרת
  const handleStoryImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const { url } = await uploadSiteAssetWithError(files[i]);
      if (url) {
        uploadedUrls.push(url);
      } else {
        alert(`העלאת התמונה ${files[i].name} נכשלה. נסה שוב.`);
      }
    }

    setNewStoryImages((prev) => [...prev, ...uploadedUrls]);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedImage = (indexToRemove: number) => {
    setNewStoryImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSaveStoryGroup = () => {
    if (!newStoryTitle.trim()) { alert('נא להזין שם לסטורי'); return; }
    if (newStoryImages.length === 0) { alert('נא לבחור לפחות תמונה אחת'); return; }
    const newStoryGroup = { title: newStoryTitle, images: newStoryImages };
    const updatedStories = [...(siteData.stories || []), newStoryGroup];
    const newData = { ...siteData, stories: updatedStories };
    setSiteData(newData);
    localStorage.setItem('generatedSite', JSON.stringify(newData));
    setNewStoryTitle('');
    setNewStoryImages([]);
    setIsStoryEditorOpen(false);
  };

  const deleteStoryGroup = (index: number) => {
    if (!isEditing) return;
    const newStories = siteData.stories.filter((_: any, i: number) => i !== index);
    const newData = { ...siteData, stories: newStories };
    setSiteData(newData);
    localStorage.setItem('generatedSite', JSON.stringify(newData));
    setActiveStoryGroupIndex(null);
  };

  const nextStoryImage = () => {
    if (activeStoryGroupIndex === null) return;
    const currentGroup = siteData.stories[activeStoryGroupIndex];
    if (activeStoryImageIndex < currentGroup.images.length - 1) {
      setActiveStoryImageIndex((prev) => prev + 1);
    } else if (activeStoryGroupIndex < siteData.stories.length - 1) {
      setActiveStoryGroupIndex((prev) => prev! + 1);
      setActiveStoryImageIndex(0);
    } else {
      setActiveStoryGroupIndex(null);
    }
  };

  const prevStoryImage = () => {
    if (activeStoryGroupIndex === null) return;
    if (activeStoryImageIndex > 0) {
      setActiveStoryImageIndex((prev) => prev - 1);
    } else if (activeStoryGroupIndex > 0) {
      const prevGroupIndex = activeStoryGroupIndex - 1;
      setActiveStoryGroupIndex(prevGroupIndex);
      setActiveStoryImageIndex(siteData.stories[prevGroupIndex].images.length - 1);
    }
  };

  const updateService = (index: number, field: string, value: string) => {
    if (!isEditing) return;
    const newServices = [...siteData.services];
    newServices[index][field] = value;
    const newData = { ...siteData, services: newServices };
    setSiteData(newData);
    localStorage.setItem('generatedSite', JSON.stringify(newData));
  };

  // העלאת תמונה לשירות או לתמונת הפתיחה (נשמרת בענן, מוגבלת ל-3MB)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const uploadImageTo = async (key: string, file: File | undefined, apply: (url: string) => void) => {
    if (!isEditing || !file) return;
    setUploadingKey(key);
    const { url, error } = await uploadSiteAssetWithError(file);
    setUploadingKey(null);
    if (!url) return alert(error || 'שגיאה בהעלאת התמונה.');
    apply(url);
  };

  const addService = () => {
    if (!isEditing) return;
    const newService = { name: 'שירות חדש', description: 'לחץ כאן כדי לערוך את תיאור השירות.', price: '100 ₪', duration: '60 דקות' };
    const newData = { ...siteData, services: [...siteData.services, newService] };
    setSiteData(newData);
    localStorage.setItem('generatedSite', JSON.stringify(newData));
  };

  const addWizardService = (service: NewService) => {
    if (!isEditing) return;
    const newData = { ...siteData, services: [...siteData.services, service] };
    setSiteData(newData);
    localStorage.setItem('generatedSite', JSON.stringify(newData));
    setShowServiceWizard(false);
  };

  const removeService = (index: number) => {
    if (!isEditing) return;
    if (siteData.services.length <= 1) { alert('חייב להשאיר לפחות שירות אחד באתר.'); return; }
    const newServices = siteData.services.filter((_: any, i: number) => i !== index);
    const newData = { ...siteData, services: newServices };
    setSiteData(newData);
    localStorage.setItem('generatedSite', JSON.stringify(newData));
  };

  const moveService = (index: number, direction: 'up' | 'down') => {
    if (!isEditing) return;
    const newServices = [...siteData.services];
    if (direction === 'up' && index > 0) {
      const temp = newServices[index];
      newServices[index] = newServices[index - 1];
      newServices[index - 1] = temp;
    } else if (direction === 'down' && index < newServices.length - 1) {
      const temp = newServices[index];
      newServices[index] = newServices[index + 1];
      newServices[index + 1] = temp;
    } else {
      return;
    }
    const newData = { ...siteData, services: newServices };
    setSiteData(newData);
    localStorage.setItem('generatedSite', JSON.stringify(newData));
  };

  const scrollToContact = () => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  const openBookingModal = (serviceName = '') => { setSelectedService(serviceName); setIsBookingModalOpen(true); };
  const handleFormSubmit = (e: any) => { e.preventDefault(); alert('במערכת האמיתית, הפרטים יישלחו כעת ישירות לבעל העסק!'); };

  const resetAndGoHome = () => { localStorage.removeItem('generatedSite'); setSiteData(null); setShowSettings(false); };

  // שומר את האתר בשרת (חובה להתחבר), ורק אז ממשיך לתשלום או לדשבורד.
  const handlePublish = async () => {
    if (!siteData.contactPhone && !confirm('לא הגדרתם מספר טלפון לעסק (בתחתית העורך, "הגדרת וואטסאפ לעסק").\nבלי מספר, לקוחות שקובעים תור או מתעניינים במוצר לא יוכלו לשלוח לכם הודעה.\n\nלשמור בכל זאת?')) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?next=/create');
        return;
      }

      const { id, ...content } = siteData;
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, name: siteData.businessName, content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'שגיאה בשמירת האתר');

      const saved = { ...siteData, id: data.id };
      setSiteData(saved);
      localStorage.setItem('generatedSite', JSON.stringify(saved));

      router.push(isPro ? '/dashboard' : '/checkout');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'שגיאה בשמירת האתר');
    } finally {
      setIsSaving(false);
    }
  };

  const getWhatsappLink = () => {
    if (!siteData.contactPhone) return "#";
    const cleanPhone = siteData.contactPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      return `https://wa.me/972${cleanPhone.substring(1)}`;
    }
    return `https://wa.me/${cleanPhone}`;
  };

  if (siteData) {
    // מראה האתר לפי תחום העסק: אותו מראה שהלקוחות יראו (utils/site-theme.ts)
    const look = siteLook(siteData);
    const tint = tintColor(siteData.themeColor, look.tint);
    const centered = look.heroAlign === 'center';

    return (
      <div dir="rtl" className={`min-h-screen ${SITE_BODY_FONT} bg-slate-50 relative pb-32 selection:bg-blue-100 selection:text-blue-900`}>

        {/* === באנר מבצע עליון === */}
        {siteData.saleBannerActive && (
          <div className="bg-[#ff4500] text-white shadow-md relative z-[200] border-b-2 border-orange-600">
            <div className="max-w-6xl mx-auto flex items-center justify-center px-8 py-3">
              <input
                className="bg-transparent text-center text-white outline-none placeholder-white/70 w-full hover:bg-white/10 focus:bg-white/20 rounded px-2 py-1 transition-colors font-extrabold text-base md:text-xl tracking-wide"
                value={siteData.saleBannerText || ''}
                onChange={(e) => updateField('saleBannerText', e.target.value)}
                disabled={!isEditing}
                placeholder="כתוב כאן את המבצע שלך..."
              />
              
              {isEditing && (
                <button
                  onClick={() => updateField('saleBannerActive', false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors shadow"
                  title="כבה מבצע"
                >
                  ✖
                </button>
              )}
            </div>
          </div>
        )}

        {/* === מודל הגדרת מבצע באחוזים === */}
        {isSaleModalOpen && (
          <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-extrabold text-gray-800">הגדרת מבצע חדש 🎁</h3>
                <button onClick={() => setIsSaleModalOpen(false)} className="text-gray-400 hover:text-gray-800 text-3xl transition-colors">&times;</button>
              </div>

              <div className="p-8 flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">על איזה שירות תרצה להפעיל את המבצע?</label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    value={saleConfigForm.serviceIndex}
                    onChange={(e) => setSaleConfigForm({ ...saleConfigForm, serviceIndex: Number(e.target.value) })}
                  >
                    {siteData.services?.map((s: any, idx: number) => (
                      <option key={idx} value={idx}>{s.name} (מחיר מקורי: {s.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">כמה אחוזי הנחה?</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      className="w-full bg-white border border-red-300 rounded-xl px-4 py-3 pr-10 text-red-700 outline-none focus:ring-2 focus:ring-red-500 font-extrabold text-lg"
                      placeholder="20"
                      value={saleConfigForm.discountPercentage}
                      onChange={(e) => setSaleConfigForm({ ...saleConfigForm, discountPercentage: Number(e.target.value) })}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-extrabold text-red-700 text-lg">%</span>
                  </div>

                  <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100 flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">מחיר חדש ללקוח:</span>
                    <span className="font-extrabold text-red-600 text-lg">
                      {calculateDiscount(siteData.services[saleConfigForm.serviceIndex]?.price || '0', saleConfigForm.discountPercentage)}
                    </span>
                  </div>
                </div>

                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                  <label className="block text-sm font-bold text-orange-900 mb-3">איך תרצה להגביל את המבצע?</label>
                  <div className="flex gap-4 mb-4">
                    <label className={`flex-1 flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border transition-all ${saleConfigForm.urgencyType === 'people' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-orange-200 hover:border-orange-400'}`}>
                      <input type="radio" name="urgency" value="people" checked={saleConfigForm.urgencyType === 'people'} onChange={() => setSaleConfigForm({ ...saleConfigForm, urgencyType: 'people' })} className="hidden" />
                      <span className="text-sm font-bold text-gray-700 w-full text-center">כמות אנשים</span>
                    </label>
                    <label className={`flex-1 flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border transition-all ${saleConfigForm.urgencyType === 'time' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-orange-200 hover:border-orange-400'}`}>
                      <input type="radio" name="urgency" value="time" checked={saleConfigForm.urgencyType === 'time'} onChange={() => setSaleConfigForm({ ...saleConfigForm, urgencyType: 'time' })} className="hidden" />
                      <span className="text-sm font-bold text-gray-700 w-full text-center">זמן מוגבל</span>
                    </label>
                  </div>

                  {saleConfigForm.urgencyType === 'people' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">כמה נרשמים למבצע?</label>
                      <input type="number" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none font-bold" min="1" value={saleConfigForm.peopleLeft} onChange={(e) => setSaleConfigForm({ ...saleConfigForm, peopleLeft: Number(e.target.value) })} />
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-600 mb-1">תאריך סיום:</label>
                        <input type="date" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none font-medium" value={saleConfigForm.endDate} onChange={(e) => setSaleConfigForm({ ...saleConfigForm, endDate: e.target.value })} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-600 mb-1">שעת סיום:</label>
                        <input type="time" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none font-medium" value={saleConfigForm.endTime} onChange={(e) => setSaleConfigForm({ ...saleConfigForm, endTime: e.target.value })} />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-3 text-center">ההגבלה שתבחר תתווסף לטקסט הבאנר בראש העמוד.</p>
                </div>

                <button onClick={handleSaveSaleConfig} className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] transition-all text-lg">
                  הפעל מבצע עכשיו! 🚀
                </button>
              </div>
            </div>
          </div>
        )}

        {isHoursModalOpen && (
          <ScheduleEditor
            schedule={getSchedule(siteData)}
            closures={getClosures(siteData)}
            onClose={() => setIsHoursModalOpen(false)}
            onSave={(schedule, closures) => {
              updateFields({ schedule, closures, workingHours: formatSchedule(schedule) });
              setIsHoursModalOpen(false);
            }}
          />
        )}

{/* === מודל הוספת סטורי === */}
        {isStoryEditorOpen && (
          <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-extrabold text-gray-800">הוספת סטורי חדש 📸</h3>
                <button onClick={() => setIsStoryEditorOpen(false)} className="text-gray-400 hover:text-gray-800 text-3xl transition-colors">&times;</button>
              </div>
              <div className="p-8 flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">איך נקרא לסטורי הזה?</label>
                  <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="לדוגמה: לפני ואחרי / הלקוחות שלנו" value={newStoryTitle} onChange={(e) => setNewStoryTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">בחר תמונות (אפשר לבחור כמה ביחד)</label>
                  <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all flex flex-col items-center justify-center group">
                    <span className="text-5xl mb-3 group-hover:scale-110 transition-transform">🖼️</span>
                    <span className="font-bold text-blue-600 text-lg">לחץ כאן כדי לבחור תמונות</span>
                  </div>
                  <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleStoryImagesSelect} className="hidden" />
                </div>
                {newStoryImages.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">תמונות שנבחרו ({newStoryImages.length}):</label>
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                      {newStoryImages.map((img, idx) => (
                        <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button onClick={() => removeSelectedImage(idx)} className="absolute top-1 right-1 bg-red-500/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">&times;</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex gap-4">
                <button onClick={handleSaveStoryGroup} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5">שמור והוסף לאתר</button>
                <button onClick={() => setIsStoryEditorOpen(false)} className="px-8 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold py-4 rounded-2xl transition-all shadow-sm">ביטול</button>
              </div>
            </div>
          </div>
        )}

        {/* === צופה הסטוריז === */}
        {activeStoryGroupIndex !== null && siteData.stories?.[activeStoryGroupIndex] && (
          <div className="fixed inset-0 z-[400] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <button onClick={() => setActiveStoryGroupIndex(null)} className="absolute top-6 right-6 text-white text-4xl hover:text-gray-300 z-50 drop-shadow-md transition-colors">&times;</button>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40 flex flex-col gap-3">
              <div className="flex gap-1.5 w-full">
                {siteData.stories[activeStoryGroupIndex].images.map((_: any, idx: number) => (
                  <div key={idx} className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx === activeStoryImageIndex ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
              <div className="text-white text-center font-bold text-lg drop-shadow-md tracking-wide">{siteData.stories[activeStoryGroupIndex].title}</div>
            </div>
            <div className="relative w-full max-w-md h-[80vh] flex items-center justify-center">
              <button onClick={prevStoryImage} className="absolute right-0 w-1/2 h-full z-20 flex items-center justify-start px-4 sm:justify-center sm:w-auto sm:right-[-70px] sm:hover:bg-white/10 sm:rounded-full sm:h-14 sm:w-14 cursor-pointer group outline-none">
                <div className="text-white opacity-0 sm:opacity-100 group-hover:scale-110 transition-all drop-shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></div>
              </button>
              <img src={siteData.stories[activeStoryGroupIndex].images[activeStoryImageIndex]} alt="Story content" className="max-w-full max-h-full object-contain rounded-2xl select-none relative z-10 shadow-2xl" />
              <button onClick={nextStoryImage} className="absolute left-0 w-1/2 h-full z-20 flex items-center justify-end px-4 sm:justify-center sm:w-auto sm:left-[-70px] sm:hover:bg-white/10 sm:rounded-full sm:h-14 sm:w-14 cursor-pointer group outline-none">
                <div className="text-white opacity-0 sm:opacity-100 group-hover:scale-110 transition-all drop-shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></div>
              </button>
            </div>
            {isEditing && (
              <button onClick={() => deleteStoryGroup(activeStoryGroupIndex)} className="absolute bottom-10 bg-red-600/90 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-red-500 hover:scale-105 transition-all z-50 backdrop-blur-md border border-red-400/30">🗑️ מחק את הקבוצה הזו</button>
            )}
          </div>
        )}

        {isBookingModalOpen && siteData.id && (
          <BookingModal
            preview
            siteId={siteData.id}
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
        {isBookingModalOpen && !siteData.id && (
          <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center space-y-4">
              <div className="text-5xl">📅</div>
              <h3 className="text-2xl font-extrabold text-gray-900">קודם צריך לשמור את האתר</h3>
              <p className="text-gray-600">קביעת תור אמיתית עובדת רק באתר שנשמר. לחצו על הכפתור הכהה בתחתית הדף ("שמור" או "פרסם"), ואז חזרו לכאן כדי לבדוק אותה.</p>
              <button onClick={() => setIsBookingModalOpen(false)} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black">הבנתי</button>
            </div>
          </div>
        )}

{/* === הדר עליון === */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-[100] transition-all">
          <input
            className="text-2xl font-extrabold text-gray-900 bg-transparent outline-none w-auto max-w-[200px] md:max-w-md transition-colors hover:bg-gray-100/50 focus:bg-gray-100 cursor-text rounded-lg px-2 py-1 tracking-tight"
            value={siteData.businessName || 'שם העסק'}
            onChange={(e) => updateField('businessName', e.target.value)}
          />

          <div className="flex items-center gap-3 md:gap-5 relative">
            <button onClick={() => setShowSettings(!showSettings)} className="bg-gray-50 p-2.5 rounded-full border border-gray-200 hover:bg-gray-100 hover:scale-105 transition-all text-xl shadow-sm">⚙️</button>
            {showSettings && (
              <div className="absolute top-14 left-0 bg-white border border-gray-100 shadow-2xl rounded-2xl w-64 overflow-hidden flex flex-col z-[100] animate-in slide-in-from-top-2">
                {!siteData.saleBannerActive && (
                  <button className="px-5 py-4 text-right hover:bg-orange-50 text-orange-600 font-bold flex justify-between items-center transition-colors border-b border-gray-50" onClick={() => { setIsSaleModalOpen(true); setShowSettings(false); }}>
                    <span>הפעל סייל/מבצע</span><span>📣</span>
                  </button>
                )}
                <button className="px-5 py-4 text-right hover:bg-blue-50 border-b border-gray-50 text-blue-700 font-bold flex justify-between items-center transition-colors" onClick={() => { updateField('bookingEnabled', siteData.bookingEnabled === false); setShowSettings(false); }}>
                  <span>{siteData.bookingEnabled === false ? 'הפעל קביעת תורים' : 'כבה קביעת תורים'}</span><span>📅</span>
                </button>
                <button className="px-5 py-4 text-right hover:bg-blue-50 border-b border-gray-50 text-blue-700 font-bold flex justify-between items-center transition-colors" onClick={() => { updateField('showServices', siteData.showServices === false); setShowSettings(false); }}>
                  <span>{siteData.showServices === false ? 'הצג סעיף שירותים' : 'הסתר סעיף שירותים'}</span><span>💈</span>
                </button>
                {(siteData.catalog || []).length === 0 && (
                  <button className="px-5 py-4 text-right hover:bg-blue-50 border-b border-gray-50 text-blue-700 font-bold flex justify-between items-center transition-colors" onClick={() => { updateField('showProducts', siteData.showProducts !== true); setShowSettings(false); }}>
                    <span>{siteData.showProducts === true ? 'הסתר סעיף מוצרים' : 'הוסף סעיף מוצרים'}</span><span>🛍️</span>
                  </button>
                )}
                <button className="px-5 py-4 text-right hover:bg-gray-50 border-b border-gray-50 text-gray-700 font-medium flex justify-between items-center transition-colors" onClick={() => setShowSettings(false)}><span>המשך עריכה</span><span>✏️</span></button>
                <button className="px-5 py-4 text-right hover:bg-red-50 text-red-600 font-medium flex justify-between items-center transition-colors border-b border-gray-50" onClick={resetAndGoHome}><span>יצירת אתר חדש</span><span>🔄</span></button>
                
                <button className="px-5 py-4 text-right hover:bg-red-100 text-red-700 font-bold flex justify-between items-center transition-colors bg-red-50/50" onClick={() => { setShowSettings(false); router.push('/dashboard?subscription=1'); }}>
                  <span>הפסקת תשלום (ביטול מנוי)</span><span>💳</span>
                </button>
              </div>
            )}
            {siteData.bookingEnabled !== false && (
              <button onClick={() => openBookingModal()} className="hidden md:block bg-gray-50 text-gray-800 border border-gray-200 px-6 py-2.5 rounded-full font-bold shadow-sm hover:bg-gray-100 hover:shadow transition-all">קביעת תור</button>
            )}
            <button onClick={scrollToContact} className="text-white px-4 sm:px-7 py-2.5 rounded-full font-bold text-sm sm:text-base whitespace-nowrap shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" style={{ backgroundColor: siteData.themeColor }}>צור קשר</button>
          </div>
        </header>

        {/* === פאנל צבעים מרחף === */}
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50 max-w-[calc(100vw-16px)] bg-white/90 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-3.5 rounded-full shadow-2xl border border-gray-100 flex items-center gap-2 sm:gap-3 transition-all">
          <span className="hidden sm:inline text-sm font-bold text-gray-700 ml-2">צבע מותג:</span>
          {themeColors.map((color) => (
            <button key={color} onClick={() => updateField('themeColor', color)} className={`w-8 h-8 rounded-full transition-all ${siteData.themeColor === color ? 'ring-4 ring-offset-2 ring-gray-200 scale-110 shadow-md' : 'border border-gray-200 shadow-sm hover:scale-110'}`} style={{ backgroundColor: color }} />
          ))}
        </div>

        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex gap-4">
          <button onClick={handlePublish} disabled={isSaving} className="bg-gray-900 text-white px-5 sm:px-10 py-3 sm:py-4 rounded-full shadow-2xl flex items-center gap-2 sm:gap-3 whitespace-nowrap hover:bg-black hover:shadow-black/20 hover:-translate-y-1 transition-all border border-gray-800 disabled:opacity-60 disabled:cursor-not-allowed">
            <span className="font-bold text-base sm:text-lg">
              {isSaving ? 'שומר...' : isPro ? 'שמור את האתר' : (
                <>
                  <span className="sm:hidden">פרסם ב-29 ₪ לחודש</span>
                  <span className="hidden sm:inline">פרסם את האתר ב-29 ₪ לחודש</span>
                </>
              )}
            </span>
            <span className="text-xl">🚀</span>
          </button>
        </div>

        {/* === Hero Section === */}
        <div className="pt-8 pb-12 px-4 max-w-7xl mx-auto">
          <div className={`relative w-full h-[420px] md:h-[560px] overflow-hidden border border-gray-200/50 bg-gray-900 flex flex-col justify-end ${look.hero}`}>
            <img src={siteData.generatedImageUrl || `https://image.pollinations.ai/prompt/${siteData.imageKeywords || 'modern business'}?width=1920&height=1080&nologo=true`} alt="תמונת רקע לעסק" className="absolute inset-0 w-full h-full object-cover" />
            <div className={`absolute inset-0 ${centered ? 'bg-gradient-to-t from-black/75 via-black/25 to-black/5' : 'bg-gradient-to-l from-black/75 via-black/40 to-black/10'}`} />
            {isEditing && (
              <label className="absolute top-4 left-4 z-20 bg-white/95 hover:bg-white text-gray-800 text-sm font-bold px-4 py-2.5 rounded-full shadow-lg cursor-pointer flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {uploadingKey === 'hero' ? 'מעלה...' : 'החלף תמונת רקע'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingKey !== null} onChange={(e) => { uploadImageTo('hero', e.target.files?.[0], (url) => updateField('generatedImageUrl', url)); e.target.value = ''; }} />
              </label>
            )}
            <div className={`relative z-10 w-full max-w-3xl p-6 md:p-12 flex flex-col ${centered ? 'items-center text-center mx-auto' : 'items-start text-right'}`}>
              <h1 contentEditable={isEditing} suppressContentEditableWarning={true} className={`${look.heading} !text-4xl md:!text-6xl text-white w-full bg-transparent ${centered ? 'text-center' : 'text-right'} outline-none p-2 transition-all hover:bg-black/30 focus:bg-black/50 cursor-text break-words leading-[1.1]`} onBlur={(e) => updateField('heroTitle', e.currentTarget.textContent || '')}>{siteData.heroTitle}</h1>
              <textarea className={`text-lg md:text-xl mt-3 w-full max-w-xl text-white/90 bg-transparent ${centered ? 'text-center' : 'text-right'} outline-none rounded-xl p-3 transition-all resize-none leading-relaxed hover:bg-black/30 focus:bg-black/50 cursor-text`} value={siteData.heroSubtitle} onChange={(e) => updateField('heroSubtitle', e.target.value)} rows={2} />
            </div>
          </div>
        </div>

        {/* === סטוריז === */}
        <div className="w-full bg-transparent pb-12">
          <div className="max-w-5xl mx-auto px-4 flex gap-6 overflow-x-auto no-scrollbar items-start">
            {isEditing && (
              <div className="flex flex-col items-center gap-3 min-w-[90px]">
                <div onClick={() => setIsStoryEditorOpen(true)} className="w-[85px] h-[85px] rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-white hover:border-gray-400 hover:shadow-md transition-all bg-gray-50 shadow-sm">
                  <span className="text-3xl text-gray-400">+</span>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-white/50 px-2 py-1 rounded-full">הוסף סטורי</span>
              </div>
            )}
            {siteData.stories?.map((storyGroup: any, index: number) => (
              <div key={index} className="flex flex-col items-center gap-3 min-w-[90px]">
                <div onClick={() => { setActiveStoryGroupIndex(index); setActiveStoryImageIndex(0); }} className="w-[85px] h-[85px] rounded-full p-[3px] cursor-pointer hover:scale-105 transition-transform shadow-md" style={{ background: `linear-gradient(to top right, ${siteData.themeColor}, #fcd34d)` }}>
                  <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-white">
                    <img src={storyGroup.images[0]} alt={storyGroup.title} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="text-xs font-bold text-center text-gray-700 w-full truncate px-1">{storyGroup.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* === על העסק + שעות פעילות === */}
        <section className="py-14 md:py-20 px-4" style={{ backgroundColor: tint }}>
          <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-10 md:gap-14 items-start">
            <div className="md:col-span-3">
              <h2 className={`${look.heading} text-3xl md:text-4xl text-gray-900 !mt-0 !mb-5`}>על העסק</h2>
              <textarea
                className="text-lg text-gray-700 w-full bg-transparent outline-none rounded-2xl p-3 -mr-3 transition-all resize-none hover:bg-white focus:bg-white focus:ring-4 focus:ring-gray-100 cursor-text leading-8"
                value={siteData.aboutText}
                onChange={(e) => updateField('aboutText', e.target.value)}
                rows={6}
              />
            </div>
            <div className={`md:col-span-2 bg-white border border-gray-200 p-6 space-y-5 ${look.card}`}>
              <div className="flex gap-3">
                <ClockIcon className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900 !mb-0.5">שעות פעילות</p>
                  <p className="text-gray-600 text-sm !mb-2">{siteData.workingHours || 'ימים א\'-ה\': 09:00 - 19:00'}</p>
                  {isEditing && (
                    <button onClick={() => setIsHoursModalOpen(true)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-full transition-all">
                      עריכת שעות (קבוע או חד-פעמי)
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <PinIcon className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 !mb-0.5">{siteData.businessType === 'physical' ? 'כתובת' : 'אזורי שירות'}</p>
                  <input className="bg-transparent outline-none cursor-text hover:bg-gray-50 rounded px-1 -mr-1 w-full text-gray-600 text-sm focus:bg-gray-50 transition-colors" value={siteData.location} onChange={(e) => updateField('location', e.target.value)} />
                  {siteData.businessType === 'physical' && siteData.location && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <a href={`https://waze.com/ul?q=${encodeURIComponent(siteData.location)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-full">Waze</a>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteData.location)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-full">Google Maps</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === שירותים ומחירון === */}
        {siteData.showServices !== false && (
<div className="py-14 md:py-20 px-4 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <h2 className={`${look.heading} text-3xl md:text-4xl text-gray-900 !mt-0 !mb-10 ${centered ? 'text-center' : ''}`}>השירותים והמחירון</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {siteData.services?.map((service: any, index: number) => {
                const isServiceOnSale = siteData.saleBannerActive && siteData.saleConfig?.serviceIndex === index;

                return (
                  <div key={index} className={`bg-white border transition-all duration-300 relative group flex flex-col h-full ${look.card} ${isServiceOnSale ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'}`}>

                    {/* תמונת השירות */}
                    <div className={`relative w-full overflow-hidden ${service.image ? 'h-48' : 'h-24 bg-gray-50 border-b border-dashed border-gray-200'} ${look.card} rounded-b-none`}>
                      {service.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                      )}
                      {isEditing && (
                        <div className={`absolute inset-0 flex items-center justify-center gap-2 ${service.image ? 'opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity' : ''}`}>
                          <label className="bg-white text-gray-800 hover:bg-gray-100 text-xs font-bold px-4 py-2 rounded-full shadow cursor-pointer flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            {uploadingKey === `service-${index}` ? 'מעלה...' : service.image ? 'החלפת תמונה' : 'הוספת תמונה לשירות'}
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingKey !== null} onChange={(e) => { uploadImageTo(`service-${index}`, e.target.files?.[0], (url) => updateService(index, 'image', url)); e.target.value = ''; }} />
                          </label>
                          {service.image && (
                            <button type="button" onClick={() => updateService(index, 'image', '')} className="bg-white text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-2 rounded-full shadow">הסרה</button>
                          )}
                        </div>
                      )}
                    </div>

                    {isServiceOnSale && (
                      <div className="absolute -top-5 -right-5 bg-gradient-to-r from-red-600 to-orange-500 text-white font-extrabold px-6 py-2 rounded-full shadow-lg transform rotate-6 border-[3px] border-white z-10 text-lg">
                        מבצע! 🎁
                      </div>
                    )}

                    <div className="absolute top-3 left-3 z-20">
                      <button onClick={() => removeService(index)} className="bg-red-50 text-red-500 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm">✖</button>
                    </div>

                    <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && <button onClick={() => moveService(index, 'up')} className="bg-gray-50 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">⬆️</button>}
                      {index < siteData.services.length - 1 && <button onClick={() => moveService(index, 'down')} className="bg-gray-50 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">⬇️</button>}
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <input className={`${look.heading} text-xl w-full bg-transparent outline-none rounded-lg p-1 -mr-1 mb-2 text-gray-900 hover:bg-gray-50 focus:bg-gray-50 cursor-text transition-colors`} value={service.name} onChange={(e) => updateService(index, 'name', e.target.value)} />
                      <textarea className="text-gray-600 w-full bg-transparent outline-none rounded-lg p-1 -mr-1 text-[15px] resize-none flex-grow hover:bg-gray-50 focus:bg-gray-50 cursor-text transition-colors leading-relaxed" value={service.description} onChange={(e) => updateService(index, 'description', e.target.value)} rows={4} />

                      <div className="mt-6 pt-4 border-t border-gray-100">
                        {isServiceOnSale ? (
                          <div className="flex items-center justify-between gap-3">
                            <input
                              className="text-gray-400 font-bold line-through decoration-red-500/70 decoration-2 bg-transparent outline-none hover:bg-gray-50 w-24 rounded"
                              value={service.price}
                              onChange={(e) => updateService(index, 'price', e.target.value)}
                            />
                            <span className="text-xl font-black text-red-600">{calculateDiscount(service.price, siteData.saleConfig.discountPercentage)}</span>
                          </div>
                        ) : (
                          <input
                            className="w-full bg-transparent outline-none rounded-lg p-1 -mr-1 text-xl font-extrabold hover:bg-gray-50 focus:bg-gray-50 cursor-text transition-colors"
                            style={{ color: siteData.themeColor }}
                            value={service.price}
                            onChange={(e) => updateService(index, 'price', e.target.value)}
                          />
                        )}
                        <div className={`${siteData.bookingEnabled === false ? 'hidden' : 'flex'} items-center gap-1.5 text-xs text-gray-500 mt-1`}>
                          <ClockIcon className="w-3.5 h-3.5" />
                          <input className="bg-transparent outline-none w-24 text-gray-600 hover:bg-gray-50 focus:bg-gray-50 cursor-text rounded px-1 transition-colors" value={service.duration || '60 דקות'} onChange={(e) => updateService(index, 'duration', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => setShowServiceWizard(true)} className="bg-blue-50 border-2 border-blue-200 text-blue-700 hover:bg-blue-100 font-bold py-5 px-10 rounded-full transition-all flex items-center gap-3 shadow-sm">
                <span className="text-xl">✨</span><span>הוסף שירות עם AI</span>
              </button>
              <button onClick={addService} className="bg-gray-50 border-2 border-dashed border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 hover:bg-white font-bold py-5 px-10 rounded-full transition-all flex items-center gap-3 mx-auto shadow-sm hover:shadow-md">
                <span className="text-xl">➕</span><span>הוסף שירות חדש</span>
              </button>
            </div>
          </div>
        </div>
)}

{showServiceWizard && (
          <ServiceWizard businessName={siteData.businessName} industry={formData.industry} onAdd={addWizardService} onClose={() => setShowServiceWizard(false)} />
        )}

{/* === קטגוריות מוצרים === */}
        {(siteData.showProducts === true || (siteData.catalog || []).length > 0) && (
          <CatalogEditor
            catalog={siteData.catalog || []}
            onChange={(catalog) => updateField('catalog', catalog)}
            themeColor={siteData.themeColor}
            businessName={siteData.businessName}
            industry={formData.industry}
          />
        )}

        {/* === צור קשר === */}
        <div id="contact-section" className="py-24 px-4 bg-gray-900 border-t border-gray-800">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-center text-white mb-16 tracking-tight">דברו איתנו</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
              <div className="text-center md:text-right">
                <textarea value={siteData.contactText || 'אשמח לשמוע מכם!'} onChange={(e) => updateField('contactText', e.target.value)} className="text-xl md:text-2xl text-gray-300 bg-transparent outline-none w-full resize-none hover:bg-gray-800 focus:bg-gray-800 p-4 rounded-2xl cursor-text font-medium leading-relaxed transition-colors" rows={3} />
                <div className="mt-8 p-8 bg-gray-800 rounded-[2rem] border border-gray-700 text-right shadow-xl">
                  <label className="block text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">📞 הגדרת וואטסאפ לעסק:</label>
                  <input className="w-full p-4 bg-gray-900 border border-gray-700 text-white rounded-xl outline-none text-left font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" dir="ltr" placeholder="0501234567" value={siteData.contactPhone || ''} onChange={(e) => updateField('contactPhone', e.target.value)} />
                  <label className="block text-sm font-bold text-gray-400 mt-6 mb-2 uppercase tracking-wider">קישור לכתיבת ביקורת בגוגל (לא חובה):</label>
                  <input className="w-full p-4 bg-gray-900 border border-gray-700 text-white rounded-xl outline-none text-left font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" dir="ltr" placeholder="https://g.page/r/..." value={siteData.googleReviewUrl || ''} onChange={(e) => updateField('googleReviewUrl', e.target.value)} />
                  <p className="text-xs text-gray-500 mt-2">בפרופיל העסק בגוגל לוחצים על "בקשו ביקורות" ומעתיקים את הקישור. הוא יופיע באתר כשיש ביקורות.</p>
                </div>
              </div>
              <div className="bg-gray-800 p-10 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-700 relative overflow-hidden">
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-5 relative z-10">
                  <input type="text" placeholder="שם מלא" className="w-full p-4 rounded-xl border border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all" required />
                  <input type="tel" placeholder="מספר טלפון" className="w-full p-4 rounded-xl border border-gray-700 bg-gray-900 text-white placeholder-gray-500 text-right transition-all" dir="rtl" required />
                  <textarea placeholder="במה אפשר לעזור?" className="w-full p-4 rounded-xl border border-gray-700 bg-gray-900 text-white placeholder-gray-500 resize-none transition-all" rows={4} />
                  <button type="submit" className="w-full py-5 mt-2 rounded-xl font-bold text-white shadow-xl text-lg hover:-translate-y-1 transition-all" style={{ backgroundColor: siteData.themeColor }}>שלח פניה</button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* === כפתור וואטסאפ צף === */}
        {siteData.contactPhone && (
          <a
            href={getWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 bg-[#25D366] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-[300]"
            title="דברו איתנו בוואטסאפ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>
          </a>
        )}

      </div>
    );
  }

  /* === טופס יצירת אתר ראשוני === */
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans py-12">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-8 md:p-12 border border-gray-100 relative overflow-hidden">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 text-center tracking-tight">האתר המקצועי שלך בדרך 🚀</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">מלא את הפרטים הבאים כדי שה-AI שלנו יבנה לך אתר מעוצב בשניות</p>
        
        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">שם העסק *</label>
            <input
              type="text"
              name="businessName"
              required
              placeholder="לדוגמה: המספרה של יוסי / משרד עורכי דין כהן"
              value={formData.businessName}
              onChange={handleChange}
              className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">תחום הפעילות *</label>
            <input
              type="text"
              name="industry"
              required
              placeholder="לדוגמה: עיצוב שיער לגברים / עורך דין לענייני משפחה"
              value={formData.industry}
              onChange={handleChange}
              className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">סוג השירות</label>
            <select
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-sm"
            >
              <option value="physical">מקום פיזי (הלקוחות מגיעים אליי)</option>
              <option value="home">עד בית הלקוח / אונליין</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">האם לקוחות קובעים אצלכם תור מראש? *</label>
            <div className="flex gap-3">
              {([['yes', 'כן, צריך קביעת תור'], ['no', 'לא, פשוט מגיעים']] as const).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setFormData((prev) => ({ ...prev, needsBooking: value }))}
                  className={`flex-1 p-4 rounded-xl border-2 font-bold text-sm transition-all ${formData.needsBooking === value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">האם אתם מוכרים מוצרים? *</label>
            <div className="flex gap-3">
              {([['yes', 'כן, אנחנו מוכרים מוצרים'], ['no', 'לא, רק שירותים']] as const).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setFormData((prev) => ({ ...prev, sellsProducts: value }))}
                  className={`flex-1 p-4 rounded-xl border-2 font-bold text-sm transition-all ${formData.sellsProducts === value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">מיקום / כתובת / אזורי שירות</label>
            <input
              type="text"
              name="location"
              placeholder="לדוגמה: הרצל 15, תל אביב / אזור המרכז והשפלה"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">באילו ימים ושעות העסק פתוח? *</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'].map((label, d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setHours((prev) => ({ ...prev, days: prev.days.includes(d) ? prev.days.filter((x) => x !== d) : [...prev.days, d].sort() }))}
                  className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${hours.days.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1">פתיחה</label>
                <input type="time" value={hours.open} onChange={(e) => setHours((prev) => ({ ...prev, open: e.target.value }))} className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-sm" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1">סגירה</label>
                <input type="time" value={hours.close} onChange={(e) => setHours((prev) => ({ ...prev, close: e.target.value }))} className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-sm" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">לקוחות יוכלו לקבוע תור רק בשעות האלה. אפשר לשנות אחר כך, וגם להוסיף סגירות חד-פעמיות.</p>
          </div>

          {(formData.needsBooking === 'yes' || formData.sellsProducts !== 'yes') && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">שירותים עיקריים (מופרדים בפסיקים)</label>
              <input
                type="text"
                name="services"
                placeholder="לדוגמה: תספורת גברים, עיצוב זקן, צביעת שיער"
                value={formData.services}
                onChange={handleChange}
                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-sm"
              />
            </div>
          )}

          {formData.sellsProducts === 'yes' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">אילו קטגוריות מוצרים אתם מוכרים? (מופרדות בפסיקים)</label>
              <input
                type="text"
                name="productCategories"
                placeholder="לדוגמה: מטענים ניידים, כיסויים, אוזניות"
                value={formData.productCategories}
                onChange={handleChange}
                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-sm"
              />
              <p className="text-xs text-gray-500 mt-1.5">אחרי יצירת האתר, ה-AI ישאל כמה שאלות על כל קטגוריה ויבנה את רשימת המוצרים.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">היתרון המרכזי / למה לבחור בנו?</label>
            <input
              type="text"
              name="superpower"
              placeholder="לדוגמה: ניסיון של 15 שנה, יחס אישי ומחירים הוגנים"
              value={formData.superpower}
              onChange={handleChange}
              className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-blue-600 text-white font-extrabold py-5 rounded-2xl hover:bg-blue-700 transition-all text-lg shadow-xl shadow-blue-600/30 hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>ה-AI יוצר את האתר שלך...</span>
              </>
            ) : (
              <span>צור לי אתר עכשיו ✨</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}