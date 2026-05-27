'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

type SiteContentRecord = {
  key: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
};

type ThemeEntry = { year: number; theme: string };

const IMAGE_ITEMS = [
  { key: 'about-header-bg', label: 'Header Background', fallback: '/about/header.JPG' },
  { key: 'about-tenets-image', label: 'Tenets Image', fallback: '/about/tenets-1.JPG' },
  { key: 'about-core-values-image', label: 'Core Values Image', fallback: '/about/core-values.JPG' },
  { key: 'about-themes-bg', label: 'Yearly Themes Background', fallback: '/about/themes.jpeg' },
] as const;

const STORY_VIDEO_KEY = 'about-story-video';
const YEARLY_THEMES_KEY = 'about-yearly-themes';

const normalizeImageUrl = (value?: string | null) => {
  if (!value) return '';
  return value.startsWith('http') ? value : apiUrl(value);
};

function themesToText(themes: ThemeEntry[]) {
  return themes
    .slice()
    .sort((a, b) => b.year - a.year)
    .map((entry) => `${entry.year} - ${entry.theme}`)
    .join('\n');
}

function parseThemesText(text: string): ThemeEntry[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const entries: ThemeEntry[] = [];
  for (const line of lines) {
    const match = line.match(/^(\d{4})\s*[-:]\s*(.+)$/);
    if (!match) continue;
    const year = Number(match[1]);
    const theme = match[2].trim();
    if (!Number.isFinite(year) || !theme) continue;
    entries.push({ year, theme });
  }

  const deduped = new Map<number, ThemeEntry>();
  for (const entry of entries) {
    deduped.set(entry.year, entry);
  }

  return Array.from(deduped.values()).sort((a, b) => b.year - a.year);
}

function parseThemesBody(body?: string | null): ThemeEntry[] {
  if (!body) return [];
  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) {
      return parsed
        .map((value: any) => ({
          year: Number(value?.year),
          theme: String(value?.theme ?? '').trim(),
        }))
        .filter((entry) => Number.isFinite(entry.year) && entry.theme);
    }
    return [];
  } catch {
    return parseThemesText(body);
  }
}

function toYoutubeEmbedUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.includes('youtube.com/embed/')) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : trimmed;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : trimmed;
    }
  } catch {
    // ignore
  }

  return trimmed;
}

