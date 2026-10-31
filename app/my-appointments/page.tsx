import Link from 'next/link';
import MyAppointmentsList from '@/app/components/MyAppointmentsList';
import Logo from '@/app/components/Logo';

export const metadata = { title: 'התורים שלי | Opnyx' };

// המקום הקבוע של הלקוח: כל התורים שקבע, בכל האתרים, מהחשבון שלו.
export default function MyAppointmentsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Opnyx"><Logo size={28} tone="light" /></Link>
          <Link href="/dashboard" className="text-sm font-bold text-gray-600 hover:text-gray-900 px-2 py-2">לדשבורד</Link>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">התורים שלי 📅</h1>
          <p className="text-gray-500 mt-1">כל התורים שקבעת, בכל מכשיר. אפשר לבטל לפני התור, ולכתוב ביקורת אחריו.</p>
        </div>
        <MyAppointmentsList />
      </main>
    </div>
  );
}
