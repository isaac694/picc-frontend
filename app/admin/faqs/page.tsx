'use client';

import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import FAQManager from '@/components/admin/FAQManager';

export default function FAQsAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
            Admin
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">
            FAQ Management
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Manage the Frequently Asked Questions displayed in the website footer.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      <FAQManager token={token} />
    </div>
  );
}
