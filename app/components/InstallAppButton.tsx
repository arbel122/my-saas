'use client';

import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

// כפתור "התקן אפליקציה": באנדרואיד/כרום פותח את חלון ההתקנה,
// באייפון (שאין בו חלון כזה) מציג הוראות. אם האפליקציה כבר מותקנת, לא מוצג כלום.
export default function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || (!promptEvent && !isIos)) return null;

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      setPromptEvent(null);
    } else {
      setShowIosHelp(true);
    }
  };

  return (
    <>
      <button
        onClick={install}
        className="bg-white px-4 py-2.5 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-700"
      >
        📲 התקן אפליקציה
      </button>

      {showIosHelp && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-4" dir="rtl" onClick={() => setShowIosHelp(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-right" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-lg text-gray-900 mb-3">התקנה באייפון</h3>
            <ol className="list-decimal pr-5 space-y-2 text-gray-700 text-sm">
              <li>פתח את האתר בדפדפן <b>Safari</b>.</li>
              <li>לחץ על כפתור השיתוף (ריבוע עם חץ למעלה) בתחתית המסך.</li>
              <li>בחר <b>״הוסף למסך הבית״</b>.</li>
            </ol>
            <button onClick={() => setShowIosHelp(false)} className="mt-5 w-full py-3 rounded-xl bg-gray-900 text-white font-bold">הבנתי</button>
          </div>
        </div>
      )}
    </>
  );
}
