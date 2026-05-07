'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save } from 'lucide-react';

type SchoolLesson = {
  title: string;
  description: string;
  num?: string | null;
};

type SchoolCoreValue = {
  name: string;
  description: string;
};

type SchoolInfo = {
  id?: string;
  schoolKey: string;
  header: string | null;
  motto: string | null;
  about: string | null;
  mission: string | null;
  vision: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  lessons: SchoolLesson[] | null;
  coreValues: SchoolCoreValue[] | null;
};

type SchoolInfoField = Exclude<keyof SchoolInfo, 'id' | 'schoolKey'>;
type FocusableSchoolInfoField = Exclude<SchoolInfoField, 'lessons' | 'coreValues'>;
type EditableFieldRef = {
  current: HTMLInputElement | HTMLTextAreaElement | null;
};

type CollectionField = 'lessons' | 'coreValues';

type SchoolInfoManagerConfig = {
  hiddenFields?: SchoolInfoField[];
  labels?: Partial<Record<SchoolInfoField, string>>;
  editorDescription?: string;
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
  if (!value || typeof value !== 'object') return null;
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
  if (!value || typeof value !== 'object') return null;
  const coreValue = value as Record<string, unknown>;
  const name = toNullable(typeof coreValue.name === 'string' ? coreValue.name : '');
  const description = toNullable(typeof coreValue.description === 'string' ? coreValue.description : '');

  if (!name && !description) return null;

  return {
    name: name || '',
    description: description || '',
  };
};

const normalizeLessons = (value: unknown): SchoolLesson[] | null => {
  if (!Array.isArray(value)) return null;
  const lessons = value.map(normalizeLesson).filter((item): item is SchoolLesson => Boolean(item));
  return lessons.length ? lessons : null;
};

