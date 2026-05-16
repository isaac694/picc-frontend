'use client';

import { apiFetch } from '@/lib/api';
import { BookOpenCheck, LogOut, MonitorPlay } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string | null;
  classInterest?: string | null;
};

type MeResponse = {
  student?: Student;
  error?: string;
};

const TOKEN_KEY = 'hope_school_online_token';
const STUDENT_KEY = 'hope_school_online_student';
const LOGIN_PATH = '/schools/hope-school/online-classes?mode=login';

export default function HopeSchoolOnlineClassDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      router.replace(LOGIN_PATH);
      return;
    }

    let isMounted = true;

    const loadStudent = async () => {
      try {
        const response = await apiFetch('/api/hope-school/online-classes/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = (await response.json().catch(() => ({}))) as MeResponse;

        if (!response.ok || !data.student) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(STUDENT_KEY);
          router.replace(LOGIN_PATH);
          return;
        }

        localStorage.setItem(STUDENT_KEY, JSON.stringify(data.student));
        if (isMounted) setStudent(data.student);
      } catch {
        if (isMounted) setError('Unable to load your online class account.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadStudent();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STUDENT_KEY);
    router.replace(LOGIN_PATH);
  };

  if (isLoading) {
    return (
      <div className="border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
        Loading your online class dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-8 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.55fr]">
      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="border-b-4 border-[#c9a84c] bg-[#0d1f3c] px-6 py-6 sm:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a84c]">
            <MonitorPlay size={14} />
            Student Dashboard
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold text-white">
            Welcome, {student.name || student.firstName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Your Hope School online class account is active.
          </p>
        </div>

        <div className="grid gap-4 px-6 py-8 sm:grid-cols-2 sm:px-8">
          <div className="border border-slate-100 bg-stone-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9a84c]">
              Email
            </p>
            <p className="mt-2 text-sm text-[#0d1f3c]">{student.email}</p>
          </div>
          <div className="border border-slate-100 bg-stone-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9a84c]">
              Cohort
            </p>
            <p className="mt-2 text-sm text-[#0d1f3c]">
              {student.classInterest || 'Not selected yet'}
            </p>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="border border-dashed border-[#c9a84c]/60 bg-[#fffaf0] p-6">
          <BookOpenCheck className="text-[#c9a84c]" size={22} />
          <h2 className="mt-4 font-serif text-xl font-bold text-[#0d1f3c]">
            Class Area
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Lessons, class links, and materials can be added here next.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex w-full items-center justify-center gap-2 border border-[#0d1f3c]/20 bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#0d1f3c] transition-colors hover:bg-slate-50"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>
    </div>
  );
}
