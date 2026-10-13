'use client';

import AdsManager from '@/components/admin/AdsManager';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function AdsManagementAdminPage() {
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
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Ads Management</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Create and manage promotional ads for the website.
        </p>
      </div>
      <AdsManager token={token} />
    </div>
  );
}
