'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type PartnershipDetail = {
  label: string;
  value: string;
};

export type MinistryInfo = {
  id?: string;
  ministryKey: string;
  name: string | null;
  motto: string | null;
  about: string | null;
  heroImageUrl: string | null;
  logoImageUrl: string | null;
  liveSessionYoutubeUrl: string | null;
  partnershipTitle: string | null;
  partnershipBody: string | null;
  partnershipDetails: PartnershipDetail[] | null;
  partnershipImageUrl: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  contactIntro: string | null;
};

export type MinistryItem = {
  id: string;
  ministryKey: string;
  category: string;
  title: string;
  description: string | null;
  label: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  acceptsOnlinePayment?: boolean;
  paymentAmount?: number | null;
  paymentCurrency?: string | null;
  paymentAccount?: string | null;
  createdAt: string;
  isFallback?: boolean;
};

type MinistryInfoDraft = Omit<MinistryInfo, 'id' | 'ministryKey'>;
type MinistryInfoField = keyof MinistryInfoDraft | 'partnershipDetails';
type MinistryItemDraft = {
  title: string;
  description: string;
  label: string;
  imageUrl: string;
  sortOrder: string;
  isPublished: boolean;
  acceptsOnlinePayment: boolean;
  paymentAmount: string;
  paymentCurrency: string;
  paymentAccount: string;
};

const toInput = (value: string | null | undefined) => value || '';
const toNullable = (value: string) => {
  const trimmed = value.trim();
  return trimmed || null;
};

const toPreviewUrl = (value: string | null | undefined) => {
  const trimmed = toInput(value).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const mergeItemsWithFallback = (loaded: MinistryItem[], fallback: MinistryItem[]) => {
  if (!loaded.length) return fallback;
  if (!fallback.length) return loaded;

  const remainingFallback = fallback.filter(
    (fallbackItem) =>
      !loaded.some(
        (loadedItem) =>
          loadedItem.category === fallbackItem.category &&
          loadedItem.sortOrder === fallbackItem.sortOrder,
      ),
  );

  return [...loaded, ...remainingFallback].sort((first, second) => {
    const sortDifference = (first.sortOrder ?? 0) - (second.sortOrder ?? 0);
    if (sortDifference !== 0) return sortDifference;
    if (first.isFallback !== second.isFallback) return first.isFallback ? 1 : -1;
    return first.title.localeCompare(second.title);
  });
};

const normalizeDetails = (value: unknown): PartnershipDetail[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const detail = item as Record<string, unknown>;
      const label = typeof detail.label === 'string' ? detail.label : '';
      const itemValue = typeof detail.value === 'string' ? detail.value : '';
      if (!label.trim() && !itemValue.trim()) return null;
      return { label, value: itemValue };
    })
    .filter((item): item is PartnershipDetail => Boolean(item));
};

async function uploadMinistryImage(token: string, file: File, setStatus: (value: string) => void) {
  if (!file.type.startsWith('image/')) {
    setStatus('Please upload an image file.');
    return null;
  }

  if (file.size > 1_000_000) {
    setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiFetch('/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const message = typeof data?.error === 'string' ? data.error : 'Image upload failed.';
      setStatus(message);
      return null;
    }

    const data = await response.json().catch(() => null);
    const rawUrl = typeof data?.url === 'string' ? data.url : '';
    if (!rawUrl) {
      setStatus('Image upload failed.');
      return null;
    }

    return rawUrl;
  } catch {
    setStatus('Image upload failed.');
    return null;
  }
}

