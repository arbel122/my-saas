"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Service {
  name: string;
  price: string;
  description: string;
}

interface SiteData {
  businessName: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  services: Service[];
  themeColor: string;
  contactLocation: string;
}

export default function PreviewPage() {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem("generatedSite");
    if (!data) {
      router.push("/create");
      return;
    }
    setSiteData(JSON.parse(data));
  }, [router]);

  if (!siteData) {
    return <div className="min-h-screen flex items-center justify-center font-medium">טוען את האתר שלך...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dir-rtl" dir="rtl">
      <div className="bg-slate-900 text-white py-3 px-6 flex justify-between items-center shadow-md sticky top-0 z-50">
        <span className="text-sm font-medium">✨ תצוגה מקדימה לאתר של: <strong className="text-yellow-400">{siteData.businessName}</strong></span>
        <button
          onClick={() => router.push("/create")}
          className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded-lg transition duration-150 font-medium cursor-pointer"
        >
          ← חזור ליצירה מחדש
        </button>
      </div>

      <header 
        className="text-white py-24 px-6 text-center shadow-inner transition-colors duration-500"
        style={{ backgroundColor: siteData.themeColor || "#2563eb" }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-sm">{siteData.heroTitle}</h1>
          <p className="text-lg md:text-2xl opacity-90 max-w-2xl mx-auto font-light">{siteData.heroSubtitle}</p>
        </div>
      </header>

      <section className="max-w-3xl mx-auto py-16 px-6 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">על העסק</h2>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">{siteData.aboutText}</p>
        <div className="inline-block bg-slate-200/80 text-slate-700 px-4 py-1.5 rounded-full text-sm font-medium mt-2">
          📍 פעילות באזור: {siteData.contactLocation}
        </div>
      </section>

      <section className="bg-white py-16 px-6 border-t border-slate-200">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold text-center text-slate-900">השירותים והמחירון שלנו</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {siteData.services.map((service, idx) => (
              <div key={idx} className="border border-slate-100 bg-slate-50/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-xl font-bold text-slate-800">{service.name}</h3>
                    <span 
                      className="text-sm font-bold px-3 py-1 rounded-full text-white whitespace-nowrap shadow-sm"
                      style={{ backgroundColor: siteData.themeColor || "#2563eb" }}
                    >
                      {service.price}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm border-t border-slate-800">
        <p>© כל הזכויות שמורות ל{siteData.businessName} • נוצר בשניות באמצעות AI</p>
      </footer>

      {/* כפתור וואטסאפ צף */}
      <a
        href="https://wa.me/972500000000" 
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#1ebe57] hover:scale-110 transition-transform z-50 flex items-center justify-center cursor-pointer"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.031 0C5.383 0 0 5.383 0 12.031c0 2.124.553 4.195 1.602 6.012L.152 24l6.108-1.597c1.737.947 3.702 1.448 5.771 1.448 6.648 0 12.031-5.383 12.031-12.031C24 5.383 18.679 0 12.031 0zm0 21.942c-1.802 0-3.564-.485-5.112-1.404l-.366-.217-3.8.994.996-3.706-.239-.379c-1.009-1.604-1.542-3.466-1.542-5.401 0-5.549 4.515-10.064 10.063-10.064 5.549 0 10.064 4.515 10.064 10.064 0 5.549-4.515 10.064-10.064 10.064zM17.556 14.86c-.304-.152-1.796-.886-2.074-.988-.278-.101-.481-.152-.684.152-.203.304-.785.988-.962 1.191-.177.203-.354.228-.658.076-.304-.152-1.282-.473-2.443-1.517-.903-.812-1.512-1.816-1.689-2.12-.177-.304-.019-.468.133-.62.137-.137.304-.354.456-.531.152-.177.203-.304.304-.506.101-.203.051-.38-.025-.531-.076-.152-.684-1.646-.937-2.253-.246-.593-.496-.513-.684-.522-.177-.009-.38-.009-.583-.009-.203 0-.532.076-.81.38-.278.304-1.064 1.038-1.064 2.532 0 1.494 1.089 2.937 1.241 3.14.152.203 2.14 3.266 5.185 4.582 2.034.88 2.721 1.042 3.693.876.817-.139 2.527-1.031 2.882-2.025.355-.994.355-1.848.253-2.025-.101-.177-.38-.278-.684-.43z"/>
        </svg>
      </a>
    </div>
  );
}