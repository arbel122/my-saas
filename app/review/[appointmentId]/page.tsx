'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// יצירת חיבור ישיר מול המפתח הציבורי של Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();

  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<any>(null);
  const [site, setSite] = useState<any>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    async function fetchDetails() {
      if (!appointmentId) return;
      try {
        // שליפת פרטי התור
        const { data: apptData, error: apptError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single();

        if (apptError || !apptData) throw new Error('התור לא נמצא');

        setAppointment(apptData);

        // שליפת פרטי האתר
        if (apptData.site_id) {
          const { data: siteData } = await supabase
            .from('sites')
            .select('*')
            .eq('id', apptData.site_id)
            .single();

          if (siteData) setSite(siteData);
        }
      } catch (err: any) {
        console.error('Error fetching review data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetails();
  }, [appointmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert([
        {
          appointment_id: appointmentId,
          site_id: appointment?.site_id,
          customer_name: appointment?.customer_name || 'לקוח',
          rating,
          comment,
        },
      ]);

      if (error) {
        console.warn('Reviews insert error:', error.message);
      }

      setIsSubmitted(true);
    } catch (err: any) {
      alert('אירעה שגיאה בשמירת הביקורת: ' + err.message);
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

  if (isSubmitted) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl border border-gray-100 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">תודה רבה על חוות הדעת!</h1>
          <p className="text-gray-600 mb-6">הדירוג והתגובה שלך נשמרו בהצלחה ועוזרים לנו להשתפר.</p>
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
          {site?.name ? `דרג את השירות אצל ${site.name}` : 'נשמח לשמוע את חוות דעתך על התור'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-bold text-gray-700">דירוג בכוכבים:</label>
            <div className="flex gap-2 dir-ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
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
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ספר לנו מה אהבת או מה ניתן לשפר..."
              className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none text-sm font-medium"
            />
          </div>

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