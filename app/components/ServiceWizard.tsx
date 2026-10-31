'use client';

import { useState } from 'react';
import { getAuthHeader } from '../utils/auth-client';

export type NewService = { name: string; description: string; price: string; duration: string };

type Props = {
  businessName?: string;
  industry?: string;
  onAdd: (service: NewService) => void;
  onClose: () => void;
};

async function callCatalog(payload: Record<string, unknown>) {
  const res = await fetch('/api/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'שגיאה. נסו שוב.');
  return data;
}

const inputCls = 'w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-blue-500 focus:bg-white text-sm';

// אשף הוספת שירות עם AI: שם השירות, כמה שאלות שה-AI מתאים לשירות, ואז שירות מוכן לעריכה.
export default function ServiceWizard({ businessName, industry, onAdd, onClose }: Props) {
  const [step, setStep] = useState<'name' | 'questions' | 'review'>('name');
  const [name, setName] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [service, setService] = useState<NewService>({ name: '', description: '', price: '', duration: '60 דקות' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fetchQuestions = async () => {
    if (!name.trim()) return setError('נא לכתוב את שם השירות.');
    setBusy(true);
    setError('');
    try {
      const data = await callCatalog({ action: 'service_questions', category: name.trim(), businessName, industry });
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
        action: 'service_generate',
        category: name.trim(),
        businessName,
        industry,
        answers: questions.map((question, i) => ({ question, answer: answers[i] })),
      });
      setService({ ...data.service, price: data.service.price || '' });
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const add = () => {
    if (!service.name.trim()) return setError('נא לכתוב שם לשירות.');
    onAdd({ ...service, name: service.name.trim(), price: service.price.trim() || 'לפי הצעת מחיר' });
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0">
          <h3 className="text-xl font-extrabold text-gray-800">
            {step === 'name' && 'שירות חדש ✨'}
            {step === 'questions' && `כמה שאלות על "${name}"`}
            {step === 'review' && 'בדקו את השירות'}
          </h3>
          <button onClick={onClose} aria-label="סגור" className="text-gray-400 hover:text-gray-800 text-3xl">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'name' && (
            <>
              <label className="block text-sm font-bold text-gray-700">איך קוראים לשירות?</label>
              <input className={inputCls} placeholder="לדוגמה: החלקה ברזילאית" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              <button onClick={fetchQuestions} disabled={busy} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60">
                {busy ? 'ה-AI מכין שאלות...' : 'המשך'}
              </button>
            </>
          )}

          {step === 'questions' && (
            <>
              <p className="text-sm text-gray-500">ענו בקצרה. ה-AI ישתמש רק במה שתכתבו, ולא ימציא מחיר או פרטים.</p>
              {questions.map((q, i) => (
                <div key={i}>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{q}</label>
                  <textarea className={inputCls} rows={2} maxLength={1500} value={answers[i]} onChange={(e) => setAnswers((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))} />
                </div>
              ))}
              <button onClick={generate} disabled={busy} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60">
                {busy ? 'ה-AI כותב את השירות...' : 'צור לי את השירות ✨'}
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <input className={inputCls} placeholder="שם השירות" value={service.name} onChange={(e) => setService({ ...service, name: e.target.value })} maxLength={80} />
              <textarea className={inputCls} rows={3} placeholder="תיאור" value={service.description} onChange={(e) => setService({ ...service, description: e.target.value })} maxLength={260} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="מחיר (למשל 120 ₪)" value={service.price} onChange={(e) => setService({ ...service, price: e.target.value })} maxLength={30} />
                <input className={inputCls} placeholder="משך (למשל 45 דקות)" value={service.duration} onChange={(e) => setService({ ...service, duration: e.target.value })} maxLength={30} />
              </div>
              <button onClick={add} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black">הוסף לאתר</button>
            </>
          )}

          {error && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
        </div>
      </div>
    </div>
  );
}
