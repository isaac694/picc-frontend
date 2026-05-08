'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

type SchoolLesson = {
  title: string;
  description: string;
  num?: string | null;
};

type SchoolCoreValue = {
  name: string;
};

type SchoolInfo = {
  id?: string;
  schoolKey: string;
  header: string | null;
  motto: string | null;
  about: string | null;
  mission: string | null;
  vision: string | null;
  heroImageUrl: string | null;
  logoImageUrl: string | null;
  missionImageUrl: string | null;
  coreValuesImageUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  lessons: SchoolLesson[] | null;
  coreValues: SchoolCoreValue[] | null;
};

type SchoolInfoField = Exclude<keyof SchoolInfo, 'id' | 'schoolKey'>;
type FocusableSchoolInfoField = Exclude<SchoolInfoField, 'lessons' | 'coreValues'>;
type CollectionField = 'lessons' | 'coreValues';

type EditorSelection =
  | { kind: 'field'; field: FocusableSchoolInfoField }
  | { kind: 'lesson'; index: number }
  | { kind: 'coreValue'; index: number };

type SchoolInfoManagerConfig = {
  hiddenFields?: SchoolInfoField[];
  labels?: Partial<Record<SchoolInfoField, string>>;
  editorDescription?: string;
  useFallbackWhenRecordExists?: boolean;
  collectionEditors?: Partial<
    Record<
      CollectionField,
      {
        label: string;
        description?: string;
      }
    >
  >;
};

const buildEmptyInfo = (schoolKey: string): SchoolInfo => ({
  schoolKey,
  header: null,
  motto: null,
  about: null,
  mission: null,
  vision: null,
  heroImageUrl: null,
  logoImageUrl: null,
  missionImageUrl: null,
  coreValuesImageUrl: null,
  phone: null,
  email: null,
  address: null,
  lessons: null,
  coreValues: null,
});

const toInputValue = (value: string | null | undefined) => value || '';
const toNullable = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeLesson = (value: unknown): SchoolLesson | null => {
  if (!value || typeof value !== "object") return null;
  const lesson = value as Record<string, unknown>;
  const title = toNullable(typeof lesson.title === 'string' ? lesson.title : '');
  const description = toNullable(typeof lesson.description === 'string' ? lesson.description : '');
  const num = toNullable(typeof lesson.num === 'string' ? lesson.num : '');

  if (!title && !description) return null;

  return {
    title: title || '',
    description: description || '',
    num,
  };
};

const normalizeCoreValue = (value: unknown): SchoolCoreValue | null => {
  if (!value || typeof value !== "object") return null;
  const coreValue = value as Record<string, unknown>;
  const name = toNullable(typeof coreValue.name === 'string' ? coreValue.name : '');

  if (!name) return null;

  return {
    name: name || '',
  };
};

const normalizeLessons = (value: unknown): SchoolLesson[] | null => {
  if (!Array.isArray(value)) return null;
  const lessons = value.map(normalizeLesson).filter((item): item is SchoolLesson => Boolean(item));
  return lessons;
};

const normalizeCoreValues = (value: unknown): SchoolCoreValue[] | null => {
  if (!Array.isArray(value)) return null;
  const coreValues = value.map(normalizeCoreValue).filter((item): item is SchoolCoreValue => Boolean(item));
  return coreValues;
};

