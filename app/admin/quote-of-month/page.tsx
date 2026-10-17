'use client';

import AdminLoginCard from '@/components/admin/AdminLoginCard';
import QuoteOfMonthManager from '@/components/admin/QuoteOfMonthManager';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function QuoteOfMonthAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
  } = useAdminAuth();

  if (!token) {
    return (
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Quotes</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Schedule monthly quotes for the homepage and archive. Each month can have one quote (UTC calendar).
          </p>
        </div>
      </div>

      <QuoteOfMonthManager token={token} />
    </div>
  );
}
