"use client";

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
}

export default function ReviewsSection({ siteId }: { siteId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setReviews(data);
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
    <section className="py-16 bg-slate-50 border-t border-slate-100" dir="rtl">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-2">מה הלקוחות שלנו אומרים</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-slate-800">{averageRating}</span>
            <div className="flex text-amber-400 text-xl">
              {"★".repeat(Math.round(Number(averageRating)))}
            </div>
            <span className="text-sm text-slate-500">({reviews.length} ביקורות מאומתות)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{review.client_name}</h4>
                    <span className="inline-block bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold mt-1">
                      ✓ תור מאומת
                    </span>
                  </div>
                  <div className="flex text-amber-400 text-lg">
                    {"★".repeat(review.rating)}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    "{review.comment}"
                  </p>
                )}
              </div>

              {review.photo_url && (
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-100 max-h-48">
                  <img
                    src={review.photo_url}
                    alt="תמונת ביקורת"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}