export function MinistryInfoManager({
  token,
  ministryKey,
  ministryName,
  fallbackInfo,
  visibleFields,
  fieldLabels = {},
  showExtraSaveButtons = true,
}: {
  token: string;
  ministryKey: string;
  ministryName: string;
  fallbackInfo: MinistryInfoDraft;
  visibleFields?: MinistryInfoField[];
  fieldLabels?: Partial<Record<MinistryInfoField, string>>;
  showExtraSaveButtons?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [draft, setDraft] = useState<MinistryInfoDraft>(fallbackInfo);
  const [activeField, setActiveField] = useState<MinistryInfoField>('name');

  const baseUrl = useMemo(() => `/api/admin/ministries/${encodeURIComponent(ministryKey)}`, [ministryKey]);
  const isVisible = (field: MinistryInfoField) => !visibleFields || visibleFields.includes(field);

  const mergeInfo = (info: Partial<MinistryInfo> | null | undefined): MinistryInfoDraft => {
    const hasSavedInfo = Boolean(info);

    return {
      name: info?.name ?? fallbackInfo.name,
      motto: info?.motto ?? fallbackInfo.motto,
      about: info?.about ?? fallbackInfo.about,
      heroImageUrl: hasSavedInfo ? info?.heroImageUrl ?? null : fallbackInfo.heroImageUrl,
      logoImageUrl: hasSavedInfo ? info?.logoImageUrl ?? null : fallbackInfo.logoImageUrl,
      liveSessionYoutubeUrl: info?.liveSessionYoutubeUrl ?? fallbackInfo.liveSessionYoutubeUrl,
      partnershipTitle: info?.partnershipTitle ?? fallbackInfo.partnershipTitle,
      partnershipBody: info?.partnershipBody ?? fallbackInfo.partnershipBody,
      partnershipDetails: normalizeDetails(info?.partnershipDetails).length
        ? normalizeDetails(info?.partnershipDetails)
        : fallbackInfo.partnershipDetails,
      partnershipImageUrl: hasSavedInfo ? info?.partnershipImageUrl ?? null : fallbackInfo.partnershipImageUrl,
      phone: info?.phone ?? fallbackInfo.phone,
      email: info?.email ?? fallbackInfo.email,
      location: info?.location ?? fallbackInfo.location,
      contactIntro: info?.contactIntro ?? fallbackInfo.contactIntro,
    };
  };

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(`${baseUrl}/content`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setStatus('Unable to load ministry info.');
        setDraft(fallbackInfo);
        return;
      }
      const data = await response.json().catch(() => ({}));
      setDraft(mergeInfo(data?.info));
    } catch {
      setStatus('Unable to load ministry info.');
      setDraft(fallbackInfo);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token]);

  const update = (field: keyof MinistryInfoDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: toNullable(value) }));
  };

  const updateDetail = (index: number, field: keyof PartnershipDetail, value: string) => {
    setDraft((prev) => {
      const details = [...(prev.partnershipDetails ?? [])];
      details[index] = { ...(details[index] ?? { label: '', value: '' }), [field]: value };
      return { ...prev, partnershipDetails: details };
    });
  };

  const save = async () => {
    setIsSaving(true);
    setStatus('');
    try {
      const response = await apiFetch(`${baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        setStatus('Unable to save ministry info.');
        return;
      }

      const data = await response.json().catch(() => ({}));
      setDraft(mergeInfo(data?.info));
      setUploadName('');
      setStatus('Ministry info saved.');
    } catch {
      setStatus('Unable to save ministry info.');
    } finally {
      setIsSaving(false);
    }
  };

  const pageInfoFields = useMemo(
    () =>
      [
        { field: 'name' as const, label: fieldLabels.name || 'Name', kind: 'text' as const, placeholder: ministryName },
        { field: 'motto' as const, label: fieldLabels.motto || 'Motto', kind: 'text' as const, placeholder: 'Raising leaders...' },
        { field: 'about' as const, label: fieldLabels.about || 'About Text', kind: 'textarea' as const, rows: 8 },
        { field: 'logoImageUrl' as const, label: fieldLabels.logoImageUrl || 'Logo', kind: 'image' as const },
        { field: 'heroImageUrl' as const, label: fieldLabels.heroImageUrl || 'Hero Picture', kind: 'image' as const },
        { field: 'partnershipTitle' as const, label: fieldLabels.partnershipTitle || 'Partnership Title', kind: 'text' as const, placeholder: 'Partner With Us' },
        { field: 'partnershipBody' as const, label: fieldLabels.partnershipBody || 'Partnership Text', kind: 'textarea' as const, rows: 6 },
        { field: 'partnershipDetails' as const, label: fieldLabels.partnershipDetails || 'Partnership Details', kind: 'details' as const },
        { field: 'partnershipImageUrl' as const, label: fieldLabels.partnershipImageUrl || 'Partnership Picture', kind: 'image' as const },
        { field: 'contactIntro' as const, label: fieldLabels.contactIntro || 'Contact Intro', kind: 'textarea' as const, rows: 6 },
        { field: 'phone' as const, label: fieldLabels.phone || 'Phone Number', kind: 'text' as const, placeholder: '+265 ...' },
        { field: 'email' as const, label: fieldLabels.email || 'Email', kind: 'text' as const, placeholder: 'info@picc.org' },
        { field: 'location' as const, label: fieldLabels.location || 'Location', kind: 'textarea' as const, rows: 4 },
      ].filter((item) => isVisible(item.field)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fieldLabels, ministryName, visibleFields],
  );

  useEffect(() => {
    if (pageInfoFields.length > 0 && !pageInfoFields.some((item) => item.field === activeField)) {
      setActiveField(pageInfoFields[0].field);
    }
  }, [activeField, pageInfoFields]);

  const activeFieldConfig = pageInfoFields.find((item) => item.field === activeField) || pageInfoFields[0];

  const fieldSummary = (field: MinistryInfoField) => {
    if (field === 'partnershipDetails') {
      const details = draft.partnershipDetails ?? [];
      return details.length ? `${details.length} payment/detail row${details.length === 1 ? '' : 's'}` : 'No rows yet';
    }
    const value = draft[field as keyof MinistryInfoDraft];
    if (Array.isArray(value)) return `${value.length} rows`;
    const text = toInput(value as string | null | undefined).replace(/\s+/g, ' ').trim();
    if (!text) return 'Empty';
    return text.length > 110 ? `${text.slice(0, 110)}...` : text;
  };

  const renderActiveEditor = () => {
    if (!activeFieldConfig) return null;
    const { field, label, kind } = activeFieldConfig;

    if (kind === 'image') {
      const imageField = field as 'logoImageUrl' | 'heroImageUrl' | 'partnershipImageUrl';
      const previewUrl = toPreviewUrl(draft[imageField]);
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{label}</h2>
            <p className="mt-1 text-sm text-foreground/70">Upload or remove this image, then save your Page Info changes.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
            {previewUrl ? (
              <div className="relative h-64">
                <Image src={previewUrl} alt={label} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-foreground/50">No image selected</div>
            )}
          </div>
          <input
            type="file"
            accept="image/*,.heic,.heif,.avif"
            className="block w-full text-sm text-foreground/70 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (!file) return;
              const url = await uploadMinistryImage(token, file, setStatus);
              if (!url) return;
              setDraft((prev) => ({ ...prev, [imageField]: url }));
              setUploadName(file.name);
              setStatus(`${label} uploaded. Save changes to publish it.`);
            }}
          />
          {draft[imageField] ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft((prev) => ({ ...prev, [imageField]: null }));
                setStatus(`${label} removed. Save changes to publish it.`);
              }}
            >
              Remove Picture
            </Button>
          ) : null}
        </div>
      );
    }

    if (kind === 'details') {
      return (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{label}</h2>
              <p className="mt-1 text-sm text-foreground/70">Add rows such as bank, account name, account number, and branch.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDraft((prev) => ({ ...prev, partnershipDetails: [...(prev.partnershipDetails ?? []), { label: '', value: '' }] }))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>
          </div>
          <div className="space-y-3">
            {(draft.partnershipDetails ?? []).map((detail, index) => (
              <div key={`detail-${index}`} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.5fr_auto]">
                <input
                  value={detail.label}
                  onChange={(event) => updateDetail(index, 'label', event.target.value)}
                  placeholder="Bank"
                  className="rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
                <input
                  value={detail.value}
                  onChange={(event) => updateDetail(index, 'value', event.target.value)}
                  placeholder="National Bank"
                  className="rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, partnershipDetails: (prev.partnershipDetails ?? []).filter((_, itemIndex) => itemIndex !== index) }))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(draft.partnershipDetails ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-foreground/60">
                No payment/detail rows yet.
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    if (kind === 'textarea') {
      return (
        <TextArea
          label={label}
          value={toInput(draft[field as keyof MinistryInfoDraft] as string | null)}
          onChange={(value) => update(field as keyof MinistryInfoDraft, value)}
          rows={activeFieldConfig.rows}
        />
      );
    }

    return (
      <Field
        label={label}
        value={toInput(draft[field as keyof MinistryInfoDraft] as string | null)}
        onChange={(value) => update(field as keyof MinistryInfoDraft, value)}
        placeholder={activeFieldConfig.placeholder}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {status && (
        <div className={`rounded-xl p-4 text-sm ${status.includes('Unable') || status.includes('failed') || status.includes('too big') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {activeFieldConfig ? `Edit ${activeFieldConfig.label}` : `Edit ${ministryName} Content`}
              </h2>
              <p className="mt-1 text-sm text-foreground/70">Select a Page Info item from the current content list, then edit it here.</p>
            </div>
            <Button onClick={save} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div className="rounded-xl border border-border/60 bg-background p-5">
            {renderActiveEditor()}
            {uploadName ? <p className="mt-3 text-xs text-foreground/60">Last uploaded: {uploadName}</p> : null}
          </div>

          {showExtraSaveButtons && (
            <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-foreground/70">Done editing this section? Save your Page Info changes here.</p>
              <Button onClick={save} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        <div className="h-fit max-h-[780px] space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Current Page Info</h2>
            <p className="mt-1 text-xs text-foreground/60">Click any item to edit it.</p>
          </div>
          {pageInfoFields.map((item) => {
            const isActive = activeField === item.field;
            const isImage = item.kind === 'image';
            const imageUrl = isImage ? toPreviewUrl(draft[item.field as 'logoImageUrl' | 'heroImageUrl' | 'partnershipImageUrl']) : '';

            return (
              <button
                key={item.field}
                type="button"
                onClick={() => setActiveField(item.field)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  isActive ? 'border-primary bg-primary/5' : 'border-border/60 bg-background hover:border-primary/60'
                }`}
              >
                {imageUrl ? (
                  <div className="relative mb-3 h-28 overflow-hidden rounded-lg border border-border/60">
                    <Image src={imageUrl} alt={item.label} fill className="object-cover" unoptimized />
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                  {isActive ? <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">Editing</span> : null}
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-foreground/60">{fieldSummary(item.field)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MinistryItemsManager({
  token,
  ministryKey,
  category,
  title,
  description,
  fallbackItems = [],
  labels,
  showLabel = true,
  showSortOrder = true,
  showImage = true,
  showPaymentFields = false,
  defaultPaymentAccount = 'main',
  maxItems,
}: {
  token: string;
  ministryKey: string;
  category: string;
  title: string;
  description: string;
  fallbackItems?: Array<Partial<MinistryItem> & { title: string }>;
  labels?: {
    label?: string;
    title?: string;
    description?: string;
    image?: string;
    save?: string;
    formTitle?: string;
  };
  showLabel?: boolean;
  showSortOrder?: boolean;
  showImage?: boolean;
  showPaymentFields?: boolean;
  defaultPaymentAccount?: 'main' | 'youth';
  maxItems?: number;
}) {
  const [items, setItems] = useState<MinistryItem[]>([]);
  const [editingItem, setEditingItem] = useState<MinistryItem | null>(null);
  const [draft, setDraft] = useState<MinistryItemDraft>({
    title: '',
    description: '',
    label: '',
    imageUrl: '',
    sortOrder: '0',
    isPublished: true,
    acceptsOnlinePayment: false,
    paymentAmount: '',
    paymentCurrency: 'MWK',
    paymentAccount: defaultPaymentAccount,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const baseUrl = useMemo(() => `/api/admin/ministries/${encodeURIComponent(ministryKey)}`, [ministryKey]);
  const fallback = useMemo<MinistryItem[]>(
    () =>
      fallbackItems.map((item, index) => ({
        id: `fallback-${category}-${index}`,
        ministryKey,
        category,
        title: item.title,
        description: item.description ?? null,
        label: item.label ?? null,
        imageUrl: item.imageUrl ?? null,
        sortOrder: item.sortOrder ?? index,
        isPublished: item.isPublished ?? true,
        acceptsOnlinePayment: item.acceptsOnlinePayment ?? false,
        paymentAmount: item.paymentAmount ?? null,
        paymentCurrency: item.paymentCurrency ?? 'MWK',
        paymentAccount: item.paymentAccount ?? defaultPaymentAccount,
        createdAt: new Date().toISOString(),
        isFallback: true,
      })),
    [category, defaultPaymentAccount, fallbackItems, ministryKey],
  );

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(`${baseUrl}/content`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setItems(fallback);
        setStatus('Unable to load items.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      const loaded = Array.isArray(data?.items) ? data.items.filter((item: MinistryItem) => item.category === category) : [];
      setItems(mergeItemsWithFallback(loaded, fallback));
    } catch {
      setItems(fallback);
      setStatus('Unable to load items.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token, category]);

  const edit = (item: MinistryItem) => {
    setEditingItem(item);
    setDraft({
      title: item.title,
      description: item.description || '',
      label: item.label || '',
      imageUrl: item.imageUrl || '',
      sortOrder: String(item.sortOrder ?? 0),
      isPublished: item.isPublished,
      acceptsOnlinePayment: Boolean(item.acceptsOnlinePayment),
      paymentAmount:
        typeof item.paymentAmount === 'number'
          ? String(item.paymentAmount)
          : item.paymentAmount
            ? String(item.paymentAmount)
            : '',
      paymentCurrency: item.paymentCurrency || 'MWK',
      paymentAccount: item.paymentAccount || defaultPaymentAccount,
    });
  };

  const addNew = () => {
    if (typeof maxItems === 'number' && items.length >= maxItems) {
      setStatus(`Only ${maxItems} ${title.toLowerCase()} can be shown on the page. Delete one before adding another.`);
      return;
    }
    setEditingItem(null);
    setDraft({
      title: '',
      description: '',
      label: '',
      imageUrl: '',
      sortOrder: String(items.length),
      isPublished: true,
      acceptsOnlinePayment: false,
      paymentAmount: '',
      paymentCurrency: 'MWK',
      paymentAccount: defaultPaymentAccount,
    });
  };

  const save = async () => {
    if (!editingItem && typeof maxItems === 'number' && items.length >= maxItems) {
      setStatus(`Only ${maxItems} ${title.toLowerCase()} can be shown on the page. Delete one before adding another.`);
      return;
    }
    if (!draft.title.trim()) {
      setStatus('Please enter a title.');
      return;
    }
    if (showPaymentFields && draft.acceptsOnlinePayment && (!Number(draft.paymentAmount) || Number(draft.paymentAmount) <= 0)) {
      setStatus('Please enter the event payment amount.');
      return;
    }

    const isPersisted = Boolean(editingItem && !editingItem.isFallback);
    setSavingId(isPersisted && editingItem ? editingItem.id : 'new');
    setStatus('');

    try {
      const sortOrder = !editingItem && !showSortOrder ? items.length : Number(draft.sortOrder) || 0;
      const response = await apiFetch(isPersisted && editingItem ? `${baseUrl}/items/${encodeURIComponent(editingItem.id)}` : `${baseUrl}/items`, {
        method: isPersisted ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          label: draft.label.trim() || null,
          imageUrl: draft.imageUrl.trim() || null,
          sortOrder,
          isPublished: draft.isPublished,
          acceptsOnlinePayment: showPaymentFields ? draft.acceptsOnlinePayment : undefined,
          paymentAmount: showPaymentFields && draft.acceptsOnlinePayment ? Number(draft.paymentAmount) : null,
          paymentCurrency: showPaymentFields && draft.acceptsOnlinePayment ? draft.paymentCurrency : 'MWK',
          paymentAccount: showPaymentFields && draft.acceptsOnlinePayment ? draft.paymentAccount : defaultPaymentAccount,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = typeof data?.error === 'string' ? data.error : `Unable to ${isPersisted ? 'update' : 'add'} item.`;
        setStatus(message);
        return;
      }

      addNew();
      await refresh();
      setStatus(`Item ${isPersisted ? 'updated' : 'added'}.`);
    } catch {
      setStatus(`Unable to ${isPersisted ? 'update' : 'add'} item.`);
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (item: MinistryItem) => {
    if (item.isFallback) {
      setStatus('Fallback items cannot be deleted. Save it first if you want to customize it.');
      return;
    }

    try {
      const response = await apiFetch(`${baseUrl}/items/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok && response.status !== 204) {
        setStatus('Unable to delete item.');
        return;
      }
      if (editingItem?.id === item.id) addNew();
      await refresh();
      setStatus('Item deleted.');
    } catch {
      setStatus('Unable to delete item.');
    }
  };

  const requestRemove = (item: MinistryItem) => {
    if (item.isFallback) {
      setStatus('Fallback items cannot be deleted. Save it first if you want to customize it.');
      return;
    }

    const toastId = toast('Delete this item?', {
      description: item.title,
      duration: Infinity,
      action: {
        label: 'Delete',
        onClick: () => {
          toast.dismiss(toastId);
          void remove(item);
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => toast.dismiss(toastId),
      },
    });
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPersistedEdit = Boolean(editingItem && !editingItem.isFallback);
  const saveButtonText = labels?.save || 'Save Item';
  const limitReached = typeof maxItems === 'number' && items.length >= maxItems;
  const isCreatingNew = !editingItem;
  const itemLimitLabel = typeof maxItems === 'number' ? `${Math.min(items.length, maxItems)} / ${maxItems}` : null;

  return (
    <div className="space-y-6">
      {status && (
        <div className={`rounded-xl p-4 text-sm ${status.includes('Unable') || status.includes('Please') || status.includes('cannot') || status.includes('Only') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{labels?.formTitle || (isPersistedEdit ? `Update ${title}` : `Add ${title}`)}</h2>
              <p className="mt-1 text-sm text-foreground/70">{description}</p>
              {itemLimitLabel ? (
                <p className={`mt-2 text-xs font-semibold ${limitReached ? 'text-destructive' : 'text-primary'}`}>
                  {itemLimitLabel} items used. {limitReached ? 'Delete one before adding another.' : `Up to ${maxItems} items can be shown.`}
                </p>
              ) : null}
            </div>
            {editingItem ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={save} disabled={savingId !== null} className="gap-2">
                  {savingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saveButtonText}
                </Button>
                <Button variant="outline" onClick={addNew} disabled={limitReached}>
                  <Plus className="mr-2 h-4 w-4" />
                  New
                </Button>
              </div>
            ) : null}
          </div>

          <Field label={labels?.title || 'Title'} value={draft.title} onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))} placeholder="Title" />
          <TextArea label={labels?.description || 'Description'} value={draft.description} onChange={(value) => setDraft((prev) => ({ ...prev, description: value }))} rows={5} />
          {(showLabel || showSortOrder) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {showLabel && (
                <Field label={labels?.label || 'Label / Date / Status'} value={draft.label} onChange={(value) => setDraft((prev) => ({ ...prev, label: value }))} placeholder="Active, May 3, 2026, etc." />
              )}
              {showSortOrder && (
                <Field label="Sort Order" value={draft.sortOrder} onChange={(value) => setDraft((prev) => ({ ...prev, sortOrder: value }))} placeholder="0" type="number" />
              )}
            </div>
          )}

          {showImage && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">{labels?.image || 'Image'}</label>
              <input
                type="file"
                accept="image/*,.heic,.heif,.avif"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                onChange={async (event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = '';
                  if (!file) return;
                  const url = await uploadMinistryImage(token, file, setStatus);
                  if (url) setDraft((prev) => ({ ...prev, imageUrl: url }));
                }}
              />
              {draft.imageUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
                  <div className="relative h-40">
                    <Image src={toPreviewUrl(draft.imageUrl)} alt={draft.title || 'Preview'} fill className="object-cover" unoptimized />
                  </div>
                  <p className="break-all px-3 py-2 text-xs text-foreground/50">{draft.imageUrl}</p>
                </div>
              ) : null}
              {draft.imageUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setDraft((prev) => ({ ...prev, imageUrl: '' }));
                    setStatus(`${labels?.image || 'Image'} removed. Save changes to publish it.`);
                  }}
                >
                  Remove Image
                </Button>
              ) : null}
            </div>
          )}

          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(event) => setDraft((prev) => ({ ...prev, isPublished: event.target.checked }))}
            />
            Published
          </label>

          {showPaymentFields && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-background/50 p-4">
              <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={draft.acceptsOnlinePayment}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      acceptsOnlinePayment: event.target.checked,
                      paymentAmount: event.target.checked ? prev.paymentAmount : '',
                      paymentCurrency: event.target.checked ? prev.paymentCurrency : 'MWK',
                      paymentAccount: event.target.checked ? prev.paymentAccount || defaultPaymentAccount : defaultPaymentAccount,
                    }))
                  }
                />
                Allow users to pay for this event on the website
              </label>
              {draft.acceptsOnlinePayment && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[140px_1fr]">
                  <select
                    value={draft.paymentCurrency}
                    onChange={(event) => setDraft((prev) => ({ ...prev, paymentCurrency: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                    aria-label="Event payment currency"
                  >
                    <option value="MWK">MWK</option>
                    <option value="USD">USD</option>
                  </select>
                  <Field
                    label="Payment Amount"
                    value={draft.paymentAmount}
                    onChange={(value) => setDraft((prev) => ({ ...prev, paymentAmount: value }))}
                    placeholder="Event payment amount"
                    type="number"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
            <Button onClick={save} disabled={savingId !== null || (isCreatingNew && limitReached)} className="gap-2">
              {savingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saveButtonText}
            </Button>
            {isCreatingNew && limitReached ? (
              <p className="flex items-center text-sm font-medium text-destructive">
                Limit reached. Select an existing item to edit it, or delete one saved item first.
              </p>
            ) : null}
            {isPersistedEdit && editingItem ? (
              <Button variant="destructive" onClick={() => requestRemove(editingItem)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        <div className="h-fit max-h-[780px] space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Current {title}</h2>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => edit(item)}
              className={`w-full rounded-xl border p-4 text-left transition ${editingItem?.id === item.id ? 'border-primary bg-primary/5' : 'border-border/60 bg-background hover:border-primary/60'}`}
            >
              {item.imageUrl ? (
                <div className="relative mb-3 h-28 overflow-hidden rounded-lg border border-border/60">
                  <Image src={toPreviewUrl(item.imageUrl)} alt={item.title} fill className="object-cover" unoptimized />
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                {!item.isPublished ? <span className="rounded bg-destructive/10 px-2 py-1 text-[10px] font-bold uppercase text-destructive">Draft</span> : null}
              </div>
              {item.label ? <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{item.label}</p> : null}
              {item.description ? <p className="mt-2 line-clamp-2 text-xs text-foreground/60">{item.description}</p> : null}
              {item.acceptsOnlinePayment && item.paymentAmount ? (
                <p className="mt-2 text-xs font-semibold text-primary">
                  Online payment: {item.paymentCurrency || 'MWK'} {Number(item.paymentAmount).toLocaleString('en-US')}
                </p>
              ) : null}
              {item.isFallback ? <p className="mt-2 text-[10px] text-foreground/40">Fallback content ready to edit</p> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
