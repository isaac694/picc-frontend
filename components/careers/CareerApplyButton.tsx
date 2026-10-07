'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';

const APPLICANT_TOKEN_KEY = 'hr_applicant_token';
const APPLICANT_KEY = 'hr_applicant';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: number;
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            }
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

type CareerApplyButtonProps = {
  vacancyIdOrSlug: string;
  title: string;
  className?: string;
};

export default function CareerApplyButton({ vacancyIdOrSlug, title, className }: CareerApplyButtonProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [availability, setAvailability] = useState('Immediately');
  const [salaryExpectation, setSalaryExpectation] = useState('Negotiable');
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [applicantToken, setApplicantToken] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setApplicantToken(localStorage.getItem(APPLICANT_TOKEN_KEY));
  }, [open]);

  const loginApplicant = useCallback(async (idToken: string) => {
    if (!phone.trim()) {
      adminErrorToast('Phone number is required before Google sign in.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/api/hr/applicants/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, phone: phone.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to sign in.');
        return;
      }
      localStorage.setItem(APPLICANT_TOKEN_KEY, data.token);
      localStorage.setItem(APPLICANT_KEY, JSON.stringify(data.applicant || null));
      setApplicantToken(data.token);
      adminSuccessToast('Signed in successfully.');
    } catch {
      adminErrorToast('Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    if (!open || applicantToken || !GOOGLE_CLIENT_ID) return;

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }

    const script = existingScript || document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    script.onerror = () => adminErrorToast('Unable to load Google sign in.');

    if (!existingScript) document.head.appendChild(script);
  }, [applicantToken, open]);

  useEffect(() => {
    if (!open || applicantToken || !googleReady || !GOOGLE_CLIENT_ID || !googleButtonRef.current || !window.google?.accounts?.id) return;

    googleButtonRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (!response.credential) {
          adminErrorToast('Google did not return a sign in token.');
          return;
        }
        void loginApplicant(response.credential);
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      width: googleButtonRef.current.offsetWidth || 320,
      text: 'continue_with',
    });

    return () => {
      window.google?.accounts?.id.cancel();
    };
  }, [applicantToken, googleReady, loginApplicant, open]);

  const apply = async () => {
    const token = localStorage.getItem(APPLICANT_TOKEN_KEY);
    if (!token) {
      adminErrorToast('Please sign in before applying.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`/api/hr/vacancies/${vacancyIdOrSlug}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coverLetter,
          answers: {
            availability,
            salaryExpectation,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to submit application.');
        return;
      }
      adminSuccessToast(data.message || 'Application submitted.');
      setOpen(false);
    } catch {
      adminErrorToast('Unable to submit application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Apply
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {title}</DialogTitle>
            <DialogDescription>
              Sign in as an applicant, then submit your application.
            </DialogDescription>
          </DialogHeader>

          {!applicantToken ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+265999999999" />
              </div>
              {GOOGLE_CLIENT_ID ? (
                <div className="space-y-2">
                  <Label>Google Sign In</Label>
                  <div ref={googleButtonRef} className="min-h-11 w-full" />
                  {loading ? <p className="text-sm text-muted-foreground">Signing you in...</p> : null}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Add <span className="font-semibold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</span> to enable Google sign in.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cover Letter</Label>
                <Textarea rows={5} value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Input value={availability} onChange={(event) => setAvailability(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Salary Expectation</Label>
                  <Input value={salaryExpectation} onChange={(event) => setSalaryExpectation(event.target.value)} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            {applicantToken ? <Button onClick={apply} loading={loading}>Submit Application</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
