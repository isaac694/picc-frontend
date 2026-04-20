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
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-foreground"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-foreground/60 hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>
    </div>
  );
}
