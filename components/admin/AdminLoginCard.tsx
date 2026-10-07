'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="max-w-sm rounded-lg border border-border/60 bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-foreground">Admin Login</h2>
      {loginError && (
        <p className="mb-2 text-xs text-red-600">{loginError}</p>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="h-8 w-full rounded-md border border-border bg-background px-2.5 pr-9 text-sm text-foreground"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-foreground/60 hover:text-foreground"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <Button type="submit" size="sm" className="w-full">
          Log in
        </Button>
      </form>
    </div>
  );
}
