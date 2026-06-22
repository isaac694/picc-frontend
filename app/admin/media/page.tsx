'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { Trash2 } from 'lucide-react';
import {
  buildFallbackItems,
  DEFAULT_MEDIA_BOOKS,
  DEFAULT_MEDIA_GALLERY,
  DEFAULT_MEDIA_MAGAZINES,
  DEFAULT_MEDIA_NEWS,
  MEDIA_NEWS_MAX_ITEMS,
  mergeMediaItemsWithFallback,
  normalizeLoadedMediaItems,
  type MediaBookItem,
  type MediaGalleryItem,
  type MediaMagazineItem,
  type MediaNewsItem,
} from '@/lib/mediaDefaults';

const SECTION_KEYS = {
  news: 'media-news',
  gallery: 'media-gallery',
  books: 'media-books',
  magazines: 'media-magazines',
} as const;

const DRAFT_UPLOAD_KEYS = {
  news: 'news-draft',
  gallery: 'gallery-draft',
  books: 'books-draft',
  magazines: 'magazines-draft',
} as const;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const GALLERY_CATEGORIES = ['worship', 'outreach', 'youth', 'music', 'celebration', 'prayer'];

const NEWS_FALLBACKS = buildFallbackItems<MediaNewsItem>('news', DEFAULT_MEDIA_NEWS);
const GALLERY_FALLBACKS = buildFallbackItems<MediaGalleryItem>('gallery', DEFAULT_MEDIA_GALLERY);
const BOOK_FALLBACKS = buildFallbackItems<MediaBookItem>('books', DEFAULT_MEDIA_BOOKS);
const MAGAZINE_FALLBACKS = buildFallbackItems<MediaMagazineItem>('magazines', DEFAULT_MEDIA_MAGAZINES);

type NewsItem = MediaNewsItem;
type GalleryItem = MediaGalleryItem;
type BookItem = MediaBookItem;
type MagazineItem = MediaMagazineItem;

type SectionId = keyof typeof SECTION_KEYS;

type SectionItems = {
  news: NewsItem;
  gallery: GalleryItem;
  books: BookItem;
  magazines: MagazineItem;
};

type SectionDrafts = {
  news: Omit<NewsItem, 'id'>;
  gallery: Omit<GalleryItem, 'id'>;
  books: Omit<BookItem, 'id'>;
  magazines: Omit<MagazineItem, 'id'>;
};

const DEFAULT_NEWS_ITEM: Omit<NewsItem, 'id'> = {
  badge: 'Updates',
  date: '',
  title: '',
  description: '',
  imageUrl: '',
};

const DEFAULT_GALLERY_ITEM: Omit<GalleryItem, 'id'> = {
  title: '',
  category: '',
  imageUrl: '',
};

const DEFAULT_BOOK_ITEM: Omit<BookItem, 'id'> = {
  title: '',
  author: '',
  description: '',
  imageUrl: '',
  fileUrl: '',
};

const DEFAULT_MAGAZINE_ITEM: Omit<MagazineItem, 'id'> = {
  title: '',
  issue: '',
  fileUrl: '',
  imageUrl: '',
};

const EMPTY_EDITING_IDS: Record<SectionId, string | null> = {
  news: null,
  gallery: null,
  books: null,
  magazines: null,
};

