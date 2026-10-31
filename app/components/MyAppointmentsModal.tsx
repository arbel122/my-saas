'use client';

import MyAppointmentsList from './MyAppointmentsList';

type Props = {
  siteId: string;
  businessName?: string;
  contactPhone?: string;
  themeColor?: string;
  onClose: () => void;
};

function whatsappNumber(phone?: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
}

// "התורים שלי" באתר של עסק: ביטול לפני התור, וביקורת אחרי שהתור התקיים. לפי חשבון הלקוח.
export default function MyAppointmentsModal({ siteId, businessName, contactPhone, themeColor = '#2563eb', onClose }: Props) {
  const wa = whatsappNumber(contactPhone);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={onClose}></div>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto relative z-10 p-6 md:p-8 space-y-5">
        <button onClick={onClose} aria-label="סגור" className="absolute top-4 left-4 bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full text-xl">✖</button>
        <div className="pt-2">
          <h2 className="text-2xl font-extrabold text-gray-900">התורים שלי 📅</h2>
          <p className="text-sm text-gray-500 mt-1">כאן אפשר לבטל תור לפני שהוא מתקיים, ולכתוב ביקורת אחרי שהגעתם.</p>
        </div>

        <MyAppointmentsList siteId={siteId} themeColor={themeColor} />

        {wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(`שלום${businessName ? ` ${businessName}` : ''}, אני צריך עזרה עם תור שקבעתי באתר.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-green-700 font-bold underline"
          >
            💬 צריכים עזרה? דברו עם העסק בוואטסאפ
          </a>
        )}
      </div>
    </div>
  );
}
