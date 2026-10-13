'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bold, CheckCheck, Eye, Heading2, Italic, List, Pencil, Plus, RefreshCw, Search, Trash2, Underline } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import VacancyArrayEditor from '@/components/admin/VacancyArrayEditor';
import VacancyDocumentsEditor from '@/components/admin/VacancyDocumentsEditor';
import FieldError, { examplePlaceholder } from '@/components/form/FieldError';
import ShortlistInterviewFields from '@/components/admin/ShortlistInterviewFields';
import {
  buildBulkStatusPayload,
  buildSingleStatusPayload,
  validateShortlistReview,
  toDateInputValue,
  toTimeInputValue,
} from '@/lib/hr-application-review';
import {
  defaultRequiredDocuments,
  EMPLOYMENT_TYPES,
  parseRequiredDocuments,
  serializeRequiredDocuments,
  VACANCY_STATUSES,
  validateVacancyForm,
  type VacancyRequiredDocument,
} from '@/lib/hr-vacancy';

type VacancyStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED';
type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';
type ApplicationTab = 'ALL' | ApplicationStatus;

type HrApplication = {
  id: string;
  status: ApplicationStatus;
  vacancyId?: string;
  vacancy?: { id?: string; title?: string };
  applicant?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  createdAt?: string;
  reviewNotes?: string;
  interviewDate?: string | null;
  interviewTime?: string | null;
};

const APPLICATION_TABS: Array<{ value: ApplicationTab; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

const parseApplications = (value: unknown): HrApplication[] => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as { applications?: unknown[] })?.applications)
      ? (value as { applications: unknown[] }).applications
      : Array.isArray((value as { data?: unknown[] })?.data)
        ? (value as { data: unknown[] }).data
        : [];

  return source.filter((item): item is HrApplication => {
    if (!item || typeof item !== 'object') return false;
    return Boolean(String((item as HrApplication).id || '').trim());
  });
};

type HrVacancy = {
  id: string;
  slug?: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredDocuments: VacancyRequiredDocument[];
  status: VacancyStatus;
  closesAt?: string;
  applications?: HrApplication[];
};

const EMPTY_FORM = {
  title: '',
  department: '',
  location: '',
  employmentType: 'Full-time',
  summary: '',
  description: '',
  responsibilities: [] as string[],
  requirements: [] as string[],
  requiredDocuments: defaultRequiredDocuments(),
  status: 'OPEN' as VacancyStatus,
  closesAt: '',
};

const normalizeVacancy = (value: unknown): HrVacancy | null => {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const id = String(item.id ?? item._id ?? '').trim();
  const title = String(item.title ?? '').trim();
  if (!id || !title) return null;

  return {
    id,
    slug: typeof item.slug === 'string' ? item.slug : undefined,
    title,
    department: String(item.department ?? '').trim(),
    location: String(item.location ?? '').trim(),
    employmentType: String(item.employmentType ?? item.type ?? '').trim(),
    summary: String(item.summary ?? '').trim(),
    description: String(item.description ?? '').trim(),
    responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities.map(String) : [],
    requirements: Array.isArray(item.requirements) ? item.requirements.map(String) : [],
    requiredDocuments: parseRequiredDocuments(item.requiredDocuments),
    status: (item.status as VacancyStatus) || 'DRAFT',
    closesAt: typeof item.closesAt === 'string' ? item.closesAt : undefined,
    applications: Array.isArray(item.applications) ? item.applications as HrApplication[] : [],
  };
};

const normalizeVacancies = (value: unknown): HrVacancy[] => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as { vacancies?: unknown[] })?.vacancies)
      ? (value as { vacancies: unknown[] }).vacancies
      : Array.isArray((value as { data?: unknown[] })?.data)
        ? (value as { data: unknown[] }).data
        : [];

  return source.map(normalizeVacancy).filter((item): item is HrVacancy => Boolean(item));
};

