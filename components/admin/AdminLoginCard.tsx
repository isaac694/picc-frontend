'use client';

import { Button } from '@/components/ui/button';

type AdminLoginCardProps = {
  email: string;
  password: string;
  loginError?: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function AdminLoginCard({
  email,
  password,
  loginError,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AdminLoginCardProps) {
  return (
    <div className="max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground mb-4">Admin Login</h2>
      {loginError && (
        <p className="text-sm text-red-600 mb-3">{loginError}</p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>
    </div>
  );
}
