// מספר הוואטסאפ של התמיכה של Opnyx (בפורמט בינלאומי, בלי + ובלי 0 בתחילה).
// זה המקום היחיד שבו צריך להחליף אותו.
export const SUPPORT_WHATSAPP = '972509388865';

export function supportWhatsappUrl(message: string) {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
