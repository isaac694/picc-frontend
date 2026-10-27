'use client';

import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { CLOUDINARY_FOLDERS, uploadImageToCloudinary } from '@/lib/cloudinary-upload';
import { PROJECT_PAGE_IMAGES_UPLOAD_PREFIX } from '@/lib/project-page-images-upload';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { BookOpen, ImageIcon, RefreshCw, Search, Trash2, UploadCloud } from 'lucide-react';

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

/** Display URL in admin preview (backend `/uploads` or site static paths). */
function resolvePreviewImageUrl(stored: string) {
  if (!stored || stored === REMOVED_IMAGE_VALUE) return '';
  const trimmed = stored.trim();
  if (trimmed.startsWith(PROJECT_PAGE_IMAGES_UPLOAD_PREFIX)) return trimmed;
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return apiUrl(`/${trimmed.replace(/^\/+/, '')}`);
}

/** Persist `/uploads/...` in site content (not full backend URL or Cloudinary). */
function toPersistedImageUrl(stored: string) {
  if (!stored || stored === REMOVED_IMAGE_VALUE) return stored;
  const trimmed = stored.trim();
  if (trimmed.startsWith(PROJECT_PAGE_IMAGES_UPLOAD_PREFIX) || trimmed.startsWith('/uploads/')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith(PROJECT_PAGE_IMAGES_UPLOAD_PREFIX)) {
      return parsed.pathname;
    }
    if (parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname;
    }
  } catch {
    // not an absolute URL
  }
  return trimmed;
}

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
  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);
  const [dragOverImageKey, setDragOverImageKey] = useState<string | null>(null);

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

  const uploadImage = useCallback(async (file: File) => {
    if (!token) return null;

    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|gif|webp|avif|heic|heif)$/i.test(file.name);

    if (!isImage) {
      setStatus('Please upload an image file.');
      return null;
    }

    if (file.size > 1024 * 1024) {
      setStatus(
        'Your image file size is too big. Please compress it first before re-uploading. Only pictures less than 1MB are allowed.',
      );
      return null;
    }

    try {
      const uploaded = await uploadImageToCloudinary(file, CLOUDINARY_FOLDERS.PAGE_IMAGES, {
        maxSizeMB: 1,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif'],
      });
      const url = uploaded.url.trim();
      if (!url.startsWith('https://')) {
        setStatus('Upload did not return a Cloudinary URL.');
        return null;
      }
      return url;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Image upload failed.');
      return null;
    }
  }, [token]);

  const applyUploadedFile = async (itemKey: string, file: File) => {
    setUploadingImageKey(itemKey);
    setStatus('');
    try {
      const path = await uploadImage(file);
      if (!path) return;
      updatePageImage(itemKey, path);
      updateUploadName(`page-${itemKey}`, file.name);
      setStatus('Image uploaded. Click Save Homepage Images to publish.');
    } finally {
      setUploadingImageKey(null);
      setDragOverImageKey(null);
    }
  };

  const handleImageDragOver = (event: DragEvent<HTMLDivElement>, itemKey: string) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverImageKey(itemKey);
  };

  const handleImageDragLeave = (event: DragEvent<HTMLDivElement>, itemKey: string) => {
    event.preventDefault();
    event.stopPropagation();
    const related = event.relatedTarget;
    if (related instanceof Node && event.currentTarget.contains(related)) {
      return;
    }
    if (dragOverImageKey === itemKey) {
      setDragOverImageKey(null);
    }
  };

  const handleImageDrop = (event: DragEvent<HTMLDivElement>, itemKey: string) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverImageKey(null);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void applyUploadedFile(itemKey, file);
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
              imageUrl: pageImages[item.key]
                ? toPersistedImageUrl(pageImages[item.key])
                : null,
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
            const raw = typeof data.imageUrl === 'string' ? data.imageUrl : '';
            const imageUrl =
              raw === REMOVED_IMAGE_VALUE
                ? REMOVED_IMAGE_VALUE
                : raw
                  ? toPersistedImageUrl(raw)
                  : '';
            return [key, imageUrl] as const;
          } catch {
            return [key, ''] as const;
          }
        })
      );

      setPageImages(Object.fromEntries(imageEntries));
      await loadHomeVerse();
    };

    void fetchImages();
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
                  const previewUrl = isRemoved
                    ? ''
                    : currentUrl
                      ? resolvePreviewImageUrl(currentUrl)
                      : item.fallback;
                  const uploadInputId = `page-image-upload-${item.key}`;
                  const isUploading = uploadingImageKey === item.key;
                  const isDragOver = dragOverImageKey === item.key;
                  const usesLocalUpload = currentUrl.startsWith(PROJECT_PAGE_IMAGES_UPLOAD_PREFIX);
                  return (
                    <div key={item.key} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{getDisplayImageLabel(item.label)}</p>
                          <p className="mt-1 text-[11px] text-foreground/50">Homepage visual</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                          {isRemoved ? 'Removed' : usesLocalUpload ? 'Uploaded' : currentUrl ? 'Custom' : 'Default'}
                        </span>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onDragOver={(event) => handleImageDragOver(event, item.key)}
                        onDragEnter={(event) => handleImageDragOver(event, item.key)}
                        onDragLeave={(event) => handleImageDragLeave(event, item.key)}
                        onDrop={(event) => handleImageDrop(event, item.key)}
                        className={`relative h-40 overflow-hidden rounded-xl border-2 border-dashed transition ${
                          isDragOver
                            ? 'border-primary bg-primary/10'
                            : 'border-border/60 bg-background'
                        } ${isUploading ? 'opacity-70' : ''}`}
                      >
                        {previewUrl ? (
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${previewUrl})` }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-foreground/50">
                            {isRemoved ? 'Image removed' : 'No preview'}
                          </div>
                        )}
                        <div
                          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/45 px-4 text-center transition ${
                            isDragOver || isUploading
                              ? 'opacity-100'
                              : 'opacity-0 hover:opacity-100 focus-within:opacity-100'
                          }`}
                        >
                          <UploadCloud className="h-6 w-6 text-white" />
                          <p className="text-xs font-medium text-white">
                            {isUploading
                              ? 'Uploading…'
                              : isDragOver
                                ? 'Drop image to upload'
                                : 'Drag & drop an image here'}
                          </p>
                          <p className="text-[10px] text-white/80">Saved to public/uploads/page-images · max 1MB</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <input
                          id={uploadInputId}
                          type="file"
                          accept="image/*,.heic,.heif,.avif"
                          disabled={isUploading}
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            event.currentTarget.value = '';
                            if (!file) return;
                            await applyUploadedFile(item.key, file);
                          }}
                          className="sr-only"
                        />
                        <label
                          htmlFor={uploadInputId}
                          className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-primary transition hover:bg-primary/5 ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
                        >
                          <RefreshCw className={`h-4 w-4 ${isUploading ? 'animate-spin' : ''}`} />
                          {isUploading ? 'Uploading…' : 'Replace'}
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
