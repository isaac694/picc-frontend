'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { BookOpen, ImageIcon, RefreshCw, Search, Trash2 } from 'lucide-react';

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
const REMOVED_IMAGE_VALUE = '__removed__';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getImageSearchText = (item: { key: string; label: string }, section: { title: string; description: string }) => {
  const aliases = [
    item.key.includes('hero') ? 'hero banner top slideshow welcome' : '',
    item.key.includes('mission') ? 'mission our mission' : '',
    item.key.includes('grow-card') ? 'grow card faith walk quick links discover attend connect give' : '',
    item.key.includes('pastors') ? 'pastors pastor esau loyce' : '',
    item.key.includes('listen-now') ? 'listen now spotify audio messages' : '',
    item.key.includes('ministry-card') ? 'ministry outreach you were made for this' : '',
    item.key.includes('livestream') ? 'video declarations listen god word background livestream' : '',
  ];

  return [section.title, section.description, item.label, item.key, ...aliases]
    .join(' ')
    .toLowerCase();
};

const getDisplayImageLabel = (label: string) => label.replace('Hero Image', 'Hero Banner');

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
  const [removingImageKey, setRemovingImageKey] = useState<string | null>(null);
  const [imageSearch, setImageSearch] = useState('');
  const [activeImageSearch, setActiveImageSearch] = useState('');
  const [verseText, setVerseText] = useState('');
  const [verseReference, setVerseReference] = useState('');
  const [savingVerse, setSavingVerse] = useState(false);

  const updatePageImage = (key: string, value: string) => {
    setPageImages((prev) => ({ ...prev, [key]: value }));
  };

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
  };

  const filteredImageSections = useMemo(() => {
    const query = activeImageSearch.trim().toLowerCase();
    if (!query) return IMAGE_SECTIONS;

    return IMAGE_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          getImageSearchText(item, section).includes(query),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [activeImageSearch]);

  const visibleImageCount = filteredImageSections.reduce(
    (total, section) => total + section.items.length,
    0,
  );

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

  const removePageImage = async (key: string) => {
    if (!token) return;

    setRemovingImageKey(key);
    setStatus('');
    updatePageImage(key, REMOVED_IMAGE_VALUE);
    updateUploadName(`page-${key}`, '');

    try {
      const response = await apiFetch(`/api/site-content/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl: REMOVED_IMAGE_VALUE }),
      });

      if (!response.ok) {
        setStatus('Unable to remove image.');
        return;
      }

      setStatus('Image removed.');
    } catch {
      setStatus('Unable to remove image.');
    } finally {
      setRemovingImageKey(null);
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
            const imageUrl = data.imageUrl === REMOVED_IMAGE_VALUE
              ? REMOVED_IMAGE_VALUE
              : data.imageUrl
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

      <div className="rounded-[24px] border border-border/60 bg-card p-6 shadow-sm md:p-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.7fr_0.8fr]">
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Homepage Verse</h2>
                <p className="mt-1 text-sm text-foreground/60">
                  Update the scripture verse shown near the top of the home page.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.9fr_1.4fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Reference</span>
                <input
                  type="text"
                  value={verseReference}
                  onChange={(event) => setVerseReference(event.target.value)}
                  placeholder="Reference (e.g. Genesis 2:10)"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Verse text</span>
                <textarea
                  value={verseText}
                  onChange={(event) => setVerseText(event.target.value)}
                  placeholder="Verse text"
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => saveHomeVerse(verseText, verseReference)}
                disabled={savingVerse}
              >
                {savingVerse ? 'Saving...' : 'Save Verse'}
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
                Clear
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-foreground/70">Preview</p>
            <div className="min-h-[170px] rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
              <p className="text-4xl font-serif leading-none text-foreground/20">&ldquo;</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                {verseText || 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'}
              </p>
              <p className="mt-5 text-sm font-semibold text-foreground">
                {verseReference || 'John 3:16'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-border/60 bg-card p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Homepage Images</h2>
              <p className="mt-1 text-sm text-foreground/60">
                Upload new images for the homepage.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-xs uppercase tracking-[0.25em] text-foreground/50">
            {savingImages ? 'Saving...' : `${visibleImageCount} Images`}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border/60 bg-background p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Search image section
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <input
                  type="search"
                  value={imageSearch}
                  onChange={(event) => setImageSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      setActiveImageSearch(imageSearch);
                    }
                  }}
                  placeholder="Search hero, mission, grow, pastors, listen, ministry..."
                  className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-foreground placeholder:text-foreground/40"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setActiveImageSearch(imageSearch)}>
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImageSearch('');
                  setActiveImageSearch('');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-foreground/60">
            {activeImageSearch.trim()
              ? `${visibleImageCount} image slot${visibleImageCount === 1 ? '' : 's'} found for "${activeImageSearch.trim()}".`
              : 'Search by homepage section name, image label, or image key.'}
          </p>
        </div>

        <div className="space-y-10">
          {filteredImageSections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center">
              <h3 className="text-lg font-semibold text-foreground">No matching image sections</h3>
              <p className="mt-2 text-sm text-foreground/60">
                Try searching for hero, mission, grow, pastors, listen, ministry, or another image label.
              </p>
            </div>
          ) : filteredImageSections.map((section) => (
            <div key={section.id} className="rounded-2xl border border-border/60 bg-background p-5">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.items.map((item) => {
                  const currentUrl = pageImages[item.key] || '';
                  const isRemoved = currentUrl === REMOVED_IMAGE_VALUE;
                  const previewUrl = isRemoved ? '' : currentUrl || item.fallback;
                  const uploadInputId = `page-image-upload-${item.key}`;
                  return (
                    <div key={item.key} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{getDisplayImageLabel(item.label)}</p>
                          <p className="mt-1 text-[11px] text-foreground/50">Homepage visual</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                          {isRemoved ? 'Removed' : currentUrl ? 'Custom' : 'Default'}
                        </span>
                      </div>
                      {previewUrl ? (
                        <div
                          className="h-40 rounded-xl border border-border/60 bg-cover bg-center"
                          style={{ backgroundImage: `url(${previewUrl})` }}
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/80 bg-background text-sm text-foreground/50">
                          Image removed
                        </div>
                      )}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <input
                          id={uploadInputId}
                          type="file"
                          accept="image/*,.heic,.heif,.avif"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            event.currentTarget.value = '';
                            if (!file) return;
                            const url = await uploadImage(file);
                            if (!url) return;
                            updatePageImage(item.key, url);
                            updateUploadName(`page-${item.key}`, file.name);
                          }}
                          className="sr-only"
                        />
                        <label
                          htmlFor={uploadInputId}
                          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Replace
                        </label>
                        <Button
                          variant="outline"
                          className="h-10 gap-2 text-destructive hover:text-destructive"
                          onClick={() => void removePageImage(item.key)}
                          disabled={removingImageKey === item.key}
                        >
                          <Trash2 className="h-4 w-4" />
                          {removingImageKey === item.key ? 'Removing...' : 'Remove'}
                        </Button>
                      </div>
                      <div className="mt-3 min-h-4">
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
