'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, ImagePlus, Loader2, Pencil, Plus, Power, PowerOff, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { adminErrorToast, adminSuccessToast, readApiMessage } from '@/components/admin/admin-toast';
import { useMediaUpload, type MediaUploadPurpose } from '@/hooks/use-media-upload';
import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import { parseContentItems, type ContentItem, type ContentSeed } from '@/lib/content-items';
import { cn } from '@/lib/utils';

type BaseField = 'title' | 'subtitle' | 'body' | 'imageUrl' | 'linkUrl';

export type CollectionField = {
  /** A column of the item, or `data.<key>` for an extra detail. */
  name: BaseField | `data.${string}`;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'image' | 'url' | 'select';
  placeholder?: string;
  help?: string;
  options?: string[];
  required?: boolean;
};

type Draft = Record<string, string>;

const readField = (item: ContentItem, name: CollectionField['name']): string => {
  if (name.startsWith('data.')) {
    const value = item.data[name.slice(5)];
    return value === undefined || value === null ? '' : String(value);
  }
  return String(item[name as BaseField] ?? '');
};

export default function ContentCollectionManager({
  token,
  collection,
  title,
  description,
  fields,
  seeds = [],
  itemLabel = 'item',
  uploadPurpose = 'page-images',
  sortable = true,
  /** Sort the admin list for display, e.g. themes newest year first. */
  displaySort,
  showViews = false,
}: {
  token: string;
  collection: string;
  title: string;
  description?: string;
  fields: CollectionField[];
  seeds?: ContentSeed[];
  itemLabel?: string;
  uploadPurpose?: MediaUploadPurpose;
  sortable?: boolean;
  displaySort?: (a: ContentItem, b: ContentItem) => number;
  showViews?: boolean;
}) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { runUpload, progress, uploading } = useMediaUpload();

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);
  const base = `/api/admin/content/${collection}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(base, { headers });
      if (!response.ok) {
        adminErrorToast(await readApiMessage(response, { fallback: `Unable to load ${title.toLowerCase()}.` }));
        return;
      }
      const data = await response.json();
      setItems(parseContentItems(data.items));
    } finally {
      setLoading(false);
    }
  }, [base, headers, title]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayed = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? items.filter((item) => `${item.title} ${item.subtitle} ${item.body} ${JSON.stringify(item.data)}`.toLowerCase().includes(term))
      : items;
    return displaySort ? [...list].sort(displaySort) : list;
  }, [items, search, displaySort]);

  const openNew = () => {
    setEditing(null);
    setDraft(Object.fromEntries(fields.map((field) => [field.name, field.type === 'select' ? field.options?.[0] || '' : ''])));
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditing(item);
    setDraft(Object.fromEntries(fields.map((field) => [field.name, readField(item, field.name)])));
    setFormError('');
    setDialogOpen(true);
  };

  const buildPayload = (values: Draft, existing?: ContentItem | null) => {
    const payload: Record<string, unknown> = {};
    const data: Record<string, unknown> = { ...(existing?.data || {}) };
    for (const field of fields) {
      const raw = (values[field.name] ?? '').trim();
      if (field.name.startsWith('data.')) {
        const key = field.name.slice(5);
        if (!raw) delete data[key];
        else data[key] = field.type === 'number' && Number.isFinite(Number(raw)) ? Number(raw) : raw;
      } else {
        payload[field.name] = raw;
      }
    }
    payload.data = data;
    return payload;
  };

  const save = async () => {
    for (const field of fields) {
      if ((field.required || field.name === 'title') && !(draft[field.name] || '').trim()) {
        setFormError(`${field.label} is required.`);
        return;
      }
    }
    setSaving(true);
    setFormError('');
    try {
      const response = await apiFetch(editing ? `${base}/${editing.id}` : base, {
        method: editing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(buildPayload(draft, editing)),
      });
      if (!response.ok) {
        setFormError(await readApiMessage(response, { fallback: 'Unable to save.' }));
        return;
      }
      adminSuccessToast(editing ? 'Changes saved.' : `${itemLabel[0].toUpperCase()}${itemLabel.slice(1)} added.`);
      setDialogOpen(false);
      void load();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: ContentItem) => {
    setBusyId(item.id);
    try {
      const response = await apiFetch(`${base}/${item.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!response.ok) {
        adminErrorToast(await readApiMessage(response, { fallback: 'Unable to update.' }));
        return;
      }
      adminSuccessToast(item.isActive ? 'Hidden from the website.' : 'Showing on the website.');
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, isActive: !entry.isActive } : entry)));
    } finally {
      setBusyId(null);
    }
  };

  const remove = (item: ContentItem) => {
    confirmDeleteToast({
      title: `Delete this ${itemLabel}?`,
      description: item.title,
      onConfirm: async () => {
        const response = await apiFetch(`${base}/${item.id}`, { method: 'DELETE', headers });
        if (!response.ok) {
          adminErrorToast(await readApiMessage(response, { fallback: 'Unable to delete.' }));
          return;
        }
        adminSuccessToast('Deleted.');
        setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      },
    });
  };

  const move = async (item: ContentItem, direction: -1 | 1) => {
    const index = items.findIndex((entry) => entry.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    const response = await apiFetch(`${base}/order`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ids: next.map((entry) => entry.id) }),
    });
    if (!response.ok) {
      adminErrorToast('Unable to save the new order.');
      void load();
    }
  };

  const importSeeds = async () => {
    const response = await apiFetch(`${base}/seed`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ items: seeds }),
    });
    if (!response.ok) {
      adminErrorToast(await readApiMessage(response, { fallback: 'Unable to load the current website items.' }));
      return;
    }
    adminSuccessToast('Current website items loaded. You can now edit them.');
    void load();
  };

  const imageField = fields.find((field) => field.type === 'image');
  const subtitleField = fields.find((field) => field.name === 'subtitle');

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-foreground/65">{description}</p> : null}
          <p className="mt-1 text-xs text-foreground/50">
            {items.length} total · {items.filter((item) => item.isActive).length} showing on the website
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!loading && items.length === 0 && seeds.length ? (
            <Button type="button" variant="outline" onClick={() => void importSeeds()} className="gap-2">
              <Download className="h-4 w-4" /> Load current website items
            </Button>
          ) : null}
          <Button type="button" onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Add {itemLabel}
          </Button>
        </div>
      </div>

      {items.length > 6 ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-foreground/40" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}`}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : displayed.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-foreground/60">
          {items.length
            ? 'Nothing matches your search.'
            : seeds.length
              ? 'The website is showing its built-in items. Load them to start editing, or add a new one.'
              : `No ${itemLabel}s yet.`}
        </p>
      ) : (
        <ul className="max-h-[620px] divide-y divide-border/60 overflow-auto rounded-xl border border-border/60">
          {displayed.map((item) => {
            const image = imageField ? resolveMediaImageUrl(readField(item, imageField.name)) : null;
            const orderIndex = items.findIndex((entry) => entry.id === item.id);
            return (
              <li key={item.id} className={cn('flex items-center gap-3 px-3 py-3', !item.isActive && 'bg-muted/40')}>
                {imageField ? (
                  image ? (
                    <img src={image} alt="" className={cn('h-12 w-16 shrink-0 rounded-md object-cover', !item.isActive && 'opacity-50 grayscale')} />
                  ) : (
                    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-foreground/30"><ImagePlus className="h-4 w-4" /></div>
                  )
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate font-medium', item.isActive ? 'text-foreground' : 'text-foreground/50')}>{item.title}</p>
                  {subtitleField && item.subtitle ? <p className="truncate text-xs text-foreground/55">{item.subtitle}</p> : null}
                </div>
                {!item.isActive ? <Badge variant="outline" className="hidden text-foreground/55 sm:inline-flex">Hidden</Badge> : null}
                {showViews ? <span className="hidden text-xs text-foreground/50 sm:inline">{item.views.toLocaleString()} plays</span> : null}
                <div className="flex shrink-0 items-center">
                  {sortable && !displaySort && !search ? (
                    <>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Move up" disabled={orderIndex === 0} onClick={() => void move(item, -1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Move down" disabled={orderIndex === items.length - 1} onClick={() => void move(item, 1)}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : null}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    disabled={busyId === item.id}
                    aria-label={item.isActive ? 'Deactivate' : 'Activate'}
                    title={item.isActive ? 'Deactivate (hide from website)' : 'Activate (show on website)'}
                    onClick={() => void toggle(item)}
                  >
                    {item.isActive ? <Power className="h-4 w-4 text-emerald-600" /> : <PowerOff className="h-4 w-4 text-foreground/40" />}
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Edit" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Delete" onClick={() => remove(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `Edit ${itemLabel}` : `Add ${itemLabel}`}
        description="Changes show on the website straight after saving."
        saving={saving || uploading}
        saveLabel={editing ? 'Save changes' : `Add ${itemLabel}`}
        onSave={() => void save()}
        onCancel={() => setDialogOpen(false)}
        maxWidthClass="sm:max-w-2xl"
      >
        <div className="space-y-4">
          {formError ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p> : null}
          {fields.map((field) => {
            const value = draft[field.name] ?? '';
            const set = (next: string) => setDraft((prev) => ({ ...prev, [field.name]: next }));
            const inputClass = 'mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm';
            // Image fields hold their own upload <label>, and labels cannot nest.
            const Wrapper = field.type === 'image' ? 'div' : 'label';
            return (
              <Wrapper key={field.name} className="block">
                <span className="text-sm font-medium">{field.label}{field.required || field.name === 'title' ? ' *' : ''}</span>
                {field.type === 'textarea' ? (
                  <textarea value={value} onChange={(event) => set(event.target.value)} rows={5} placeholder={field.placeholder} className={inputClass} />
                ) : field.type === 'select' ? (
                  <select value={value} onChange={(event) => set(event.target.value)} className={inputClass}>
                    {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : field.type === 'image' ? (
                  <div className="mt-1 grid gap-3 sm:grid-cols-[1fr_140px]">
                    <div>
                      <input value={value} onChange={(event) => set(event.target.value)} placeholder="Paste an image link or upload" className={inputClass.replace('mt-1 ', '')} />
                      <div className="mt-2 flex gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
                          <ImagePlus className="h-4 w-4" /> {value ? 'Replace picture' : 'Upload picture'}
                          <input
                            type="file"
                            accept="image/*,.heic,.heif,.avif"
                            className="hidden"
                            onChange={async (event) => {
                              const file = event.currentTarget.files?.[0];
                              event.currentTarget.value = '';
                              if (!file) return;
                              if (file.size > 1_000_000) {
                                setFormError('Images must be smaller than 1MB. Please compress the picture first.');
                                return;
                              }
                              try {
                                set(await runUpload(file, uploadPurpose));
                              } catch (error) {
                                setFormError(error instanceof Error ? error.message : 'Upload failed.');
                              }
                            }}
                          />
                        </label>
                        {value ? (
                          <button type="button" onClick={() => set('')} className="rounded-full px-3 text-xs font-semibold text-destructive hover:bg-destructive/10">
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <MediaUploadProgress uploading={uploading} progress={progress} className="mt-2" />
                    </div>
                    {value ? (
                      <img src={resolveMediaImageUrl(value) || value} alt="" className="h-24 w-full rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-lg bg-muted text-xs text-foreground/45">No picture</div>
                    )}
                  </div>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                    value={value}
                    onChange={(event) => set(event.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                )}
                {field.help ? <span className="mt-1 block text-xs text-foreground/50">{field.help}</span> : null}
              </Wrapper>
            );
          })}
        </div>
      </SchoolAdminDialogShell>
    </section>
  );
}
