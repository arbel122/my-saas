import { NextResponse } from "next/server";
import { isRateLimited } from "@/app/utils/rate-limit";
import { getUserFromRequest } from "@/app/utils/auth";
import { aiJson } from "@/app/utils/ai";

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

    const body = await req.json().catch(() => null);
    const { businessDescription, action, services: ownerServices } = body ?? {};
    const suggesting = action === "suggest_services";

    if (isRateLimited(`${suggesting ? "suggest" : "generate"}:${user.id}`, suggesting ? 12 : RATE_LIMIT, RATE_WINDOW_MS)) {
      return NextResponse.json(
        { error: "יותר מדי ניסיונות. נסה שוב בעוד כמה דקות." },
        { status: 429 }
      );
    }

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

    if (suggesting) {
      const suggestPrompt = `אתה עוזר לבעל עסק. פרטי העסק: "${businessDescription}".
החזר אך ורק JSON בצורה {"services": ["שם שירות", "שם שירות"]} עם 4 עד 6 שירותים שעסק כזה נותן ללקוח (כמו תספורת, ייעוץ, טיפול, אימון). שמות קצרים בעברית. אל תכלול מוצרים פיזיים שנמכרים, אל תוסיף מחירים, ואל תשתמש במרכאות כפולות בתוך הטקסטים.`;
      const rawSuggest = await aiJson(suggestPrompt, { maxTokens: 400, temperature: 0.5 });
      let names: string[] = [];
      try {
        const parsed = JSON.parse(cleanJsonResponse(rawSuggest));
        names = (Array.isArray(parsed?.services) ? parsed.services : [])
          .map((n: unknown) => (typeof n === "string" ? n.trim().slice(0, 60) : ""))
          .filter(Boolean)
          .slice(0, 6);
      } catch {
        names = [];
      }
      return NextResponse.json({ success: true, services: names });
    }

    // השירותים והמחירים שבעל העסק קבע. ה-AI לא ממציא מחירים: הוא רק כותב תיאורים.
    const owner: Array<{ name: string; price: string }> = (Array.isArray(ownerServices) ? ownerServices : [])
      .slice(0, 8)
      .map((item: any) => {
        const price = String(item?.price ?? "").trim().slice(0, 30);
        return { name: String(item?.name ?? "").trim().slice(0, 60), price: /\d/.test(price) && !/₪|ש"?ח|שקל|%/.test(price) ? `${price} ₪` : price };
      })
      .filter((item: { name: string }) => item.name);

    // 1. הוספנו פה כלל ברזל קריטי ל-Gemini כדי שלא ישבור את ה-JSON
    const systemPrompt = `
אתה קופירייטר, איש שיווק ומעצב אתרים מומחה.
פרטי העסק שסיפק הלקוח: "${businessDescription}"

חשוב לחיפוש בגוגל: בכותרת הראשית ובפסקת האודות שלב באופן טבעי את תחום העסק ואת העיר או האזור שלו (למשל: קצביה בירושלים), בלי חזרות מוגזמות ובלי להמציא פרטים שלא נמסרו.

כללי כתיבה (חשובים מאוד): כתוב קונקרטי ובשפה פשוטה, כמו שבעל העסק היה מדבר. השתמש רק בעובדות שנמסרו בפרטי העסק. אל תמציא מספרים, שנות ניסיון, פרסים, כמות לקוחות או המלצות שלא נמסרו. הימנע מקלישאות כמו: ללא פשרות, איכות מעולה, שירות מקצועי ואישי, הכי טוב, מובילים בתחום, פתרונות מתקדמים, חווית לקוח. הכותרת הראשית: עד 7 מילים. תת הכותרת: משפט אחד, עד 14 מילים. פסקת האודות: עד 55 מילים.

${owner.length ? `השירותים והמחירים שבעל העסק קבע (אסור לשנות אותם או להוסיף שירותים אחרים):
${owner.map((item, i) => `${i + 1}. ${item.name}: ${item.price || "מחיר לפי הצעה"}`).join("\n")}
בשדה services החזר בדיוק את השירותים האלה, באותו סדר ובאותו שם, ורק הוסף לכל אחד description קצר ו-duration. את שדה price השאר ריק, המחירים נקבעים על ידי בעל העסק.

` : ""}כלל לגבי services: הרשימה כוללת רק שירותים שהעסק נותן ללקוח (כמו תספורת, ייעוץ, טיפול, אימון). אל תכניס אליה מוצרים פיזיים שנמכרים (כמו שמפו, מוצרי שיער, כיסויים, אביזרים), גם אם העסק מוכר אותם. מוצרים מנוהלים בנפרד, ובשום אופן לא כשירות.

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

    const rawContent = await aiJson(systemPrompt, { maxTokens: 2000, temperature: 0.7 });
    
    // מנגנון הגנה נגד שגיאות בקריאת ה-JSON
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJsonResponse(rawContent));
    } catch (parseError) {
      console.error("JSON Parsing failed:", rawContent);
      throw new Error("הבינה המלאכותית החזירה טקסט לא תקין, אנא נסה שוב.");
    }

    if (owner.length) {
      const aiServices: any[] = Array.isArray(parsedData.services) ? parsedData.services : [];
      parsedData.services = owner.map((item, i) => {
        const match = aiServices.find((x) => x?.name === item.name) ?? aiServices[i] ?? {};
        return {
          name: item.name,
          price: item.price || "מחיר לפי הצעה",
          description: String(match.description ?? "").slice(0, 300),
          duration: String(match.duration ?? "60 דקות").slice(0, 30),
        };
      });
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
      title: parsedData.title || parsedData.businessName || "העסק שלי",
      subtitle: parsedData.subtitle || "",
      hero_image: finalImageUrl,
      aboutText: parsedData.aboutText || "",
      location: parsedData.location || "שירות ארצי",      services: parsedData.services || []
    };

    return NextResponse.json({ success: true, site: finalSiteData });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}