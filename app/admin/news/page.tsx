'use client';

import { useState } from 'react';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import NewsManager from '@/components/admin/NewsManager';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { ADMIN_PAGE, MINISTRY_ADMIN_OPTIONS, canAccessAdminPage, canAccessMinistry } from '@/lib/admin-pages';
import { cn } from '@/lib/utils';

export default function AdminNewsPage() {
  const { token, user, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();
  const [chosenScope, setScope] = useState<string | null>(null);

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

  const canChurchNews = canAccessAdminPage(user, ADMIN_PAGE.NEWS) || canAccessAdminPage(user, ADMIN_PAGE.MEDIA_PAGE);
  const ministryScopes = MINISTRY_ADMIN_OPTIONS.filter((ministry) => canAccessMinistry(user, ministry.key));
  const scopes = [...(canChurchNews ? [{ key: 'church', label: 'Church news' }] : []), ...ministryScopes];
  const scope = chosenScope && scopes.some((entry) => entry.key === chosenScope) ? chosenScope : scopes[0]?.key;

  if (!scope) {
    return <p className="text-sm text-foreground/70">You do not have access to any news section.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">News</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Church news appears on the Media page and at /news. Each ministry has its own news section.
        </p>
      </div>
      {scopes.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {scopes.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setScope(entry.key)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-semibold',
                scope === entry.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:bg-muted',
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
      ) : null}
      <NewsManager key={scope} token={token} scope={scope} />
    </div>
  );
}
