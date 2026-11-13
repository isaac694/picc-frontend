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
  parseRequiredDocuments,
  serializeRequiredDocuments,
  validateRequiredDocumentFields,
  type VacancyRequiredDocument,
} from '@/lib/hr-vacancy';
import {
  columnFor,
  DEFAULT_VACANCY_FIELDS,
  HR_VACANCY_FIELDS_ENDPOINT,
  parseHrFormFields,
  validateFieldValue,
  type CustomFieldValue,
  type HrFormField,
} from '@/lib/hr-form';

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
  customFields: Record<string, CustomFieldValue>;
  status: VacancyStatus;
  closesAt?: string;
  applications?: HrApplication[];
};

type VacancyForm = {
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
  closesAt: string;
  /** Answers to the custom fields added in Settings > Form management > HR form. */
  customFields: Record<string, CustomFieldValue>;
};

const EMPTY_FORM: VacancyForm = {
  title: '',
  department: '',
  location: '',
  employmentType: 'Full-time',
  summary: '',
  description: '',
  responsibilities: [] as string[],
  requirements: [] as string[],
  requiredDocuments: defaultRequiredDocuments(),
  status: 'OPEN',
  closesAt: '',
  customFields: {},
};

/** A field's current value: fields that fill a vacancy property read it, the rest live in customFields. */
const fieldValue = (form: VacancyForm, field: HrFormField): unknown => {
  const column = columnFor(field);
  return column ? form[column] : form.customFields[field.key];
};

const withFieldValue = (form: VacancyForm, field: HrFormField, value: CustomFieldValue): VacancyForm => {
  const column = columnFor(field);
  return column
    ? { ...form, [column]: value }
    : { ...form, customFields: { ...form.customFields, [field.key]: value } };
};

/** Errors keyed by field key (and document keys), checked against the fields set up in Form management. */
function validateVacancyForm(form: VacancyForm, fields: HrFormField[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const message = validateFieldValue(field, fieldValue(form, field));
    if (message) errors[field.key] = message;
  }
  return { ...errors, ...validateRequiredDocumentFields(form.requiredDocuments) };
}

const parseCustomFields = (value: unknown): Record<string, CustomFieldValue> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([, entry]) => (
      ['string', 'number', 'boolean'].includes(typeof entry) || Array.isArray(entry)
    )).map(([key, entry]) => [key, Array.isArray(entry) ? entry.map(String) : entry as CustomFieldValue]),
  );
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
    customFields: parseCustomFields(item.customFields),
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

const selectClass = 'h-10 w-full rounded-md border border-border bg-background px-3 text-sm aria-invalid:border-destructive';

