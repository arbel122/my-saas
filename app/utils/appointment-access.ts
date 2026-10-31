import { NextResponse } from 'next/server';
import { getUserFromRequest } from './auth';

type Owned = { customer_user_id?: string | null };

// תור שנקבע דרך חשבון לקוח שייך לאותו חשבון בלבד: צריך להיות מחובר אליו.
// תורים ישנים (לפני שהוספנו חשבונות לקוחות) נשארים נגישים לפי המזהה האקראי בלבד.
// מחזיר תשובת שגיאה להחזרה מה-API, או null אם מותר להמשיך.
export async function denyIfNotOwner(req: Request, appointment: Owned) {
  if (!appointment.customer_user_id) return null;

  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'יש להתחבר לחשבון שקבע את התור.', needsLogin: true }, { status: 401 });
  }
  if (user.id !== appointment.customer_user_id) {
    return NextResponse.json({ error: 'התור לא נמצא' }, { status: 404 });
  }
  return null;
}
