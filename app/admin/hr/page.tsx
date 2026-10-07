'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Heading2, Italic, List, Pencil, Plus, RefreshCw, Trash2, Underline } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import VacancyPortalBuilder from '@/components/admin/VacancyPortalBuilder';
import {
  buildDefaultPortalConfig,
  DEFAULT_PORTAL_FIELD_TYPES,
  normalizePortalConfig,
  parseCatalog,
  type PortalConfig,
  type PortalFieldCatalogItem,
} from '@/lib/hr-portal';

type VacancyStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED';
type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';

type HrApplication = {
  id: string;
  status: ApplicationStatus;
  applicant?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  createdAt?: string;
  reviewNotes?: string;
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
  requiredDocuments: string[];
  status: VacancyStatus;
  closesAt?: string;
  applications?: HrApplication[];
  portalConfig?: PortalConfig | null;
};

const EMPTY_FORM = {
  title: '',
  department: '',
  location: '',
  employmentType: 'Full-time',
  summary: '',
  description: '',
  responsibilities: '',
  requirements: '',
  requiredDocuments: 'CV\nCover Letter',
  status: 'OPEN' as VacancyStatus,
  closesAt: '',
};

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

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
    requiredDocuments: Array.isArray(item.requiredDocuments)
      ? item.requiredDocuments.map((document) => {
          if (typeof document === 'string') return document;
          if (!document || typeof document !== 'object') return String(document);
          const record = document as Record<string, unknown>;
          return String(record.label || record.name || record.description || 'Required document');
        })
      : [],
    status: (item.status as VacancyStatus) || 'DRAFT',
    closesAt: typeof item.closesAt === 'string' ? item.closesAt : undefined,
    applications: Array.isArray(item.applications) ? item.applications as HrApplication[] : [],
    portalConfig: normalizePortalConfig(item.portalConfig),
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
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
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          className="prose prose-sm min-h-44 max-w-none px-4 py-3 text-sm outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] dark:prose-invert"
        />
      </div>
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
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HrVacancy | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [portalConfig, setPortalConfig] = useState<PortalConfig>(buildDefaultPortalConfig({}));
  const [fieldTypes, setFieldTypes] = useState<PortalFieldCatalogItem[]>(DEFAULT_PORTAL_FIELD_TYPES);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>('UNDER_REVIEW');
  const [reviewNotes, setReviewNotes] = useState('');

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

  useEffect(() => {
    if (!token) return;
    void apiFetch('/api/admin/hr/portal-field-types', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (response.ok) setFieldTypes(parseCatalog(data));
    }).catch(() => undefined);
  }, [token]);

  const fetchApplications = async (vacancyId: string) => {
    if (!token) return;
    setLoadingApplications(true);
    try {
      const response = await apiFetch(`/api/admin/hr/vacancies/${vacancyId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      const applications = Array.isArray(data)
        ? data
        : Array.isArray(data.applications)
          ? data.applications
          : [];
      setVacancies((items) => items.map((vacancy) => (
        vacancy.id === vacancyId ? { ...vacancy, applications } : vacancy
      )));
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (selectedId) void fetchApplications(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, token]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPortalConfig(buildDefaultPortalConfig({ requiredDocuments: ['CV', 'Cover Letter'] }));
    setDialogOpen(true);
  };

  const openEdit = async (vacancy: HrVacancy) => {
    setEditing(vacancy);
    setForm({
      title: vacancy.title,
      department: vacancy.department,
      location: vacancy.location,
      employmentType: vacancy.employmentType,
      summary: vacancy.summary,
      description: vacancy.description,
      responsibilities: vacancy.responsibilities.join('\n'),
      requirements: vacancy.requirements.join('\n'),
      requiredDocuments: vacancy.requiredDocuments.join('\n'),
      status: vacancy.status,
      closesAt: vacancy.closesAt ? vacancy.closesAt.slice(0, 10) : '',
    });
    setPortalConfig(vacancy.portalConfig || buildDefaultPortalConfig(vacancy));
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
      setForm({
        title: full.title,
        department: full.department,
        location: full.location,
        employmentType: full.employmentType,
        summary: full.summary,
        description: full.description,
        responsibilities: full.responsibilities.join('\n'),
        requirements: full.requirements.join('\n'),
        requiredDocuments: full.requiredDocuments.join('\n'),
        status: full.status,
        closesAt: full.closesAt ? full.closesAt.slice(0, 10) : '',
      });
      setPortalConfig(full.portalConfig || buildDefaultPortalConfig(full));
    } catch {
      // Keep the list payload if the detail request fails.
    }
  };

  const saveVacancy = async () => {
    if (!token) return;
    if (!form.title.trim()) {
      adminErrorToast('Vacancy title is required.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        department: form.department.trim(),
        location: form.location.trim(),
        employmentType: form.employmentType.trim(),
        summary: form.summary.trim(),
        description: form.description.trim(),
        responsibilities: splitLines(form.responsibilities),
        requirements: splitLines(form.requirements),
        requiredDocuments: splitLines(form.requiredDocuments),
        status: form.status,
        closesAt: form.closesAt ? new Date(`${form.closesAt}T23:59:59`).toISOString() : undefined,
        portalConfig: {
          ...portalConfig,
          version: portalConfig.version || 1,
          display: {
            ...(portalConfig.display || {}),
            title: form.title.trim(),
            subtitle: form.summary.trim(),
            department: form.department.trim(),
            location: form.location.trim(),
            employmentType: form.employmentType.trim(),
            summary: form.summary.trim(),
          },
        },
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
    const response = await apiFetch(`/api/admin/hr/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: reviewStatus, reviewNotes }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      adminErrorToast(data.error || data.message || 'Unable to update application.');
      return;
    }
    adminSuccessToast(data.message || 'Application updated.');
    setReviewingId(null);
    setReviewNotes('');
    await fetchVacancies();
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
          {selectedVacancy ? <Badge variant="outline">{selectedVacancy.status}</Badge> : null}
        </div>

        <div className="mt-4 overflow-x-auto">
          {loadingApplications ? (
            <p className="rounded-xl border border-border/60 p-8 text-center text-sm text-muted-foreground">Loading applications...</p>
          ) : null}
          {selectedVacancy && !loadingApplications && (selectedVacancy.applications || []).length > 0 ? (
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(selectedVacancy.applications || []).map((application) => (
                  <tr key={application.id}>
                    <td className="px-4 py-3 font-semibold">{application.applicant?.name || 'Applicant'}</td>
                    <td className="px-4 py-3">{application.applicant?.email || '-'}</td>
                    <td className="px-4 py-3">{application.applicant?.phone || '-'}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{application.status}</Badge></td>
                    <td className="px-4 py-3">
                      {reviewingId === application.id ? (
                        <div className="space-y-2">
                          <select
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                            value={reviewStatus}
                            onChange={(event) => setReviewStatus(event.target.value as ApplicationStatus)}
                          >
                            {['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'HIRED', 'WITHDRAWN'].map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                          <Textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Review notes" />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setReviewingId(null)}>Cancel</Button>
                            <Button size="sm" onClick={() => reviewApplication(application.id)}>Save Review</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => {
                          setReviewingId(application.id);
                          setReviewStatus(application.status || 'UNDER_REVIEW');
                          setReviewNotes(application.reviewNotes || '');
                        }}>
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {selectedVacancy && !loadingApplications && (selectedVacancy.applications || []).length === 0 ? (
            <p className="rounded-xl border border-border/60 p-8 text-center text-sm text-muted-foreground">No applications yet.</p>
          ) : null}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Vacancy' : 'Create Vacancy'}</DialogTitle>
            <DialogDescription>
              Fill in the vacancy details, format the description, then save.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Job Title</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Secondary School Teacher" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} placeholder="PICC Secondary School" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="Area 49, Lilongwe" />
            </div>
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Input value={form.employmentType} onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))} placeholder="Full-time" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as VacancyStatus }))}
              >
                {['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Closing Date</Label>
              <Input type="date" value={form.closesAt} onChange={(e) => setForm((p) => ({ ...p, closesAt: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Short Summary</Label>
              <Textarea rows={3} value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <RichTextEditor
                label="Full Description"
                value={form.description}
                onChange={(description) => setForm((p) => ({ ...p, description }))}
                placeholder="Describe the opportunity, culture and ideal candidate..."
              />
            </div>
            <div className="space-y-2">
              <Label>Responsibilities, one per line</Label>
              <Textarea rows={6} value={form.responsibilities} onChange={(e) => setForm((p) => ({ ...p, responsibilities: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Requirements, one per line</Label>
              <Textarea rows={6} value={form.requirements} onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Required Documents, one per line</Label>
              <Textarea rows={3} value={form.requiredDocuments} onChange={(e) => setForm((p) => ({ ...p, requiredDocuments: e.target.value }))} />
            </div>
            <VacancyPortalBuilder value={portalConfig} fieldTypes={fieldTypes} onChange={setPortalConfig} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveVacancy} loading={saving}>{saving ? 'Saving...' : 'Save Vacancy'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
