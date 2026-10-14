'use client';

import AdminLoginCard from '@/components/admin/AdminLoginCard';
import ZonesManager from '@/components/admin/ZonesManager';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function ZonesAdminPage() {
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
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Locations</p>
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Zones &amp; Home Churches</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage headquarter zones, zonal pastors, and home church areas shown on the locations page.
        </p>
      </div>
      <ZonesManager token={token} />
    </div>
  );
}
