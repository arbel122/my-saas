// קריאה ל-AI דרך OpenRouter. הספק העיקרי (Gemini) מגביל לפעמים בקשות זמנית (429),
// ולכן יש מודל חלופי אצל ספק אחר, וניסיון חוזר קצר לפני שמוותרים.
const MODELS = ['google/gemini-2.5-flash-lite', 'openai/gpt-4o-mini'];
const MAX_ATTEMPTS = 3;

export const AI_BUSY_MESSAGE = 'שירות ה-AI עמוס כרגע. נסו שוב בעוד רגע.';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function aiJson(prompt: string, opts: { maxTokens: number; temperature: number }): Promise<string> {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        models: MODELS,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    lastStatus = res.status;
    console.warn(`AI request failed (attempt ${attempt}, status ${res.status})`);
    // רק עומס זמני או תקלת שרת שווים ניסיון נוסף
    if (res.status !== 429 && res.status < 500) break;
    if (attempt < MAX_ATTEMPTS) await sleep(1200 * attempt);
  }
  throw new Error(lastStatus === 429 || lastStatus >= 500 ? AI_BUSY_MESSAGE : 'שגיאה ביצירה באמצעות AI.');
}
