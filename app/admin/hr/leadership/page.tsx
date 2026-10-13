'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import {
  Users,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  GitFork,
  ArrowUpDown,
  Search,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

type Group = 'church-admins' | 'secretariates';

type Person = {
  id: string;
  userId: string;
  designation: string;
  description: string | null;
  imageLinkPath: string | null;
  parentId: string | null;
  sortOrder: number;
  isPublished: boolean;
  regularStaff?: boolean;

  user: { id: string; name: string; email: string };
};

type User = { id: string; name: string; email: string };

type Form = {
  userId: string;
  designation: string;
  description: string;
  imageLinkPath: string;
  parentId: string;
  sortOrder: number;
  isPublished: boolean;

  regularStaff: boolean;
};

const blank: Form = {
  userId: '',
  designation: '',
  description: '',
  imageLinkPath: '',
  parentId: '',
  sortOrder: 0,
  isPublished: true,
  regularStaff: false
};

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="%23f1f5f9"/><circle cx="80" cy="62" r="30" fill="%23cbd5e1"/><path d="M26 142c0-29 24-52 54-52s54 23 54 52" fill="%23cbd5e1"/></svg>';

function pictureUrl(path?: string | null) {
  if (!path) return DEFAULT_AVATAR;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  return apiUrl(path.startsWith('/') ? path : `/${path}`);
}

