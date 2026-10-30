import { supabase } from './supabase';

export async function uploadSiteAsset(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `stories/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('site-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error('שגיאה בהעלאת התמונה:', err);
    return null;
  }
}