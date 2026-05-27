'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const IMAGE_SECTIONS = [
  {
    id: 'home',
    title: 'Homepage Images',
    description: 'Update hero, mission, and ministry visuals used on the home page.',
    items: [
      { key: 'home-hero-1', label: 'Hero Image 1', fallback: '/hero/hero-4.JPG' },
      { key: 'home-hero-2', label: 'Hero Image 2', fallback: '/hero/hero-10.JPG' },
      { key: 'home-hero-3', label: 'Hero Image 3', fallback: '/hero/hero-9.JPG' },
      { key: 'home-hero-4', label: 'Hero Image 4', fallback: '/hero/hero-8.JPG' },
      { key: 'home-hero-5', label: 'Hero Image 5', fallback: '/hero/hero-7.png' },
      { key: 'home-hero-6', label: 'Hero Image 6', fallback: '/hero/hero-2.jpg' },
      { key: 'home-hero-7', label: 'Hero Image 7', fallback: '/hero/hero-1.jpg' },
      { key: 'home-hero-8', label: 'Hero Image 8', fallback: '/hero/hero-5.png' },
      { key: 'home-hero-9', label: 'Hero Image 9', fallback: '/hero/hero-3.JPG' },
      { key: 'home-mission-image', label: 'Our Mission Image', fallback: '/images/pastor-preaching-bw.jpeg' },
      { key: 'home-grow-card-1', label: 'Grow Card 1', fallback: '/cards/about-church.jpg' },
      { key: 'home-grow-card-2', label: 'Grow Card 2', fallback: '/cards/service-times.jpg' },
      { key: 'home-grow-card-3', label: 'Grow Card 3', fallback: '/cards/upcoming-events.jpg' },
      { key: 'home-grow-card-4', label: 'Grow Card 4', fallback: '/cards/give-offerings.jpg' },
      { key: 'home-pastors-image', label: 'Our Pastors Image', fallback: '/images/pastor-preaching-bw.jpeg' },
      { key: 'home-listen-now-bg', label: 'Listen Now Background', fallback: '/pastor/pastor-photo.jpg' },
      { key: 'home-ministry-card-1', label: 'You Were Made For This 1', fallback: '/hero/hero-2.jpg' },
      { key: 'home-ministry-card-2', label: 'You Were Made For This 2', fallback: '/hero/hero-5.png' },
      { key: 'home-ministry-card-3', label: 'You Were Made For This 3', fallback: '/hero/hero-1.jpg' },
      { key: 'home-ministry-card-4', label: 'You Were Made For This 4', fallback: '/hero/hero-6.jpg' },
      { key: 'home-ministry-card-5', label: 'You Were Made For This 5', fallback: '/hero/hero-3.jpg' },
      { key: 'home-ministry-card-6', label: 'You Were Made For This 6', fallback: '/hero/hero-4.jpg' },
      { key: 'home-ministry-card-7', label: 'You Were Made For This 7', fallback: '/cards/about-church.jpg' },
      { key: 'home-livestream-bg', label: "Listen to God's Word Background", fallback: '/hero/hero-6.jpg' },
    ],
  },
];

