'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function AdminLoginPage() {
  const router = useRouter();

  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
  } = useAdminAuth();

  useEffect(() => {
    if (token) {
      router.replace('/admin');
    }
  }, [token, router]);

  if (token) return null;

  return (
    <div className="max-w-md">
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    </div>
  );
}