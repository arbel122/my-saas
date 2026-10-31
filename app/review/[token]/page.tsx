'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuthHeader } from '@/app/utils/auth-client';

type AppointmentInfo = {
  customerName: string;
  date: string;
  siteName: string | null;
  reviewed: boolean;
  canReview: boolean;
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();

  const token = params.token as string;

  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [needsLogin, setNeedsLogin] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    async function fetchDetails() {
      if (!token) return;
      try {
        const res = await fetch(`/api/appointments/${encodeURIComponent(token)}`, { headers: { ...(await getAuthHeader()) } });
        if (res.status === 401) {
          setNeedsLogin(true);
          return;
        }
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setAppointment(await res.json());
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetails();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) },
        body: JSON.stringify({ token, rating, comment }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data.error || 'אירעה שגיאה בשמירת הביקורת. נסו שוב.');
        return;
      }

      setIsSubmitted(true);
    } catch {
      setSubmitError('אירעה שגיאה בשמירת הביקורת. בדקו את החיבור ונסו שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 font-bold text-lg">טוען את פרטי התור...</div>
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl border border-gray-100 text-center">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">צריך להתחבר</h1>
          <p className="text-gray-600 mb-6">התחברו לחשבון שקבע את התור כדי להשאיר ביקורת.</p>
          <a href={`/login?next=${encodeURIComponent(`/review/${token}`)}`} className="block w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all">
            התחברות / הרשמה
          </a>
        </div>
      </div>
    );
  }

  if (notFound || !appointment) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl border border-gray-100 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">הקישור לא תקין</h1>
          <p className="text-gray-600 mb-6">לא מצאנו את התור. ייתכן שהוא בוטל או שהקישור שגוי.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  if (!appointment.canReview && !isSubmitted && !appointment.reviewed) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl border border-gray-100 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">עוד לא הגיע הזמן לביקורת</h1>
          <p className="text-gray-600 mb-2">אפשר להשאיר ביקורת אחרי שהתור מתקיים.</p>
          <p className="text-gray-800 font-bold mb-6">התור שלכם: {appointment.date}</p>
          <p className="text-sm text-gray-500">שמרו את הקישור הזה וחזרו אליו אחרי התור.</p>
        </div>
      </div>
    );
  }

  if (isSubmitted || appointment.reviewed) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl border border-gray-100 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            {isSubmitted ? 'תודה רבה על חוות הדעת!' : 'כבר השארת ביקורת על התור הזה'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isSubmitted
              ? 'הדירוג והתגובה שלך נשמרו בהצלחה ועוזרים לנו להשתפר.'
              : 'תודה! אפשר להשאיר ביקורת אחת לכל תור.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-lg w-full shadow-2xl border border-gray-100">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-2">
          איך הייתה החוויה שלך?
        </h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          {appointment.siteName ? `דרג את השירות אצל ${appointment.siteName}` : 'נשמח לשמוע את חוות דעתך על התור'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-bold text-gray-700">דירוג בכוכבים:</label>
            <div className="flex gap-2" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`${star} כוכבים`}
                  className="text-4xl transition-transform hover:scale-125 focus:outline-none"
                >
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">חוות דעת מילולית:</label>
            <textarea
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ספר לנו מה אהבת או מה ניתן לשפר..."
              className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none text-sm font-medium"
            />
          </div>

          {submitError && (
            <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl p-3 text-center">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'שומר ביקורת...' : 'שלח חוות דעת ✨'}
          </button>
        </form>
      </div>
    </div>
  );
}
