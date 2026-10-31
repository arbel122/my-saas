import { NextResponse } from 'next/server';
import { isRateLimited } from '@/app/utils/rate-limit';
import { getUserFromRequest } from '@/app/utils/auth';

const FALLBACK_QUESTIONS = [
  'אילו מוצרים, דגמים או מותגים אתם מוכרים בקטגוריה הזו?',
  'מה המחיר של כל מוצר, או טווח המחירים?',
  'מה מיוחד אצלכם (אחריות, משלוח, מבצעים, זמינות במלאי)?',
];

function cleanJson(raw: string) {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
  return cleaned.trim();
}

// המודל לפעמים מחזיר JSON שבור. מנסים פעם אחת נוספת לפני שמוותרים.
async function askAi(prompt: string): Promise<unknown> {
  try {
    return await askAiOnce(prompt);
  } catch (firstError) {
    console.warn('Catalog AI attempt failed, retrying:', firstError);
    return askAiOnce(prompt);
  }
}

async function askAiOnce(prompt: string): Promise<unknown> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2500,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error('AI request failed');
  const data = await res.json();
  return JSON.parse(cleanJson(data.choices?.[0]?.message?.content || ''));
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// שני שלבים: שאלות מותאמות לקטגוריה, ואז יצירת רשימת מוצרים מהתשובות של בעל העסק.
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'יש להתחבר כדי להשתמש בעורך.', needsLogin: true }, { status: 401 });
    }
    if (isRateLimited(`catalog:${user.id}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'יותר מדי בקשות. נסו שוב מאוחר יותר.' }, { status: 429 });
    }

    const body = await req.json();
    const action = body?.action;
    const category = text(body?.category, 60);
    const businessName = text(body?.businessName, 80);
    const industry = text(body?.industry, 120);

    if (!category) {
      return NextResponse.json({ error: 'נא לכתוב שם לקטגוריה.' }, { status: 400 });
    }

    const context = `העסק: ${businessName || 'לא צוין'}${industry ? ` (${industry})` : ''}. הקטגוריה: ${category}.`;

    if (action === 'questions') {
      try {
        const result = (await askAi(`
אתה עוזר לבעל עסק להוסיף קטגוריית מוצרים לאתר שלו.
${context}
כתוב 3 עד 4 שאלות קצרות וממוקדות בעברית לבעל העסק, כדי לדעת בדיוק אילו מוצרים הוא מוכר בקטגוריה הזו (למשל מותגים, דגמים, גדלים, מחירים, אחריות). השאלות חייבות להתאים לקטגוריה הספציפית.
אל תשתמש במרכאות כפולות בתוך הטקסט.
החזר אך ורק JSON בצורה: {"questions": ["שאלה 1", "שאלה 2"]}
`)) as { questions?: unknown };

        const questions = Array.isArray(result.questions)
          ? result.questions.map((q) => text(q, 200)).filter(Boolean).slice(0, 4)
          : [];
        return NextResponse.json({ questions: questions.length >= 2 ? questions : FALLBACK_QUESTIONS });
      } catch (err) {
        console.error('Catalog questions failed, using fallback questions:', err);
        return NextResponse.json({ questions: FALLBACK_QUESTIONS });
      }
    }

    if (action === 'generate') {
      const rawAnswers: unknown[] = Array.isArray(body?.answers) ? body.answers.slice(0, 6) : [];
      const answers = rawAnswers
        .map((a) => {
          const item = a as { question?: unknown; answer?: unknown };
          return { question: text(item?.question, 200), answer: text(item?.answer, 1500) };
        })
        .filter((a) => a.answer);

      if (answers.length === 0) {
        return NextResponse.json({ error: 'נא לענות על שאלה אחת לפחות.' }, { status: 400 });
      }

      const qa = answers.map((a) => `שאלה: ${a.question}\nתשובה: ${a.answer}`).join('\n\n');
      const result = (await askAi(`
אתה עוזר לבעל עסק לבנות רשימת מוצרים לאתר שלו.
${context}

התשובות של בעל העסק:
${qa}

צור רשימת מוצרים לקטגוריה לפי המידע שנמסר בלבד.
כללים חשובים:
- אל תמציא מוצרים, מותגים, דגמים או מחירים שלא הוזכרו. אם מחיר לא צוין, השאר את שדה המחיר ריק.
- נסח לכל מוצר תיאור קצר ושיווקי (עד 140 תווים) בלי להוסיף עובדות שלא נמסרו.
- עד 12 מוצרים. אם נמסרה רשימה, כל פריט ברשימה הוא מוצר נפרד.
- אל תשתמש במרכאות כפולות בתוך הטקסט.
החזר אך ורק JSON בצורה: {"items": [{"name": "שם המוצר", "description": "תיאור", "price": "מחיר או ריק"}]}
`)) as { items?: unknown };

      const items = (Array.isArray(result.items) ? result.items : [])
        .map((i) => {
          const item = i as { name?: unknown; description?: unknown; price?: unknown };
          return { name: text(item?.name, 80), description: text(item?.description, 200), price: text(item?.price, 30) };
        })
        .filter((i) => i.name)
        .slice(0, 12);

      if (items.length === 0) {
        return NextResponse.json({ error: 'לא הצלחנו ליצור מוצרים מהתשובות. נסו לפרט יותר.' }, { status: 422 });
      }
      return NextResponse.json({ items });
    }

    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 });
  } catch (err) {
    console.error('Catalog error:', err);
    return NextResponse.json({ error: 'שגיאה ביצירת הקטגוריה. נסו שוב.' }, { status: 500 });
  }
}
