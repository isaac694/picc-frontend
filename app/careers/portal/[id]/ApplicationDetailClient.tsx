'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { adminErrorToast } from '@/components/admin/admin-toast';
import ApplicantAuthPanel from '@/components/careers/ApplicantAuthPanel';
import VacancyPortalView from '@/components/careers/VacancyPortalView';
import {
  applicantAuthHeaders,
  getApplicant,
  getApplicantToken,
  type ApplicantRecord,
} from '@/lib/hr-applicant';
import { normalizePortalConfig, type PortalConfig } from '@/lib/hr-portal';

type ApplicationDetail = {
  id: string;
  status?: string;
  createdAt?: string;
  answers?: Record<string, unknown>;
  reviewNotes?: string;
  vacancyId?: string;
  vacancy?: {
    id?: string;
    title?: string;
    department?: string;
    location?: string;
    slug?: string;
    employmentType?: string;
    summary?: string;
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
    portalConfig?: PortalConfig | null;
  };
  documents?: Array<{
    id: string;
    label?: string;
    fieldKey?: string;
  }>;
  completion?: {
    answersComplete?: boolean;
    attachmentsComplete?: boolean;
    missingFields?: Array<{ field?: string; label?: string; error?: string }>;
  };
};

type VacancyDetail = {
  id?: string;
  title?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  summary?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  portalConfig?: PortalConfig | null;
};

export default function ApplicationDetailClient({ id, vacancyId }: { id: string; vacancyId?: string }) {
  const [applicant, setApplicant] = useState<ApplicantRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null);

  const loadVacancy = async (vacancyId: string) => {
    const headers: HeadersInit = applicantAuthHeaders();
    const [adminResponse, publicResponse, portalResponse] = await Promise.all([
      apiFetch(`/api/admin/hr/vacancies/${vacancyId}`, { headers }),
      apiFetch(`/api/hr/vacancies/${vacancyId}`, { headers }),
      apiFetch(`/api/hr/vacancies/${vacancyId}/portal`, { headers }),
    ]);
    const adminData = await adminResponse.json().catch(() => ({}));
    const publicData = await publicResponse.json().catch(() => ({}));
    const portalData = await portalResponse.json().catch(() => ({}));
    const adminVacancy = adminResponse.ok ? (adminData.vacancy || adminData) : {};
    const publicVacancy = publicResponse.ok ? (publicData.vacancy || publicData) : {};
    const portalVacancy = portalResponse.ok ? (portalData.vacancy || {}) : {};
    const portalConfig = portalResponse.ok
      ? portalData.portalConfig || portalVacancy.portalConfig
      : adminVacancy.portalConfig || publicVacancy.portalConfig;

    if (adminResponse.ok || publicResponse.ok || portalResponse.ok) {
      setVacancy({
        ...publicVacancy,
        ...adminVacancy,
        ...portalVacancy,
        description: portalVacancy.description || adminVacancy.description || publicVacancy.description,
        requirements: portalVacancy.requirements || adminVacancy.requirements || publicVacancy.requirements,
        responsibilities: portalVacancy.responsibilities || adminVacancy.responsibilities || publicVacancy.responsibilities,
        portalConfig,
      });
    }
  };
  ///kkkkk

  const loadDetail = async () => {
    if (!getApplicantToken()) return;
    try {
      const response = await apiFetch(`/api/hr/applicant/applications/${id}`, {
        headers: applicantAuthHeaders() as HeadersInit,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to load application.');
        return;
        ///skwwkw
      }
      const nextApplication = (data.application || data) as ApplicationDetail;
      setApplication(nextApplication);
      const nextVacancyId = vacancyId || nextApplication.vacancy?.id || nextApplication.vacancyId || nextApplication.vacancy?.slug;
      if (nextVacancyId) await loadVacancy(nextVacancyId);
    } catch {
      adminErrorToast('Unable to load application.');
    }
  };

  useEffect(() => {
    const current = getApplicant();
    setApplicant(current);
    setReady(true);
    if (current && getApplicantToken()) void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, vacancyId]);

  return (
    <main className="min-h-screen bg-stone-50">
      <Navigation />
      <section className="bg-[#0d1f3c] py-16 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/careers/portal" className="text-sm font-semibold text-white/80 hover:text-white">
            Back to my applications
          </Link>
          <p className="mt-6 text-secondary font-semibold uppercase tracking-[0.3em]">Application Status</p>
          <h1 className="mt-3 text-4xl font-bold">{vacancy?.title || application?.vacancy?.title || 'Application'}</h1>
          <p className="mt-4 text-white/80">{vacancy?.summary || application?.vacancy?.summary || ''}</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!ready ? null : !applicant ? (
            <ApplicantAuthPanel
              onAuthenticated={(next) => {
                setApplicant(next);
                void loadDetail();
              }}
            />
          ) : application ? (
            <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{(application.status || 'SUBMITTED').replaceAll('_', ' ')}</Badge>
                <p className="text-sm text-slate-600">
                  Submitted {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department</p>
                  <p className="mt-1 text-sm">{vacancy?.department || application.vacancy?.department || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
                  <p className="mt-1 text-sm">{vacancy?.location || application.vacancy?.location || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employment type</p>
                  <p className="mt-1 text-sm">{vacancy?.employmentType || '-'}</p>
                </div>
              </div>
              {vacancy?.portalConfig || vacancy?.description || (vacancy?.requirements || []).length ? (
                <div>
                  <h2 className="font-semibold text-primary">Vacancy details</h2>
                  <div className="mt-4">
                    {normalizePortalConfig(vacancy?.portalConfig) ? (
                      <VacancyPortalView
                        portalConfig={normalizePortalConfig(vacancy?.portalConfig)}
                        description={vacancy?.description}
                        requirements={vacancy?.requirements}
                        responsibilities={vacancy?.responsibilities}
                      />
                    ) : (
                      <div className="space-y-4 text-slate-600">
                        {vacancy?.description ? <div dangerouslySetInnerHTML={{ __html: vacancy.description }} /> : null}
                        {(vacancy?.requirements || []).length ? (
                          <ul className="list-disc pl-5">
                            {(vacancy?.requirements || []).map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
              {application.reviewNotes ? (
                <div>
                  <h2 className="font-semibold text-primary">Review notes</h2>
                  <p className="mt-2 text-slate-600">{application.reviewNotes}</p>
                </div>
              ) : null}
              {application.completion?.missingFields?.length ? (
                <div>
                  <h2 className="font-semibold text-primary">Still needed</h2>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                    {application.completion.missingFields.map((item) => (
                      <li key={item.field || item.label}>{item.error || item.label}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {(application.documents || []).length ? (
                <div>
                  <h2 className="font-semibold text-primary">Uploaded documents</h2>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {(application.documents || []).map((document) => (
                      <li key={document.id}>{document.label || document.fieldKey}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link
                href="/careers"
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium"
              >
                Browse more vacancies
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading application...</p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
