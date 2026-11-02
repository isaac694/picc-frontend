'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Loader2, Pencil, Plus, Search, SlidersHorizontal, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { adminErrorToast, adminSuccessToast, readApiMessage } from '@/components/admin/admin-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import {
  MEMBER_STATUS_LABELS,
  formatMemberValue,
  memberName,
  parseCsv,
  type Member,
  type MembershipField,
} from '@/lib/membership';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-600 hover:bg-emerald-600',
  inactive: 'bg-slate-500 hover:bg-slate-500',
  transferred: 'bg-sky-600 hover:bg-sky-600',
  deceased: 'bg-zinc-800 hover:bg-zinc-800',
};

const inputClass = 'mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm';

export default function MembershipRegisterPage() {
  const { token, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();
  const [fields, setFields] = useState<MembershipField[]>([]);
  const [statuses, setStatuses] = useState<string[]>(['active', 'inactive', 'transferred', 'deceased']);
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const [draftStatus, setDraftStatus] = useState('active');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);
  const activeFields = useMemo(() => fields.filter((field) => field.isActive), [fields]);
  const tableFields = useMemo(() => activeFields.filter((field) => field.showInTable).slice(0, 6), [activeFields]);

  const loadFields = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch('/api/admin/membership/fields', { headers });
    if (!response.ok) {
      adminErrorToast(await readApiMessage(response, { fallback: 'Unable to load membership fields.' }));
      return;
    }
    const data = await response.json();
    setFields(Array.isArray(data.fields) ? data.fields : []);
    if (Array.isArray(data.statuses)) setStatuses(data.statuses);
  }, [headers, token]);

  const loadMembers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const search = new URLSearchParams({ page: String(page), limit: '25', status: statusFilter });
      if (query) search.set('q', query);
      const response = await apiFetch(`/api/admin/membership/members?${search.toString()}`, { headers });
      if (!response.ok) {
        adminErrorToast(await readApiMessage(response, { fallback: 'Unable to load members.' }));
        return;
      }
      const data = await response.json();
      setMembers(Array.isArray(data.members) ? data.members : []);
      setTotal(Number(data.total) || 0);
      setPages(Number(data.pages) || 1);
    } finally {
      setLoading(false);
    }
  }, [headers, page, query, statusFilter, token]);

  useEffect(() => {
    void loadFields();
  }, [loadFields]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const openNew = () => {
    setEditing(null);
    setDraft({});
    setDraftStatus('active');
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setDraft(Object.fromEntries(Object.entries(member.data).map(([key, value]) => [key, typeof value === 'boolean' ? value : String(value ?? '')])));
    setDraftStatus(member.status);
    setFormError('');
    setDialogOpen(true);
  };

  const save = async () => {
    for (const field of activeFields) {
      if (field.isRequired && field.type !== 'checkbox' && !String(draft[field.key] ?? '').trim()) {
        setFormError(`${field.label} is required.`);
        return;
      }
    }
    setSaving(true);
    setFormError('');
    try {
      const response = await apiFetch(editing ? `/api/admin/membership/members/${editing.id}` : '/api/admin/membership/members', {
        method: editing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({ data: draft, status: draftStatus }),
      });
      if (!response.ok) {
        setFormError(await readApiMessage(response, { fallback: 'Unable to save this member.' }));
        return;
      }
      adminSuccessToast(editing ? 'Member updated.' : 'Member added.');
      setDialogOpen(false);
      void loadMembers();
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (member: Member, status: string) => {
    const response = await apiFetch(`/api/admin/membership/members/${member.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      adminErrorToast(await readApiMessage(response, { fallback: 'Unable to change status.' }));
      return;
    }
    adminSuccessToast(`Marked as ${MEMBER_STATUS_LABELS[status] || status}.`);
    setMembers((prev) => prev.map((entry) => (entry.id === member.id ? { ...entry, status } : entry)));
  };

  const remove = (member: Member) => {
    confirmDeleteToast({
      title: 'Delete this member record?',
      description: memberName(member, fields),
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/membership/members/${member.id}`, { method: 'DELETE', headers });
        if (!response.ok) {
          adminErrorToast('Unable to delete this member.');
          return;
        }
        adminSuccessToast('Member deleted.');
        void loadMembers();
      },
    });
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const response = await apiFetch(`/api/admin/membership/export?status=${statusFilter}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        adminErrorToast('Unable to download the membership register.');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `picc-membership-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) {
        adminErrorToast('The file has no rows. Save the spreadsheet as CSV with a heading row.');
        return;
      }
      // Columns may be named by the field label (as in our download) or by its key.
      const lookup = new Map<string, MembershipField>();
      for (const field of activeFields) {
        lookup.set(field.label.toLowerCase(), field);
        lookup.set(field.key.toLowerCase(), field);
      }
      const mapped = rows.map((row) => {
        const data: Record<string, string> = {};
        for (const [column, value] of Object.entries(row)) {
          const field = lookup.get(column.toLowerCase());
          if (field && value) data[field.key] = value;
        }
        return data;
      });
      const response = await apiFetch('/api/admin/membership/members/import', {
        method: 'POST',
        headers,
        body: JSON.stringify({ rows: mapped }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        adminErrorToast(data?.error || 'Import failed.');
        return;
      }
      const failed = Array.isArray(data.failed) ? data.failed : [];
      adminSuccessToast(`Imported ${data.created} member${data.created === 1 ? '' : 's'}.`);
      if (failed.length) {
        adminErrorToast(`${failed.length} row(s) skipped. First problem: row ${failed[0].row}: ${failed[0].error}`);
      }
      void loadMembers();
    } finally {
      setImporting(false);
    }
  };

  if (!token) {
    return (
      <AdminLoginCard email={email} password={password} loginError={loginError} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Membership department</p>
          <h1 className="text-2xl font-semibold md:text-3xl">Membership register</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {total.toLocaleString()} member record{total === 1 ? '' : 's'}. Choose the details you record under Fields.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/admin/membership/dashboard"><BarChart3 className="h-4 w-4" /> Statistics</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/admin/membership/fields"><SlidersHorizontal className="h-4 w-4" /> Fields</Link>
          </Button>
          <label className={cn('inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent', importing && 'pointer-events-none opacity-60')}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                if (file) void importCsv(file);
              }}
            />
          </label>
          <Button variant="outline" size="sm" className="gap-2" disabled={exporting} onClick={() => void exportCsv()}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download (Excel / CSV)
          </Button>
          <Button size="sm" className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Add member
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(queryInput.trim());
            setPage(1);
          }}
          className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
        >
          <Search className="h-4 w-4 text-foreground/40" />
          <input
            type="search"
            value={queryInput}
            onChange={(event) => {
              setQueryInput(event.target.value);
              if (!event.target.value) {
                setQuery('');
                setPage(1);
              }
            }}
            placeholder="Search name, phone, zone... then press Enter"
            className="w-full bg-transparent text-sm outline-none"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{MEMBER_STATUS_LABELS[status] || status}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : members.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {query || statusFilter !== 'all' ? 'No members match your search.' : 'No members yet. Add the first member or import a spreadsheet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  {tableFields.map((field) => <th key={field.id} className="whitespace-nowrap px-3 py-2 font-medium">{field.label}</th>)}
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t border-border/60">
                    {tableFields.map((field, index) => (
                      <td key={field.id} className={cn('px-3 py-2.5', index === 0 && 'font-medium')}>
                        {formatMemberValue(field, member.data[field.key]) || <span className="text-foreground/30">—</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2.5">
                      <Badge className={STATUS_STYLES[member.status] || ''}>{MEMBER_STATUS_LABELS[member.status] || member.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <select
                          value={member.status}
                          onChange={(event) => void changeStatus(member, event.target.value)}
                          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                          aria-label="Change status"
                        >
                          {statuses.map((status) => <option key={status} value={status}>{MEMBER_STATUS_LABELS[status] || status}</option>)}
                        </select>
                        <Button type="button" size="icon" variant="ghost" aria-label="Edit member" onClick={() => openEdit(member)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Delete member" onClick={() => remove(member)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 ? (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </div>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit member' : 'Add member'}
        description="Fields marked * are required. Change the list of fields under Membership fields."
        saving={saving}
        saveLabel={editing ? 'Save changes' : 'Add member'}
        onSave={() => void save()}
        onCancel={() => setDialogOpen(false)}
        maxWidthClass="sm:max-w-2xl"
      >
        <div className="space-y-4">
          {formError ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {activeFields.map((field) => {
              const value = draft[field.key];
              const set = (next: string | boolean) => setDraft((prev) => ({ ...prev, [field.key]: next }));
              const label = `${field.label}${field.isRequired ? ' *' : ''}`;
              if (field.type === 'checkbox') {
                return (
                  <label key={field.id} className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm sm:mt-6">
                    <input type="checkbox" checked={value === true} onChange={(event) => set(event.target.checked)} /> {label}
                  </label>
                );
              }
              return (
                <label key={field.id} className={cn('block', field.type === 'textarea' && 'sm:col-span-2')}>
                  <span className="text-sm font-medium">{label}</span>
                  {field.type === 'textarea' ? (
                    <textarea value={String(value ?? '')} onChange={(event) => set(event.target.value)} rows={3} className={inputClass} />
                  ) : field.type === 'select' ? (
                    <select value={String(value ?? '')} onChange={(event) => set(event.target.value)} className={inputClass}>
                      <option value="">Choose…</option>
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'phone' ? 'tel' : field.type}
                      value={String(value ?? '')}
                      onChange={(event) => set(event.target.value)}
                      className={inputClass}
                    />
                  )}
                </label>
              );
            })}
            <label className="block">
              <span className="text-sm font-medium">Membership status</span>
              <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)} className={inputClass}>
                {statuses.map((status) => <option key={status} value={status}>{MEMBER_STATUS_LABELS[status] || status}</option>)}
              </select>
            </label>
          </div>
        </div>
      </SchoolAdminDialogShell>
    </div>
  );
}
