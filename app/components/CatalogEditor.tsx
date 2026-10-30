'use client';

import { useState } from 'react';
import type { CatalogCategory, CatalogItem } from './CatalogSection';

type Props = {
  catalog: CatalogCategory[];
  onChange: (catalog: CatalogCategory[]) => void;
  themeColor?: string;
  businessName?: string;
  industry?: string;
};

type Step = 'closed' | 'name' | 'questions' | 'review';

async function callCatalog(payload: Record<string, unknown>) {
  const res = await fetch('/api/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'שגיאה. נסו שוב.');
  return data;
}

const inputCls = 'w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-blue-500 focus:bg-white text-sm';

// עורך הקטגוריות בעורך האתר: אשף AI ליצירת קטגוריה חדשה, ועריכה ידנית של קיימות.
export default function CatalogEditor({ catalog, onChange, themeColor = '#2563eb', businessName, industry }: Props) {
  const [step, setStep] = useState<Step>('closed');
  const [draft, setDraft] = useState<CatalogCategory>({ id: '', name: '', items: [] });
  const [isNew, setIsNew] = useState(true);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => { setStep('closed'); setError(''); setBusy(false); };

  const startNew = () => {
    setDraft({ id: '', name: '', items: [] });
    setIsNew(true);
    setQuestions([]);
    setAnswers([]);
    setError('');
    setStep('name');
  };

  const editExisting = (category: CatalogCategory) => {
    setDraft({ ...category, items: category.items.map((i) => ({ ...i })) });
    setIsNew(false);
    setError('');

    // קטגוריה ריקה (נוצרה בטופס הפתיחה): ישר לשאלות ה-AI, כדי שיבנה את המוצרים
    if (category.items.length === 0) {
      setQuestions([]);
      setAnswers([]);
      setStep('name');
      fetchQuestions(category.name);
      return;
    }
    setStep('review');
  };

  const fetchQuestions = async (nameOverride?: string) => {
    const categoryName = (nameOverride ?? draft.name).trim();
    if (!categoryName) return setError('נא לכתוב שם לקטגוריה.');
    setBusy(true);
    setError('');
    try {
      const data = await callCatalog({ action: 'questions', category: categoryName, businessName, industry });
      setQuestions(data.questions);
      setAnswers(data.questions.map(() => ''));
      setStep('questions');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await callCatalog({
        action: 'generate',
        category: draft.name,
        businessName,
        industry,
        answers: questions.map((question, i) => ({ question, answer: answers[i] })),
      });
      setDraft((d) => ({ ...d, items: data.items }));
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const updateItem = (index: number, field: keyof CatalogItem, value: string) =>
    setDraft((d) => ({ ...d, items: d.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)) }));

  const save = () => {
    const items = draft.items.filter((i) => i.name.trim());
    if (!draft.name.trim()) return setError('נא לכתוב שם לקטגוריה.');
    if (items.length === 0) return setError('צריך לפחות מוצר אחד בקטגוריה.');
    const category = { ...draft, name: draft.name.trim(), items, id: draft.id || `cat-${Date.now()}` };
    onChange(isNew ? [...catalog, category] : catalog.map((c) => (c.id === category.id ? category : c)));
    close();
  };

  const remove = () => {
    if (!confirm(`למחוק את הקטגוריה "${draft.name}"?`)) return;
    onChange(catalog.filter((c) => c.id !== draft.id));
    close();
  };

  return (
    <div className="py-16 px-4 bg-gray-50 border-t border-gray-100" dir="rtl">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">מה אנחנו מוכרים</h2>
        <p className="text-gray-500 mb-8 text-sm">לעסקים שמוכרים מוצרים: הוסיפו קטגוריה, ענו על כמה שאלות, וה-AI יבנה את רשימת המוצרים.</p>

        <div className="flex flex-wrap justify-center gap-3">
          {catalog.map((c) => (
            <button
              key={c.id}
              onClick={() => editExisting(c)}
              className="px-6 py-3 rounded-full font-bold text-white shadow-md hover:shadow-xl transition-all"
              style={{ backgroundColor: themeColor }}
              title="לחצו לעריכה"
            >
              {c.name} {c.items.length === 0 ? '➕ הוסיפו מוצרים' : '✏️'}
            </button>
          ))}
          <button onClick={startNew} className="bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-900 font-bold px-6 py-3 rounded-full transition-all">
            ➕ הוסף קטגוריית מוצרים (AI)
          </button>
        </div>
      </div>

      {step !== 'closed' && (
        <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-extrabold text-gray-800">
                {step === 'name' && 'קטגוריה חדשה 🛍️'}
                {step === 'questions' && `כמה שאלות על "${draft.name}"`}
                {step === 'review' && (isNew ? 'בדקו את המוצרים' : 'עריכת קטגוריה')}
              </h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-800 text-3xl">&times;</button>
            </div>

            <div className="p-6 space-y-5">
              {step === 'name' && (
                <>
                  <label className="block text-sm font-bold text-gray-700">איך תקראו לקטגוריה? (זה יהיה שם הכפתור באתר)</label>
                  <input className={inputCls} placeholder="לדוגמה: מטענים ניידים" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={60} />
                  <button onClick={() => fetchQuestions()} disabled={busy} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60">
                    {busy ? 'ה-AI מכין שאלות...' : 'המשך'}
                  </button>
                </>
              )}

              {step === 'questions' && (
                <>
                  <p className="text-sm text-gray-500">ענו בקצרה. ה-AI ישתמש רק במה שתכתבו, ולא ימציא מוצרים או מחירים.</p>
                  {questions.map((q, i) => (
                    <div key={i}>
                      <label className="block text-sm font-bold text-gray-700 mb-1">{q}</label>
                      <textarea className={inputCls} rows={3} maxLength={1500} value={answers[i]} onChange={(e) => setAnswers((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))} />
                    </div>
                  ))}
                  <button onClick={generate} disabled={busy} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60">
                    {busy ? 'ה-AI יוצר את המוצרים...' : 'צור לי את המוצרים ✨'}
                  </button>
                </>
              )}

              {step === 'review' && (
                <>
                  {!isNew && (
                    <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={60} placeholder="שם הקטגוריה" />
                  )}
                  <div className="space-y-4">
                    {draft.items.map((item, i) => (
                      <div key={i} className="border border-gray-200 rounded-2xl p-4 space-y-2 relative">
                        <button onClick={() => setDraft((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }))} className="absolute top-3 left-3 text-red-500 font-bold" aria-label="הסר מוצר">✖</button>
                        <input className={inputCls} placeholder="שם המוצר" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} maxLength={80} />
                        <textarea className={inputCls} rows={2} placeholder="תיאור קצר" value={item.description || ''} onChange={(e) => updateItem(i, 'description', e.target.value)} maxLength={200} />
                        <input className={inputCls} placeholder="מחיר (למשל 79 ₪)" value={item.price || ''} onChange={(e) => updateItem(i, 'price', e.target.value)} maxLength={30} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setDraft((d) => ({ ...d, items: [...d.items, { name: '', description: '', price: '' }] }))} className="w-full border-2 border-dashed border-gray-300 text-gray-600 font-bold py-3 rounded-xl hover:border-gray-500">
                    ➕ הוסף מוצר
                  </button>
                  <div className="flex gap-3">
                    <button onClick={save} className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black">{isNew ? 'הוסף לאתר' : 'שמור'}</button>
                    {!isNew && <button onClick={remove} className="px-5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100">מחק קטגוריה</button>}
                  </div>
                </>
              )}

              {error && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
