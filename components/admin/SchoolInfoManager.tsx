'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';

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
  const [info, setInfo] = useState<SchoolInfo>({
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

  const baseUrl = useMemo(() => `/api/schools/${encodeURIComponent(schoolKey)}/info`, [schoolKey]);

  const refresh = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      const response = await apiFetch(baseUrl);
      if (!response.ok) {
        setStatus('Unable to load school info.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      setInfo(data);
    } catch {
      setStatus('Unable to load school info.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

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
          header: info.header,
          motto: info.motto,
          about: info.about,
          mission: info.mission,
          vision: info.vision,
          phone: info.phone,
          email: info.email,
          address: info.address,
        }),
      });
      if (!response.ok) {
        setStatus('Unable to save school info.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      setInfo(data);
      setStatus('School info saved.');
    } catch {
      setStatus('Unable to save school info.');
    } finally {
      setIsSaving(false);
    }
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
          className={`p-4 rounded-xl text-sm ${
            status.includes('Unable') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}
        >
          {status}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Manage {schoolName} Information
          </h2>
          <p className="text-sm text-foreground/70 mb-6">
            Update the school's header, motto, mission, vision, and contact information displayed on the public page.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
              Header / Title
            </label>
            <input
              type="text"
              value={info.header || ''}
              onChange={(e) => setInfo((prev) => ({ ...prev, header: e.target.value || null }))}
              placeholder="e.g., Hope School - Leadership Training"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
              Motto
            </label>
            <input
              type="text"
              value={info.motto || ''}
              onChange={(e) => setInfo((prev) => ({ ...prev, motto: e.target.value || null }))}
              placeholder="e.g., Raising Godly Leaders"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
              About / Aim
            </label>
            <textarea
              value={info.about || ''}
              onChange={(e) => setInfo((prev) => ({ ...prev, about: e.target.value || null }))}
              placeholder="Describe the school's aim and purpose..."
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
              Mission
            </label>
            <textarea
              value={info.mission || ''}
              onChange={(e) => setInfo((prev) => ({ ...prev, mission: e.target.value || null }))}
              placeholder="Describe the school's mission..."
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
              Vision
            </label>
            <textarea
              value={info.vision || ''}
              onChange={(e) => setInfo((prev) => ({ ...prev, vision: e.target.value || null }))}
              placeholder="Describe the school's vision..."
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div className="border-t border-border/60 pt-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Contact Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                  Phone
                </label>
                <input
                  type="tel"
                  value={info.phone || ''}
                  onChange={(e) => setInfo((prev) => ({ ...prev, phone: e.target.value || null }))}
                  placeholder="+265 999 123 456"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={info.email || ''}
                  onChange={(e) => setInfo((prev) => ({ ...prev, email: e.target.value || null }))}
                  placeholder="info@school.org"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1 block">
                Address
              </label>
              <textarea
                value={info.address || ''}
                onChange={(e) => setInfo((prev) => ({ ...prev, address: e.target.value || null }))}
                placeholder="School address..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border/60">
          <Button
            onClick={save}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
