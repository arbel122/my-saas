// התורים שהלקוח קבע מהמכשיר הזה, כדי שיוכל לחזור לבטל (לפני התור) או לכתוב ביקורת (אחריו).
// נשמר בדפדפן בלבד. המזהה האקראי של התור הוא ההרשאה, ולכן אין צורך בהתחברות.
export type SavedAppointment = {
  token: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
};

const key = (siteId: string) => `myAppointments:${siteId}`;

export function getSavedAppointments(siteId: string): SavedAppointment[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key(siteId)) || '[]');
    return Array.isArray(parsed) ? parsed.filter((a) => a && typeof a.token === 'string') : [];
  } catch {
    return [];
  }
}

function write(siteId: string, list: SavedAppointment[]) {
  try {
    localStorage.setItem(key(siteId), JSON.stringify(list.slice(-20)));
  } catch {
    // אחסון חסום (גלישה פרטית): הלקוח עדיין יכול להשתמש בקישור האישי
  }
}

export function rememberAppointment(siteId: string, appointment: SavedAppointment) {
  const list = getSavedAppointments(siteId).filter((a) => a.token !== appointment.token);
  write(siteId, [...list, appointment]);
}

export function forgetAppointment(siteId: string, token: string) {
  write(siteId, getSavedAppointments(siteId).filter((a) => a.token !== token));
}
