"use client";
import { useState } from 'react';
// הייבוא התקין של Supabase נמצא כאן למעלה
import { supabase } from '../utils/supabase'; 

export default function Editor() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // 1. קבלת פרטי המשתמש שמחובר כרגע למערכת (זה מה שנמחק בטעות)
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("חובה להתחבר כדי לשמור אתרים!");
        return;
      }

      // 2. הנתונים של האתר שאתה רוצה לשמור 
      const siteData = {
        html: "<h1>שלום עולם</h1>", 
        css: "body { background: #fff; }"
      };

      // 3. הכנסת הנתונים לטבלת sites ב-Supabase
      const { data, error } = await supabase
        .from('sites')
        .insert([
          {
            name: "האתר החדש שלי",
            content: siteData,
            user_id: user.id
          }
        ]);

      if (error) throw error;
      
      alert("האתר נשמר בהצלחה בענן! 🚀");

    } catch (error) {
      console.error("שגיאה בשמירת האתר:", error);
      alert("קרתה שגיאה. בדוק את הקונסול לפרטים נוספים.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4">
      {/* כאן נמצא שאר הממשק של בונה האתרים שלך */}
      
      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
      >
        {isSaving ? "שומר בענן..." : "שמור אתר"}
      </button>
    </div>
  );
}