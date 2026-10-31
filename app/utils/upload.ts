import { getAuthHeader } from './auth-client';

// מקטין תמונה גדולה (עד 1200 פיקסלים, JPEG) כדי לחסוך נפח ולהעלות מהר. אם משהו נכשל, מחזיר את המקור.
async function shrink(file: File): Promise<File> {
  try {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? new File([blob], 'image.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

// מעלה תמונה דרך השרת ומחזיר את הכתובת הציבורית שלה, או null אם נכשל.
// אפשר לקבל גם את הודעת השגיאה דרך uploadSiteAssetWithError.
export async function uploadSiteAssetWithError(file: File): Promise<{ url: string | null; error?: string }> {
  try {
    const auth = await getAuthHeader();
    if (!auth) return { url: null, error: 'יש להתחבר כדי להעלות תמונה.' };

    const form = new FormData();
    form.append('file', await shrink(file));
    const res = await fetch('/api/upload', { method: 'POST', headers: auth, body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { url: null, error: data.error || 'שגיאה בהעלאת התמונה.' };
    return { url: data.url as string };
  } catch {
    return { url: null, error: 'שגיאה בהעלאת התמונה. בדקו את החיבור ונסו שוב.' };
  }
}

export async function uploadSiteAsset(file: File): Promise<string | null> {
  return (await uploadSiteAssetWithError(file)).url;
}
