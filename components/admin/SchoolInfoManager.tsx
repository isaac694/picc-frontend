'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save } from 'lucide-react';

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
});

const toInputValue = (value: string | null | undefined) => value || '';
const toNullable = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export default function SchoolInfoManager({
  token,
  schoolKey,
  schoolName,
}: {
  token: string;
  schoolKey: string;
  schoolName: string;
}) {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedInfo, setSavedInfo] = useState<SchoolInfo>(buildEmptyInfo(schoolKey));
  const [draft, setDraft] = useState<SchoolInfo>(buildEmptyInfo(schoolKey));

  const baseUrl = useMemo(() => `/api/schools/${encodeURIComponent(schoolKey)}/info`, [schoolKey]);

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(baseUrl);
      if (!response.ok) {
        setSavedInfo(buildEmptyInfo(schoolKey));
        setDraft(buildEmptyInfo(schoolKey));
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
      };
      setSavedInfo(nextInfo);
      setDraft(nextInfo);
    } catch {
      setSavedInfo(buildEmptyInfo(schoolKey));
      setDraft(buildEmptyInfo(schoolKey));
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
      };
      setSavedInfo(nextInfo);
      setDraft(nextInfo);
      setStatus('School info saved.');
    } catch {
      setStatus('Unable to save school info.');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { label: 'Header / Title', value: savedInfo.header },
    { label: 'Motto', value: savedInfo.motto },
    { label: 'About / Aim', value: savedInfo.about },
    { label: 'Mission', value: savedInfo.mission },
    { label: 'Vision', value: savedInfo.vision },
    { label: 'Phone', value: savedInfo.phone },
    { label: 'Email', value: savedInfo.email },
    { label: 'Address', value: savedInfo.address },
  ];

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
        <div className="space-y-6">
          <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Edit {schoolName} Information
                </h2>
                <p className="mt-1 text-sm text-foreground/70">
                  Update the school&apos;s header, motto, mission, and vision from this main editor.
                </p>
              </div>
              <Button variant="outline" onClick={startFresh}>
                <Plus className="mr-2 h-4 w-4" />
                Clear Form
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Header / Title
                </label>
                <input
                  type="text"
                  value={toInputValue(draft.header)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, header: toNullable(e.target.value) }))}
                  placeholder="e.g., Hope School - Leadership Training"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Motto
                </label>
                <input
                  type="text"
                  value={toInputValue(draft.motto)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, motto: toNullable(e.target.value) }))}
                  placeholder="e.g., Raising Godly Leaders"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  About / Aim
                </label>
                <textarea
                  value={toInputValue(draft.about)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, about: toNullable(e.target.value) }))}
                  placeholder="Describe the school's aim and purpose..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Mission
                </label>
                <textarea
                  value={toInputValue(draft.mission)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, mission: toNullable(e.target.value) }))}
                  placeholder="Describe the school's mission..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Vision
                </label>
                <textarea
                  value={toInputValue(draft.vision)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, vision: toNullable(e.target.value) }))}
                  placeholder="Describe the school's vision..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Contact Details</h3>
              <p className="mt-1 text-sm text-foreground/70">
                Keep the school&apos;s phone, email, and address in their own section.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Phone
                </label>
                <input
                  type="tel"
                  value={toInputValue(draft.phone)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, phone: toNullable(e.target.value) }))}
                  placeholder="+265 999 123 456"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Email
                </label>
                <input
                  type="email"
                  value={toInputValue(draft.email)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, email: toNullable(e.target.value) }))}
                  placeholder="info@school.org"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground/50">
                Address
              </label>
              <textarea
                value={toInputValue(draft.address)}
                onChange={(e) => setDraft((prev) => ({ ...prev, address: toNullable(e.target.value) }))}
                placeholder="School address..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
              <Button onClick={save} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={resetDraft}>
                Reset to Current
              </Button>
            </div>
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
            {sections.every((section) => !section.value) ? (
              <div className="rounded-xl border border-border/60 border-dashed py-12 text-center">
                <p className="text-sm text-foreground/60">No school info saved yet.</p>
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.label} className="rounded-xl border border-border/60 bg-background p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">
                    {section.label}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {section.value || 'Not provided'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
