import { CONTACT_EMAIL, OPERATOR } from '../utils/config';

// "פרטי המפעיל והתקשרות" בתחתית עמודי החוק. מציג רק את מה שמולא ב-config.
export default function OperatorDetails({ heading }: { heading: string }) {
  return (
    <>
      <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">{heading}</h2>
      <p className="text-slate-600 leading-relaxed">
        {OPERATOR.legalName && <>המפעיל: {OPERATOR.legalName}<br /></>}
        {OPERATOR.taxId && <>מספר עוסק: {OPERATOR.taxId}<br /></>}
        {OPERATOR.address && <>כתובת: {OPERATOR.address}<br /></>}
        דוא&quot;ל: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline">{CONTACT_EMAIL}</a>
      </p>
    </>
  );
}
