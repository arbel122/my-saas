// כלל הסיסמה באתר: לפחות 6 תווים, אות אחת באנגלית וספרה אחת.
// הבדיקה כאן היא להודעה ברורה למשתמש. את האכיפה האמיתית כדאי להגדיר גם ב-Supabase (Authentication, Password requirements).
export const PASSWORD_RULE_TEXT = 'לפחות 6 תווים, כולל אות אחת באנגלית וספרה אחת.';

export function passwordProblem(password: string): string {
  if (password.length < 6) return 'הסיסמה חייבת להכיל לפחות 6 תווים.';
  if (!/[A-Za-z]/.test(password)) return 'הסיסמה חייבת לכלול לפחות אות אחת באנגלית.';
  if (!/\d/.test(password)) return 'הסיסמה חייבת לכלול לפחות ספרה אחת.';
  return '';
}
