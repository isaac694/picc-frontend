'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { MINISTRY_ADMIN_OPTIONS } from '@/lib/admin-pages';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { downloadRegistrationsExcel, downloadRegistrationsPdf, type ExportColumn } from '@/lib/event-registration-export';

type MinistryEventRow = {
  id: string;
  title: string;
  startDate?: string | null;
  location?: string | null;
  registrationCount: number;
};

type RegistrationRow = {
  id: string;
  eventId?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt?: string;
  answers?: Record<string, unknown>;
  answerRows?: Array<[string, unknown]>;
  event?: {
    id: string;
    title: string;
    startDate?: string | null;
    location?: string | null;
    ministryKey?: string;
  } | null;
};

type RegistrationsResponse = {
  events?: MinistryEventRow[];
  registrations?: RegistrationRow[];
  total?: number;
  error?: string;
};

function answerValue(rows: Array<[string, unknown]> | undefined, labels: string[]) {
  const match = (rows || []).find(([label]) => labels.includes(String(label).trim().toLowerCase()));
  return match ? formatAnswer(match[1]) : '';
}

function formatAnswer(value: unknown) {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean).join(', ') || '—';
  return String(value);
}

function answerList(registration: RegistrationRow) {
  if (Array.isArray(registration.answerRows) && registration.answerRows.length > 0) {
    return registration.answerRows.map(([label, value], index) => ({
      key: `${registration.id}-${index}`,
      label: String(label || 'Answer'),
      value: formatAnswer(value),
    }));
  }
  return Object.entries(registration.answers || {}).map(([label, value]) => ({
    key: `${registration.id}-${label}`,
    label,
    value: formatAnswer(value),
  }));
}

const BASE_EXPORT_FIELDS: ExportColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'ministry', label: 'Ministry' },
  { key: 'event', label: 'Event' },
  { key: 'eventDate', label: 'Event date' },
  { key: 'location', label: 'Location' },
  { key: 'submitted', label: 'Submitted' },
];

function answerColumns(registration: RegistrationRow) {
  const pairs =
    Array.isArray(registration.answerRows) && registration.answerRows.length > 0
      ? registration.answerRows.map(([label, value]) => [String(label || 'Answer'), formatAnswer(value)] as const)
      : Object.entries(registration.answers || {}).map(([label, value]) => [label, formatAnswer(value)] as const);
  const seen = new Map<string, number>();
  return pairs.map(([label, value]) => {
    const count = (seen.get(label) || 0) + 1;
    seen.set(label, count);
    return {
      key: `answer:${count}:${label}`,
      label: count === 1 ? label : `${label} (${count})`,
      value,
    };
  });
}

