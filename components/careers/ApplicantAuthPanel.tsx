'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import {
  saveApplicantSession,
  type ApplicantRecord,
} from '@/lib/hr-applicant';
import FieldError, { examplePlaceholder } from '@/components/form/FieldError';

type AuthView = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';

type ApplicantAuthPanelProps = {
  onAuthenticated: (applicant: ApplicantRecord | null) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{7,19}$/;

const extractMessage = (data: Record<string, unknown>, fallback: string) =>
  String(data.error || data.message || fallback);

function validateAuthFields(view: AuthView, fields: {
  email: string;
  password: string;
  name: string;
  phone: string;
  otp: string;
  newPassword: string;
}) {
  const errors: Record<string, string> = {};
  if (!fields.email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = 'Enter a valid email address.';

  if (view === 'login' || view === 'signup') {
    if (!fields.password) errors.password = 'Password is required.';
    else if (fields.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  }

  if (view === 'signup') {
    if (fields.name.trim() && fields.name.trim().length < 2) errors.name = 'Enter at least 2 characters.';
    if (fields.phone.trim() && !PHONE_PATTERN.test(fields.phone.trim())) errors.phone = 'Enter a valid phone number.';
  }

  if (view === 'verify' || view === 'reset') {
    if (!fields.otp.trim()) errors.otp = 'OTP is required.';
    else if (!/^\d{6}$/.test(fields.otp.trim())) errors.otp = 'Enter the 6-digit OTP.';
  }

  if (view === 'reset') {
    if (!fields.newPassword) errors.newPassword = 'New password is required.';
    else if (fields.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters.';
  }

  return errors;
}

export default function ApplicantAuthPanel({ onAuthenticated }: ApplicantAuthPanelProps) {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const fieldValues = { email, password, name, phone, otp, newPassword };
  const errors = showErrors ? validateAuthFields(view, fieldValues) : {};

  const switchView = (next: AuthView) => {
    setView(next);
    setShowErrors(false);
  };

  const apiJson = async (path: string, body: Record<string, unknown>) => {
    const response = await apiFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return { response, data: data as Record<string, unknown> };
  };

  const completeAuth = (token: string, applicant: ApplicantRecord | null, message: string) => {
    saveApplicantSession(token, applicant);
    onAuthenticated(applicant);
    adminSuccessToast(message);
  };

  const ensureValid = () => {
    setShowErrors(true);
    const nextErrors = validateAuthFields(view, fieldValues);
    const first = Object.values(nextErrors)[0];
    if (first) {
      adminErrorToast(first);
      return false;
    }
    return true;
  };

  const signup = async () => {
    if (!ensureValid()) return;
    setLoading(true);
    try {
      const { response, data } = await apiJson('/api/hr/applicants/signup', {
        email: email.trim(),
        password,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      if (!response.ok) {
        adminErrorToast(extractMessage(data, 'Unable to sign up.'));
        return;
      }
      setDevOtp(typeof data.devOtp === 'string' ? data.devOtp : '');
      switchView('verify');
      adminSuccessToast(extractMessage(data, 'Check your email for the OTP.'));
    } catch {
      adminErrorToast('Unable to sign up.');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (!ensureValid()) return;
    setLoading(true);
    try {
      const { response, data } = await apiJson('/api/hr/applicants/login', {
        email: email.trim(),
        password,
      });
      if (response.status === 403) {
        switchView('verify');
        adminErrorToast(extractMessage(data, 'Please verify your email. A new OTP has been sent.'));
        return;
      }
      if (!response.ok || typeof data.token !== 'string') {
        adminErrorToast(extractMessage(data, 'Unable to sign in.'));
        return;
      }
      completeAuth(data.token, (data.applicant || null) as ApplicantRecord | null, 'Signed in successfully.');
    } catch {
      adminErrorToast('Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!ensureValid()) return;
    setLoading(true);
    try {
      const { response, data } = await apiJson('/api/hr/applicants/verify-email', {
        email: email.trim(),
        otp: otp.trim(),
      });
      if (!response.ok || typeof data.token !== 'string') {
        adminErrorToast(extractMessage(data, 'Unable to verify email.'));
        return;
      }
      completeAuth(data.token, (data.applicant || null) as ApplicantRecord | null, 'Email verified.');
    } catch {
      adminErrorToast('Unable to verify email.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setShowErrors(true);
    const nextErrors = validateAuthFields('forgot', fieldValues);
    if (nextErrors.email) {
      adminErrorToast(nextErrors.email);
      return;
    }
    setLoading(true);
    try {
      const { response, data } = await apiJson('/api/hr/applicants/resend-otp', { email: email.trim() });
      if (!response.ok) {
        adminErrorToast(extractMessage(data, 'Unable to resend OTP.'));
        return;
      }
      setDevOtp(typeof data.devOtp === 'string' ? data.devOtp : '');
      adminSuccessToast(extractMessage(data, 'OTP sent.'));
    } catch {
      adminErrorToast('Unable to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    if (!ensureValid()) return;
    setLoading(true);
    try {
      const { response, data } = await apiJson('/api/hr/applicants/forgot-password', { email: email.trim() });
      if (!response.ok) {
        adminErrorToast(extractMessage(data, 'Unable to send reset OTP.'));
        return;
      }
      setDevOtp(typeof data.devOtp === 'string' ? data.devOtp : '');
      switchView('reset');
      adminSuccessToast(extractMessage(data, 'If that email exists, a reset OTP has been sent.'));
    } catch {
      adminErrorToast('Unable to send reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!ensureValid()) return;
    setLoading(true);
    try {
      const { response, data } = await apiJson('/api/hr/applicants/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        password: newPassword,
      });
      if (!response.ok || typeof data.token !== 'string') {
        adminErrorToast(extractMessage(data, 'Unable to reset password.'));
        return;
      }
      completeAuth(data.token, (data.applicant || null) as ApplicantRecord | null, 'Password reset.');
    } catch {
      adminErrorToast('Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<AuthView, string> = {
    login: 'Applicant login',
    signup: 'Create applicant account',
    verify: 'Verify your email',
    forgot: 'Forgot password',
    reset: 'Reset password',
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-primary">{titles[view]}</h2>
      <p className="mt-2 text-sm text-slate-600">Use your email and password. A 6-digit OTP is sent to verify your email.</p>

      <div className="mt-6 space-y-4">
        {view === 'login' ? (
          <>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={examplePlaceholder('applicant@example.com')}
              />
              <FieldError message={errors.email} />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={password}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={examplePlaceholder('At least 8 characters')}
              />
              <FieldError message={errors.password} />
            </div>
            <Button onClick={login} loading={loading} className="w-full">Sign In</Button>
            <div className="flex justify-between text-sm">
              <button type="button" className="text-primary hover:underline" onClick={() => switchView('signup')}>Create account</button>
              <button type="button" className="text-muted-foreground hover:underline" onClick={() => switchView('forgot')}>Forgot password</button>
            </div>
          </>
        ) : null}

        {view === 'signup' ? (
          <>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={examplePlaceholder('applicant@example.com')}
              />
              <FieldError message={errors.email} />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={password}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={examplePlaceholder('At least 8 characters')}
              />
              <FieldError message={errors.password} />
            </div>
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={name}
                aria-invalid={Boolean(errors.name)}
                onChange={(event) => setName(event.target.value)}
                placeholder={examplePlaceholder('Jane Banda')}
              />
              <FieldError message={errors.name} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={phone}
                aria-invalid={Boolean(errors.phone)}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={examplePlaceholder('+265 999 000 000')}
              />
              <FieldError message={errors.phone} />
            </div>
            <Button onClick={signup} loading={loading} className="w-full">Create Account</Button>
            <button type="button" className="w-full text-sm text-muted-foreground hover:underline" onClick={() => switchView('login')}>Already have an account? Sign in</button>
          </>
        ) : null}

        {view === 'verify' ? (
          <>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={examplePlaceholder('applicant@example.com')}
              />
              <FieldError message={errors.email} />
            </div>
            <div className="space-y-2">
              <Label>OTP *</Label>
              <Input
                value={otp}
                aria-invalid={Boolean(errors.otp)}
                onChange={(event) => setOtp(event.target.value)}
                placeholder={examplePlaceholder('123456')}
              />
              <FieldError message={errors.otp} />
            </div>
            {devOtp ? <p className="text-xs text-muted-foreground">Local test OTP: {devOtp}</p> : null}
            <Button onClick={verifyEmail} loading={loading} className="w-full">Verify Email</Button>
            <Button variant="outline" onClick={resendOtp} loading={loading} className="w-full">Resend OTP</Button>
            <button type="button" className="w-full text-sm text-muted-foreground hover:underline" onClick={() => switchView('login')}>Back to sign in</button>
          </>
        ) : null}

        {view === 'forgot' ? (
          <>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={examplePlaceholder('applicant@example.com')}
              />
              <FieldError message={errors.email} />
            </div>
            <Button onClick={forgotPassword} loading={loading} className="w-full">Send Reset OTP</Button>
            <button type="button" className="w-full text-sm text-muted-foreground hover:underline" onClick={() => switchView('login')}>Back to sign in</button>
          </>
        ) : null}

        {view === 'reset' ? (
          <>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={examplePlaceholder('applicant@example.com')}
              />
              <FieldError message={errors.email} />
            </div>
            <div className="space-y-2">
              <Label>OTP *</Label>
              <Input
                value={otp}
                aria-invalid={Boolean(errors.otp)}
                onChange={(event) => setOtp(event.target.value)}
                placeholder={examplePlaceholder('123456')}
              />
              <FieldError message={errors.otp} />
            </div>
            <div className="space-y-2">
              <Label>New Password *</Label>
              <Input
                type="password"
                value={newPassword}
                aria-invalid={Boolean(errors.newPassword)}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={examplePlaceholder('At least 8 characters')}
              />
              <FieldError message={errors.newPassword} />
            </div>
            {devOtp ? <p className="text-xs text-muted-foreground">Local test OTP: {devOtp}</p> : null}
            <Button onClick={resetPassword} loading={loading} className="w-full">Reset Password</Button>
            <button type="button" className="w-full text-sm text-muted-foreground hover:underline" onClick={() => switchView('login')}>Back to sign in</button>
          </>
        ) : null}
      </div>
    </div>
  );
}
