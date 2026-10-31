import { NextResponse } from "next/server";
import { isRateLimited } from "@/app/utils/rate-limit";
import { getUserFromRequest } from "@/app/utils/auth";

function cleanJsonResponse(rawText: string) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/, "");
  if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "");
  if (cleaned.endsWith("```")) cleaned = cleaned.replace(/```$/, "");
  return cleaned.trim();
}

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_DESCRIPTION_LENGTH = 2000;

export async function POST(req: Request) {
  try {
    // יצירת אתר מותרת רק לבעל עסק שנרשם (וגם מגינה על עלות ה-AI)
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "יש להתחבר כדי ליצור אתר.", needsLogin: true }, { status: 401 });
    }

    if (isRateLimited(`generate:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS)) {
      return NextResponse.json(
        { error: "יותר מדי ניסיונות. נסה שוב בעוד כמה דקות." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const { businessDescription } = body ?? {};

    if (!businessDescription || typeof businessDescription !== "string") {
      return NextResponse.json(
        { error: "נא לספק תיאור עסק." },
        { status: 400 }
      );
    }

    if (businessDescription.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: "התיאור ארוך מדי." },
        { status: 400 }
      );
    }

    // 1. הוספנו פה כלל ברזל קריטי ל-Gemini כדי שלא ישבור את ה-JSON
    const systemPrompt = `
אתה קופירייטר, איש שיווק ומעצב אתרים מומחה.
פרטי העסק שסיפק הלקוח: "${businessDescription}"

חובה עליך להחזיר אך ורק אובייקט JSON חוקי ותקין.
כלל ברזל (קריטי!): אל תשתמש במרכאות כפולות (") בתוך הטקסטים עצמם! השתמש רק בגרש יחיד (') אם צריך.

המבנה הנדרש:
{
  "businessName": "שם העסק",
  "title": "כותרת ראשית קצרה",
  "subtitle": "תת כותרת",
  "imageKeyword": "English ONLY! 1 or 2 words describing the profession (e.g. hair salon, plumber, gym, lawyer)",
  "aboutText": "פסקה שיווקית חמה ומקצועית המספרת על העסק. (ללא מרכאות כפולות)",
  "location": "מיקום העסק",
  "services": [
    { "name": "שם השירות", "description": "תיאור השירות", "price": "מחיר", "duration": "משך בדקות, למשל 60 דקות" }
  ]
}
`;

    const textResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", 
        messages: [{ role: "user", content: systemPrompt }],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!textResponse.ok) throw new Error("שגיאה מ-Gemini.");
    
    const aiData = await textResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // מנגנון הגנה נגד שגיאות בקריאת ה-JSON
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJsonResponse(rawContent));
    } catch (parseError) {
      console.error("JSON Parsing failed:", rawContent);
      throw new Error("הבינה המלאכותית החזירה טקסט לא תקין, אנא נסה שוב.");
    }

    // 2. משיכת התמונה מ-Unsplash
    const keyword = parsedData.imageKeyword || "business";
    let finalImageUrl = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"; 

    try {
      const unsplashResponse = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keyword)}&orientation=landscape&client_id=${process.env.UNSPLASH_API_KEY}`
      );
      
      if (unsplashResponse.ok) {
        const unsplashData = await unsplashResponse.json();
        if (unsplashData?.urls?.regular) {
          finalImageUrl = unsplashData.urls.regular;
        }
      }
    } catch (imageError) {
      console.error("Unsplash error:", imageError);
    }

    // 3. החזרת התשובה הסופית
    const finalSiteData = {
      businessName: parsedData.businessName || "העסק שלי",
      title: parsedData.title || "העסק שלך מתחיל כאן",
      subtitle: parsedData.subtitle || "איכות ושירות ללא פשרות.",
      hero_image: finalImageUrl,
      aboutText: parsedData.aboutText || "כאן כדי לתת לכם את השירות הטוב ביותר.",
      location: parsedData.location || "שירות ארצי",      services: parsedData.services || []
    };

    return NextResponse.json({ success: true, site: finalSiteData });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}