function formatWhen(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MinistryEventApplicationsPage() {
  const params = useParams<{ ministryKey: string }>();
  const ministryKey = String(params?.ministryKey || '');
  const ministry = MINISTRY_ADMIN_OPTIONS.find((item) => item.key === ministryKey);
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
  } = useAdminAuth();
  const [events, setEvents] = useState<MinistryEventRow[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openRegistration, setOpenRegistration] = useState<RegistrationRow | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTargets, setExportTargets] = useState<RegistrationRow[]>([]);
  const [exportFieldKeys, setExportFieldKeys] = useState<string[]>([]);
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  useEffect(() => {
    if (!token || !ministryKey) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      const path = selectedEventId
        ? `/api/admin/ministries/${encodeURIComponent(ministryKey)}/events/${encodeURIComponent(selectedEventId)}/registrations`
        : `/api/admin/ministries/${encodeURIComponent(ministryKey)}/event-registrations`;
      try {
        const response = await apiFetch(path, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await response.json().catch(() => null)) as RegistrationsResponse | null;
        if (!response.ok) {
          throw new Error(data?.error || 'Could not load registrations.');
        }
        if (cancelled) return;
        if (Array.isArray(data?.events)) setEvents(data.events);
        setRegistrations(Array.isArray(data?.registrations) ? data.registrations : []);
        setTotal(typeof data?.total === 'number' ? data.total : 0);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load registrations.');
          setRegistrations([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token, ministryKey, selectedEventId]);

  const title = ministry?.label || 'Ministry';
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId],
  );
  const openEvent = useMemo(() => {
    if (!openRegistration) return null;
    const eventId = openRegistration.event?.id || openRegistration.eventId;
    return events.find((event) => event.id === eventId) || null;
  }, [events, openRegistration]);
  const openAnswers = openRegistration ? answerList(openRegistration) : [];
  const exportColumns = useMemo(() => {
    const answerFields: ExportColumn[] = [];
    const seen = new Set<string>();
    exportTargets.forEach((registration) => {
      answerColumns(registration).forEach((column) => {
        if (seen.has(column.key)) return;
        seen.add(column.key);
        answerFields.push({ key: column.key, label: column.label });
      });
    });
    return [...BASE_EXPORT_FIELDS, ...answerFields];
  }, [exportTargets]);

  const registrationValues = (registration: RegistrationRow) => {
    const eventId = registration.event?.id || registration.eventId;
    const eventMeta = events.find((event) => event.id === eventId) || null;
    const answers = Object.fromEntries(answerColumns(registration).map((column) => [column.key, column.value]));
    return {
      name: registration.name || answerValue(registration.answerRows, ['full name', 'name']) || '—',
      email: registration.email || '—',
      phone: registration.phone || answerValue(registration.answerRows, ['phone number', 'phone']) || '—',
      ministry: title,
      event: registration.event?.title || eventMeta?.title || '—',
      eventDate: formatWhen(registration.event?.startDate || eventMeta?.startDate),
      location: registration.event?.location || eventMeta?.location || '—',
      submitted: formatWhen(registration.createdAt),
      ...answers,
    };
  };

  const registrationsPath = (take?: number) => {
    const base = selectedEventId
      ? `/api/admin/ministries/${encodeURIComponent(ministryKey)}/events/${encodeURIComponent(selectedEventId)}/registrations`
      : `/api/admin/ministries/${encodeURIComponent(ministryKey)}/event-registrations`;
    return take ? `${base}?skip=0&take=${take}` : base;
  };

  const beginExport = async () => {
    if (registrations.length === 0) return;
    setExportError('');
    let rows = registrations;
    if (token && total > registrations.length) {
      try {
        const response = await apiFetch(registrationsPath(total), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await response.json().catch(() => null)) as RegistrationsResponse | null;
        if (response.ok && Array.isArray(data?.registrations) && data.registrations.length > 0) {
          rows = data.registrations;
        }
      } catch {
        rows = registrations;
      }
    }
    const answerFields: ExportColumn[] = [];
    const seen = new Set<string>();
    rows.forEach((registration) => {
      answerColumns(registration).forEach((column) => {
        if (seen.has(column.key)) return;
        seen.add(column.key);
        answerFields.push(column);
      });
    });
    setExportTargets(rows);
    setExportFieldKeys([...BASE_EXPORT_FIELDS, ...answerFields].map((field) => field.key));
    setExportOpen(true);
  };

  const runExport = async (format: 'excel' | 'pdf') => {
    const columns = exportColumns.filter((column) => exportFieldKeys.includes(column.key));
    if (exportTargets.length === 0) {
      setExportError('There are no applications to export.');
      return;
    }
    if (columns.length === 0) {
      setExportError('Select at least one field.');
      return;
    }
    const rows = exportTargets.map((registration) => registrationValues(registration));
    const day = new Date().toISOString().slice(0, 10);
    const baseName = `${ministryKey || 'ministry'}-registrations-${day}`;
    setExporting(format);
    setExportError('');
    try {
      if (format === 'excel') {
        downloadRegistrationsExcel({
          fileName: `${baseName}.xls`,
          columns,
          rows,
        });
      } else {
        await downloadRegistrationsPdf({
          title: `${title} registrations`,
          fileName: `${baseName}.pdf`,
          columns,
          rows,
        });
      }
      setExportOpen(false);
    } catch {
      setExportError(format === 'excel' ? 'Could not create the Excel file.' : 'Could not create the PDF.');
    } finally {
      setExporting(null);
    }
  };
  const openName =
    openRegistration?.name ||
    answerValue(openRegistration?.answerRows, ['full name', 'name']) ||
    openRegistration?.email ||
    'Application';

  if (!token) {
    return (
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title} events</h1>
        <p className="text-sm text-foreground/70">
          Registration applications for {title}. Choose an event to see only that event.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium" htmlFor="ministry-event-filter">Event</label>
        <select
          id="ministry-event-filter"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={selectedEventId}
          onChange={(event) => setSelectedEventId(event.target.value)}
        >
          <option value="">All {title} events</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} ({event.registrationCount})
            </option>
          ))}
        </select>
        <span className="text-sm text-foreground/60">{loading ? 'Loading…' : `${total} application${total === 1 ? '' : 's'}`}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || registrations.length === 0}
          onClick={() => void beginExport()}
        >
          Export
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/70">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Phone number</th>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">Submitted</th>
              <th className="px-3 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-foreground/60" colSpan={5}>
                  {loading ? 'Loading applications…' : `No applications${selectedEvent ? ` for ${selectedEvent.title}` : ''}.`}
                </td>
              </tr>
            ) : registrations.map((registration) => (
              <tr key={registration.id} className="border-t border-border/60 align-top">
                <td className="px-3 py-3 font-medium">{registration.name || answerValue(registration.answerRows, ['full name', 'name']) || '—'}</td>
                <td className="px-3 py-3">{registration.phone || answerValue(registration.answerRows, ['phone number', 'phone']) || '—'}</td>
                <td className="px-3 py-3">{registration.event?.title || selectedEvent?.title || '—'}</td>
                <td className="px-3 py-3 whitespace-nowrap">{formatWhen(registration.createdAt)}</td>
                <td className="px-3 py-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenRegistration(registration)}>
                    View details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(openRegistration)} onOpenChange={(open) => { if (!open) setOpenRegistration(null); }}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border/70 bg-muted/30 px-6 py-5">
            <DialogTitle>{openName}</DialogTitle>
            <DialogDescription>
              {openRegistration?.event?.title || openEvent?.title || 'Event application'}
              {openRegistration?.createdAt ? ` · Submitted ${formatWhen(openRegistration.createdAt)}` : ''}
            </DialogDescription>
          </DialogHeader>
          {openRegistration ? (
            <div className="max-h-[min(70vh,640px)] space-y-5 overflow-y-auto px-6 py-5">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">Email</dt>
                  <dd className="mt-1 break-all text-sm text-foreground">{openRegistration.email || '—'}</dd>
                </div>
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">Phone</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {openRegistration.phone || answerValue(openRegistration.answerRows, ['phone number', 'phone']) || '—'}
                  </dd>
                </div>
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">Event</dt>
                  <dd className="mt-1 text-sm text-foreground">{openRegistration.event?.title || openEvent?.title || '—'}</dd>
                </div>
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">Event date</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {formatWhen(openRegistration.event?.startDate || openEvent?.startDate)}
                  </dd>
                </div>
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3 sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">Location</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {openRegistration.event?.location || openEvent?.location || '—'}
                  </dd>
                </div>
              </dl>

              <section>
                <h2 className="text-sm font-semibold text-foreground">Answers</h2>
                {openAnswers.length === 0 ? (
                  <p className="mt-2 text-sm text-foreground/60">No answers were submitted.</p>
                ) : (
                  <dl className="mt-3 divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
                    {openAnswers.map((answer) => (
                      <div key={answer.key} className="grid gap-1 bg-background px-4 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
                        <dt className="text-sm font-medium text-foreground/70">{answer.label}</dt>
                        <dd className="text-sm text-foreground break-words">{answer.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={exportOpen}
        onOpenChange={(open) => {
          setExportOpen(open);
          if (!open) setExportError('');
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border/70 bg-muted/30 px-6 py-5">
            <DialogTitle>Export registrations</DialogTitle>
            <DialogDescription>
              All {exportTargets.length} application{exportTargets.length === 1 ? '' : 's'} will be exported. Choose the fields to include.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(60vh,480px)] space-y-4 overflow-y-auto px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">Fields</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const everyKey = exportColumns.map((column) => column.key);
                  setExportFieldKeys((current) => (current.length === everyKey.length ? [] : everyKey));
                }}
              >
                {exportFieldKeys.length === exportColumns.length ? 'Clear all' : 'Select all'}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {exportColumns.map((column) => (
                <label key={column.key} className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm">
                  <Checkbox
                    checked={exportFieldKeys.includes(column.key)}
                    onCheckedChange={(checked) => {
                      setExportFieldKeys((current) =>
                        checked === true ? [...current, column.key] : current.filter((key) => key !== column.key),
                      );
                    }}
                    aria-label={column.label}
                  />
                  <span className="min-w-0 truncate">{column.label}</span>
                </label>
              ))}
            </div>
            {exportError ? <p className="text-sm text-red-600">{exportError}</p> : null}
          </div>
          <DialogFooter className="border-t border-border/70 bg-muted/20 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)} disabled={exporting !== null}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={() => void runExport('excel')} disabled={exporting !== null}>
              {exporting === 'excel' ? 'Preparing Excel…' : 'Download Excel'}
            </Button>
            <Button type="button" onClick={() => void runExport('pdf')} disabled={exporting !== null}>
              {exporting === 'pdf' ? 'Preparing PDF…' : 'Download PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
