'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = () => {
    setIsLoading(true);
    router.push('/checkout');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* תפריט ניווט עליון חזר לדשבורד */}
      <nav className="p-6">
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-gray-500 hover:text-gray-900 transition font-medium flex items-center gap-2"
        >
          <span>→</span>
          חזרה לדשבורד
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            שדרג את העסק שלך ל-<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Pro</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            בחר את המסלול שמתאים בדיוק לצרכים של העסק שלך והתחל לצמוח.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto justify-center items-center md:items-stretch">
          
          {/* כרטיס חינם */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm w-full max-w-md flex flex-col">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">מסלול בסיסי</h3>
            <p className="text-gray-500 mb-6">מעולה להתנסות ותצוגה מקדימה</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-gray-900">0₪</span>
              <span className="text-gray-500 font-medium"> / לחודש</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-gray-700">
                <span className="text-green-500">✓</span> יצירת סקיצה לאתר בעזרת AI ב-10 שניות
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <span className="text-green-500">✓</span> עריכת טקסטים והתאמה אישית
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <span className="text-gray-300">✖</span> תמונות מאגר רגילות (ללא AI אישי)
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <span className="text-gray-300">✖</span> ללא קבלת לידים או קביעת תורים
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <span className="text-gray-300">✖</span> ללא חיבור ישיר לוואטסאפ של העסק
              </li>
            </ul>

            <button 
              disabled
              className="w-full py-4 rounded-xl font-bold bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed"
            >
              המסלול הנוכחי שלך
            </button>
          </div>

          {/* כרטיס Pro */}
          <div className="bg-gradient-to-b from-blue-900 to-indigo-900 rounded-3xl p-1 border border-blue-700 shadow-2xl shadow-blue-900/30 w-full max-w-md flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-400 to-indigo-400 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
              הכי משתלם
            </div>
            
            <div className="bg-white rounded-[23px] p-8 flex flex-col h-full">
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">מסלול Pro</h3>
              <p className="text-gray-500 mb-6">לבעלי עסקים שרוצים לקוחות</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-gray-900">29₪</span>
                <span className="text-gray-500 font-medium"> / לחודש</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-gray-800 font-bold">
                  <span className="text-blue-500">✓</span> פרסום האתר לאוויר (Hosting מהיר)
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="text-blue-500">✓</span> תמונות AI פרימיום ספציפיות לעסק
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="text-blue-500">✓</span> מערכת לידים פתוחה וקביעת תורים
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="text-blue-500">✓</span> חיבור כפתור ישיר לוואטסאפ שלך
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="text-blue-500">✓</span> עריכה ללא הגבלה + תמיכה טכנית
                </li>
              </ul>

              <button 
                onClick={handleUpgrade}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-transform ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed opacity-70' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:scale-105'
                }`}
              >
                {isLoading ? 'פותח דף סליקה...' : 'שדרג עכשיו ל-Pro'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}