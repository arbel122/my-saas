"use client";

import { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabase";
import "../ui.css";

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
    <div dir="rtl" className="ui pay">
      <div className="pay-card">
        <h1>האתר שלך מוכן</h1>
        <p className="pay-lead">כדי להעלות את האתר לאוויר ולפתוח אותו ללקוחות, יש להצטרף למסלול Pro.</p>

        <div className="pay-total">
          <span>חיוב חודשי</span>
          <strong>₪{price}</strong>
          <span>ניתן לבטל בכל עת דרך חשבון PayPal</span>
        </div>

        {message && (
          <div role="status" className="ui-alert ui-alert--good">{message}</div>
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
              style={{ layout: "vertical", shape: "rect", label: "subscribe" }}
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

        <div className="pay-back">
          <button type="button" onClick={() => router.back()} className="ui-link">
            חזור לעריכת האתר
          </button>
        </div>
      </div>
    </div>
  );
}
