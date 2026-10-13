'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import ApplicantAuthPanel from '@/components/careers/ApplicantAuthPanel';
import ApplicantPortalFields, {
  validatePortalAnswerFields,
  validatePortalAnswers,
  type AnswerMap,
  type FileMap,
} from '@/components/careers/ApplicantPortalFields';
import ApplicantProfileForm from '@/components/careers/ApplicantProfileForm';
import {
  applicantAuthHeaders,
  clearApplicantSession,
  emptyApplicantProfile,
  extractApplicantProfile,
  getApplicant,
  getApplicantToken,
  saveApplicantSession,
  serializeApplicantProfile,
  validateApplicantProfile,
  validateApplicantProfileFields,
  type ApplicantProfileFields,
  type ApplicantRecord,
} from '@/lib/hr-applicant';
import type { PortalConfig } from '@/lib/hr-portal';
import type { Vacancy } from '../../vacancies';

export default function ApplyPageClient({ vacancy }: { vacancy: Vacancy }) {
  const router = useRouter();
  const [applicant, setApplicant] = useState<ApplicantRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [files, setFiles] = useState<FileMap>({});
  const [profile, setProfile] = useState<ApplicantProfileFields>(emptyApplicantProfile());
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(vacancy.portalConfig || null);
  const [showErrors, setShowErrors] = useState(false);

  const loadSavedProfile = async (current: ApplicantRecord | null) => {
    const saved = extractApplicantProfile(current);
    setProfile((existing) => ({
      personalSummary: saved.personalSummary || existing.personalSummary,
      currentLocation: saved.currentLocation || existing.currentLocation,
      address: saved.address || existing.address,
      achievements: saved.achievements || existing.achievements,
      skills: saved.skills.length ? saved.skills : existing.skills,
      workExperience: saved.workExperience.length ? saved.workExperience : existing.workExperience,
      education: saved.education.length ? saved.education : existing.education,
      referees: saved.referees.length ? saved.referees : existing.referees,
    }));

    if (!getApplicantToken()) return;
    try {
      const response = await apiFetch('/api/hr/applicant/me', {
        headers: applicantAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      const next = extractApplicantProfile(data);
      setProfile((existing) => ({
        personalSummary: next.personalSummary || existing.personalSummary,
        currentLocation: next.currentLocation || existing.currentLocation,
        address: next.address || existing.address,
        achievements: next.achievements || existing.achievements,
        skills: next.skills.length ? next.skills : existing.skills,
        workExperience: next.workExperience.length ? next.workExperience : existing.workExperience,
        education: next.education.length ? next.education : existing.education,
        referees: next.referees.length ? next.referees : existing.referees,
      }));
      const token = getApplicantToken();
      if (token) {
        saveApplicantSession(token, {
          ...(current || {}),
          ...(data.applicant && typeof data.applicant === 'object' ? data.applicant : data),
          ...next,
        });
      }
    } catch {
      // Keep locally saved profile if the backend profile request fails.
    }
  };

  useEffect(() => {
    const current = getApplicant();
    setApplicant(current);
    setReady(true);
    if (current) void loadSavedProfile(current);
    void apiFetch(`/api/hr/vacancies/${vacancy.id || vacancy.slug}/portal`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.portalConfig) setPortalConfig(data.portalConfig);
      })
      .catch(() => undefined);
  }, [vacancy.id, vacancy.slug]);

  const apply = async () => {
    const token = getApplicantToken();
    if (!token) {
      adminErrorToast('Please sign in before applying.');
      return;
    }

    setShowErrors(true);
    const profileErrors = validateApplicantProfile(profile);
    if (profileErrors.length) {
      adminErrorToast(profileErrors[0]);
      return;
    }

    const portalValidation = validatePortalAnswers(portalConfig, answers, files);
    if (portalValidation.length) {
      adminErrorToast(portalValidation[0]);
      return;
    }

    setLoading(true);
    try {
      const coverLetter = typeof answers.coverLetter === 'string' ? answers.coverLetter.trim() : '';
      const profilePayload = serializeApplicantProfile(profile);
      const portalAnswers = Object.fromEntries(
        Object.entries(answers).filter(([key, value]) => {
          if (key === 'coverLetter') return false;
          if (Array.isArray(value)) return value.length > 0;
          return String(value ?? '').trim() !== '';
        }),
      );
      const response = await apiFetch(`/api/hr/vacancies/${vacancy.id || vacancy.slug}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...applicantAuthHeaders(),
        },
        body: JSON.stringify({
          coverLetter,
          ...profilePayload,
          ...(Object.keys(portalAnswers).length ? { answers: portalAnswers } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 403) {
        adminErrorToast(data.error || data.message || 'Please verify your email before applying.');
        clearApplicantSession();
        setApplicant(null);
        return;
      }
      if (!response.ok) {
        const firstError = Array.isArray(data.errors) ? data.errors[0]?.error : null;
        adminErrorToast(firstError || data.error || data.message || 'Unable to submit application.');
        return;
      }

      const applicationId = data.application?.id || data.id;
      if (applicationId) {
        for (const [fieldKey, file] of Object.entries(files)) {
          if (!file) continue;
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fieldKey', fieldKey);
          formData.append('label', fieldKey);
          const upload = await apiFetch(`/api/hr/applicant/applications/${applicationId}/documents`, {
            method: 'POST',
            headers: applicantAuthHeaders(),
            body: formData,
          });
          const uploadData = await upload.json().catch(() => ({}));
          if (!upload.ok) {
            adminErrorToast(uploadData.error || uploadData.message || `Unable to upload ${fieldKey}.`);
            return;
          }
        }
      }

      if (token) {
        saveApplicantSession(token, {
          ...(applicant || {}),
          ...profilePayload,
        });
      }
      adminSuccessToast(data.message || 'Application submitted.');
      router.push('/careers/portal');
    } catch {
      adminErrorToast('Unable to submit application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <Navigation />
      <section className="bg-[#0d1f3c] py-16 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={`/careers/${vacancy.slug}`} className="text-sm font-semibold text-white/80 hover:text-white">
            Back to vacancy
          </Link>
          <p className="mt-6 text-secondary font-semibold uppercase tracking-[0.3em]">Applicant Portal</p>
          <h1 className="mt-3 text-4xl font-bold">Apply for {vacancy.title}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{vacancy.summary}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!ready ? null : !applicant ? (
            <ApplicantAuthPanel
              onAuthenticated={(next) => {
                setApplicant(next);
                void loadSavedProfile(next);
              }}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-600">Signed in as {applicant.email || applicant.name}</p>
                  <h2 className="text-2xl font-bold text-primary">Application form</h2>
                </div>
                <div className="flex gap-2">
                  <Link href="/careers/portal" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium">
                    My applications
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearApplicantSession();
                      setApplicant(null);
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              </div>
              <div className="mt-8 space-y-10">
                <ApplicantProfileForm
                  value={profile}
                  onChange={setProfile}
                  errors={showErrors ? validateApplicantProfileFields(profile) : {}}
                />
                <ApplicantPortalFields
                  portalConfig={portalConfig}
                  answers={answers}
                  files={files}
                  errors={showErrors ? validatePortalAnswerFields(portalConfig, answers, files) : {}}
                  onAnswerChange={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))}
                  onFileChange={(key, file) => setFiles((current) => ({ ...current, [key]: file }))}
                />
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <Link href={`/careers/${vacancy.slug}`} className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium">
                  Cancel
                </Link>
                <Button onClick={apply} loading={loading}>Submit Application</Button>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