const buildSnippet = (value: string | null | undefined) => {
  const normalized = toInputValue(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Not provided';
  return normalized.length > 100 ? `${normalized.slice(0, 100)}...` : normalized;
};

const imageFields: FocusableSchoolInfoField[] = [
  'heroImageUrl',
  'logoImageUrl',
  'missionImageUrl',
  'coreValuesImageUrl',
];

const isImageField = (field: FocusableSchoolInfoField) => imageFields.includes(field);

const toPreviewUrl = (value: string | null | undefined) => {
  const trimmed = toInputValue(value).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const isSelectionValid = (
  selection: EditorSelection | null,
  info: SchoolInfo,
  hiddenFields: Set<SchoolInfoField>,
  collectionEditors?: SchoolInfoManagerConfig['collectionEditors'],
) => {
  if (!selection) return false;
  if (selection.kind === 'field') return !hiddenFields.has(selection.field);
  if (selection.kind === 'lesson') {
    return Boolean(collectionEditors?.lessons) && selection.index >= 0 && selection.index < (info.lessons?.length ?? 0);
  }
  return Boolean(collectionEditors?.coreValues) && selection.index >= 0 && selection.index < (info.coreValues?.length ?? 0);
};

const getDefaultSelection = (
  info: SchoolInfo,
  hiddenFields: Set<SchoolInfoField>,
  collectionEditors?: SchoolInfoManagerConfig['collectionEditors'],
): EditorSelection => {
  const fieldOrder: FocusableSchoolInfoField[] = [
    'header',
    'motto',
    'about',
    'mission',
    'vision',
    'heroImageUrl',
    'logoImageUrl',
    'missionImageUrl',
    'coreValuesImageUrl',
    'phone',
    'email',
    'address',
  ];

  for (const field of fieldOrder) {
    if (!hiddenFields.has(field)) {
      return { kind: 'field', field };
    }
  }

  if (collectionEditors?.lessons) {
    return { kind: 'lesson', index: 0 };
  }

  if (collectionEditors?.coreValues) {
    return { kind: 'coreValue', index: 0 };
  }

  return { kind: 'field', field: 'header' };
};

export default function SchoolInfoManager({
  token,
  schoolKey,
  schoolName,
  fallbackInfo,
  config,
}: {
  token: string;
  schoolKey: string;
  schoolName: string;
  fallbackInfo?: Partial<SchoolInfo>;
  config?: SchoolInfoManagerConfig;
}) {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedInfo, setSavedInfo] = useState<SchoolInfo>(buildEmptyInfo(schoolKey));
  const [draft, setDraft] = useState<SchoolInfo>(buildEmptyInfo(schoolKey));
  const [selection, setSelection] = useState<EditorSelection | null>(null);
  const [uploadNames, setUploadNames] = useState<Partial<Record<FocusableSchoolInfoField, string>>>({});

  const headerRef = useRef<HTMLInputElement | null>(null);
  const mottoRef = useRef<HTMLInputElement | null>(null);
  const aboutRef = useRef<HTMLTextAreaElement | null>(null);
  const missionRef = useRef<HTMLTextAreaElement | null>(null);
  const visionRef = useRef<HTMLTextAreaElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const heroImageUrlRef = useRef<HTMLInputElement | null>(null);
  const logoImageUrlRef = useRef<HTMLInputElement | null>(null);
  const missionImageUrlRef = useRef<HTMLInputElement | null>(null);
  const coreValuesImageUrlRef = useRef<HTMLInputElement | null>(null);
  const addressRef = useRef<HTMLTextAreaElement | null>(null);
  const lessonTitleRef = useRef<HTMLInputElement | null>(null);
  const coreValueNameRef = useRef<HTMLInputElement | null>(null);

  const baseUrl = useMemo(() => `/api/schools/${encodeURIComponent(schoolKey)}/info`, [schoolKey]);
  const emptyInfo = useMemo(() => buildEmptyInfo(schoolKey), [schoolKey]);
  const hiddenFields = useMemo(() => new Set(config?.hiddenFields ?? []), [config?.hiddenFields]);
  const lessonEditor = config?.collectionEditors?.lessons;
  const coreValuesEditor = config?.collectionEditors?.coreValues;
  const useFallbackWhenRecordExists = config?.useFallbackWhenRecordExists ?? true;

  const fieldLabels = useMemo(
    () => ({
      header: config?.labels?.header || 'Header / Title',
      motto: config?.labels?.motto || 'Motto',
      about: config?.labels?.about || 'About / Aim',
      mission: config?.labels?.mission || 'Mission',
      vision: config?.labels?.vision || 'Vision',
      heroImageUrl: config?.labels?.heroImageUrl || 'Hero Image URL',
      logoImageUrl: config?.labels?.logoImageUrl || 'Logo Image URL',
      missionImageUrl: config?.labels?.missionImageUrl || 'Mission Section Image URL',
      coreValuesImageUrl: config?.labels?.coreValuesImageUrl || 'Core Values Image URL',
      phone: config?.labels?.phone || 'Phone',
      email: config?.labels?.email || 'Email',
      address: config?.labels?.address || 'Address',
      lessons: config?.labels?.lessons || 'Lessons',
      coreValues: config?.labels?.coreValues || 'Core Values',
    }),
    [config?.labels],
  );

  const mergeWithFallback = (info: SchoolInfo): SchoolInfo => {
    if (info.id && !useFallbackWhenRecordExists) {
      return info;
    }

    return {
      ...info,
      header: info.header ?? fallbackInfo?.header ?? null,
      motto: info.motto ?? fallbackInfo?.motto ?? null,
      about: info.about ?? fallbackInfo?.about ?? null,
      mission: info.mission ?? fallbackInfo?.mission ?? null,
      vision: info.vision ?? fallbackInfo?.vision ?? null,
      heroImageUrl: info.heroImageUrl ?? fallbackInfo?.heroImageUrl ?? null,
      logoImageUrl: info.logoImageUrl ?? fallbackInfo?.logoImageUrl ?? null,
      missionImageUrl: info.missionImageUrl ?? fallbackInfo?.missionImageUrl ?? null,
      coreValuesImageUrl: info.coreValuesImageUrl ?? fallbackInfo?.coreValuesImageUrl ?? null,
      phone: info.phone ?? fallbackInfo?.phone ?? null,
      email: info.email ?? fallbackInfo?.email ?? null,
      address: info.address ?? fallbackInfo?.address ?? null,
      lessons: info.lessons ?? normalizeLessons(fallbackInfo?.lessons) ?? null,
      coreValues: info.coreValues ?? normalizeCoreValues(fallbackInfo?.coreValues) ?? null,
    };
  };

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(baseUrl);
      if (!response.ok) {
        const fallbackState = mergeWithFallback(emptyInfo);
        setSavedInfo(fallbackState);
        setDraft(fallbackState);
        setSelection(getDefaultSelection(fallbackState, hiddenFields, config?.collectionEditors));
        setStatus('Unable to load school info.');
        return;
      }

      const data = await response.json().catch(() => ({}));
      const nextInfo: SchoolInfo = {
        schoolKey,
        id: data?.id,
        header: data?.header ?? null,
        motto: data?.motto ?? null,
        about: data?.about ?? null,
        mission: data?.mission ?? null,
        vision: data?.vision ?? null,
        heroImageUrl: data?.heroImageUrl ?? null,
        logoImageUrl: data?.logoImageUrl ?? null,
        missionImageUrl: data?.missionImageUrl ?? null,
        coreValuesImageUrl: data?.coreValuesImageUrl ?? null,
        phone: data?.phone ?? null,
        email: data?.email ?? null,
        address: data?.address ?? null,
        lessons: normalizeLessons(data?.lessons),
        coreValues: normalizeCoreValues(data?.coreValues),
      };
      const mergedInfo = mergeWithFallback(nextInfo);
      setSavedInfo(mergedInfo);
      setDraft(mergedInfo);
      setSelection((prev) =>
        isSelectionValid(prev, mergedInfo, hiddenFields, config?.collectionEditors)
          ? prev
          : getDefaultSelection(mergedInfo, hiddenFields, config?.collectionEditors),
      );
    } catch {
      const fallbackState = mergeWithFallback(emptyInfo);
      setSavedInfo(fallbackState);
      setDraft(fallbackState);
      setSelection(getDefaultSelection(fallbackState, hiddenFields, config?.collectionEditors));
      setStatus('Unable to load school info.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  useEffect(() => {
    if (selection === null) return;
    if (isSelectionValid(selection, draft, hiddenFields, config?.collectionEditors)) return;
    setSelection(getDefaultSelection(draft, hiddenFields, config?.collectionEditors));
  }, [selection, draft, hiddenFields, config?.collectionEditors]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selection) return;
      if (selection.kind === 'field') {
        const refMap: Record<FocusableSchoolInfoField, HTMLInputElement | HTMLTextAreaElement | null> = {
          header: headerRef.current,
          motto: mottoRef.current,
          about: aboutRef.current,
          mission: missionRef.current,
          vision: visionRef.current,
          heroImageUrl: heroImageUrlRef.current,
          logoImageUrl: logoImageUrlRef.current,
          missionImageUrl: missionImageUrlRef.current,
          coreValuesImageUrl: coreValuesImageUrlRef.current,
          phone: phoneRef.current,
          email: emailRef.current,
          address: addressRef.current,
        };
        refMap[selection.field]?.focus();
        return;
      }
      if (selection.kind === 'lesson') {
        lessonTitleRef.current?.focus();
        return;
      }
      coreValueNameRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selection]);

  const resetDraft = () => {
    setDraft(savedInfo);
  };

  const uploadImage = async (file: File) => {
    if (!token) return null;

    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
      setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiFetch('/api/uploads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        setStatus('Image upload failed.');
        return null;
      }

      const data = await response.json().catch(() => null) as { url?: string } | null;
      if (!data?.url) {
        setStatus('Image upload failed.');
        return null;
      }

      return data.url;
    } catch {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const save = async () => {
    setIsSaving(true);
    setStatus('');
    try {
      const response = await apiFetch(`/api/admin/schools/${encodeURIComponent(schoolKey)}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          header: draft.header,
          motto: draft.motto,
          about: draft.about,
          mission: draft.mission,
          vision: draft.vision,
          heroImageUrl: draft.heroImageUrl,
          logoImageUrl: draft.logoImageUrl,
          missionImageUrl: draft.missionImageUrl,
          coreValuesImageUrl: draft.coreValuesImageUrl,
          phone: draft.phone,
          email: draft.email,
          address: draft.address,
          lessons: normalizeLessons(draft.lessons),
          coreValues: normalizeCoreValues(draft.coreValues),
        }),
      });

      if (!response.ok) {
        setStatus('Unable to save school info.');
        return;
      }

      const data = await response.json().catch(() => ({}));
      const nextInfo: SchoolInfo = {
        schoolKey,
        id: data?.id,
        header: data?.header ?? null,
        motto: data?.motto ?? null,
        about: data?.about ?? null,
        mission: data?.mission ?? null,
        vision: data?.vision ?? null,
        heroImageUrl: data?.heroImageUrl ?? null,
        logoImageUrl: data?.logoImageUrl ?? null,
        missionImageUrl: data?.missionImageUrl ?? null,
        coreValuesImageUrl: data?.coreValuesImageUrl ?? null,
        phone: data?.phone ?? null,
        email: data?.email ?? null,
        address: data?.address ?? null,
        lessons: normalizeLessons(data?.lessons),
        coreValues: normalizeCoreValues(data?.coreValues),
      };
      const mergedInfo = mergeWithFallback(nextInfo);
      setSavedInfo(mergedInfo);
      setDraft(mergedInfo);
      setSelection(null);
      setUploadNames({});
      setStatus('School info has been saved. Select any item on the right to continue editing.');
    } catch {
      setStatus('Unable to save school info.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: FocusableSchoolInfoField, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: toNullable(value) }));
  };

  const addLesson = () => {
    setDraft((prev) => {
      const nextLessons = [
        ...(prev.lessons ?? []),
        { title: '', description: '', num: String((prev.lessons?.length ?? 0) + 1).padStart(2, '0') },
      ];
      return { ...prev, lessons: nextLessons };
    });
    setSelection({ kind: 'lesson', index: draft.lessons?.length ?? 0 });
  };

  const updateLesson = (index: number, field: keyof SchoolLesson, value: string) => {
    setDraft((prev) => {
      const current = [...(prev.lessons ?? [])];
      const existing = current[index] ?? { title: '', description: '', num: null };
      current[index] = { ...existing, [field]: field === 'num' ? toNullable(value) : value };
      return { ...prev, lessons: current };
    });
  };

  const removeLesson = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      lessons: (prev.lessons ?? []).filter((_, lessonIndex) => lessonIndex !== index),
    }));
    setSelection((prev) => {
      if (prev?.kind !== 'lesson') return prev;
      if ((draft.lessons?.length ?? 0) <= 1) {
        return getDefaultSelection(draft, hiddenFields, config?.collectionEditors);
      }
      if (prev.index > 0) return { kind: 'lesson', index: prev.index - 1 };
      return { kind: 'lesson', index: 0 };
    });
  };

  const addCoreValue = () => {
    setDraft((prev) => ({
      ...prev,
      coreValues: [...(prev.coreValues ?? []), { name: '' }],
    }));
    setSelection({ kind: 'coreValue', index: draft.coreValues?.length ?? 0 });
  };

  const updateCoreValue = (index: number, field: keyof SchoolCoreValue, value: string) => {
    setDraft((prev) => {
      const current = [...(prev.coreValues ?? [])];
      const existing = current[index] ?? { name: '' };
      current[index] = { ...existing, [field]: value };
      return { ...prev, coreValues: current };
    });
  };

  const removeCoreValue = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      coreValues: (prev.coreValues ?? []).filter((_, coreValueIndex) => coreValueIndex !== index),
    }));
    setSelection((prev) => {
      if (prev?.kind !== 'coreValue') return prev;
      if ((draft.coreValues?.length ?? 0) <= 1) {
        return getDefaultSelection(draft, hiddenFields, config?.collectionEditors);
      }
      if (prev.index > 0) return { kind: 'coreValue', index: prev.index - 1 };
      return { kind: 'coreValue', index: 0 };
    });
  };

  const visibleInfoFields = [
    { field: 'header', label: fieldLabels.header, value: draft.header },
    { field: 'motto', label: fieldLabels.motto, value: draft.motto },
    { field: 'about', label: fieldLabels.about, value: draft.about },
    { field: 'mission', label: fieldLabels.mission, value: draft.mission },
    { field: 'vision', label: fieldLabels.vision, value: draft.vision },
    { field: 'heroImageUrl', label: fieldLabels.heroImageUrl, value: draft.heroImageUrl },
    { field: 'logoImageUrl', label: fieldLabels.logoImageUrl, value: draft.logoImageUrl },
    { field: 'missionImageUrl', label: fieldLabels.missionImageUrl, value: draft.missionImageUrl },
    { field: 'coreValuesImageUrl', label: fieldLabels.coreValuesImageUrl, value: draft.coreValuesImageUrl },
    { field: 'phone', label: fieldLabels.phone, value: draft.phone },
    { field: 'email', label: fieldLabels.email, value: draft.email },
    { field: 'address', label: fieldLabels.address, value: draft.address },
  ].filter((item) => !hiddenFields.has(item.field as SchoolInfoField)) as Array<{
    field: FocusableSchoolInfoField;
    label: string;
    value: string | null;
  }>;

  const selectedLesson = selection?.kind === 'lesson' ? draft.lessons?.[selection.index] ?? null : null;
  const selectedCoreValue = selection?.kind === 'coreValue' ? draft.coreValues?.[selection.index] ?? null : null;
  const selectedFieldValue = selection?.kind === 'field' ? draft[selection.field] : null;
  const selectedFieldPreviewUrl =
    selection?.kind === 'field' && isImageField(selection.field) ? toPreviewUrl(selectedFieldValue) : '';
  const isErrorStatus =
    status.includes('Unable') ||
    status.includes('failed') ||
    status.includes('too big') ||
    status.includes('Only pictures less than 1MB are allowed');

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
        <div
          className={`rounded-xl p-4 text-sm ${
            isErrorStatus ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}
        >
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Edit {schoolName} Information</h2>
              <p className="mt-1 text-sm text-foreground/70">
                {config?.editorDescription || 'Choose an item from the right and edit it here.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={save} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={resetDraft}>
                Reset to Current
              </Button>
            </div>
          </div>

          {selection === null && (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-sm text-foreground/60">
              Changes saved successfully. Choose any item from the right to load it back into the editor.
            </div>
          )}

          {selection?.kind === 'field' && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40">
                  {selection.field === 'phone' || selection.field === 'email' || selection.field === 'address'
                    ? 'Contact Detail'
                    : isImageField(selection.field)
                      ? 'Page Image'
                    : 'School Info'}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{fieldLabels[selection.field]}</h3>
              </div>

              {isImageField(selection.field) && (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                    {selectedFieldPreviewUrl ? (
                      <div className="relative h-56 w-full">
                        <Image
                          src={selectedFieldPreviewUrl}
                          alt={fieldLabels[selection.field]}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-56 items-center justify-center text-sm text-foreground/50">
                        No image selected.
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*,.heic,.heif,.avif"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const uploadedUrl = await uploadImage(file);
                      if (!uploadedUrl) return;
                      updateField(selection.field, uploadedUrl);
                      setUploadNames((prev) => ({ ...prev, [selection.field]: file.name }));
                      setStatus(`${fieldLabels[selection.field]} uploaded. Save changes to publish it.`);
                    }}
                    className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />

                  {uploadNames[selection.field] ? (
                    <p className="text-xs text-foreground/60">Selected: {uploadNames[selection.field]}</p>
                  ) : null}
                </div>
              )}

              {(selection.field === 'header' ||
                selection.field === 'motto' ||
                selection.field === 'phone' ||
                selection.field === 'email') && (
                <input
                  ref={
                    selection.field === 'header'
                      ? headerRef
                      : selection.field === 'motto'
                        ? mottoRef
                        : selection.field === 'phone'
                          ? phoneRef
                          : emailRef
                  }
                  type={
                    selection.field === 'email'
                      ? 'email'
                      : selection.field === 'phone'
                        ? 'tel'
                        : 'text'
                  }
                  value={toInputValue(selectedFieldValue)}
                  onChange={(e) => updateField(selection.field, e.target.value)}
                  placeholder={
                    selection.field === 'header'
                      ? 'e.g., School of Discipleship'
                      : selection.field === 'motto'
                        ? 'e.g., Rooted in Christ, Growing in Truth'
                        : selection.field === 'phone'
                          ? '+265 999 123 456'
                          : 'info@school.org'
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              )}

              {(selection.field === 'about' ||
                selection.field === 'mission' ||
                selection.field === 'vision' ||
                selection.field === 'address') && (
                <textarea
                  ref={
                    selection.field === 'about'
                      ? aboutRef
                      : selection.field === 'mission'
                        ? missionRef
                        : selection.field === 'vision'
                          ? visionRef
                          : addressRef
                  }
                  value={toInputValue(selectedFieldValue)}
                  onChange={(e) => updateField(selection.field, e.target.value)}
                  placeholder={
                    selection.field === 'address'
                      ? 'School address...'
                      : `Describe the school's ${fieldLabels[selection.field].toLowerCase()}...`
                  }
                  rows={selection.field === 'address' ? 4 : 10}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              )}
            </div>
          )}

          {selection?.kind === 'lesson' && selectedLesson && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40">
                    {lessonEditor?.label || fieldLabels.lessons}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">Lesson {selection.index + 1}</h3>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeLesson(selection.index)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[110px_1fr]">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                    Number
                  </label>
                  <input
                    type="text"
                    value={toInputValue(selectedLesson.num)}
                    onChange={(e) => updateLesson(selection.index, 'num', e.target.value)}
                    placeholder="01"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                    Title
                  </label>
                  <input
                    ref={lessonTitleRef}
                    type="text"
                    value={selectedLesson.title}
                    onChange={(e) => updateLesson(selection.index, 'title', e.target.value)}
                    placeholder="The Nature and Character of God"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Description
                </label>
                <textarea
                  value={selectedLesson.description}
                  onChange={(e) => updateLesson(selection.index, 'description', e.target.value)}
                  placeholder="Short lesson summary..."
                  rows={10}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {selection?.kind === 'coreValue' && selectedCoreValue && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40">
                    {coreValuesEditor?.label || fieldLabels.coreValues}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">Core Value {selection.index + 1}</h3>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeCoreValue(selection.index)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Name
                </label>
                <input
                  ref={coreValueNameRef}
                  type="text"
                  value={selectedCoreValue.name}
                  onChange={(e) => updateCoreValue(selection.index, 'name', e.target.value)}
                  placeholder="Christ-Centered Living"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Current Information</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Click any highlight to load it into the editor.
            </p>
          </div>

          <div className="space-y-3">
            {visibleInfoFields.map((item) => {
              const isActive = selection?.kind === 'field' && selection.field === item.field;
              const previewUrl = isImageField(item.field) ? toPreviewUrl(item.value) : '';
              return (
                <button
                  key={item.field}
                  type="button"
                  onClick={() => setSelection({ kind: 'field', field: item.field })}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 bg-background hover:border-primary/60 hover:bg-primary/5'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">{item.label}</p>
                  {isImageField(item.field) ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-background">
                      {previewUrl ? (
                        <div className="relative h-28 w-full">
                          <Image
                            src={previewUrl}
                            alt={item.label}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-28 items-center justify-center text-xs text-foreground/50">
                          No image selected
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-foreground">{buildSnippet(item.value)}</p>
                  )}
                </button>
              );
            })}
          </div>

          {lessonEditor && (
            <div className="space-y-3 border-t border-border/60 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{lessonEditor.label}</h3>
                  {lessonEditor.description && <p className="text-xs text-foreground/60">{lessonEditor.description}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={addLesson}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              {(draft.lessons ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-foreground/60">
                  No lessons added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {(draft.lessons ?? []).map((lesson, index) => {
                    const isActive = selection?.kind === 'lesson' && selection.index === index;
                    return (
                      <button
                        key={`lesson-item-${index}`}
                        type="button"
                        onClick={() => setSelection({ kind: 'lesson', index })}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border/60 bg-background hover:border-primary/60 hover:bg-primary/5'
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">
                          Lesson {lesson.num || String(index + 1).padStart(2, '0')}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{lesson.title || 'Untitled lesson'}</p>
                        <p className="mt-1 text-sm text-foreground/70">{buildSnippet(lesson.description)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {coreValuesEditor && (
            <div className="space-y-3 border-t border-border/60 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{coreValuesEditor.label}</h3>
                  {coreValuesEditor.description && <p className="text-xs text-foreground/60">{coreValuesEditor.description}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={addCoreValue}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              {(draft.coreValues ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-foreground/60">
                  No core values added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {(draft.coreValues ?? []).map((coreValue, index) => {
                    const isActive = selection?.kind === 'coreValue' && selection.index === index;
                    return (
                      <button
                        key={`core-value-item-${index}`}
                        type="button"
                        onClick={() => setSelection({ kind: 'coreValue', index })}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border/60 bg-background hover:border-primary/60 hover:bg-primary/5'
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">
                          Core Value {index + 1}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{coreValue.name || 'Untitled core value'}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
