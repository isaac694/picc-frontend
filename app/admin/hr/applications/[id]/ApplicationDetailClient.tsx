'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Printer,
  Sparkles,
  Trophy,
  UserRound,
} from 'lucide-react';
import { apiFetch, apiUrl } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { normalizePortalConfig, type PortalConfig } from '@/lib/hr-portal';
import {
  educationLevelLabel,
  extractApplicantProfile,
  formatProgramOfStudy,
  isTertiaryEducation,
} from '@/lib/hr-applicant';
import ShortlistInterviewFields from '@/components/admin/ShortlistInterviewFields';
import {
  buildSingleStatusPayload,
  validateShortlistReview,
  toDateInputValue,
  toTimeInputValue,
} from '@/lib/hr-application-review';
import ApplicantDocument from '@/components/admin/ApplicantDocument';
import {
  documentFileName,
  downloadElementAsPdf,
  printElement,
} from '@/lib/hr-applicant-document-pdf';

type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';

type ApplicationDocument = {
  id: string;
  fieldKey?: string;
  label?: string;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
  createdAt?: string;
};

type ApplicantProfile = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  emailVerified?: boolean;
  avatarUrl?: string | null;
  createdAt?: string;
};

type VacancySnapshot = {
  id?: string;
  title?: string;
  slug?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  requiredDocuments?: Array<string | { label?: string; name?: string }>;
  portalConfig?: PortalConfig | null;
};

type ApplicationDetail = {
  id: string;
  applicantId?: string;
  vacancyId?: string;
  status?: ApplicationStatus | string;
  coverLetter?: string | null;
  answers?: Record<string, unknown>;
  personalSummary?: string | null;
  currentLocation?: string | null;
  address?: string | null;
  achievements?: string | null;
  skills?: string[];
  workExperience?: Array<Record<string, unknown>>;
  education?: Array<Record<string, unknown>>;
  referees?: Array<Record<string, unknown>>;
  reviewNotes?: string | null;
  interviewDate?: string | null;
  interviewTime?: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  applicant?: ApplicantProfile;
  vacancy?: VacancySnapshot;
  documents?: ApplicationDocument[];
  completion?: {
    answersComplete?: boolean;
    attachmentsComplete?: boolean;
    missingFields?: Array<string | { field?: string; label?: string; error?: string }>;
  };
};

const STATUSES: ApplicationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'HIRED', 'WITHDRAWN'];

const statusTone: Record<string, string> = {
  SUBMITTED: 'bg-sky-100 text-sky-800 border-sky-200',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  SHORTLISTED: 'bg-violet-100 text-violet-800 border-violet-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
  HIRED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  WITHDRAWN: 'bg-slate-100 text-slate-700 border-slate-200',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toLocal = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const toDate = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const prettyStatus = (status?: string) => (status || 'SUBMITTED').replaceAll('_', ' ');

const initials = (name?: string) => {
  const parts = String(name || 'Applicant').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || 'A') + (parts[1]?.[0] || '')).toUpperCase();
};

