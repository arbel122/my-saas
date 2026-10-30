'use client';

import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // חזרה לדף שממנו הגיעו (רק נתיב פנימי באתר, למניעת הפניה לאתר זר)
        const next = new URLSearchParams(window.location.search).get('next');
        router.push(next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // הודעה מעודכנת שדורשת אימות במייל
        alert('הרשמה בוצעה בהצלחה! ✉️ שלחנו לך קישור אימות לאימייל, אנא אמת את כתובת המייל שלך לפני ההתחברות.');
        
        setIsLogin(true);
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'אירעה שגיאה. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden font-sans">
      
      {/* רקע עם צורות מטושטשות סטייל SaaS */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md p-8 m-4 bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 relative z-10">
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-6 transition-transform">
            <span className="text-4xl text-white">✨</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            SiteAI
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {isLogin ? 'ברוכים השבים למערכת' : 'הצטרפו למהפכת האתרים'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">כתובת אימייל</label>
            <input
              type="email"
              required
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">סיסמה</label>
            <input
              type="password"
              required
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isLogin ? 'היכנס לחשבון' : 'צור חשבון חדש'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {isLogin ? 'עדיין אין לך חשבון? ' : 'כבר יש לך חשבון? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors ml-1"
            >
              {isLogin ? 'הרשם עכשיו' : 'התחבר כאן'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}