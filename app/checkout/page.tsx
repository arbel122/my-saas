"use client";

import { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabase";

export default function CheckoutPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const price = "29.00";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login?next=/checkout");
        return;
      }
      setUserId(user.id);
    });
  }, [router]);

  const activateOnServer = async (subscriptionId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/paypal/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (res.status === 202) {
      setMessage("התשלום התקבל ומעובד. המנוי יופעל תוך דקות ספורות.");
      setTimeout(() => router.push("/dashboard"), 3000);
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "שגיאה באימות התשלום. אם חויבת, פנה אלינו.");
      return;
    }

    router.push("/dashboard?status=success");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 dir-rtl" dir="rtl">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">

        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          🚀
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">האתר שלך מוכן!</h1>
        <p className="text-slate-500 mb-6">כדי להעלות את האתר לאוויר ולפתוח אותו ללקוחות, יש להצטרף למסלול Pro.</p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
          <span className="block text-sm text-slate-500 mb-1">חיוב חודשי:</span>
          <span className="text-3xl font-black text-slate-900">₪{price}</span>
          <span className="block text-xs text-slate-400 mt-1">ניתן לבטל בכל עת דרך חשבון PayPal</span>
        </div>

        {message && (
          <p className="mb-4 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg p-3">{message}</p>
        )}

        {userId && (
          <PayPalScriptProvider
            options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string,
              currency: "ILS",
              intent: "subscription",
              vault: true,
            }}
          >
            <PayPalButtons
              style={{ layout: "vertical", shape: "pill", label: "subscribe" }}
              createSubscription={(data, actions) =>
                actions.subscription.create({
                  plan_id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID as string,
                  custom_id: userId,
                })
              }
              onApprove={async (data) => {
                if (data.subscriptionID) await activateOnServer(data.subscriptionID);
              }}
              onError={() => setMessage("אירעה שגיאה בתשלום. נסה שוב.")}
            />
          </PayPalScriptProvider>
        )}

        <button
          onClick={() => router.back()}
          className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          חזור לעריכת האתר
        </button>
      </div>
    </div>
  );
}
