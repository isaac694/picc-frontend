'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const { runUpload, progress, uploading } = useMediaUpload();
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
  const [openSection, setOpenSection] = useState<SectionId | null>(null);

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

  const closeSectionDialog = (section: SectionId) => {
    setOpenSection(null);
    resetSectionEditor(section);
  };

  const openAddSectionDialog = (section: SectionId) => {
    resetSectionEditor(section);
    setOpenSection(section);
  };

  const openEditSectionDialog = <S extends SectionId>(section: S, item: SectionItems[S]) => {
    if (section === 'news') startEditingNews(item as NewsItem);
    if (section === 'gallery') startEditingGallery(item as GalleryItem);
    if (section === 'books') startEditingBook(item as BookItem);
    if (section === 'magazines') startEditingMagazine(item as MagazineItem);
    setOpenSection(section);
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
    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
      setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }

    try {
      return await runUpload(file, 'media');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Image upload failed.');
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
      setOpenSection(null);
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
        closeSectionDialog(section);
      } else if (openSection === section) {
        setOpenSection(null);
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
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}
      <MediaUploadProgress uploading={uploading} progress={progress} />

      <div className="space-y-12">
        <section className="space-y-5 border-t border-border/60 pt-8 first:border-t-0 first:pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Church News</p>
              <p className="text-sm text-foreground/60">
                Keep news stories separate from the rest of the media page and edit them from one focused workspace.
              </p>
              <p className={`mt-2 text-xs font-semibold ${persistedNewsCount >= MEDIA_NEWS_MAX_ITEMS ? 'text-destructive' : 'text-primary'}`}>
                {persistedNewsCount} / {MEDIA_NEWS_MAX_ITEMS} saved news items. Built-in news also appears on the public page.
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 gap-2"
              disabled={persistedNewsCount >= MEDIA_NEWS_MAX_ITEMS}
              onClick={() => openAddSectionDialog('news')}
            >
              <Plus className="h-4 w-4" />
              Add news
            </Button>
          </div>

          <div className={sectionCardClassName}>
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
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-background px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                          {[item.badge, item.date].filter(Boolean).join(' - ') || 'News Item'}
                        </p>
                        <ItemSourceBadge isFallback={item.isFallback} />
                      </div>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {item.title || 'Untitled news item'}
                      </p>
                      {item.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${item.title || 'news item'}`}
                        onClick={() => openEditSectionDialog('news', item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${item.title || 'news item'}`}
                        onClick={() => requestDeleteItem('news', item, newsItems, setNewsItems)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5 border-t border-border/60 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Events Gallery</p>
              <p className="text-sm text-foreground/60">
                Gallery items are managed separately from church news.
              </p>
            </div>
            <Button type="button" className="shrink-0 gap-2" onClick={() => openAddSectionDialog('gallery')}>
              <Plus className="h-4 w-4" />
              Add gallery item
            </Button>
          </div>

          <div className={sectionCardClassName}>
            {galleryItems.length === 0 ? (
              <p className="text-sm text-foreground/60">No gallery items yet.</p>
            ) : (
              <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
                {galleryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                        {item.category || 'Gallery'}
                      </p>
                      <div className="mt-1 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title || 'Untitled gallery item'}
                        </p>
                        <ItemSourceBadge isFallback={item.isFallback} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${item.title || 'gallery item'}`}
                        onClick={() => openEditSectionDialog('gallery', item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${item.title || 'gallery item'}`}
                        onClick={() => requestDeleteItem('gallery', item, galleryItems, setGalleryItems)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5 border-t border-border/60 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Fire on the Altar Books</p>
              <p className="text-sm text-foreground/60">
                Book uploads have a dedicated list and modal editor.
              </p>
            </div>
            <Button type="button" className="shrink-0 gap-2" onClick={() => openAddSectionDialog('books')}>
              <Plus className="h-4 w-4" />
              Add book
            </Button>
          </div>

          <div className={sectionCardClassName}>
            {bookItems.length === 0 ? (
              <p className="text-sm text-foreground/60">No books yet.</p>
            ) : (
              <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
                {bookItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-background px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                        {item.author || 'Book'}
                      </p>
                      <div className="mt-1 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title || 'Untitled book'}
                        </p>
                        <ItemSourceBadge isFallback={item.isFallback} />
                      </div>
                      {item.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${item.title || 'book'}`}
                        onClick={() => openEditSectionDialog('books', item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${item.title || 'book'}`}
                        onClick={() => requestDeleteItem('books', item, bookItems, setBookItems)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5 border-t border-border/60 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Church Magazines</p>
              <p className="text-sm text-foreground/60">
                Magazine entries in a dedicated list with modal editing.
              </p>
            </div>
            <Button type="button" className="shrink-0 gap-2" onClick={() => openAddSectionDialog('magazines')}>
              <Plus className="h-4 w-4" />
              Add magazine
            </Button>
          </div>

          <div className={sectionCardClassName}>
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
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                        {item.issue || 'Magazine'}
                      </p>
                      <div className="mt-1 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title || 'Untitled magazine'}
                        </p>
                        <ItemSourceBadge isFallback={item.isFallback} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${item.title || 'magazine'}`}
                        onClick={() => openEditSectionDialog('magazines', item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${item.title || 'magazine'}`}
                        onClick={() => requestDeleteItem('magazines', item, magazineItems, setMagazineItems)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <SchoolAdminDialogShell
        open={openSection !== null}
        onOpenChange={(open) => {
          if (!open && openSection) closeSectionDialog(openSection);
        }}
        title={
          openSection === 'news'
            ? editingIds.news
              ? 'Edit news item'
              : 'Add news item'
            : openSection === 'gallery'
              ? editingIds.gallery
                ? 'Edit gallery item'
                : 'Add gallery item'
              : openSection === 'books'
                ? editingIds.books
                  ? 'Edit book'
                  : 'Add book'
                : openSection === 'magazines'
                  ? editingIds.magazines
                    ? 'Edit magazine'
                    : 'Add magazine'
                  : 'Edit item'
        }
        description="Update the details below and save your changes."
        saving={uploading}
        saveLabel={
          openSection === 'news'
            ? editingIds.news
              ? 'Save news item'
              : 'Add news item'
            : openSection === 'gallery'
              ? editingIds.gallery
                ? 'Save gallery item'
                : 'Add gallery item'
              : openSection === 'books'
                ? editingIds.books
                  ? 'Save book'
                  : 'Add book'
                : openSection === 'magazines'
                  ? editingIds.magazines
                    ? 'Save magazine'
                    : 'Add magazine'
                  : 'Save'
        }
        onSave={() => {
          if (openSection === 'news') {
            void handleSaveItem('news', draftNews, editingIds.news, newsItems, setNewsItems);
          } else if (openSection === 'gallery') {
            void handleSaveItem('gallery', draftGallery, editingIds.gallery, galleryItems, setGalleryItems);
          } else if (openSection === 'books') {
            void handleSaveItem('books', draftBook, editingIds.books, bookItems, setBookItems);
          } else if (openSection === 'magazines') {
            void handleSaveItem('magazines', draftMagazine, editingIds.magazines, magazineItems, setMagazineItems);
          }
        }}
        onCancel={() => {
          if (openSection) closeSectionDialog(openSection);
        }}
        maxWidthClass="sm:max-w-2xl"
      >
        {openSection === 'news' ? (
          <div className="space-y-4">
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
              {uploadNames[DRAFT_UPLOAD_KEYS.news] ? (
                <p className="mt-2 text-xs text-foreground/60">Selected: {uploadNames[DRAFT_UPLOAD_KEYS.news]}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        {openSection === 'gallery' ? (
          <div className="space-y-4">
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
              {uploadNames[DRAFT_UPLOAD_KEYS.gallery] ? (
                <p className="mt-2 text-xs text-foreground/60">Selected: {uploadNames[DRAFT_UPLOAD_KEYS.gallery]}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        {openSection === 'books' ? (
          <div className="space-y-4">
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
              {uploadNames[DRAFT_UPLOAD_KEYS.books] ? (
                <p className="mt-2 text-xs text-foreground/60">Selected: {uploadNames[DRAFT_UPLOAD_KEYS.books]}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        {openSection === 'magazines' ? (
          <div className="space-y-4">
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
              {uploadNames[DRAFT_UPLOAD_KEYS.magazines] ? (
                <p className="mt-2 text-xs text-foreground/60">Selected: {uploadNames[DRAFT_UPLOAD_KEYS.magazines]}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </SchoolAdminDialogShell>
    </div>
  );
}