const HOME_VERSE_KEY = 'home-verse';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export default function PageImagesAdminPage() {
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
  const [pageImages, setPageImages] = useState<Record<string, string>>({});
  const [savingImages, setSavingImages] = useState(false);
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});
  const [verseText, setVerseText] = useState('');
  const [verseReference, setVerseReference] = useState('');
  const [savingVerse, setSavingVerse] = useState(false);

  const updatePageImage = (key: string, value: string) => {
    setPageImages((prev) => ({ ...prev, [key]: value }));
  };

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
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
      const data = await response.json();
      return apiUrl(data.url);
    } catch {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const loadHomeVerse = async () => {
    try {
      const response = await apiFetch(`/api/site-content/${HOME_VERSE_KEY}`);
      if (!response.ok) {
        setVerseText('');
        setVerseReference('');
        return;
      }
      const data = (await response.json().catch(() => null)) as unknown;
      const body = isRecord(data) && typeof data.body === 'string' ? data.body : '';
      if (!body) {
        setVerseText('');
        setVerseReference('');
        return;
      }

      try {
        const parsed = JSON.parse(body) as unknown;
        if (isRecord(parsed)) {
          setVerseText(typeof parsed.text === 'string' ? parsed.text : '');
          setVerseReference(typeof parsed.reference === 'string' ? parsed.reference : '');
          return;
        }
      } catch {
        // ignore JSON parsing
      }

      setVerseText(body);
      setVerseReference('');
    } catch {
      setVerseText('');
      setVerseReference('');
    }
  };

  const saveHomeVerse = async (nextText: string, nextReference: string) => {
    if (!token) return;
    setSavingVerse(true);
    setStatus('');

    try {
      const payload = JSON.stringify({ text: nextText, reference: nextReference });
      const response = await apiFetch(`/api/site-content/${HOME_VERSE_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: payload }),
      });

      if (!response.ok) {
        setStatus('Unable to save the home verse.');
        return;
      }

      setStatus('Home verse saved.');
    } catch {
      setStatus('Unable to save the home verse.');
    } finally {
      setSavingVerse(false);
    }
  };

  const saveImageSection = async (sectionId: string) => {
    if (!token) return;
    const section = IMAGE_SECTIONS.find((item) => item.id === sectionId);
    if (!section) return;
    setSavingImages(true);
    setStatus('');
    try {
      const responses = await Promise.all(
        section.items.map((item) =>
          apiFetch(`/api/site-content/${item.key}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              imageUrl: pageImages[item.key] || null,
            }),
          })
        )
      );
      if (responses.some((response) => !response.ok)) {
        setStatus(`Unable to save ${section.title.toLowerCase()}.`);
        return;
      }
      setStatus(`${section.title} updated.`);
    } catch {
      setStatus(`Unable to save ${section.title.toLowerCase()}.`);
    } finally {
      setSavingImages(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchImages = async () => {
      const imageKeys = IMAGE_SECTIONS.flatMap((section) =>
        section.items.map((item) => item.key)
      );
      const imageEntries = await Promise.all(
        imageKeys.map(async (key) => {
          try {
            const response = await apiFetch(`/api/site-content/${key}`);
            if (!response.ok) {
              return [key, ''] as const;
            }
            const data = await response.json();
            const imageUrl = data.imageUrl
              ? data.imageUrl.startsWith('http')
                ? data.imageUrl
                : apiUrl(data.imageUrl)
              : '';
            return [key, imageUrl] as const;
          } catch {
            return [key, ''] as const;
          }
        })
      );

      setPageImages(Object.fromEntries(imageEntries));
    };

    fetchImages();
    void loadHomeVerse();
  }, [token]);

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
            Homepage Images
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Upload and manage homepage visuals.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
              Homepage Verse
            </p>
            <p className="text-sm text-foreground/60">
              Update the scripture verse shown near the top of the home page.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-foreground/40">
            {savingVerse ? 'Saving...' : 'Verse'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={verseReference}
            onChange={(event) => setVerseReference(event.target.value)}
            placeholder="Reference (e.g. Genesis 2:10)"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
          />
          <textarea
            value={verseText}
            onChange={(event) => setVerseText(event.target.value)}
            placeholder="Verse text"
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground md:col-span-2"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => saveHomeVerse(verseText, verseReference)}
            disabled={savingVerse}
          >
            Save Verse
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setVerseText('');
              setVerseReference('');
              void saveHomeVerse('', '');
            }}
            disabled={savingVerse}
          >
            Clear Verse
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Homepage Images</h2>
            <p className="text-sm text-foreground/60">
              Upload new images for the homepage.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-foreground/40">
            {savingImages ? 'Saving...' : 'Images'}
          </div>
        </div>

        <div className="space-y-10">
          {IMAGE_SECTIONS.map((section) => (
            <div key={section.id} className="rounded-2xl border border-border/60 bg-background p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
                    {section.title}
                  </p>
                  <p className="text-sm text-foreground/60">{section.description}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => saveImageSection(section.id)}
                  disabled={savingImages}
                >
                  Save {section.title}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {section.items.map((item) => {
                  const currentUrl = pageImages[item.key] || '';
                  const previewUrl = currentUrl || item.fallback;
                  return (
                    <div key={item.key} className="rounded-2xl border border-border/60 bg-card p-4">
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
                            if (!url) return;
                            updatePageImage(item.key, url);
                            updateUploadName(`page-${item.key}`, file.name);
                          }}
                          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            updatePageImage(item.key, '');
                            updateUploadName(`page-${item.key}`, '');
                          }}
                        >
                          Remove Image
                        </Button>
                        {uploadNames[`page-${item.key}`] && (
                          <p className="text-xs text-foreground/60">
                            Selected: {uploadNames[`page-${item.key}`]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
