"use client";

import { useEffect, useState } from "react";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

type Props = {
  siteId: string;
  // מראה לפי תחום העסק (utils/site-theme.ts)
  headingClass?: string;
  cardClass?: string;
  background?: string;
  /** קישור לכתיבת ביקורת בפרופיל הגוגל של העסק */
  googleReviewUrl?: string;
};

export default function ReviewsSection({ siteId, headingClass = "", cardClass = "rounded-3xl", background, googleReviewUrl }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/sites/${encodeURIComponent(siteId)}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews ?? []);
        }
      } catch {
        // אם הטעינה נכשלה פשוט לא מציגים את האזור
      }
      setLoading(false);
    }

    fetchReviews();
  }, [siteId]);

  if (loading) return null;
  if (reviews.length === 0) return null;

  const averageRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <section className="py-14 md:py-20 bg-slate-50 border-t border-slate-100" dir="rtl" style={background ? { backgroundColor: background } : undefined}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className={`${headingClass} text-3xl md:text-4xl text-slate-900 !mt-0 !mb-2`}>מה הלקוחות שלנו אומרים</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-slate-800">{averageRating}</span>
            <div className="flex text-amber-400 text-xl" aria-label={`דירוג ממוצע ${averageRating} מתוך 5`}>
              {"★".repeat(Math.round(Number(averageRating)))}
            </div>
            <span className="text-sm text-slate-500">({reviews.length} ביקורות)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white p-6 border border-slate-200 flex flex-col justify-between space-y-4 ${cardClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{review.name}</h4>
                    <span className="inline-block bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold mt-1">
                      ✓ לקוח שקבע תור
                    </span>
                  </div>
                  <div className="flex text-amber-400 text-lg" aria-label={`${review.rating} כוכבים`}>
                    {"★".repeat(review.rating)}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    &quot;{review.comment}&quot;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {googleReviewUrl && (
          <div className="text-center mt-10">
            <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold px-6 py-3 rounded-full">
              כתבו עלינו גם בגוגל
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
