'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import ServiceTimesManager from '@/components/admin/ServiceTimesManager';

type SiteContentRecord = {
  key: string;
  imageUrl?: string | null;
};

const IMAGE_ITEMS = [
  { key: 'contact-header-bg', label: 'Header Background', fallback: '/images/our-church.JPG' },
  { key: 'contact-locate-image', label: 'Locate Us Image', fallback: '/images/our-church.JPG' },
  { key: 'contact-send-message-image', label: 'Send Us a Message Image', fallback: '/images/send-message-2.JPG' },
] as const;

const normalizeImageUrl = (value?: string | null) => {
  if (!value) return '';
  return value.startsWith('http') ? value : apiUrl(value);
};

export default function ContactPageAdmin() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [pageImages, setPageImages] = useState<Record<string, string>>({});
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});

  const updatePageImage = (key: string, value: string) => {
    setPageImages((prev) => ({ ...prev, [key]: value }));
  };

  const uploadImage = async (file: File) => {
    if (!token) return null;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiFetch('/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) return null;
      const data = await response.json();
      return normalizeImageUrl(data.url);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchContent = async (key: string): Promise<SiteContentRecord | null> => {
      try {
        const response = await apiFetch(`/api/site-content/${key}`);
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    };

    const load = async () => {
      setStatus('');
      const entries = await Promise.all(
        IMAGE_ITEMS.map(async (item) => {
          const record = await fetchContent(item.key);
          return [item.key, normalizeImageUrl(record?.imageUrl ?? '')] as const;
        }),
      );
      setPageImages(Object.fromEntries(entries));
    };

    load();
  }, [token]);

  const handleSaveImages = async () => {
    if (!token) return;
    setSaving(true);
    setStatus('');
    try {
      const responses = await Promise.all(
        IMAGE_ITEMS.map((item) =>
          apiFetch(`/api/site-content/${item.key}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ imageUrl: pageImages[item.key] || null }),
          }),
        ),
      );

      if (responses.some((response) => !response.ok)) {
        setStatus('Unable to save contact images.');
        return;
      }

      setStatus('Contact page images updated.');
    } catch {
      setStatus('Unable to save contact images.');
    } finally {
      setSaving(false);
    }
  };

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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
            Admin
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">
            Contact Page
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Update the images and service times shown on the public contact page.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Contact Images</h2>
            <p className="text-sm text-foreground/60">
              Upload new images for the header, locate section, and contact form.
            </p>
          </div>
          <Button variant="outline" onClick={handleSaveImages} disabled={saving}>
            {saving ? 'Saving...' : 'Save Images'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {IMAGE_ITEMS.map((item) => {
            const currentUrl = pageImages[item.key] || '';
            const previewUrl = currentUrl || item.fallback;
            const selectedName = uploadNames[item.key] || '';

            return (
              <div key={item.key} className="rounded-2xl border border-border/60 bg-background p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-foreground/50">{item.key}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    {currentUrl ? 'Custom' : 'Default'}
                  </span>
                </div>
                <div
                  className="h-40 rounded-xl border border-border/60 bg-cover bg-center"
                  style={{ backgroundImage: `url(${previewUrl})` }}
                />
                <div className="mt-4 space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      if (!url) {
                        setStatus('Image upload failed.');
                        return;
                      }
                      updatePageImage(item.key, url);
                      setUploadNames((prev) => ({ ...prev, [item.key]: file.name }));
                    }}
                    className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        updatePageImage(item.key, '');
                        setUploadNames((prev) => ({ ...prev, [item.key]: '' }));
                      }}
                    >
                      Use Default
                    </Button>
                  </div>
                  {selectedName && (
                    <p className="text-xs text-foreground/60">Selected: {selectedName}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Service Times</h2>
        <p className="text-sm text-foreground/60">
          These entries also power the service times section on the homepage.
        </p>
      </div>

      <ServiceTimesManager token={token} compact />
    </div>
  );
}