const formatBytes = (size?: number) => {
  if (!size || size < 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const humanizeKey = (value?: string) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();

const assetUrl = (value?: string | null) => {
  if (!value) return '';
  return value.startsWith('http') ? value : apiUrl(value);
};

const missingFieldLabel = (value: string | { field?: string; label?: string; error?: string }) => {
  if (typeof value === 'string') return value;
  return value.error || value.label || value.field || 'Missing field';
};

const formatAnswer = (value: unknown) => {
  if (value == null || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ') || 'Not provided';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const extractApplication = (value: unknown, id: string): ApplicationDetail | null => {
  const pick = (item: unknown): ApplicationDetail | null => {
    if (!isRecord(item)) return null;
    const recordId = String(item.id || item._id || '').trim();
    if (recordId && recordId !== id) return null;
    if (!recordId && !item.applicant && !item.vacancy) return null;
    return {
      ...(item as ApplicationDetail),
      id: recordId || id,
      vacancy: item.vacancy && isRecord(item.vacancy)
        ? {
            ...(item.vacancy as VacancySnapshot),
            portalConfig: normalizePortalConfig((item.vacancy as VacancySnapshot).portalConfig),
          }
        : undefined,
    };
  };

  if (Array.isArray(value)) {
    return value.map(pick).find(Boolean) || null;
  }

  if (!isRecord(value)) return null;

  const nested = value.application || value.data;
  if (isRecord(nested) && !Array.isArray(nested)) {
    return pick(nested);
  }

  if (Array.isArray(value.applications)) {
    return value.applications.map(pick).find(Boolean) || null;
  }

  if (Array.isArray(nested)) {
    return nested.map(pick).find(Boolean) || null;
  }

  return pick(value);
};

const mergeProfileText = (primary?: string | null, supplemental?: string | null) => {
  const left = String(primary ?? '').trim();
  const right = String(supplemental ?? '').trim();
  return left || right || undefined;
};

const mergeApplicationDetails = (
  primary: ApplicationDetail,
  supplemental: ApplicationDetail,
): ApplicationDetail => ({
  ...supplemental,
  ...primary,
  personalSummary: mergeProfileText(primary.personalSummary, supplemental.personalSummary),
  currentLocation: mergeProfileText(primary.currentLocation, supplemental.currentLocation),
  address: mergeProfileText(primary.address, supplemental.address),
  achievements: mergeProfileText(primary.achievements, supplemental.achievements),
  skills: primary.skills?.length ? primary.skills : supplemental.skills,
  education: primary.education?.length ? primary.education : supplemental.education,
  workExperience: primary.workExperience?.length ? primary.workExperience : supplemental.workExperience,
  referees: primary.referees?.length ? primary.referees : supplemental.referees,
  coverLetter: primary.coverLetter ?? supplemental.coverLetter,
  answers: primary.answers ?? supplemental.answers,
  documents: primary.documents?.length ? primary.documents : supplemental.documents,
  vacancy: primary.vacancy ?? supplemental.vacancy,
  applicant: primary.applicant ?? supplemental.applicant,
  completion: primary.completion ?? supplemental.completion,
});

const fieldLabelMap = (portalConfig?: PortalConfig | null) => {
  const map = new Map<string, string>();
  for (const section of portalConfig?.sections || []) {
    for (const field of section.fields || []) {
      if (field.key) map.set(field.key, field.label || humanizeKey(field.key));
    }
  }
  return map;
};

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof UserRound;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-5 py-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function ApplicationDetailClient({ id, vacancyId }: { id: string; vacancyId?: string }) {
  const { token } = useAdminAuth();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>('UNDER_REVIEW');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewInterviewDate, setReviewInterviewDate] = useState('');
  const [reviewInterviewTime, setReviewInterviewTime] = useState('');
  const [exportingDocument, setExportingDocument] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const labels = useMemo(
    () => fieldLabelMap(application?.vacancy?.portalConfig),
    [application?.vacancy?.portalConfig],
  );

  const loadApplication = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const requests: Array<Promise<Response>> = [
        apiFetch(`/api/admin/hr/applications/${id}`, { headers }),
      ];
      if (vacancyId) {
        requests.push(apiFetch(`/api/admin/hr/vacancies/${vacancyId}/applications`, { headers }));
      }

      const responses = await Promise.all(requests);
      let next: ApplicationDetail | null = null;

      for (let index = 0; index < responses.length; index += 1) {
        const response = responses[index];
        const data = await response.json().catch(() => ({}));
        if (!response.ok) continue;
        const found = extractApplication(data, id);
        if (!found) continue;
        if (!next) {
          next = found;
          continue;
        }
        const primary = index === 0 ? found : next;
        const supplemental = index === 0 ? next : found;
        next = mergeApplicationDetails(primary, supplemental);
      }

      if (!next && vacancyId) {
        const vacancyResponse = await apiFetch(`/api/admin/hr/vacancies/${vacancyId}`, { headers });
        const vacancyData = await vacancyResponse.json().catch(() => ({}));
        const nested = extractApplication(vacancyData, id);
        if (nested) next = nested;
      }

      const resolvedVacancyId = vacancyId || next?.vacancyId;
      if (next && !next.vacancy && resolvedVacancyId) {
        const vacancyResponse = await apiFetch(`/api/admin/hr/vacancies/${resolvedVacancyId}`, { headers });
        const vacancyData = await vacancyResponse.json().catch(() => ({}));
        const vacancy = vacancyResponse.ok
          ? (isRecord(vacancyData.vacancy) ? vacancyData.vacancy : vacancyData)
          : null;
        if (isRecord(vacancy)) {
          next = {
            ...next,
            vacancy: {
              ...(vacancy as VacancySnapshot),
              portalConfig: normalizePortalConfig((vacancy as VacancySnapshot).portalConfig),
            },
          };
        }
      }

      if (!next) {
        adminErrorToast('Unable to load application details.');
        setApplication(null);
        return;
      }

      setApplication(next);
      setReviewStatus((STATUSES.includes(next.status as ApplicationStatus) ? next.status : 'UNDER_REVIEW') as ApplicationStatus);
      setReviewNotes(next.reviewNotes || '');
      setReviewInterviewDate(toDateInputValue(next.interviewDate));
      setReviewInterviewTime(toTimeInputValue(next.interviewTime) || next.interviewTime || '');
    } catch {
      adminErrorToast('Unable to load application details.');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, vacancyId, token]);

  const saveReview = async () => {
    if (!token || !application) return;
    const validationError = validateShortlistReview(reviewStatus, reviewInterviewDate, reviewInterviewTime);
    if (validationError) {
      adminErrorToast(validationError);
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch(`/api/admin/hr/applications/${application.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildSingleStatusPayload({
          status: reviewStatus,
          reviewNotes,
          interviewDate: reviewInterviewDate,
          interviewTime: reviewInterviewTime,
        })),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to update application.');
        return;
      }
      adminSuccessToast(data.message || 'Application updated.');
      await loadApplication();
    } catch {
      adminErrorToast('Unable to update application.');
    } finally {
      setSaving(false);
    }
  };

  const applicant = application?.applicant;
  const vacancy = application?.vacancy;
  const profile = extractApplicantProfile(application);
  const documents = application?.documents || [];
  const answers = Object.entries(application?.answers || {}).filter(([key]) => key !== 'coverLetter');
  const missingFields = application?.completion?.missingFields || [];

  const documentAnswers = useMemo(
    () => answers.map(([key, value]) => ({
      label: labels.get(key) || humanizeKey(key),
      value: formatAnswer(value),
    })),
    [answers, labels],
  );

  const interviewLabel = application?.interviewDate
    ? `${toDate(application.interviewDate)}${application.interviewTime ? ` at ${application.interviewTime}` : ''}`
    : undefined;

  const documentName = documentFileName(applicant?.name || 'applicant');

  const printDocument = async () => {
    if (!documentRef.current) return;
    setExportingDocument(true);
    try {
      await printElement(documentRef.current, documentName);
    } catch {
      adminErrorToast('Unable to open the print dialog. Please try Download PDF instead.');
    } finally {
      setExportingDocument(false);
    }
  };

  const downloadDocument = async () => {
    if (!documentRef.current) return;
    setExportingDocument(true);
    try {
      await downloadElementAsPdf(documentRef.current, documentName);
      adminSuccessToast('Applicant document downloaded.');
    } catch {
      adminErrorToast('Unable to generate PDF. Try print instead.');
    } finally {
      setExportingDocument(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/hr" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to vacancies
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {application ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={printDocument} loading={exportingDocument}>
                <Printer className="h-4 w-4" />
                Print document
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={downloadDocument} loading={exportingDocument}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Badge className={statusTone[application.status || 'SUBMITTED'] || statusTone.SUBMITTED} variant="outline">
                {prettyStatus(application.status)}
              </Badge>
            </>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
          Loading application details...
        </div>
      ) : null}

      {!loading && !application ? (
        <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">This application could not be found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/hr">Return to vacancies</Link>
          </Button>
        </div>
      ) : null}

      {!loading && application ? (
        <>
          <div className="fixed top-0 -left-[10000px]" aria-hidden>
            <ApplicantDocument
              ref={documentRef}
              applicantName={applicant?.name || 'Applicant'}
              email={applicant?.email}
              phone={applicant?.phone || undefined}
              emailVerified={applicant?.emailVerified}
              vacancyTitle={vacancy?.title}
              department={vacancy?.department}
              location={vacancy?.location}
              employmentType={vacancy?.employmentType}
              statusLabel={prettyStatus(application.status)}
              submittedLabel={toLocal(application.createdAt)}
              generatedLabel={new Date().toLocaleString()}
              interviewLabel={interviewLabel}
              profile={profile}
              additionalAnswers={documentAnswers}
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
                  {initials(applicant?.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Application details</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight">{applicant?.name || 'Applicant'}</h1>
                  {vacancy?.title ? (
                    <p className="mt-1 text-sm text-muted-foreground">Applied for {vacancy.title}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {applicant?.email ? (
                      <a href={`mailto:${applicant.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs hover:bg-muted">
                        <Mail className="h-3.5 w-3.5" />
                        {applicant.email}
                      </a>
                    ) : null}
                    {applicant?.phone ? (
                      <a href={`tel:${applicant.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs hover:bg-muted">
                        <Phone className="h-3.5 w-3.5" />
                        {applicant.phone}
                      </a>
                    ) : null}
                    {applicant?.emailVerified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified email
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                        Email not verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid min-w-[220px] gap-2 text-sm">
                <div className="rounded-xl bg-muted/50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Submitted</p>
                  <p className="font-medium">{toLocal(application.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-muted/50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Last reviewed</p>
                  <p className="font-medium">{toLocal(application.reviewedAt)}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <Panel title="Describe yourself" icon={UserRound}>
                {profile.personalSummary ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/85">{profile.personalSummary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No personal summary was provided.</p>
                )}
              </Panel>

              <Panel title="Location" icon={MapPin}>
                {profile.currentLocation || profile.address ? (
                  <div className="space-y-2 text-sm leading-7 text-foreground/85">
                    {profile.currentLocation ? (
                      <p>
                        <span className="font-medium text-foreground">Current location: </span>
                        {profile.currentLocation}
                      </p>
                    ) : null}
                    {profile.address ? (
                      <p>
                        <span className="font-medium text-foreground">Address: </span>
                        {profile.address}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No location details were provided.</p>
                )}
              </Panel>

              <Panel title="Achievements" icon={Trophy}>
                {profile.achievements ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/85">{profile.achievements}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No achievements were provided.</p>
                )}
              </Panel>

              <Panel title="Skills" icon={Sparkles}>
                {profile.skills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="rounded-full px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills were added.</p>
                )}
              </Panel>

              <Panel title="Work experience" icon={BriefcaseBusiness}>
                {profile.workExperience.length ? (
                  <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
                    {profile.workExperience.map((item, index) => (
                      <div key={item.id || `${item.employer}-${index}`} className="relative pl-7">
                        <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{item.employer || 'Employer not provided'}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {toDate(item.startDate)} — {item.currentlyWorking ? 'Present' : toDate(item.endDate)}
                              </p>
                            </div>
                            {item.currentlyWorking ? (
                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                                Currently working here
                              </Badge>
                            ) : null}
                          </div>
                          {item.jobDescription ? (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{item.jobDescription}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No work experience was added.</p>
                )}
              </Panel>

              <Panel title="Education" icon={GraduationCap}>
                {profile.education.length ? (
                  <div className="grid gap-3">
                    {profile.education.map((item, index) => (
                      <div key={item.id || `${item.schoolName}-${index}`} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <p className="font-semibold">{item.schoolName || 'School not provided'}</p>
                        <p className="mt-1 text-sm text-foreground/80">
                          {item.levelLabel || educationLevelLabel(item.level) || 'Level not provided'}
                        </p>
                        {isTertiaryEducation(item.level) ? (
                          <p className="mt-1 text-sm text-foreground/80">
                            <span className="font-medium text-foreground">Program of study: </span>
                            {formatProgramOfStudy(item.programOfStudy)}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {toDate(item.startDate)} — {toDate(item.endDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No education records were added.</p>
                )}
              </Panel>

              <Panel title="Referees" icon={Phone}>
                {profile.referees.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {profile.referees.map((item, index) => (
                      <div key={item.id || `${item.name}-${index}`} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <p className="font-semibold">{item.name || 'Name not provided'}</p>
                        <p className="mt-1 text-sm text-foreground/80">{item.position || 'Position not provided'}</p>
                        <p className="mt-1 text-sm text-foreground/80">{item.company || 'Company not provided'}</p>
                        {item.contactDetails ? (
                          <p className="mt-2 text-sm text-muted-foreground">{item.contactDetails}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No referees were added.</p>
                )}
              </Panel>

              <Panel title="Cover letter" icon={Mail}>
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/85">
                  {application.coverLetter || 'No cover letter was provided.'}
                </p>
                {answers.length ? (
                  <div className="mt-5 space-y-2 border-t border-border/50 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional answers</p>
                    {answers.map(([key, value]) => (
                      <div key={key} className="rounded-xl bg-muted/40 px-3 py-2">
                        <p className="text-xs text-muted-foreground">{labels.get(key) || humanizeKey(key)}</p>
                        <p className="mt-1 text-sm font-medium">{formatAnswer(value)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Panel>

              <Panel title="Uploaded documents" icon={FileText}>
                {documents.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {documents.map((document) => {
                      const href = assetUrl(document.fileUrl);
                      const title = labels.get(document.fieldKey || '') || humanizeKey(document.label || document.fieldKey) || 'Document';
                      return (
                        <div key={document.id} className="flex flex-col justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{title}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{document.fileName || 'Uploaded file'}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {[document.mimeType, formatBytes(document.size), toLocal(document.createdAt)].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          {href ? (
                            <div className="flex gap-2">
                              <Button asChild size="sm" variant="outline">
                                <a href={href} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                  Open
                                </a>
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <a href={href} download={document.fileName || undefined}>
                                  <Download className="h-4 w-4" />
                                  Save
                                </a>
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents were uploaded with this application.</p>
                )}
              </Panel>
            </div>

            <div className="space-y-5 xl:sticky xl:top-3">
              <Panel title="Completion" icon={CheckCircle2}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
                    <span>Answers</span>
                    <span className={application.completion?.answersComplete ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
                      {application.completion?.answersComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
                    <span>Attachments</span>
                    <span className={application.completion?.attachmentsComplete ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
                      {application.completion?.attachmentsComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                  {missingFields.length ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      <p className="mb-1 inline-flex items-center gap-1 font-medium">
                        <CircleAlert className="h-3.5 w-3.5" /> Still needed
                      </p>
                      <ul className="list-disc pl-4">
                        {missingFields.map((item, index) => (
                          <li key={`${missingFieldLabel(item)}-${index}`}>{missingFieldLabel(item)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nothing is missing from this application.</p>
                  )}
                </div>
              </Panel>

              <Panel title="Application" icon={CalendarDays}>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">{prettyStatus(application.status)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="text-right font-medium">{toLocal(application.createdAt)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="text-right font-medium">{toLocal(application.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">ID</span>
                    <span className="max-w-[60%] break-all text-right font-mono text-[11px]">{application.id}</span>
                  </div>
                </div>
              </Panel>

              <Panel title="Review decision" icon={BadgeCheck}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                    <select
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      value={reviewStatus}
                      onChange={(event) => setReviewStatus(event.target.value as ApplicationStatus)}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>{prettyStatus(status)}</option>
                      ))}
                    </select>
                  </div>
                  {reviewStatus === 'SHORTLISTED' ? (
                    <ShortlistInterviewFields
                      dateId="detail-interview-date"
                      timeId="detail-interview-time"
                      interviewDate={reviewInterviewDate}
                      interviewTime={reviewInterviewTime}
                      onInterviewDateChange={setReviewInterviewDate}
                      onInterviewTimeChange={setReviewInterviewTime}
                    />
                  ) : null}
                  {application.status === 'SHORTLISTED' && application.interviewDate ? (
                    <div className="rounded-xl bg-muted/50 px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scheduled interview</p>
                      <p className="mt-1 font-medium">
                        {toDate(application.interviewDate)}
                        {application.interviewTime ? ` at ${application.interviewTime}` : ''}
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review notes</p>
                    <Textarea
                      rows={5}
                      value={reviewNotes}
                      onChange={(event) => setReviewNotes(event.target.value)}
                      placeholder="e.g. Panel interview at head office."
                    />
                  </div>
                  <Button className="w-full" onClick={saveReview} loading={saving}>
                    Save review
                  </Button>
                </div>
              </Panel>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
