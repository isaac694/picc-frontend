'use client';

import { apiFetch } from '@/lib/api';
import { useSchoolKeyDates } from '@/hooks/use-school-key-dates';
import Link from 'next/link';
import { Eye, EyeOff, LockKeyhole, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

type Mode = 'register' | 'login';

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string | null;
  classInterest?: string | null;
};

type AuthResponse = {
  token?: string;
  student?: Student;
  error?: string;
};

type Props = {
  selectedMode: Mode;
};

const TOKEN_KEY = 'hope_school_online_token';
const STUDENT_KEY = 'hope_school_online_student';
const DASHBOARD_PATH = '/schools/hope-school/online-classes/dashboard';
const HOPE_SCHOOL_KEY_DATES_FALLBACK = [
  { label: 'Registration Opens', dateText: 'March 15, 2025', sortOrder: 0 },
  { label: 'Registration Deadline', dateText: 'April 30, 2025', sortOrder: 1 },
  { label: 'Cohort 1 Starts', dateText: 'May 4, 2025', sortOrder: 2 },
  { label: 'Cohort 1 Ends', dateText: 'July 27, 2025', sortOrder: 3 },
  { label: 'Cohort 2 Registration', dateText: 'August 17, 2025', sortOrder: 4 },
];

const inputClass =
  'w-full border border-slate-200 bg-white px-4 py-3 text-sm text-[#0d1f3c] outline-none transition-all placeholder:text-slate-300 focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/10';