const normalizeCoreValues = (value: unknown): SchoolCoreValue[] | null => {
  if (!Array.isArray(value)) return null;
  const coreValues = value.map(normalizeCoreValue).filter((item): item is SchoolCoreValue => Boolean(item));
  return coreValues.length ? coreValues : null;
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
  const headerRef = useRef<HTMLInputElement | null>(null);
  const mottoRef = useRef<HTMLInputElement | null>(null);
  const aboutRef = useRef<HTMLTextAreaElement | null>(null);
  const missionRef = useRef<HTMLTextAreaElement | null>(null);
  const visionRef = useRef<HTMLTextAreaElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const addressRef = useRef<HTMLTextAreaElement | null>(null);

  const baseUrl = useMemo(() => `/api/schools/${encodeURIComponent(schoolKey)}/info`, [schoolKey]);
  const emptyInfo = useMemo(() => buildEmptyInfo(schoolKey), [schoolKey]);
  const hiddenFields = useMemo(() => new Set(config?.hiddenFields ?? []), [config?.hiddenFields]);
  const fieldLabels = useMemo(
    () => ({
      header: config?.labels?.header || 'Header / Title',
      motto: config?.labels?.motto || 'Motto',
      about: config?.labels?.about || 'About / Aim',
      mission: config?.labels?.mission || 'Mission',
      vision: config?.labels?.vision || 'Vision',
      phone: config?.labels?.phone || 'Phone',
      email: config?.labels?.email || 'Email',
      address: config?.labels?.address || 'Address',
      lessons: config?.labels?.lessons || 'Lessons',
      coreValues: config?.labels?.coreValues || 'Core Values',
    }),
    [config?.labels],
  );

  const mergeWithFallback = (info: SchoolInfo): SchoolInfo => ({
    ...info,
    header: info.header ?? fallbackInfo?.header ?? null,
    motto: info.motto ?? fallbackInfo?.motto ?? null,
    about: info.about ?? fallbackInfo?.about ?? null,
    mission: info.mission ?? fallbackInfo?.mission ?? null,
    vision: info.vision ?? fallbackInfo?.vision ?? null,
    phone: info.phone ?? fallbackInfo?.phone ?? null,
    email: info.email ?? fallbackInfo?.email ?? null,
    address: info.address ?? fallbackInfo?.address ?? null,
    lessons: info.lessons ?? normalizeLessons(fallbackInfo?.lessons) ?? null,
    coreValues: info.coreValues ?? normalizeCoreValues(fallbackInfo?.coreValues) ?? null,
  });

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(baseUrl);
      if (!response.ok) {
        const fallbackState = mergeWithFallback(emptyInfo);
        setSavedInfo(fallbackState);
        setDraft(fallbackState);
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
        phone: data?.phone ?? null,
        email: data?.email ?? null,
        address: data?.address ?? null,
        lessons: normalizeLessons(data?.lessons),
        coreValues: normalizeCoreValues(data?.coreValues),
      };
      const mergedInfo = mergeWithFallback(nextInfo);
      setSavedInfo(mergedInfo);
      setDraft(mergedInfo);
    } catch {
      const fallbackState = mergeWithFallback(emptyInfo);
      setSavedInfo(fallbackState);
      setDraft(fallbackState);
      setStatus('Unable to load school info.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  const resetDraft = () => {
    setDraft(savedInfo);
  };

  const startFresh = () => {
    setDraft(buildEmptyInfo(schoolKey));
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
        phone: data?.phone ?? null,
        email: data?.email ?? null,
        address: data?.address ?? null,
        lessons: normalizeLessons(data?.lessons),
        coreValues: normalizeCoreValues(data?.coreValues),
      };
      const mergedInfo = mergeWithFallback(nextInfo);
      setSavedInfo(mergedInfo);
      setDraft(mergedInfo);
      setStatus('School info has been saved.');
    } catch {
      setStatus('Unable to save school info.');
    } finally {
      setIsSaving(false);
    }
  };

  const refMap: Record<FocusableSchoolInfoField, EditableFieldRef> = {
      header: headerRef,
      motto: mottoRef,
      about: aboutRef,
      mission: missionRef,
      vision: visionRef,
      phone: phoneRef,
      email: emailRef,
      address: addressRef,
    };

  const focusSection = (field: FocusableSchoolInfoField) => {

    const value = savedInfo[field];
    if (typeof value === 'string' || value === null) {
      setDraft((prev) => ({ ...prev, [field]: value }));
    }

    const node = refMap[field]?.current;
    if (node) {
      node.focus();
      const supportsSelection =
        node instanceof HTMLTextAreaElement ||
        (node instanceof HTMLInputElement && ['text', 'search', 'tel', 'url', 'password'].includes(node.type));

      if (supportsSelection) {
        const valueLength = node.value.length;
        node.setSelectionRange(valueLength, valueLength);
      }
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const sections = [
    { label: fieldLabels.header, field: 'header', value: savedInfo.header },
    { label: fieldLabels.motto, field: 'motto', value: savedInfo.motto },
    { label: fieldLabels.about, field: 'about', value: savedInfo.about },
    { label: fieldLabels.mission, field: 'mission', value: savedInfo.mission },
    { label: fieldLabels.vision, field: 'vision', value: savedInfo.vision },
  ] satisfies Array<{ label: string; field: SchoolInfoField; value: string | null }>;

  const visibleSections = sections.filter((section) => !hiddenFields.has(section.field));

  const contactSections = [
    { label: fieldLabels.phone, field: 'phone', value: savedInfo.phone },
    { label: fieldLabels.email, field: 'email', value: savedInfo.email },
    { label: fieldLabels.address, field: 'address', value: savedInfo.address },
  ] satisfies Array<{ label: string; field: SchoolInfoField; value: string | null }>;

  const visibleContactSections = contactSections.filter((section) => !hiddenFields.has(section.field));
  const lessonEditor = config?.collectionEditors?.lessons;
  const coreValuesEditor = config?.collectionEditors?.coreValues;

  const updateLesson = (index: number, field: keyof SchoolLesson, value: string) => {
    setDraft((prev) => {
      const current = [...(prev.lessons ?? [])];
      const existing = current[index] ?? { title: '', description: '', num: null };
      current[index] = { ...existing, [field]: field === 'num' ? toNullable(value) : value };
      return { ...prev, lessons: current };
    });
  };

  const addLesson = () => {
    setDraft((prev) => ({
      ...prev,
      lessons: [...(prev.lessons ?? []), { title: '', description: '', num: String((prev.lessons?.length ?? 0) + 1).padStart(2, '0') }],
    }));
  };

  const removeLesson = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      lessons: (prev.lessons ?? []).filter((_, lessonIndex) => lessonIndex !== index),
    }));
  };

  const updateCoreValue = (index: number, field: keyof SchoolCoreValue, value: string) => {
    setDraft((prev) => {
      const current = [...(prev.coreValues ?? [])];
      const existing = current[index] ?? { name: '', description: '' };
      current[index] = { ...existing, [field]: value };
      return { ...prev, coreValues: current };
    });
  };

  const addCoreValue = () => {
    setDraft((prev) => ({
      ...prev,
      coreValues: [...(prev.coreValues ?? []), { name: '', description: '' }],
    }));
  };

  const removeCoreValue = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      coreValues: (prev.coreValues ?? []).filter((_, coreValueIndex) => coreValueIndex !== index),
    }));
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
        <div
          className={`rounded-xl p-4 text-sm ${
            status.includes('Unable') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}
        >
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Edit {schoolName} Information
              </h2>
              <p className="mt-1 text-sm text-foreground/70">
                {config?.editorDescription || 'Update the school&apos;s header, motto, mission, and vision from this main editor.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={save} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={startFresh}>
                <Plus className="mr-2 h-4 w-4" />
                Clear Form
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {!hiddenFields.has('header') && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                {fieldLabels.header}
              </label>
              <input
                ref={headerRef}
                type="text"
                value={toInputValue(draft.header)}
                onChange={(e) => setDraft((prev) => ({ ...prev, header: toNullable(e.target.value) }))}
                placeholder="e.g., Hope School - Leadership Training"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
              />
            </div>
            )}

            {!hiddenFields.has('motto') && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                {fieldLabels.motto}
              </label>
              <input
                ref={mottoRef}
                type="text"
                value={toInputValue(draft.motto)}
                onChange={(e) => setDraft((prev) => ({ ...prev, motto: toNullable(e.target.value) }))}
                placeholder="e.g., Raising Godly Leaders"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
              />
            </div>
            )}

            {!hiddenFields.has('about') && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                {fieldLabels.about}
              </label>
              <textarea
                ref={aboutRef}
                value={toInputValue(draft.about)}
                onChange={(e) => setDraft((prev) => ({ ...prev, about: toNullable(e.target.value) }))}
                placeholder="Describe the school's aim and purpose..."
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
              />
            </div>
            )}

            {!hiddenFields.has('mission') && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                {fieldLabels.mission}
              </label>
              <textarea
                ref={missionRef}
                value={toInputValue(draft.mission)}
                onChange={(e) => setDraft((prev) => ({ ...prev, mission: toNullable(e.target.value) }))}
                placeholder="Describe the school's mission..."
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
              />
            </div>
            )}

            {!hiddenFields.has('vision') && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                {fieldLabels.vision}
              </label>
              <textarea
                ref={visionRef}
                value={toInputValue(draft.vision)}
                onChange={(e) => setDraft((prev) => ({ ...prev, vision: toNullable(e.target.value) }))}
                placeholder="Describe the school's vision..."
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
              />
            </div>
            )}
          </div>
        </div>

        <div className="flex h-fit max-h-[800px] flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Current Information</h2>
            <Button variant="outline" size="sm" onClick={resetDraft}>
              Edit Current
            </Button>
          </div>

          <div className="custom-scrollbar space-y-3 overflow-y-auto pr-2">
            {visibleSections.every((section) => !section.value) ? (
              <div className="rounded-xl border border-border/60 border-dashed py-12 text-center">
                <p className="text-sm text-foreground/60">No school info saved yet.</p>
              </div>
            ) : (
              visibleSections.map((section) => (
                <button
                  key={section.label}
                  type="button"
                  onClick={() => focusSection(section.field)}
                  className="w-full rounded-xl border border-border/60 bg-background p-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">
                    {section.label}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {section.value || 'Not provided'}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {(lessonEditor || coreValuesEditor) && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {lessonEditor && (
            <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{lessonEditor.label}</h3>
                  {lessonEditor.description && (
                    <p className="mt-1 text-sm text-foreground/70">{lessonEditor.description}</p>
                  )}
                </div>
                <Button variant="outline" onClick={addLesson}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lesson
                </Button>
              </div>

              <div className="space-y-4">
                {(draft.lessons ?? []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-foreground/60">
                    No lessons added yet.
                  </div>
                ) : (
                  (draft.lessons ?? []).map((lesson, index) => (
                    <div key={`lesson-${index}`} className="space-y-4 rounded-xl border border-border/60 bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">Lesson {index + 1}</p>
                        <Button variant="outline" size="sm" onClick={() => removeLesson(index)}>
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[100px_1fr]">
                        <div>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                            Number
                          </label>
                          <input
                            type="text"
                            value={toInputValue(lesson.num)}
                            onChange={(e) => updateLesson(index, 'num', e.target.value)}
                            placeholder="01"
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                            Title
                          </label>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLesson(index, 'title', e.target.value)}
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
                          value={lesson.description}
                          onChange={(e) => updateLesson(index, 'description', e.target.value)}
                          placeholder="Short lesson summary..."
                          rows={3}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {coreValuesEditor && (
            <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{coreValuesEditor.label}</h3>
                  {coreValuesEditor.description && (
                    <p className="mt-1 text-sm text-foreground/70">{coreValuesEditor.description}</p>
                  )}
                </div>
                <Button variant="outline" onClick={addCoreValue}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Core Value
                </Button>
              </div>

              <div className="space-y-4">
                {(draft.coreValues ?? []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-foreground/60">
                    No core values added yet.
                  </div>
                ) : (
                  (draft.coreValues ?? []).map((coreValue, index) => (
                    <div key={`core-value-${index}`} className="space-y-4 rounded-xl border border-border/60 bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">Core Value {index + 1}</p>
                        <Button variant="outline" size="sm" onClick={() => removeCoreValue(index)}>
                          Remove
                        </Button>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                          Name
                        </label>
                        <input
                          type="text"
                          value={coreValue.name}
                          onChange={(e) => updateCoreValue(index, 'name', e.target.value)}
                          placeholder="Christ-Centered Living"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                          Description
                        </label>
                        <textarea
                          value={coreValue.description}
                          onChange={(e) => updateCoreValue(index, 'description', e.target.value)}
                          placeholder="Short core value summary..."
                          rows={3}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Contact Details</h3>
            <p className="mt-1 text-sm text-foreground/70">
              Keep the school&apos;s phone, email, and address in their own section.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {!hiddenFields.has('phone') && (
            <div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  {fieldLabels.phone}
                </label>
                <input
                  ref={phoneRef}
                  type="tel"
                  value={toInputValue(draft.phone)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, phone: toNullable(e.target.value) }))}
                  placeholder="+265 999 123 456"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            )}

            {!hiddenFields.has('email') && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                {fieldLabels.email}
              </label>
              <input
                ref={emailRef}
                type="email"
                value={toInputValue(draft.email)}
                onChange={(e) => setDraft((prev) => ({ ...prev, email: toNullable(e.target.value) }))}
                placeholder="info@school.org"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
              />
            </div>
            )}
          </div>

          {!hiddenFields.has('address') && (
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
              {fieldLabels.address}
            </label>
            <textarea
              ref={addressRef}
              value={toInputValue(draft.address)}
              onChange={(e) => setDraft((prev) => ({ ...prev, address: toNullable(e.target.value) }))}
              placeholder="School address..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
            />
          </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
            <Button onClick={save} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={startFresh}>
              <Plus className="mr-2 h-4 w-4" />
              Clear Form
            </Button>
            <Button variant="outline" onClick={resetDraft}>
              Reset to Current
            </Button>
          </div>
        </div>

        <div className="flex h-fit flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Current Contact Information</h2>
            <Button variant="outline" size="sm" onClick={resetDraft}>
              Edit Current
            </Button>
          </div>

          <div className="space-y-3">
            {visibleContactSections.every((section) => !section.value) ? (
              <div className="rounded-xl border border-border/60 border-dashed py-12 text-center">
                <p className="text-sm text-foreground/60">No contact details saved yet.</p>
              </div>
            ) : (
              visibleContactSections.map((section) => (
                <button
                  key={section.label}
                  type="button"
                  onClick={() => focusSection(section.field)}
                  className="w-full rounded-xl border border-border/60 bg-background p-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">
                    {section.label}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {section.value || 'Not provided'}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
