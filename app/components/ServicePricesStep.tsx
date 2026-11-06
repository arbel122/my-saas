'use client';

export type PriceRow = { name: string; price: string };

type Props = {
  rows: PriceRow[];
  busy: boolean;
  onChange: (rows: PriceRow[]) => void;
  onConfirm: () => void;
  onBack: () => void;
};

const MAX_ROWS = 8;
const inputCls = 'w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-blue-500 focus:bg-white text-sm font-medium';

// שלב בין השאלות ליצירת האתר: בעל העסק קובע כמה הוא לוקח על כל שירות. ה-AI לא ממציא מחירים,
// כי אותו שירות עולה אחרת בכל עסק (ואיכות שונה, וניסיון שונה).
export default function ServicePricesStep({ rows, busy, onChange, onConfirm, onBack }: Props) {
  const update = (index: number, patch: Partial<PriceRow>) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index));
  const hasService = rows.some((row) => row.name.trim());

  return (
    <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="prices-title">
      <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 id="prices-title" className="text-xl font-extrabold text-gray-900 !m-0">כמה אתם לוקחים על כל שירות?</h2>
          <p className="text-sm text-gray-600 mt-2 !mb-0">
            אותו שירות עולה אחרת בכל עסק, ולכן אנחנו לא ממציאים מחירים. כתבו כאן את המחיר שלכם. שירות בלי מחיר יופיע באתר כ"מחיר לפי הצעה".
          </p>
        </div>

        <div className="p-6 space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className={inputCls}
                value={row.name}
                onChange={(e) => update(index, { name: e.target.value })}
                placeholder="שם השירות"
                aria-label={`שם שירות ${index + 1}`}
                maxLength={60}
              />
              <div className="relative w-36 shrink-0">
                <input
                  className={`${inputCls} pl-8`}
                  value={row.price}
                  onChange={(e) => update(index, { price: e.target.value })}
                  placeholder="מחיר"
                  aria-label={`מחיר ל${row.name || `שירות ${index + 1}`}`}
                  inputMode="decimal"
                  maxLength={30}
                  dir="rtl"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold" aria-hidden="true">₪</span>
              </div>
              {rows.length > 1 && (
                <button type="button" onClick={() => remove(index)} aria-label={`הסר את ${row.name || `שירות ${index + 1}`}`} className="w-9 h-9 shrink-0 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500">
                  ✖
                </button>
              )}
            </div>
          ))}

          {rows.length < MAX_ROWS && (
            <button type="button" onClick={() => onChange([...rows, { name: '', price: '' }])} className="text-sm font-bold text-blue-700 hover:text-blue-900 py-2">
              הוסיפו שירות
            </button>
          )}
        </div>

        <div className="px-6 pb-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !hasService}
            className="w-full bg-blue-600 text-white font-extrabold py-4 rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? 'ה-AI יוצר את האתר...' : 'המשך ויצירת האתר'}
          </button>
          <button type="button" onClick={onBack} disabled={busy} className="text-sm font-bold text-gray-500 hover:text-gray-800 py-1 disabled:opacity-50">
            חזרה לשאלות
          </button>
        </div>
      </div>
    </div>
  );
}
