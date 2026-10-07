'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { adminErrorToast } from '@/components/admin/admin-toast';
import ApplicantAuthPanel from '@/components/careers/ApplicantAuthPanel';
import {
  applicantAuthHeaders,
  clearApplicantSession,
  getApplicant,
  getApplicantToken,
  type ApplicantRecord,
} from '@/lib/hr-applicant';

type ApplicantApplication = {
  id: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  vacancy?: {
    id?: string;
    slug?: string;
    title?: string;
    department?: string;
    location?: string;
  };
  completion?: {
    answersComplete?: boolean;
    attachmentsComplete?: boolean;
  };
};

const statusLabel = (status?: string) => (status || 'SUBMITTED').replaceAll('_', ' ');

export default function ApplicantPortalClient() {
  const [applicant, setApplicant] = useState<ApplicantRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<ApplicantApplication[]>([]);

  const loadApplications = async () => {
    const token = getApplicantToken();
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/hr/applicant/applications', {
        headers: applicantAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to load applications.');
        return;
      }
      const list = Array.isArray(data) ? data : data.applications || [];
      setApplications(list);
    } catch {
      adminErrorToast('Unable to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const current = getApplicant();
    setApplicant(current);
    setReady(true);
    if (current && getApplicantToken()) void loadApplications();
  }, []);

  return (
    <main className="min-h-screen bg-stone-50">
      <Navigation />
      <section className="bg-[#0d1f3c] py-16 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/careers" className="text-sm font-semibold text-white/80 hover:text-white">
            Back to careers
          </Link>
          <p className="mt-6 text-secondary font-semibold uppercase tracking-[0.3em]">Applicant Portal</p>
          <h1 className="mt-3 text-4xl font-bold">My Applications</h1>
          <p className="mt-4 max-w-2xl text-white/80">Track the status of every vacancy you have applied for.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {!ready ? null : !applicant ? (
            <ApplicantAuthPanel
              onAuthenticated={(next) => {
                setApplicant(next);
                void loadApplications();
              }}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">Signed in as {applicant.email || applicant.name}</p>
                <div className="flex gap-2">
                  <Link href="/careers" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium">
                    Browse vacancies
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearApplicantSession();
                      setApplicant(null);
                      setApplications([]);
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Vacancy</th>
                        <th className="px-5 py-3 font-semibold">Department</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Submitted</th>
                        <th className="px-5 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.map((application) => (
                        <tr key={application.id}>
                          <td className="px-5 py-4 font-semibold text-primary">{application.vacancy?.title || 'Vacancy'}</td>
                          <td className="px-5 py-4">{application.vacancy?.department || '-'}</td>
                          <td className="px-5 py-4">
                            <Badge variant="outline">{statusLabel(application.status)}</Badge>
                          </td>
                          <td className="px-5 py-4">{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : '-'}</td>
                          <td className="px-5 py-4">
                            <Link
                              href={`/careers/portal/${application.id}${application.vacancy?.id ? `?vacancyId=${application.vacancy.id}` : ''}`}
                              className="text-sm font-semibold text-primary hover:underline"
                            >
                              View details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading applications...</p> : null}
                {!loading && applications.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">You have not submitted any applications yet.</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
