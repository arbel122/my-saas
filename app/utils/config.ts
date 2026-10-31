// מספר הוואטסאפ של התמיכה של Opnyx (בפורמט בינלאומי, בלי + ובלי 0 בתחילה).
// זה המקום היחיד שבו צריך להחליף אותו.
export const SUPPORT_WHATSAPP = '972509388865';

export function supportWhatsappUrl(message: string) {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

// מייל הפניות שמופיע בתקנון, במדיניות הפרטיות ובהצהרת הנגישות. המקום היחיד להחלפה.
export const CONTACT_EMAIL = 'siteai6767@gmail.com';

// פרטי המפעיל. כל שדה שמלאים כאן מופיע אוטומטית בתקנון ובמדיניות הפרטיות; שדה ריק לא מוצג.
export const OPERATOR = {
  legalName: 'ארבל משה', // שם משפטי או שם העוסק
  taxId: '', // מספר עוסק (ת.ז. או ח.פ.)
  address: '', // כתובת למשלוח דואר
};