const EMPTY_DELETED_FALLBACK_INDEXES: Record<SectionId, number[]> = {
  news: [],
  gallery: [],
  books: [],
  magazines: [],
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 13 }, (_, index) => (currentYear - 2 + index).toString());

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const newId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseJson = (value: unknown) => {
  if (typeof value !== 'string') return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const sectionCardClassName = 'rounded-3xl border border-border/60 bg-card p-6 shadow-sm';

const ItemSourceBadge = ({ isFallback }: { isFallback?: boolean }) =>
  isFallback ? (
    <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60">
      Built-in
    </span>
  ) : (
    <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
      Saved
    </span>
  );

export default function AdminMediaPage() {
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
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [bookItems, setBookItems] = useState<BookItem[]>([]);
  const [magazineItems, setMagazineItems] = useState<MagazineItem[]>([]);
  const [newsSearch, setNewsSearch] = useState('');
  const [magazineSearch, setMagazineSearch] = useState('');
  const [draftNews, setDraftNews] = useState(DEFAULT_NEWS_ITEM);
  const [draftGallery, setDraftGallery] = useState(DEFAULT_GALLERY_ITEM);
  const [draftBook, setDraftBook] = useState(DEFAULT_BOOK_ITEM);
  const [draftMagazine, setDraftMagazine] = useState(DEFAULT_MAGAZINE_ITEM);
  const [editingIds, setEditingIds] = useState<Record<SectionId, string | null>>(EMPTY_EDITING_IDS);
  const [deletedFallbackIndexes, setDeletedFallbackIndexes] = useState<Record<SectionId, number[]>>(EMPTY_DELETED_FALLBACK_INDEXES);
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
  };

  const resetSectionEditor = (section: SectionId) => {
    setEditingIds((prev) => ({ ...prev, [section]: null }));
    updateUploadName(DRAFT_UPLOAD_KEYS[section], '');

    if (section === 'news') setDraftNews(DEFAULT_NEWS_ITEM);
    if (section === 'gallery') setDraftGallery(DEFAULT_GALLERY_ITEM);
    if (section === 'books') setDraftBook(DEFAULT_BOOK_ITEM);
    if (section === 'magazines') setDraftMagazine(DEFAULT_MAGAZINE_ITEM);
  };

  const startEditingNews = (item: NewsItem) => {
    setDraftNews({
      badge: item.badge || 'Updates',
      date: item.date || '',
      title: item.title || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
    });
    setEditingIds((prev) => ({ ...prev, news: item.id }));
    updateUploadName(DRAFT_UPLOAD_KEYS.news, '');
  };

  const startEditingGallery = (item: GalleryItem) => {
    setDraftGallery({
      title: item.title || '',
      category: item.category || '',
      imageUrl: item.imageUrl || '',
    });
    setEditingIds((prev) => ({ ...prev, gallery: item.id }));
    updateUploadName(DRAFT_UPLOAD_KEYS.gallery, '');
  };

  const startEditingBook = (item: BookItem) => {
    setDraftBook({
      title: item.title || '',
      author: item.author || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      fileUrl: item.fileUrl || '',
    });
    setEditingIds((prev) => ({ ...prev, books: item.id }));
    updateUploadName(DRAFT_UPLOAD_KEYS.books, '');
  };

  const startEditingMagazine = (item: MagazineItem) => {
    setDraftMagazine({
      title: item.title || '',
      issue: item.issue || '',
      fileUrl: item.fileUrl || '',
      imageUrl: item.imageUrl || '',
    });
    setEditingIds((prev) => ({ ...prev, magazines: item.id }));
    updateUploadName(DRAFT_UPLOAD_KEYS.magazines, '');
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
      return data.url as string;
    } catch {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const fetchSection = async <S extends SectionId>(
    section: S,
    key: string,
    fallbacks: SectionItems[S][],
    setState: (value: SectionItems[S][]) => void,
  ) => {
    try {
      const response = await apiFetch(`/api/site-content/${key}`);
      if (!response.ok && response.status !== 404) {
        setState(fallbacks);
        return;
      }

      if (response.status === 404) {
        setState(fallbacks);
        return;
      }

      const record = (await response.json().catch(() => null)) as unknown;
      const body = isRecord(record) ? record.body : null;
      const parsed = parseJson(body);
      const deletedIndexes =
        isRecord(parsed) && Array.isArray(parsed.deletedFallbackIndexes)
          ? parsed.deletedFallbackIndexes.filter((value): value is number => typeof value === 'number')
          : [];
      const items =
        Array.isArray(parsed)
          ? parsed
          : isRecord(parsed) && Array.isArray(parsed.items)
            ? parsed.items
            : [];

      const normalized = normalizeLoadedMediaItems<SectionItems[S]>(items)
        .filter((item) => !item.isDeleted);
      const deletedFromLegacyTombstones = normalizeLoadedMediaItems<SectionItems[S]>(items)
        .filter((item) => item.isDeleted && typeof item.fallbackIndex === 'number')
        .map((item) => item.fallbackIndex as number);
      const nextDeletedIndexes = Array.from(new Set([...deletedIndexes, ...deletedFromLegacyTombstones]));
      const visibleFallbacks = fallbacks.filter(
        (item) => typeof item.fallbackIndex !== 'number' || !nextDeletedIndexes.includes(item.fallbackIndex),
      );
      setDeletedFallbackIndexes((prev) => ({ ...prev, [section]: nextDeletedIndexes }));
      setState(mergeMediaItemsWithFallback(normalized, visibleFallbacks));
    } catch {
      setState(fallbacks);
    }
  };

  const saveSection = async (key: string, items: unknown[], nextDeletedFallbackIndexes: number[] = []) => {
    if (!token) return false;

    const response = await apiFetch(`/api/site-content/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body: JSON.stringify({ items, deletedFallbackIndexes: nextDeletedFallbackIndexes }) }),
    });

    return response.ok;
  };

  useEffect(() => {
    if (!token) return;

    void Promise.all([
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSection('news', SECTION_KEYS.news, NEWS_FALLBACKS, setNewsItems),
      fetchSection('gallery', SECTION_KEYS.gallery, GALLERY_FALLBACKS, setGalleryItems),
      fetchSection('books', SECTION_KEYS.books, BOOK_FALLBACKS, setBookItems),
      fetchSection('magazines', SECTION_KEYS.magazines, MAGAZINE_FALLBACKS, setMagazineItems),
    ]);
  }, [token]);

  const getFallbacksForSection = (section: SectionId) => {
    if (section === 'news') return NEWS_FALLBACKS;
    if (section === 'gallery') return GALLERY_FALLBACKS;
    if (section === 'books') return BOOK_FALLBACKS;
    return MAGAZINE_FALLBACKS;
  };

  const persistedNewsCount = newsItems.filter((item) => !item.isFallback).length;
  const editingNewsItem = editingIds.news ? newsItems.find((item) => item.id === editingIds.news) : null;
  const editingGalleryItem = editingIds.gallery ? galleryItems.find((item) => item.id === editingIds.gallery) : null;
  const editingBookItem = editingIds.books ? bookItems.find((item) => item.id === editingIds.books) : null;
  const editingMagazineItem = editingIds.magazines
    ? magazineItems.find((item) => item.id === editingIds.magazines)
    : null;

  const filteredNewsItems = useMemo(() => {
    const term = newsSearch.trim().toLowerCase();
    if (!term) return newsItems;
    return newsItems.filter((item) =>
      [item.badge, item.date, item.title, item.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [newsItems, newsSearch]);

  const filteredMagazineItems = useMemo(() => {
    const term = magazineSearch.trim().toLowerCase();
    if (!term) return magazineItems;
    return magazineItems.filter((item) =>
      [item.issue, item.title]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [magazineItems, magazineSearch]);

  const handleSaveItem = async <S extends SectionId>(
    section: S,
    draft: SectionDrafts[S],
    editingId: string | null,
    items: SectionItems[S][],
    setItems: (items: SectionItems[S][]) => void,
  ) => {
    if (!token) return;

    const fallbacks = getFallbacksForSection(section);
    const persistedItems = items.filter((item) => !item.isFallback) as SectionItems[S][];
    const editingItem = editingId ? items.find((item) => item.id === editingId) : null;
    const isFallbackEdit = Boolean(editingItem?.isFallback);

    if (section === 'news' && !isFallbackEdit && !editingId && persistedItems.length >= MEDIA_NEWS_MAX_ITEMS) {
      setStatus(`Only ${MEDIA_NEWS_MAX_ITEMS} saved news items can be stored in the dashboard. Delete one before adding another.`);
      return;
    }

    if (!draft.title.trim()) {
      setStatus('Please add a title before saving.');
      return;
    }

    setStatus('');

    try {
      let nextPersisted: SectionItems[S][];

      if (editingId && !isFallbackEdit) {
        nextPersisted = persistedItems.map((existing) =>
          existing.id === editingId
            ? ({ ...draft, id: editingId, fallbackIndex: existing.fallbackIndex } as SectionItems[S])
            : existing,
        );
      } else {
        nextPersisted = [
          ...persistedItems,
          {
            ...draft,
            id: newId(),
            fallbackIndex: isFallbackEdit ? editingItem?.fallbackIndex : undefined,
          } as SectionItems[S],
        ];
      }

      const visibleFallbacks = (fallbacks as SectionItems[S][]).filter(
        (item) => typeof item.fallbackIndex !== 'number' || !deletedFallbackIndexes[section].includes(item.fallbackIndex),
      );
      const ok = await saveSection(SECTION_KEYS[section], nextPersisted, deletedFallbackIndexes[section]);
      if (!ok) {
        setStatus(editingId ? 'Unable to update item.' : 'Unable to add item to the media section.');
        return;
      }

      setItems(mergeMediaItemsWithFallback(nextPersisted, visibleFallbacks));
      resetSectionEditor(section);
      setStatus(
        isFallbackEdit
          ? 'Built-in item customized and saved.'
          : editingId
            ? 'Item updated.'
            : 'Item added.',
      );
    } catch {
      setStatus(editingId ? 'Unable to update item.' : 'Unable to add item to the media section.');
    }
  };

  const handleDeleteItem = async <S extends SectionId>(
    section: S,
    itemId: string,
    items: SectionItems[S][],
    setItems: (items: SectionItems[S][]) => void,
  ) => {
    if (!token) return;

    const target = items.find((item) => item.id === itemId);
    if (!target) return;

    setStatus('');

    try {
      const fallbacks = getFallbacksForSection(section);
      const persistedItems = items.filter((item) => !item.isFallback) as SectionItems[S][];
      const nextDeletedIndexes =
        target.isFallback && typeof target.fallbackIndex === 'number'
          ? Array.from(new Set([...deletedFallbackIndexes[section], target.fallbackIndex]))
          : deletedFallbackIndexes[section];
      const nextPersisted = target.isFallback
        ? persistedItems
        : persistedItems.filter((item) => item.id !== itemId);
      const ok = await saveSection(SECTION_KEYS[section], nextPersisted, nextDeletedIndexes);
      if (!ok) {
        setStatus('Unable to delete item.');
        return;
      }

      const visibleFallbacks = (fallbacks as SectionItems[S][]).filter(
        (item) => typeof item.fallbackIndex !== 'number' || !nextDeletedIndexes.includes(item.fallbackIndex),
      );
      setDeletedFallbackIndexes((prev) => ({ ...prev, [section]: nextDeletedIndexes }));
      setItems(mergeMediaItemsWithFallback(nextPersisted, visibleFallbacks));
      if (editingIds[section] === itemId) {
        resetSectionEditor(section);
      }
      setStatus('Item deleted.');
    } catch {
      setStatus('Unable to delete item.');
    }
  };

  const requestDeleteItem = <S extends SectionId>(
    section: S,
    item: SectionItems[S],
    items: SectionItems[S][],
    setItems: (items: SectionItems[S][]) => void,
  ) => {
    confirmDeleteToast({
      title: 'Delete this item?',
      description: item.title || 'This media item will be permanently removed.',
      onConfirm: () => handleDeleteItem(section, item.id, items, setItems),
    });
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">
            Media Page Editor
          </h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage church news, gallery items, Fire on the Altar books, and magazines. Built-in content appears alongside saved dashboard items, just like the ministry pages.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="space-y-12">
        <section className="space-y-5 border-t border-border/60 pt-8 first:border-t-0 first:pt-0">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Church News</p>
            <p className="text-sm text-foreground/60">
              Keep news stories separate from the rest of the media page and edit them from one focused workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className={`${sectionCardClassName} space-y-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {editingIds.news ? 'Edit News Item' : 'Create News Item'}
                  </h2>
                  <p className="text-sm text-foreground/60">
                    The editor stays right after the sidebar, just like the devotions flow.
                  </p>
                  <p className={`mt-2 text-xs font-semibold ${persistedNewsCount >= MEDIA_NEWS_MAX_ITEMS ? 'text-destructive' : 'text-primary'}`}>
                    {persistedNewsCount} / {MEDIA_NEWS_MAX_ITEMS} saved news items. Built-in news also appears on the public page and in the list below.
                  </p>
                </div>
                {editingIds.news && (
                  <Button variant="outline" onClick={() => resetSectionEditor('news')}>
                    New Item
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_1.35fr_1.35fr_0.95fr]">
                <input
                  type="text"
                  placeholder="Badge"
                  value={draftNews.badge}
                  onChange={(event) => setDraftNews((prev) => ({ ...prev, badge: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
                <select
                  value={draftNews.date.split(' ')[0] || ''}
                  onChange={(event) => {
                    const year = draftNews.date.split(' ')[1] || '';
                    setDraftNews((prev) => ({
                      ...prev,
                      date: event.target.value ? `${event.target.value}${year ? ` ${year}` : ''}` : year,
                    }));
                  }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                >
                  <option value="">Month</option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={draftNews.date.split(' ')[1] || ''}
                  onChange={(event) => {
                    const month = draftNews.date.split(' ')[0] || '';
                    setDraftNews((prev) => ({
                      ...prev,
                      date: event.target.value ? `${month ? `${month} ` : ''}${event.target.value}` : month,
                    }));
                  }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                >
                  <option value="">Year</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Headline"
                  value={draftNews.title}
                  onChange={(event) => setDraftNews((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={draftNews.description}
                  onChange={(event) => setDraftNews((prev) => ({ ...prev, description: event.target.value }))}
                  rows={5}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  placeholder="Write a short summary for the news story."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Upload Image</label>
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.avif"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (!url) return;
                    setDraftNews((prev) => ({ ...prev, imageUrl: url }));
                    updateUploadName(DRAFT_UPLOAD_KEYS.news, file.name);
                  }}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
                {uploadNames[DRAFT_UPLOAD_KEYS.news] && (
                  <p className="mt-2 text-xs text-foreground/60">Selected: {uploadNames[DRAFT_UPLOAD_KEYS.news]}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleSaveItem('news', draftNews, editingIds.news, newsItems, setNewsItems)}
                  disabled={!editingIds.news && persistedNewsCount >= MEDIA_NEWS_MAX_ITEMS}
                >
                  {editingIds.news ? 'Save News Item' : 'Add News Item'}
                </Button>
                <Button variant="outline" onClick={() => resetSectionEditor('news')}>
                  Clear
                </Button>
                {editingNewsItem && (
                  <Button
                    variant="destructive"
                    onClick={() => requestDeleteItem('news', editingNewsItem, newsItems, setNewsItems)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <div className={sectionCardClassName}>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Existing News</h3>
              <div className="mb-4">
                <input
                  type="search"
                  value={newsSearch}
                  onChange={(event) => setNewsSearch(event.target.value)}
                  placeholder="Search existing news..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              {filteredNewsItems.length === 0 ? (
                <p className="text-sm text-foreground/60">No news items yet.</p>
              ) : (
                <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
                  {filteredNewsItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 transition ${
                        editingIds.news === item.id
                          ? 'border-primary/60 bg-primary/5'
                          : 'border-border/60 bg-background'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                          {[item.badge, item.date].filter(Boolean).join(' - ') || 'News Item'}
                        </p>
                        <ItemSourceBadge isFallback={item.isFallback} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {item.title || 'Untitled news item'}
                      </p>
                      {item.description && (
                        <p className="mt-2 text-sm text-foreground/70">{item.description}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => startEditingNews(item)}>
                          {editingIds.news === item.id ? 'Editing' : 'Edit'}
                        </Button>
                        <Button variant="outline" onClick={() => requestDeleteItem('news', item, newsItems, setNewsItems)} className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-border/60 pt-8">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Events Gallery</p>
            <p className="text-sm text-foreground/60">
              Gallery items are now managed in their own split area so they do not overlap with church news.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className={`${sectionCardClassName} space-y-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {editingIds.gallery ? 'Edit Gallery Item' : 'Create Gallery Item'}
                  </h2>
                  <p className="text-sm text-foreground/60">
                    Select an item on the right to update it here.
                  </p>
                </div>
                {editingIds.gallery && (
                  <Button variant="outline" onClick={() => resetSectionEditor('gallery')}>
                    New Item
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={draftGallery.title}
                  onChange={(event) => setDraftGallery((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
                <select
                  value={draftGallery.category}
                  onChange={(event) => setDraftGallery((prev) => ({ ...prev, category: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                >
                  <option value="">Select a category</option>
                  {GALLERY_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Upload Image</label>
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.avif"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (!url) return;
                    setDraftGallery((prev) => ({ ...prev, imageUrl: url }));
                    updateUploadName(DRAFT_UPLOAD_KEYS.gallery, file.name);
                  }}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
                {uploadNames[DRAFT_UPLOAD_KEYS.gallery] && (
                  <p className="mt-2 text-xs text-foreground/60">Selected: {uploadNames[DRAFT_UPLOAD_KEYS.gallery]}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    handleSaveItem('gallery', draftGallery, editingIds.gallery, galleryItems, setGalleryItems)
                  }
                >
                  {editingIds.gallery ? 'Save Gallery Item' : 'Add Gallery Item'}
                </Button>
                <Button variant="outline" onClick={() => resetSectionEditor('gallery')}>
                  Clear
                </Button>
                {editingGalleryItem && (
                  <Button
                    variant="destructive"
                    onClick={() => requestDeleteItem('gallery', editingGalleryItem, galleryItems, setGalleryItems)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <div className={sectionCardClassName}>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Existing Gallery Items</h3>
              {galleryItems.length === 0 ? (
                <p className="text-sm text-foreground/60">No gallery items yet.</p>
              ) : (
                <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
                  {galleryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 transition ${
                        editingIds.gallery === item.id
                          ? 'border-primary/60 bg-primary/5'
                          : 'border-border/60 bg-background'
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                        {item.category || 'Gallery'}
                      </p>
                      <div className="mt-2 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title || 'Untitled gallery item'}
                        </p>
                        <ItemSourceBadge isFallback={item.isFallback} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => startEditingGallery(item)}>
                          {editingIds.gallery === item.id ? 'Editing' : 'Edit'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => requestDeleteItem('gallery', item, galleryItems, setGalleryItems)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-border/60 pt-8">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Fire on the Altar Books</p>
            <p className="text-sm text-foreground/60">
              Book uploads now have their own separated editor and review list for safer updates.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className={`${sectionCardClassName} space-y-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {editingIds.books ? 'Edit Book' : 'Create a new Fire on the Altar Book'}
                  </h2>
                  <p className="text-sm text-foreground/60">
                    Pick a saved book on the right when you need to update it.
                  </p>
                </div>
                {editingIds.books && (
                  <Button variant="outline" onClick={() => resetSectionEditor('books')}>
                    New Item
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Book title"
                  value={draftBook.title}
                  onChange={(event) => setDraftBook((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
                <input
                  type="text"
                  placeholder="Author"
                  value={draftBook.author}
                  onChange={(event) => setDraftBook((prev) => ({ ...prev, author: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={draftBook.description}
                  onChange={(event) => setDraftBook((prev) => ({ ...prev, description: event.target.value }))}
                  rows={5}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  placeholder="Write a short description of the book."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Cover Image</label>
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.avif"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (!url) return;
                    setDraftBook((prev) => ({ ...prev, imageUrl: url }));
                    updateUploadName(DRAFT_UPLOAD_KEYS.books, file.name);
                  }}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
                {uploadNames[DRAFT_UPLOAD_KEYS.books] && (
                  <p className="mt-2 text-xs text-foreground/60">Selected: {uploadNames[DRAFT_UPLOAD_KEYS.books]}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleSaveItem('books', draftBook, editingIds.books, bookItems, setBookItems)}>
                  {editingIds.books ? 'Save Book' : 'Add Book'}
                </Button>
                <Button variant="outline" onClick={() => resetSectionEditor('books')}>
                  Clear
                </Button>
                {editingBookItem && (
                  <Button
                    variant="destructive"
                    onClick={() => requestDeleteItem('books', editingBookItem, bookItems, setBookItems)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <div className={sectionCardClassName}>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Existing Fire on the Altar</h3>
              {bookItems.length === 0 ? (
                <p className="text-sm text-foreground/60">No books yet.</p>
              ) : (
                <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
                  {bookItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 transition ${
                        editingIds.books === item.id
                          ? 'border-primary/60 bg-primary/5'
                          : 'border-border/60 bg-background'
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                        {item.author || 'Book'}
                      </p>
                      <div className="mt-2 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title || 'Untitled book'}
                        </p>
                        <ItemSourceBadge isFallback={item.isFallback} />
                      </div>
                      {item.description && (
                        <p className="mt-2 text-sm text-foreground/70">{item.description}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => startEditingBook(item)}>
                          {editingIds.books === item.id ? 'Editing' : 'Edit'}
                        </Button>
                        <Button variant="outline" onClick={() => requestDeleteItem('books', item, bookItems, setBookItems)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-border/60 pt-8">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Church Magazines</p>
            <p className="text-sm text-foreground/60">
              Magazine entries now sit in their own final section with a dedicated review column.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className={`${sectionCardClassName} space-y-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {editingIds.magazines ? 'Edit Magazine' : 'Create Magazine'}
                  </h2>
                  <p className="text-sm text-foreground/60">
                    Use the list on the right to load an existing issue into this editor.
                  </p>
                </div>
                {editingIds.magazines && (
                  <Button variant="outline" onClick={() => resetSectionEditor('magazines')}>
                    New Item
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Magazine title"
                  value={draftMagazine.title}
                  onChange={(event) => setDraftMagazine((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
                <input
                  type="text"
                  placeholder="Issue"
                  value={draftMagazine.issue}
                  onChange={(event) => setDraftMagazine((prev) => ({ ...prev, issue: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>

              <input
                type="text"
                placeholder="Link URL"
                value={draftMagazine.fileUrl}
                onChange={(event) => setDraftMagazine((prev) => ({ ...prev, fileUrl: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Cover Image</label>
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.avif"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (!url) return;
                    setDraftMagazine((prev) => ({ ...prev, imageUrl: url }));
                    updateUploadName(DRAFT_UPLOAD_KEYS.magazines, file.name);
                  }}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
                {uploadNames[DRAFT_UPLOAD_KEYS.magazines] && (
                  <p className="mt-2 text-xs text-foreground/60">Selected: {uploadNames[DRAFT_UPLOAD_KEYS.magazines]}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    handleSaveItem('magazines', draftMagazine, editingIds.magazines, magazineItems, setMagazineItems)
                  }
                >
                  {editingIds.magazines ? 'Save Magazine' : 'Add Magazine'}
                </Button>
                <Button variant="outline" onClick={() => resetSectionEditor('magazines')}>
                  Clear
                </Button>
                {editingMagazineItem && (
                  <Button
                    variant="destructive"
                    onClick={() => requestDeleteItem('magazines', editingMagazineItem, magazineItems, setMagazineItems)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <div className={sectionCardClassName}>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Existing Magazines</h3>
              <div className="mb-4">
                <input
                  type="search"
                  value={magazineSearch}
                  onChange={(event) => setMagazineSearch(event.target.value)}
                  placeholder="Search existing magazines..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              {filteredMagazineItems.length === 0 ? (
                <p className="text-sm text-foreground/60">No magazine issues yet.</p>
              ) : (
                <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
                  {filteredMagazineItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 transition ${
                        editingIds.magazines === item.id
                          ? 'border-primary/60 bg-primary/5'
                          : 'border-border/60 bg-background'
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                        {item.issue || 'Magazine'}
                      </p>
                      <div className="mt-2 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title || 'Untitled magazine'}
                        </p>
                        <ItemSourceBadge isFallback={item.isFallback} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => startEditingMagazine(item)}>
                          {editingIds.magazines === item.id ? 'Editing' : 'Edit'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => requestDeleteItem('magazines', item, magazineItems, setMagazineItems)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