/** One field of the Create vacancy form, drawn from its Form management settings. */
function VacancyFormField({
  field,
  value,
  onChange,
  error,
}: {
  field: HrFormField;
  value: unknown;
  onChange: (value: CustomFieldValue) => void;
  error?: string;
}) {
  const label = `${field.label}${field.isRequired ? ' *' : ''}`;
  const placeholder = field.placeholder ? examplePlaceholder(field.placeholder) : undefined;
  const text = value === undefined || value === null ? '' : String(value);
  const help = field.helpText && field.type !== 'list' ? <p className="text-xs text-muted-foreground">{field.helpText}</p> : null;

  if (field.type === 'richtext') {
    return (
      <div className="space-y-1 md:col-span-2">
        <RichTextEditor label={label} value={text} onChange={onChange} placeholder={placeholder} invalid={Boolean(error)} error={error} />
        {help}
      </div>
    );
  }

  if (field.type === 'list') {
    return (
      <section className={`rounded-2xl border border-border/70 bg-background/60 p-4 ${field.width === 'half' ? '' : 'md:col-span-2'}`}>
        <VacancyArrayEditor
          label={label}
          description={field.helpText || 'Add each item on its own.'}
          value={Array.isArray(value) ? value.map(String) : []}
          onChange={onChange}
          placeholder={field.placeholder.replace(/^e\.g\.\s*/i, '') || 'Add an item'}
          error={error}
        />
      </section>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <div className={`space-y-1 ${field.width === 'half' ? '' : 'md:col-span-2'}`}>
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox checked={value === true} onCheckedChange={(checked) => onChange(checked === true)} aria-invalid={Boolean(error)} />
          {label}
        </label>
        {help}
        <FieldError message={error} />
      </div>
    );
  }

  let control;
  if (field.type === 'select') {
    // Keep a value saved before its choice was removed, so editing a vacancy never changes it silently.
    const options = Array.from(new Set([...field.options, text].filter(Boolean)));
    const isStatus = columnFor(field) === 'status';
    control = (
      <select className={selectClass} value={text} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)}>
        {field.isRequired && text ? null : <option value="">Choose…</option>}
        {options.map((option) => (
          <option key={option} value={option}>{isStatus ? option.replaceAll('_', ' ') : option}</option>
        ))}
      </select>
    );
  } else if (field.type === 'textarea') {
    control = <Textarea rows={3} value={text} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />;
  } else {
    const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text';
    control = <Input type={inputType} step={field.type === 'number' ? 'any' : undefined} value={text} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />;
  }

  return (
    <div className={`space-y-2 ${field.width === 'half' ? '' : 'md:col-span-2'}`}>
      <Label>{label}</Label>
      {control}
      {help}
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
  // The Create vacancy fields from Settings > Form management > HR form. The built-in layout is used
  // until they load, or if they cannot be loaded.
  const [formFields, setFormFields] = useState<HrFormField[]>(DEFAULT_VACANCY_FIELDS);
  const activeFormFields = useMemo(() => formFields.filter((field) => field.isActive), [formFields]);
  const vacancyErrors = showVacancyErrors ? validateVacancyForm(form, activeFormFields) : {};

  const fetchFormFields = async () => {
    if (!token) return;
    try {
      const response = await apiFetch(`${HR_VACANCY_FIELDS_ENDPOINT}?active=1`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!response.ok) return;
      const fields = parseHrFormFields(await response.json());
      if (fields.length) setFormFields(fields);
    } catch {
      // Keep the built-in layout.
    }
  };

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
    void fetchFormFields();
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

  const vacancyToForm = (vacancy: HrVacancy): VacancyForm => ({
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
    customFields: vacancy.customFields,
  });

  const openCreate = () => {
    setEditing(null);
    setShowVacancyErrors(false);
    setForm({ ...EMPTY_FORM, requiredDocuments: defaultRequiredDocuments(), customFields: {} });
    setDialogOpen(true);
    // Pick up changes made in Form management since the page loaded.
    void fetchFormFields();
  };

  const openEdit = async (vacancy: HrVacancy) => {
    setEditing(vacancy);
    setShowVacancyErrors(false);
    setForm(vacancyToForm(vacancy));
    setDialogOpen(true);
    void fetchFormFields();

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
    const vacancyErrors = validateVacancyForm(form, activeFormFields);
    const firstError = Object.values(vacancyErrors)[0];
    if (firstError) {
      adminErrorToast(firstError);
      return;
    }

    setSaving(true);
    try {
      const requiredDocuments = serializeRequiredDocuments(form.requiredDocuments);
      // Vacancy properties that a shown field fills. The rest are left out: a new vacancy leaves them empty
      // (without a Job title field the backend names it from the first short answer; without Status it is
      // a draft), and an edit keeps what was saved.
      const shown = new Set<string>(activeFormFields.flatMap((field) => columnFor(field) ?? []));
      const trimList = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
      const columns: Record<string, unknown> = {
        title: form.title.trim(),
        status: form.status,
        department: form.department.trim(),
        location: form.location.trim(),
        employmentType: form.employmentType.trim() || 'Full-time',
        summary: form.summary.trim(),
        description: form.description.trim(),
        responsibilities: trimList(form.responsibilities),
        requirements: trimList(form.requirements),
        closesAt: form.closesAt ? `${form.closesAt}T23:59:59.000Z` : null,
      };
      const customFields = Object.fromEntries(
        activeFormFields
          .filter((field) => !columnFor(field))
          .map((field) => {
            const value = form.customFields[field.key];
            if (field.type === 'list') return [field.key, trimList(Array.isArray(value) ? value.map(String) : [])];
            if (field.type === 'checkbox') return [field.key, value === true];
            return [field.key, typeof value === 'string' ? value.trim() : value ?? ''];
          }),
      );
      const body = {
        ...Object.fromEntries(Object.entries(columns).filter(([key]) => shown.has(key))),
        requiredDocuments,
        customFields,
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
                <h3 className="text-base font-semibold">Vacancy details</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Shown on the careers portal. The fields here are set up in Settings &gt; Form management &gt; HR form.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {activeFormFields.map((field) => (
                  <VacancyFormField
                    key={field.id}
                    field={field}
                    value={fieldValue(form, field)}
                    onChange={(value) => setForm((current) => withFieldValue(current, field, value))}
                    error={vacancyErrors[field.key]}
                  />
                ))}
              </div>
            </section>

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