const parseKeyDate = (value: string) => {
  const cleaned = value
    .replace(/[–—]/g, '-')
    .replace(/\b(\d{1,2})-\d{1,2},/g, '$1,')
    .trim();
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export default function HopeSchoolOnlineClassAuth({ selectedMode }: Props) {
  const router = useRouter();
  const { keyDates, isLoading: isLoadingKeyDates } = useSchoolKeyDates('hope-school');
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    cohort: '',
  });
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const cohortOptions = useMemo(() => {
    const activeKeyDates = keyDates
      .filter((item) => item.isActive !== false)
      .map((item) => ({
        label: item.label,
        dateText: item.dateText,
        sortOrder: item.sortOrder ?? 0,
      }));

    const source = activeKeyDates.length > 0 ? activeKeyDates : HOPE_SCHOOL_KEY_DATES_FALLBACK;
    const today = startOfToday();
    const upcomingByCohort = new Map<
      string,
      { label: string; dateText: string; sortOrder: number; parsedDate: Date }
    >();

    source
      .filter((item) => /cohort/i.test(item.label))
      .forEach((item) => {
        const parsedDate = parseKeyDate(item.dateText);
        if (!parsedDate || parsedDate < today) return;

        const cohortMatch = item.label.match(/cohort\s+\d+/i);
        const cohortKey = cohortMatch?.[0].toLowerCase() || item.label.toLowerCase();
        const existing = upcomingByCohort.get(cohortKey);

        if (!existing || parsedDate < existing.parsedDate) {
          upcomingByCohort.set(cohortKey, {
            label: cohortMatch?.[0] || item.label,
            dateText: item.dateText,
            sortOrder: item.sortOrder,
            parsedDate,
          });
        }
      });

    const cohortDates = Array.from(upcomingByCohort.values())
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return cohortDates.map((item) => ({
      value: `${item.label} - ${item.dateText}`,
      label: item.label,
      dateText: item.dateText,
    }));
  }, [keyDates]);

  const selectedCohort = registerForm.cohort || cohortOptions[0]?.value || '';

  const saveSession = (data: AuthResponse) => {
    if (!data.token || !data.student) return;
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(STUDENT_KEY, JSON.stringify(data.student));
    setStudent(data.student);
  };

  const parseResponse = async (response: Response): Promise<AuthResponse> => {
    return (await response.json().catch(() => ({}))) as AuthResponse;
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (registerForm.password !== registerForm.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiFetch('/api/hope-school/online-classes/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
          email: registerForm.email,
          phone: registerForm.phone,
          password: registerForm.password,
          classInterest: selectedCohort,
        }),
      });
      const data = await parseResponse(response);

      if (!response.ok) {
        setStatus({ type: 'error', message: data.error || 'Unable to complete registration.' });
        return;
      }

      saveSession(data);
      setStatus({ type: 'success', message: 'Registration successful. You are now logged in for online classes.' });
      router.push(DASHBOARD_PATH);
      setRegisterForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        cohort: '',
      });
    } catch {
      setStatus({ type: 'error', message: 'Unable to reach the online class service.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    try {
      setIsSubmitting(true);
      const response = await apiFetch('/api/hope-school/online-classes/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await parseResponse(response);

      if (!response.ok) {
        setStatus({ type: 'error', message: data.error || 'Unable to log in.' });
        return;
      }

      saveSession(data);
      setStatus({ type: 'success', message: 'Login successful. Your online class session is active.' });
      router.push(DASHBOARD_PATH);
      setLoginForm({ email: '', password: '' });
    } catch {
      setStatus({ type: 'error', message: 'Unable to reach the online class service.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <aside className="space-y-4">
        <Link
          href="/schools/hope-school/online-classes?mode=register"
          className={`block border p-6 transition-colors ${
            selectedMode === 'register'
              ? 'border-[#c9a84c] bg-white shadow-sm'
              : 'border-slate-200 bg-white/70 hover:bg-white'
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[#c9a84c] text-[#c9a84c]">
              <UserPlus size={18} />
            </span>
            <span>
              <span className="block font-serif text-lg font-bold text-[#0d1f3c]">Register</span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                Request access for Hope School online classes.
              </span>
            </span>
          </div>
        </Link>

        <Link
          href="/schools/hope-school/online-classes?mode=login"
          className={`block border p-6 transition-colors ${
            selectedMode === 'login'
              ? 'border-[#c9a84c] bg-white shadow-sm'
              : 'border-slate-200 bg-white/70 hover:bg-white'
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[#c9a84c] text-[#c9a84c]">
              <LockKeyhole size={18} />
            </span>
            <span>
              <span className="block font-serif text-lg font-bold text-[#0d1f3c]">Login</span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                Continue to your class materials and lessons.
              </span>
            </span>
          </div>
        </Link>
      </aside>

      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="border-b-4 border-[#c9a84c] bg-[#0d1f3c] px-6 py-5 sm:px-8">
          <h2 className="font-serif text-2xl font-bold text-white">
            {selectedMode === 'login' ? 'Login to Online Classes' : 'Register for Online Classes'}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {selectedMode === 'login'
              ? 'Use your student account to access the online class portal.'
              : 'Create your student account for Hope School online class access.'}
          </p>
        </div>

        {status && (
          <div
            className={`mx-6 mt-6 border px-4 py-3 text-sm sm:mx-8 ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {status.message}
            {student && status.type === 'success' && (
              <span className="block pt-1 font-medium">Welcome, {student.name || student.email}.</span>
            )}
          </div>
        )}

        {selectedMode === 'login' ? (
          <form className="space-y-5 px-6 py-8 sm:px-8" onSubmit={handleLogin}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0d1f3c]">
                Email
              </label>
              <input
                className={inputClass}
                type="email"
                placeholder="student@email.com"
                value={loginForm.email}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0d1f3c]">
                Password
              </label>
              <div className="relative">
                <input
                  className={`${inputClass} pr-12`}
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-500 transition-colors hover:text-[#0d1f3c]"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 bg-[#c9a84c] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#0d1f3c] transition-colors hover:bg-[#e2c27d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <LockKeyhole size={16} />
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form className="grid gap-5 px-6 py-8 sm:grid-cols-2 sm:px-8" onSubmit={handleRegister}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0d1f3c]">
                First Name
              </label>
              <input
                className={inputClass}
                type="text"
                placeholder="First name"
                value={registerForm.firstName}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, firstName: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0d1f3c]">
                Last Name
              </label>
              <input
                className={inputClass}
                type="text"
                placeholder="Last name"
                value={registerForm.lastName}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, lastName: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0d1f3c]">
                Email
              </label>
              <input
                className={inputClass}
                type="email"
                placeholder="student@email.com"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0d1f3c]">
                Phone
              </label>
              <input
                className={inputClass}
                type="tel"
                placeholder="+265 999 000 000"
                value={registerForm.phone}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0d1f3c]">
                Password
              </label>
              <div className="relative">
                <input
                  className={`${inputClass} pr-12`}
                  type={showRegisterPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-500 transition-colors hover:text-[#0d1f3c]"
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                  aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0d1f3c]">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  className={`${inputClass} pr-12`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={registerForm.confirmPassword}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-500 transition-colors hover:text-[#0d1f3c]"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0d1f3c]">
                Applying For Cohort
              </label>
              <select
                className={inputClass}
                value={selectedCohort}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, cohort: event.target.value }))}
                required
              >
                {cohortOptions.length === 0 && (
                  <option value="">No cohort dates available</option>
                )}
                {cohortOptions.map((cohort) => (
                  <option key={cohort.value} value={cohort.value}>
                    {cohort.label} - {cohort.dateText}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {isLoadingKeyDates
                  ? 'Loading the latest Hope School cohort dates...'
                  : 'Cohort options are pulled from the Hope School key dates.'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 bg-[#c9a84c] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#0d1f3c] transition-colors hover:bg-[#e2c27d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <UserPlus size={16} />
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
