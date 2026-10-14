'use client';

import { use } from 'react';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import ZoneAreasManager from '@/components/admin/ZoneAreasManager';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function ZoneAreasAdminPage({ params }: { params: Promise<{ zoneId: string }> }) {
  const { zoneId } = use(params);
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
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Manage home churches</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Add, edit, or remove home church areas for this zone.
        </p>
      </div>
      <ZoneAreasManager token={token} zoneId={zoneId} />
    </div>
  );
}
