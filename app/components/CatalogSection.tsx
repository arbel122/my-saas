'use client';

import { useState } from 'react';

export type CatalogItem = { name: string; description?: string; price?: string; image?: string };
export type CatalogCategory = { id: string; name: string; items: CatalogItem[] };

type Props = {
  catalog?: CatalogCategory[];
  themeColor?: string;
  phone?: string;
  businessName?: string;
};

function whatsappNumber(phone?: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
}

// תצוגת הקטגוריות באתר הציבורי: כפתור לכל קטגוריה שפותח את רשימת המוצרים.
export default function CatalogSection({ catalog, themeColor = '#2563eb', phone, businessName }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const categories = (catalog ?? []).filter((c) => c.name && c.items?.length > 0);
  if (categories.length === 0) return null;

  const active = categories.find((c) => c.id === openId);
  const wa = whatsappNumber(phone);

  return (
    <section className="py-16 px-4 bg-white border-t" dir="rtl">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">מה אנחנו מוכרים</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setOpenId(c.id)}
              className="px-8 py-4 rounded-full font-bold text-white text-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all"
              style={{ backgroundColor: themeColor }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setOpenId(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto relative z-10 p-6 md:p-8">
            <button onClick={() => setOpenId(null)} aria-label="סגור" className="absolute top-4 left-4 bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full text-xl">✖</button>
            <h3 className="text-3xl font-extrabold text-gray-900 text-center mb-8">{active.name}</h3>
            <div className="grid sm:grid-cols-2 gap-5">
              {active.items.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-2xl p-5 flex flex-col text-right shadow-sm">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} loading="lazy" className="w-full h-44 object-cover rounded-xl mb-3" />
                  )}
                  <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                  {item.description && <p className="text-gray-600 text-sm mt-2 flex-grow">{item.description}</p>}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="font-extrabold text-lg" style={{ color: themeColor }}>{item.price || ''}</span>
                    {wa && (
                      <a
                        href={`https://wa.me/${wa}?text=${encodeURIComponent(`שלום${businessName ? ` ${businessName}` : ''}, אני מעוניין ב${item.name} (${active.name}) שראיתי באתר.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm px-4 py-2 rounded-full transition-colors"
                      >
                        💬 אני מעוניין
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
