'use client';

import AdminLoginCard from '@/components/admin/AdminLoginCard';
import AdminLiveChatWorkspace from '@/components/admin/AdminLiveChatWorkspace';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function LiveChatAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
  } = useAdminAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Live chat</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Moderate stream conversations, review archives by video, and remove messages when needed.
          </p>
        </div>
      </div>

      {!token ? (
        <AdminLoginCard
          email={email}
          password={password}
          loginError={loginError}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleLogin}
        />
      ) : (
        <AdminLiveChatWorkspace token={token} />
      )}
    </div>
  );
}