function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  invalid,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  error?: string;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current || document.activeElement === editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || '');
  };

  const tools = [
    { label: 'Heading', icon: Heading2, command: 'formatBlock', value: 'h2' },
    { label: 'Bold', icon: Bold, command: 'bold' },
    { label: 'Italic', icon: Italic, command: 'italic' },
    { label: 'Underline', icon: Underline, command: 'underline' },
    { label: 'Bullets', icon: List, command: 'insertUnorderedList' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">Format with headings, bold text and lists</span>
      </div>
      <div className={`overflow-hidden rounded-2xl border bg-background shadow-sm ${invalid ? 'border-destructive' : 'border-border'}`}>
        <div className="flex flex-wrap items-center gap-1 border-b border-border/70 bg-muted/40 p-2">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button
                key={tool.label}
                type="button"
                title={tool.label}
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand(tool.command, tool.value);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              runCommand('formatBlock', 'p');
            }}
            className="ml-auto rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-background hover:text-foreground"
          >
            Normal text
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label={label}
          data-placeholder={placeholder}
          aria-invalid={invalid}
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          className="prose prose-sm min-h-44 max-w-none px-4 py-3 text-sm outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] dark:prose-invert"
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

export default function AdminHrPage() {
  const { token } = useAdminAuth();
  const [vacancies, setVacancies] = useState<HrVacancy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedVacancy = useMemo(
    () => vacancies.find((vacancy) => vacancy.id === selectedId) || vacancies[0] || null,
    [selectedId, vacancies]
  );
  const [loading, setLoading] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applications, setApplications] = useState<HrApplication[]>([]);
  const [applicationTab, setApplicationTab] = useState<ApplicationTab>('ALL');
  const [applicationSearch, setApplicationSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const applicationsRequestId = useRef(0);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HrVacancy | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showVacancyErrors, setShowVacancyErrors] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>('UNDER_REVIEW');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewInterviewDate, setReviewInterviewDate] = useState('');
  const [reviewInterviewTime, setReviewInterviewTime] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus>('SHORTLISTED');
  const [bulkNotes, setBulkNotes] = useState('Approved by HR');
  const [bulkInterviewDate, setBulkInterviewDate] = useState('');
  const [bulkInterviewTime, setBulkInterviewTime] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const reviewingApplication = useMemo(
    () => applications.find((application) => application.id === reviewingId) || null,
    [applications, reviewingId]
  );
  const selectedCount = selectedApplicationIds.length;
  const allVisibleSelected = applications.length > 0 && selectedCount === applications.length;
  const vacancyErrors = showVacancyErrors ? validateVacancyForm(form) : {};

  const fetchVacancies = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/hr/vacancies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.error || data.message || 'Unable to load HR vacancies.';
        adminErrorToast(message);
        return;
      }
      const items = normalizeVacancies(data);
      setVacancies(items);
      setSelectedId((current) => current || items[0]?.id || null);
    } catch {
      adminErrorToast('Unable to load HR vacancies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchApplications = async (vacancyId: string, status: ApplicationTab = applicationTab) => {
    if (!token) return;
    const requestId = ++applicationsRequestId.current;
    setLoadingApplications(true);
    setSelectedApplicationIds([]);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const statusQuery = status === 'ALL' ? '' : `?status=${encodeURIComponent(status)}`;
      let next: HrApplication[] = [];

      if (status === 'ALL') {
        const vacancyResponse = await apiFetch(`/api/admin/hr/vacancies/${vacancyId}/applications`, { headers });
        const vacancyData = await vacancyResponse.json().catch(() => ({}));
        if (vacancyResponse.ok) next = parseApplications(vacancyData);
      } else {
        const globalParams = new URLSearchParams({ status, vacancyId });
        const globalResponse = await apiFetch(`/api/admin/hr/applications?${globalParams.toString()}`, { headers });
        const globalData = await globalResponse.json().catch(() => ({}));
        if (globalResponse.ok) {
          next = parseApplications(globalData).filter((application) => {
            const applicationVacancyId = application.vacancyId || application.vacancy?.id;
            return !applicationVacancyId || applicationVacancyId === vacancyId;
          });
        }

        if (!next.length) {
          const vacancyResponse = await apiFetch(`/api/admin/hr/vacancies/${vacancyId}/applications${statusQuery}`, { headers });
          const vacancyData = await vacancyResponse.json().catch(() => ({}));
          if (vacancyResponse.ok) next = parseApplications(vacancyData);
        }
      }

      if (status !== 'ALL') {
        next = next.filter((application) => application.status === status);
      }

      if (requestId !== applicationsRequestId.current) return;
      setApplications(next);
      if (status === 'ALL') {
        setVacancies((items) => items.map((vacancy) => (
          vacancy.id === vacancyId ? { ...vacancy, applications: next } : vacancy
        )));
      }
    } catch {
      if (requestId !== applicationsRequestId.current) return;
      adminErrorToast('Unable to load applications.');
      setApplications([]);
    } finally {
      if (requestId === applicationsRequestId.current) setLoadingApplications(false);
    }
  };

  const searchApplications = async (vacancyId: string, term: string, status: ApplicationTab = applicationTab) => {
    if (!token) return;
    const requestId = ++applicationsRequestId.current;
    setLoadingApplications(true);
    setSelectedApplicationIds([]);
    try {
      const params = new URLSearchParams({ q: term, query: term, search: term });
      if (status !== 'ALL') params.set('status', status);
      const response = await apiFetch(`/api/admin/hr/vacancies/${vacancyId}/applications/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (requestId !== applicationsRequestId.current) return;
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to search applications.');
        setApplications([]);
        return;
      }
      let next = parseApplications(data);
      if (status !== 'ALL') {
        next = next.filter((application) => application.status === status);
      }
      setApplications(next);
    } catch {
      if (requestId !== applicationsRequestId.current) return;
      adminErrorToast('Unable to search applications.');
      setApplications([]);
    } finally {
      if (requestId === applicationsRequestId.current) setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (!selectedId) return;
    const term = applicationSearch.trim();
    const timeoutId = window.setTimeout(() => {
      if (term) void searchApplications(selectedId, term, applicationTab);
      else void fetchApplications(selectedId, applicationTab);
    }, term ? 350 : 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, token, applicationTab, applicationSearch]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const vacancyToForm = (vacancy: HrVacancy) => ({
    title: vacancy.title,
    department: vacancy.department,
    location: vacancy.location,
    employmentType: vacancy.employmentType || 'Full-time',
    summary: vacancy.summary,
    description: vacancy.description,
    responsibilities: vacancy.responsibilities,
    requirements: vacancy.requirements,
    requiredDocuments: vacancy.requiredDocuments.length ? vacancy.requiredDocuments : defaultRequiredDocuments(),
    status: vacancy.status,
    closesAt: vacancy.closesAt ? vacancy.closesAt.slice(0, 10) : '',
  });

  const openCreate = () => {
    setEditing(null);
    setShowVacancyErrors(false);
    setForm({ ...EMPTY_FORM, requiredDocuments: defaultRequiredDocuments() });
    setDialogOpen(true);
  };

  const openEdit = async (vacancy: HrVacancy) => {
    setEditing(vacancy);
    setShowVacancyErrors(false);
    setForm(vacancyToForm(vacancy));
    setDialogOpen(true);

    if (!token) return;
    try {
      const response = await apiFetch(`/api/admin/hr/vacancies/${vacancy.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      const full = normalizeVacancy(data.vacancy || data);
      if (!full) return;
      setEditing(full);
      setForm(vacancyToForm(full));
    } catch {
      // Keep the list payload if the detail request fails.
    }
  };

  const saveVacancy = async () => {
    if (!token) return;
    setShowVacancyErrors(true);
    const vacancyErrors = validateVacancyForm(form);
    const firstError = Object.values(vacancyErrors)[0];
    if (firstError) {
      adminErrorToast(firstError);
      return;
    }

    setSaving(true);
    try {
      const requiredDocuments = serializeRequiredDocuments(form.requiredDocuments);
      const body = {
        title: form.title.trim(),
        department: form.department.trim(),
        location: form.location.trim(),
        employmentType: form.employmentType.trim() || 'Full-time',
        summary: form.summary.trim(),
        description: form.description.trim(),
        responsibilities: form.responsibilities.map((item) => item.trim()).filter(Boolean),
        requirements: form.requirements.map((item) => item.trim()).filter(Boolean),
        requiredDocuments,
        status: form.status,
        closesAt: form.closesAt ? `${form.closesAt}T23:59:59.000Z` : undefined,
      };

      const response = await apiFetch(editing ? `/api/admin/hr/vacancies/${editing.id}` : '/api/admin/hr/vacancies', {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to save vacancy.');
        return;
      }
      adminSuccessToast(data.message || (editing ? 'Vacancy updated.' : 'Vacancy created.'));
      setDialogOpen(false);
      await fetchVacancies();
    } catch {
      adminErrorToast('Unable to save vacancy.');
    } finally {
      setSaving(false);
    }
  };

  const deleteVacancy = (vacancy: HrVacancy) => {
    confirmDeleteToast({
      title: 'Delete this vacancy?',
      description: vacancy.title,
      onConfirm: async () => {
        if (!token) return;
        const response = await apiFetch(`/api/admin/hr/vacancies/${vacancy.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          adminErrorToast(data.error || data.message || 'Unable to delete vacancy.');
          return;
        }
        adminSuccessToast(data.message || 'Vacancy deleted.');
        await fetchVacancies();
      },
    });
  };

  const reviewApplication = async (applicationId: string) => {
    if (!token) return;
    const validationError = validateShortlistReview(reviewStatus, reviewInterviewDate, reviewInterviewTime);
    if (validationError) {
      adminErrorToast(validationError);
      return;
    }
    setReviewSaving(true);
    try {
      const response = await apiFetch(`/api/admin/hr/applications/${applicationId}/status`, {
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
      setReviewingId(null);
      setReviewNotes('');
      setReviewInterviewDate('');
      setReviewInterviewTime('');
      await fetchVacancies();
      if (selectedId) await fetchApplications(selectedId, applicationTab);
    } catch {
      adminErrorToast('Unable to update application.');
    } finally {
      setReviewSaving(false);
    }
  };

  const toggleApplicationSelection = (applicationId: string, checked: boolean) => {
    setSelectedApplicationIds((current) => {
      if (checked) return current.includes(applicationId) ? current : [...current, applicationId];
      return current.filter((id) => id !== applicationId);
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedApplicationIds(checked ? applications.map((application) => application.id) : []);
  };

  const openBulkApprove = () => {
    if (!selectedCount) {
      adminErrorToast('Select at least one applicant to approve.');
      return;
    }
    setBulkStatus('SHORTLISTED');
    setBulkNotes('Approved by HR');
    setBulkInterviewDate('');
    setBulkInterviewTime('');
    setBulkDialogOpen(true);
  };

  const saveBulkStatus = async () => {
    if (!token || !selectedCount) return;
    const validationError = validateShortlistReview(bulkStatus, bulkInterviewDate, bulkInterviewTime);
    if (validationError) {
      adminErrorToast(validationError);
      return;
    }
    setBulkSaving(true);
    try {
      const response = await apiFetch('/api/admin/hr/applications/bulk-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildBulkStatusPayload({
          applicationIds: selectedApplicationIds,
          status: bulkStatus,
          reviewNotes: bulkNotes.trim() || 'Approved by HR',
          interviewDate: bulkInterviewDate,
          interviewTime: bulkInterviewTime,
        })),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to update selected applicants.');
        return;
      }
      adminSuccessToast(data.message || `${selectedCount} applicant${selectedCount === 1 ? '' : 's'} updated.`);
      setBulkDialogOpen(false);
      setSelectedApplicationIds([]);
      if (selectedId) await fetchApplications(selectedId, applicationTab);
    } catch {
      adminErrorToast('Unable to update selected applicants.');
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">HR Vacancies</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage vacancies and review applicants.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchVacancies}
            loading={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Vacancy
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="text-lg font-semibold">Vacancies</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Closing Date</th>
                <th className="px-5 py-3 font-semibold">Applications</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vacancies.map((vacancy) => (
                <tr
                  key={vacancy.id}
                  onClick={() => setSelectedId(vacancy.id)}
                  className={selectedVacancy?.id === vacancy.id ? 'bg-muted/60' : 'cursor-pointer hover:bg-muted/40'}
                >
                  <td className="px-5 py-4 font-semibold">{vacancy.title}</td>
                  <td className="px-5 py-4">{vacancy.department || 'HR'}</td>
                  <td className="px-5 py-4">{vacancy.location || 'Location not set'}</td>
                  <td className="px-5 py-4">{vacancy.employmentType || 'Full-time'}</td>
                  <td className="px-5 py-4"><Badge variant="outline">{vacancy.status}</Badge></td>
                  <td className="px-5 py-4">{vacancy.closesAt ? new Date(vacancy.closesAt).toLocaleDateString() : 'Not set'}</td>
                  <td className="px-5 py-4">{vacancy.applications?.length || 0}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(vacancy);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteVacancy(vacancy);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && vacancies.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No vacancies found.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Applications</h3>
            <p className="text-sm text-muted-foreground">
              {selectedVacancy ? `Selected vacancy: ${selectedVacancy.title}` : 'Select a vacancy to view applications.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedVacancy ? (
              searchOpen || applicationSearch ? (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    value={applicationSearch}
                    onChange={(event) => setApplicationSearch(event.target.value)}
                    onBlur={() => {
                      if (!applicationSearch.trim()) setSearchOpen(false);
                    }}
                    className="h-8 w-48 pl-8"
                    aria-label="Search applications"
                  />
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search applications"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )
            ) : null}
            {selectedCount ? (
              <Button size="sm" onClick={openBulkApprove}>
                <CheckCheck className="h-4 w-4" />
                Approve {selectedCount} selected
              </Button>
            ) : null}
            {selectedVacancy ? <Badge variant="outline">{selectedVacancy.status}</Badge> : null}
          </div>
        </div>

        {selectedVacancy ? (
          <Tabs
            value={applicationTab}
            onValueChange={(value) => setApplicationTab(value as ApplicationTab)}
            className="mt-4"
          >
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
              {APPLICATION_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex-none px-3">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          {loadingApplications ? (
            <p className="rounded-xl border border-border/60 p-8 text-center text-sm text-muted-foreground">Loading applications...</p>
          ) : null}
          {selectedVacancy && !loadingApplications && applications.length > 0 ? (
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={allVisibleSelected ? true : selectedCount ? 'indeterminate' : false}
                      onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                      aria-label="Select all applicants"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedApplicationIds.includes(application.id)}
                        onCheckedChange={(checked) => toggleApplicationSelection(application.id, checked === true)}
                        aria-label={`Select ${application.applicant?.name || 'applicant'}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold">{application.applicant?.name || 'Applicant'}</td>
                    <td className="px-4 py-3">{application.applicant?.email || '-'}</td>
                    <td className="px-4 py-3">{application.applicant?.phone || '-'}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{application.status.replaceAll('_', ' ')}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/hr/applications/${application.id}?vacancyId=${selectedVacancy.id}`}>
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReviewingId(application.id);
                            setReviewStatus(application.status || 'UNDER_REVIEW');
                            setReviewNotes(application.reviewNotes || '');
                            setReviewInterviewDate(toDateInputValue(application.interviewDate));
                            setReviewInterviewTime(toTimeInputValue(application.interviewTime) || application.interviewTime || '');
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {selectedVacancy && !loadingApplications && applications.length === 0 ? (
            <p className="rounded-xl border border-border/60 p-8 text-center text-sm text-muted-foreground">
              {applicationSearch.trim()
                ? 'No applicants match your search.'
                : applicationTab === 'ALL'
                  ? 'No applications yet.'
                  : `No ${applicationTab.replaceAll('_', ' ').toLowerCase()} applications.`}
            </p>
          ) : null}
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setShowVacancyErrors(false);
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-b border-border/70 bg-muted/30 px-6 py-5">
            <DialogTitle>{editing ? 'Edit vacancy' : 'Create vacancy'}</DialogTitle>
            <DialogDescription>
              Publish a role with a clear summary, responsibilities, requirements, and the documents applicants should upload.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            <section className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-5">
              <div>
                <h3 className="text-base font-semibold">Role details</h3>
                <p className="mt-1 text-sm text-muted-foreground">Core information shown on the careers portal.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Job title *</Label>
                  <Input
                    value={form.title}
                    aria-invalid={Boolean(vacancyErrors.title)}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder={examplePlaceholder('Communications Officer')}
                  />
                  <FieldError message={vacancyErrors.title} />
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Input
                    value={form.department}
                    aria-invalid={Boolean(vacancyErrors.department)}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                    placeholder={examplePlaceholder('Human Resources')}
                  />
                  <FieldError message={vacancyErrors.department} />
                </div>
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <Input
                    value={form.location}
                    aria-invalid={Boolean(vacancyErrors.location)}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder={examplePlaceholder('Lilongwe')}
                  />
                  <FieldError message={vacancyErrors.location} />
                </div>
                <div className="space-y-2">
                  <Label>Employment type *</Label>
                  <select
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm aria-invalid:border-destructive"
                    value={form.employmentType}
                    aria-invalid={Boolean(vacancyErrors.employmentType)}
                    onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}
                  >
                    {Array.from(new Set([...EMPLOYMENT_TYPES, form.employmentType].filter(Boolean))).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <FieldError message={vacancyErrors.employmentType} />
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <select
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm aria-invalid:border-destructive"
                    value={form.status}
                    aria-invalid={Boolean(vacancyErrors.status)}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as VacancyStatus }))}
                  >
                    {VACANCY_STATUSES.map((status) => (
                      <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
                    ))}
                  </select>
                  <FieldError message={vacancyErrors.status} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Closing date *</Label>
                  <Input
                    type="date"
                    value={form.closesAt}
                    aria-invalid={Boolean(vacancyErrors.closesAt)}
                    onChange={(e) => setForm((p) => ({ ...p, closesAt: e.target.value }))}
                  />
                  <FieldError message={vacancyErrors.closesAt} />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-5">
              <div>
                <h3 className="text-base font-semibold">Description</h3>
                <p className="mt-1 text-sm text-muted-foreground">A short summary for listings and a full description for the vacancy page.</p>
              </div>
              <div className="space-y-2">
                <Label>Short summary *</Label>
                <Textarea
                  rows={3}
                  value={form.summary}
                  aria-invalid={Boolean(vacancyErrors.summary)}
                  onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                  placeholder={examplePlaceholder('We are hiring a Communications Officer to support media relations.')}
                />
                <FieldError message={vacancyErrors.summary} />
              </div>
              <RichTextEditor
                label="Full description *"
                value={form.description}
                onChange={(description) => setForm((p) => ({ ...p, description }))}
                placeholder={examplePlaceholder('Describe the role, who it reports to, and what success looks like.')}
                invalid={Boolean(vacancyErrors.description)}
                error={vacancyErrors.description}
              />
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <VacancyArrayEditor
                  label="Responsibilities *"
                  description="Add each responsibility on its own."
                  value={form.responsibilities}
                  onChange={(responsibilities) => setForm((p) => ({ ...p, responsibilities }))}
                  placeholder="Prepare reports for leadership"
                  error={vacancyErrors.responsibilities}
                />
              </section>
              <section className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <VacancyArrayEditor
                  label="Requirements *"
                  description="Add each qualification or requirement on its own."
                  value={form.requirements}
                  onChange={(requirements) => setForm((p) => ({ ...p, requirements }))}
                  placeholder="Degree or diploma in Communications"
                  error={vacancyErrors.requirements}
                />
              </section>
            </div>

            <VacancyDocumentsEditor
              value={form.requiredDocuments}
              onChange={(requiredDocuments) => setForm((p) => ({ ...p, requiredDocuments }))}
              errors={vacancyErrors}
            />
          </div>
          <DialogFooter className="border-t border-border/70 bg-muted/20 px-6 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveVacancy} loading={saving}>{saving ? 'Saving...' : 'Save vacancy'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reviewingId)}
        onOpenChange={(open) => {
          if (!open) setReviewingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review application</DialogTitle>
            <DialogDescription>
              {reviewingApplication?.applicant?.name
                ? `Update the status and notes for ${reviewingApplication.applicant.name}.`
                : 'Update the application status and add review notes.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewingApplication ? (
              <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
                <p className="font-semibold">{reviewingApplication.applicant?.name || 'Applicant'}</p>
                <p className="text-muted-foreground">{reviewingApplication.applicant?.email || 'No email on file'}</p>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="review-status">Status</Label>
              <select
                id="review-status"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={reviewStatus}
                onChange={(event) => setReviewStatus(event.target.value as ApplicationStatus)}
              >
                {['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'HIRED', 'WITHDRAWN'].map((status) => (
                  <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </div>
            {reviewStatus === 'SHORTLISTED' ? (
              <ShortlistInterviewFields
                dateId="review-interview-date"
                timeId="review-interview-time"
                interviewDate={reviewInterviewDate}
                interviewTime={reviewInterviewTime}
                onInterviewDateChange={setReviewInterviewDate}
                onInterviewTimeChange={setReviewInterviewTime}
              />
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="review-notes">Review notes</Label>
              <Textarea
                id="review-notes"
                rows={4}
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder={examplePlaceholder('Panel interview at head office.')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewingId(null)}>Cancel</Button>
            <Button
              onClick={() => reviewingId && reviewApplication(reviewingId)}
              loading={reviewSaving}
            >
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk approve applicants</DialogTitle>
            <DialogDescription>
              Update {selectedCount} selected applicant{selectedCount === 1 ? '' : 's'} at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">Status</Label>
              <select
                id="bulk-status"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value as ApplicationStatus)}
              >
                {['SHORTLISTED', 'UNDER_REVIEW', 'HIRED', 'REJECTED', 'SUBMITTED', 'WITHDRAWN'].map((status) => (
                  <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </div>
            {bulkStatus === 'SHORTLISTED' ? (
              <ShortlistInterviewFields
                dateId="bulk-interview-date"
                timeId="bulk-interview-time"
                interviewDate={bulkInterviewDate}
                interviewTime={bulkInterviewTime}
                onInterviewDateChange={setBulkInterviewDate}
                onInterviewTimeChange={setBulkInterviewTime}
              />
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="bulk-notes">Review notes</Label>
              <Textarea
                id="bulk-notes"
                rows={4}
                value={bulkNotes}
                onChange={(event) => setBulkNotes(event.target.value)}
                placeholder={examplePlaceholder('Panel interview at head office.')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveBulkStatus} loading={bulkSaving}>
              Update {selectedCount} applicant{selectedCount === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