export default function LeadershipManager() {
  const { token, user: adminUser } = useAdminAuth();
  const [group, setGroup] = useState<Group>('church-admins');
  const [records, setRecords] = useState<Person[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const { runUpload, progress, uploading } = useMediaUpload();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) {
      h.Authorization = `Bearer ${token}`;
    }
    return h;
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [resManage, resUsers] = await Promise.all([
        apiFetch(`/api/leadership-manage/${group}`, {
          headers: authHeaders,
        }),
        apiFetch('/api/leadership-users', {
          headers: authHeaders,
        }),
      ]);

      if (!resManage.ok || !resUsers.ok) {
        const manageErr = await resManage.json().catch(() => ({}));
        const usersErr = await resUsers.json().catch(() => ({}));
        const msg =
          manageErr.error ||
          usersErr.error ||
          'Could not load records. Please check that you are signed in as an administrator.';
        throw new Error(msg);
      }

      const recs = await resManage.json();
      const usrs = await resUsers.json();
      setRecords(recs);
      setUsers(usrs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load leadership records.';
      setError(msg);
      adminErrorToast(msg);
    } finally {
      setLoading(false);
    }
  }, [group, token, authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  function switchGroup(value: Group) {
    setGroup(value);
    setEditing(null);
    setForm(blank);
    setError('');
    setNotice('');
  }

  function edit(person: Person) {
    setEditing(person.id);

    setForm({
      userId: person.userId,
      designation: person.designation,
      description: person.description ?? '',
      imageLinkPath: person.imageLinkPath ?? '',
      parentId: person.parentId ?? '',
      sortOrder: person.sortOrder,
      isPublished: person.isPublished,
      regularStaff: person.regularStaff ?? false
    });

    setError('');
    setNotice('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function cancelEdit() {
    setEditing(null);
    setForm(blank);
    setError('');
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      adminErrorToast('Image size must be less than 2MB.');
      return;
    }

    try {
      const url = await runUpload(file, 'hr-leadership');
      setForm((prev) => ({ ...prev, imageLinkPath: url }));
      adminSuccessToast('Profile picture uploaded.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed';
      adminErrorToast(msg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      adminErrorToast('Authentication token missing. Please sign in again.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    try {
      const response = await apiFetch(`/api/${group}${editing ? `/${editing}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          parentId: form.parentId || null,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to save leadership profile.');
      }

      const successMsg = editing ? 'Leadership profile updated.' : 'Leadership profile created.';
      setNotice(successMsg);
      adminSuccessToast(successMsg);
      setForm(blank);
      setEditing(null);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to save.';
      setError(msg);
      adminErrorToast(msg);
    } finally {
      setBusy(false);
    }
  }

  async function remove(person: Person) {
    if (
      !window.confirm(
        `Delete ${person.user.name} from ${group === 'church-admins' ? 'Church Administration' : 'The Secretariat'}?\n\nAny direct reports will become top-level positions.`
      )
    ) {
      return;
    }

    if (!token) {
      adminErrorToast('Authentication token missing.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    try {
      const response = await apiFetch(`/api/${group}/${person.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Could not delete record.');
      }

      if (editing === person.id) {
        setEditing(null);
        setForm(blank);
      }

      await load();
      setNotice('Leadership profile deleted.');
      adminSuccessToast('Profile deleted successfully.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to delete.';
      setError(msg);
      adminErrorToast(msg);
    } finally {
      setBusy(false);
    }
  }

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.user.name.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q)
    );
  }, [records, search]);

  const activeGroupLabel = group === 'church-admins' ? 'Church Administration' : 'The Secretariat';
  const secretariatStats = useMemo(() => {
    if (group !== 'secretariates') {
      return null;
    }

    return {
      total: records.length,
      seniorOfficers: records.filter(
        (person) => !person.regularStaff
      ).length,
      regularStaff: records.filter(
        (person) => person.regularStaff
      ).length
    };
  }, [group, records]);
  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="mx-auto max-w-7xl pb-12">
        {/* Top Header Card */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Users className="h-3.5 w-3.5" />
                HR &amp; Governance
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Leadership Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure official roles, reporting hierarchy and display orders for the public leadership directory.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/about/leadership"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Public Page (/about/leadership)
            </Link>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-border/60 bg-muted/40 p-1.5">
          {(
            [
              ['church-admins', 'Church Administration', Building2],
              ['secretariates', 'The Secretariat', Users],
            ] as const
          ).map(([val, label, Icon]) => {
            const active = group === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => switchGroup(val)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${active
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-card/50 hover:text-foreground'
                  }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-amber-600' : 'text-muted-foreground'}`} />
                {label}
                <span
                  className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${active ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold' : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {group === val ? records.length : ''}
                </span>
              </button>
            );
          })}
        </div>

        {secretariatStats && (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Total Secretariat Members',
                value: secretariatStats.total
              },
              {
                label: 'Senior Officers',
                value: secretariatStats.seniorOfficers
              },
              {
                label: 'Regular Staff',
                value: secretariatStats.regularStaff
              }
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>

                <p className="mt-2 text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}


        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Unable to load leadership</p>
              <p className="mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => load()}
              className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-900 transition hover:bg-red-200 dark:bg-red-900 dark:text-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </div>
        )}

        {/* Two-column layout: Form on left, Directory list on right */}
        <div className="grid gap-6 lg:grid-cols-[410px_1fr]">
          {/* Form */}
          <section className="h-fit rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
            <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                {editing ? (
                  <Pencil className="h-4 w-4 text-amber-600" />
                ) : (
                  <Plus className="h-4 w-4 text-amber-600" />
                )}
                <h2 className="text-base font-bold text-foreground">
                  {editing ? 'Edit Profile' : `Add to ${activeGroupLabel}`}
                </h2>
              </div>
              {editing && (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Editing
                </span>
              )}
            </div>

            <form onSubmit={save} className="space-y-4">
              {/* Registered user select */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Registered User <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={form.userId}
                  onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-950"
                >
                  <option value="">Select registered user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  User accounts are managed under Admin &gt; Users.
                </p>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Official Designation <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  maxLength={191}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-950"
                  value={form.designation}
                  onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
                  placeholder="e.g. Chief Administration Officer"
                />
              </div>

              {/* Secretariat Staff Classification */}
              {group === 'secretariates' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Secretariat Staff Classification
                      <span className="text-destructive"> *</span>
                    </label>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Choose how this member should appear on the
                      public website.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label
                      className={`cursor-pointer rounded-xl border-2 p-4 transition ${!form.regularStaff
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                        : 'border-border hover:border-amber-300'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="staffClassification"
                          checked={!form.regularStaff}
                          onChange={() =>
                            setForm((previous) => ({
                              ...previous,
                              regularStaff: false
                            }))
                          }
                          className="accent-amber-600"
                        />

                        <span className="text-sm font-semibold text-foreground">
                          Senior Officer
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        Appears within the official Secretariat
                        organogram according to the reporting hierarchy.
                      </p>
                    </label>

                    <label
                      className={`cursor-pointer rounded-xl border-2 p-4 transition ${form.regularStaff
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                        : 'border-border hover:border-amber-300'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="staffClassification"
                          checked={form.regularStaff}
                          onChange={() =>
                            setForm((previous) => ({
                              ...previous,
                              regularStaff: true
                            }))
                          }
                          className="accent-amber-600"
                        />

                        <span className="text-sm font-semibold text-foreground">
                          Regular Staff
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        Appears in the separate Secretariat staff
                        directory, not in the organogram.
                      </p>
                    </label>
                  </div>
                </div>
              )}


              {/* Reports to (Parent in Hierarchy) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reports To (Hierarchy Parent)
                </label>
                <div className="relative mt-1.5">
                  <select
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-950"
                    value={form.parentId}
                    onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
                  >
                    <option value="">None — Top-level Position</option>
                    {records
                      .filter((r) => r.id !== editing)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.designation} — {r.user.name}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {group === 'secretariates' && form.regularStaff
                    ? 'Select the officer this staff member reports to. The reporting relationship will be stored internally, but the staff member will not appear on the public organogram.'
                    : 'Select the supervisor for this position in the official reporting hierarchy.'}
                </p>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sort Order
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-950"
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Lower numbers display first within the same level (0, 1, 2...).
                </p>
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Leader Photo
                </label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pictureUrl(form.imageLinkPath)}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="leadership-photo-input"
                    />
                    <label
                      htmlFor="leadership-photo-input"
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted ${uploading ? 'pointer-events-none opacity-50' : ''
                        }`}
                    >
                      <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                    <input
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground outline-none"
                      value={form.imageLinkPath}
                      onChange={(e) => setForm((p) => ({ ...p, imageLinkPath: e.target.value }))}
                      placeholder="Or enter path / URL"
                    />
                    <MediaUploadProgress uploading={uploading} progress={progress} />
                  </div>
                </div>
              </div>

              {/* Description / Responsibilities */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Responsibilities &amp; Bio
                </label>
                <textarea
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-950"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Key responsibilities and brief profile description..."
                />
              </div>

              {/* Published Toggle */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                  className="h-4 w-4 rounded border-input text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-semibold">Published on Public Website</span>
                  <p className="text-[11px] text-muted-foreground">
                    When checked, this profile is visible to visitors on /about/leadership.
                  </p>
                </div>
              </label>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={busy || uploading}
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-500"
                >
                  {busy ? 'Saving...' : editing ? 'Update Profile' : 'Add Profile'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Directory & Records List */}
          <section className="flex flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Current Directory ({activeGroupLabel})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Profiles are arranged by sort order and hierarchy.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search people..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-48 rounded-lg border border-input bg-background py-1.5 pl-8 pr-2.5 text-xs text-foreground outline-none focus:border-amber-600 sm:w-60"
                  />
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {filteredRecords.length}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                Loading leadership directory...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                <Users className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-semibold text-foreground">No leadership profiles found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {records.length === 0
                    ? `No ${activeGroupLabel.toLowerCase()} records have been created yet. Use the form on the left to add one.`
                    : 'No profiles match your search term.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecords.map((r) => {
                  const supervisor = records.find((p) => p.id === r.parentId);
                  return (
                    <div
                      key={r.id}
                      className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 transition hover:border-border hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pictureUrl(r.imageLinkPath)}
                            alt={r.user.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_AVATAR;
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold text-foreground">
                              {r.user.name}
                            </h3>

                            {group === 'secretariates' && (
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${r.regularStaff
                                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                  }`}
                              >
                                {r.regularStaff ? 'Regular Staff' : 'Senior Officer'}
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${r.isPublished
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground'
                                }`}
                            >
                              {r.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>

                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            {r.designation}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <GitFork className="h-3 w-3" />
                              Reports to: <strong className="text-foreground">{supervisor ? supervisor.user.name : 'Top Level'}</strong>
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <ArrowUpDown className="h-3 w-3" />
                              Order: <strong className="text-foreground">{r.sortOrder}</strong>
                            </span>
                            <span>•</span>
                            <span>{r.user.email}</span>
                          </div>

                          {r.description && (
                            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                              {r.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => edit(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => remove(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
