"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  
  // המחיר שהלקוח ישלם בשקלים.
  const price = "29.00"; 

  // שים כאן את ה-Client ID המלא שרשום לך בפייפאל (זה שמתחיל ב-AbcCm2ezb...)
  const PAYPAL_CLIENT_ID = "AbcCm2ezbCM3uTlSXjqNRT9fcqam5ebjefvSngtIFmnQfWJtLW1k5gTKRLXSOY_NKT5MnnW76j7qvePy"; 

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 dir-rtl" dir="rtl">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
        
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          🚀
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">האתר שלך מוכן!</h1>
        <p className="text-slate-500 mb-6">כדי להעלות את האתר לאוויר ולפתוח אותו ללקוחות, יש להשלים את התשלום.</p>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
          <span className="block text-sm text-slate-500 mb-1">סך הכל לתשלום:</span>
          <span className="text-3xl font-black text-slate-900">₪{price}</span>
        </div>

        {/* מערכת התשלום של פייפאל */}
        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "ILS" }}>
          <PayPalButtons
            style={{ layout: "vertical", shape: "pill" }}
            createOrder={(data, actions) => {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    amount: {
                      currency_code: "ILS",
                      value: price,
                    },
                  },
                ],
              });
            }}
            onApprove={async (data, actions) => {
              if (actions.order) {
                const details = await actions.order.capture();
                alert("תשלום התקבל בהצלחה מ-" + details.payer?.name?.given_name + "! מפרסם את האתר...");
                router.push("/success");
              }
            }}
          />
        </PayPalScriptProvider>
        
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