export default function AboutPageAdmin() {
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
  const [statusIsError, setStatusIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pageImages, setPageImages] = useState<Record<string, string>>({});
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});
  const [storyVideoUrl, setStoryVideoUrl] = useState('');
  const [themesText, setThemesText] = useState('');

  const clearStatus = () => {
    setStatus('');
    setStatusIsError(false);
  };
  const setErrorStatus = (message: string) => {
    setStatus(message);
    setStatusIsError(true);
  };
  const setSuccessStatus = (message: string) => {
    setStatus(message);
    setStatusIsError(false);
  };

  const themesPreview = useMemo(() => parseThemesText(themesText), [themesText]);

  const fetchSiteContent = async (key: string): Promise<SiteContentRecord | null> => {
    try {
      const response = await apiFetch(`/api/site-content/${key}`);
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  };

  const uploadImage = async (file: File) => {
    if (!token) return null;

    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
      setErrorStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
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
      if (!response.ok) return null;
      const data = await response.json();
      return normalizeImageUrl(data.url);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      clearStatus();
      const keys = [...IMAGE_ITEMS.map((item) => item.key), STORY_VIDEO_KEY, YEARLY_THEMES_KEY];
      const entries = await Promise.all(
        keys.map(async (key) => {
          const record = await fetchSiteContent(key);
          return [key, record] as const;
        }),
      );

      const byKey = Object.fromEntries(entries) as Record<string, SiteContentRecord | null>;

      const imageMap: Record<string, string> = {};
      for (const item of IMAGE_ITEMS) {
        const record = byKey[item.key];
        const imageUrl = record?.imageUrl ? normalizeImageUrl(record.imageUrl) : '';
        imageMap[item.key] = imageUrl;
      }
      setPageImages(imageMap);

      setStoryVideoUrl(byKey[STORY_VIDEO_KEY]?.body ?? '');
      const themes = parseThemesBody(byKey[YEARLY_THEMES_KEY]?.body ?? null);
      setThemesText(themes.length ? themesToText(themes) : '');
    };

    load();
  }, [token]);

  const saveKey = async (key: string, payload: Partial<SiteContentRecord>) => {
    if (!token) return false;
    const response = await apiFetch(`/api/site-content/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  };

  const handleSaveAll = async () => {
    if (!token) return;
    clearStatus();
    setSaving(true);

    try {
      const themeEntries = parseThemesText(themesText);
      const themeBody = JSON.stringify(themeEntries);

      const saves = await Promise.all([
        ...IMAGE_ITEMS.map((item) =>
          saveKey(item.key, {
            imageUrl: pageImages[item.key] || null,
          }),
        ),
        saveKey(STORY_VIDEO_KEY, { body: storyVideoUrl ? toYoutubeEmbedUrl(storyVideoUrl) : null }),
        saveKey(YEARLY_THEMES_KEY, { body: themeBody }),
      ]);

      if (saves.every(Boolean)) {
        setSuccessStatus('About page updates saved.');
      } else {
        setErrorStatus('Some updates failed to save. Please try again.');
      }
    } catch {
      setErrorStatus('Unable to save updates right now.');
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
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">Admin</p>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">About Page</h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Update images, story video, and yearly themes shown on the About page.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleLogout}>
            Log out
          </Button>
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {status && (
        <p className={statusIsError ? 'text-sm text-red-600' : 'text-sm text-foreground/70'}>
          {status}
        </p>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-10">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Images</h2>
          <p className="text-sm text-foreground/60">
            Upload new images for the About page sections.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {IMAGE_ITEMS.map((item) => {
              const currentUrl = pageImages[item.key] || '';
              const previewUrl = currentUrl || item.fallback;
              const uploadKey = `about-${item.key}`;

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
                      accept="image/*,.heic,.heif,.avif"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        if (!url) {
                          setErrorStatus('Image upload failed. Please try again.');
                          return;
                        }
                        setPageImages((prev) => ({ ...prev, [item.key]: url }));
                        setUploadNames((prev) => ({ ...prev, [uploadKey]: file.name }));
                      }}
                      className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                      disabled={saving}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPageImages((prev) => ({ ...prev, [item.key]: '' }));
                        setUploadNames((prev) => ({ ...prev, [uploadKey]: '' }));
                      }}
                      disabled={saving}
                    >
                      Remove Image
                    </Button>
                    {uploadNames[uploadKey] ? (
                      <p className="text-xs text-foreground/60">Selected: {uploadNames[uploadKey]}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-xl font-semibold text-foreground mb-2">Our Story Video</h2>
            <p className="text-sm text-foreground/60 mb-4">
              Paste a YouTube link (watch URL, youtu.be URL, or embed URL).
            </p>
            <input
              type="url"
              value={storyVideoUrl}
              onChange={(event) => setStoryVideoUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground"
              disabled={saving}
            />
            <p className="mt-2 text-xs text-foreground/60 break-all">
              Embed preview URL: {toYoutubeEmbedUrl(storyVideoUrl) || '(not set)'}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-xl font-semibold text-foreground mb-2">Yearly Themes</h2>
            <p className="text-sm text-foreground/60 mb-4">
              One per line. Format: <span className="font-mono">YYYY - Theme</span>
            </p>
            <textarea
              value={themesText}
              onChange={(event) => setThemesText(event.target.value)}
              rows={10}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground"
              placeholder="2026 - The year of the hand of God - Ezekiel 37:1-10"
              disabled={saving}
            />
            <p className="mt-2 text-xs text-foreground/60">
              Parsed themes: {themesPreview.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
