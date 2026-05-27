'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';

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

type NewsItem = {
  id: string;
  badge: string;
  date: string;
  title: string;
  description: string;
  imageUrl: string;
};

type GalleryItem = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
};

type BookItem = {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  fileUrl: string;
};

type MagazineItem = {
  id: string;
  title: string;
  issue: string;
  fileUrl: string;
  imageUrl: string;
};

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
  const [draftNews, setDraftNews] = useState(DEFAULT_NEWS_ITEM);
  const [draftGallery, setDraftGallery] = useState(DEFAULT_GALLERY_ITEM);
  const [draftBook, setDraftBook] = useState(DEFAULT_BOOK_ITEM);
  const [draftMagazine, setDraftMagazine] = useState(DEFAULT_MAGAZINE_ITEM);
  const [editingIds, setEditingIds] = useState<Record<SectionId, string | null>>(EMPTY_EDITING_IDS);
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

  const fetchSection = async <T,>(key: string, setState: (value: T[]) => void) => {
    try {
      const response = await apiFetch(`/api/site-content/${key}`);
      if (!response.ok && response.status !== 404) {
        setState([]);
        return;
      }

      if (response.status === 404) {
        setState([]);
        return;
      }

      const record = (await response.json().catch(() => null)) as unknown;
      const body = isRecord(record) ? record.body : null;
      const parsed = parseJson(body);
      const items =
        Array.isArray(parsed)
          ? parsed
          : isRecord(parsed) && Array.isArray(parsed.items)
            ? parsed.items
            : [];

      const normalized = items
        .filter(isRecord)
        .map((item) => ({
          ...item,
          imageUrl: item.imageUrl ? String(item.imageUrl) : '',
          fileUrl: item.fileUrl ? String(item.fileUrl) : '',
        })) as T[];

      setState(normalized);
    } catch {
      setState([]);
    }
  };

  const saveSection = async (key: string, items: unknown[]) => {
    if (!token) return false;

    const response = await apiFetch(`/api/site-content/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body: JSON.stringify({ items }) }),
    });

    return response.ok;
  };

  useEffect(() => {
    if (!token) return;

    fetchSection<NewsItem>(SECTION_KEYS.news, setNewsItems);
    fetchSection<GalleryItem>(SECTION_KEYS.gallery, setGalleryItems);
    fetchSection<BookItem>(SECTION_KEYS.books, setBookItems);
    fetchSection<MagazineItem>(SECTION_KEYS.magazines, setMagazineItems);
  }, [token]);

  const handleSaveItem = async <S extends SectionId>(
    section: S,
    draft: SectionDrafts[S],
    editingId: string | null,
    items: SectionItems[S][],
    setItems: (items: SectionItems[S][]) => void,
  ) => {
    if (!token) return;

    if (!draft.title.trim()) {
      setStatus('Please add a title before saving.');
      return;
    }

    setStatus('');

    try {
      const nextItems = editingId
        ? items.map((existing) =>
            existing.id === editingId ? ({ ...draft, id: editingId } as SectionItems[S]) : existing
          )
        : ([...items, { ...draft, id: newId() }] as SectionItems[S][]);

      const ok = await saveSection(SECTION_KEYS[section], nextItems);
      if (!ok) {
        setStatus(editingId ? 'Unable to update item.' : 'Unable to add item to the media section.');
        return;
      }

      setItems(nextItems);
      resetSectionEditor(section);
      setStatus(editingId ? 'Item updated.' : 'Item added.');
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

    setStatus('');

    try {
      const nextItems = items.filter((item) => item.id !== itemId);
      const ok = await saveSection(SECTION_KEYS[section], nextItems);
      if (!ok) {
        setStatus('Unable to delete item.');
        return;
      }

      setItems(nextItems);
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
            Manage church news, gallery items, Fire on the Altar books, and magazines with a cleaner editor and separate review panels.
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
                <Button onClick={() => handleSaveItem('news', draftNews, editingIds.news, newsItems, setNewsItems)}>
                  {editingIds.news ? 'Save News Item' : 'Add News Item'}
                </Button>
                <Button variant="outline" onClick={() => resetSectionEditor('news')}>
                  Clear
                </Button>
              </div>
            </div>

            <div className={sectionCardClassName}>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Existing News</h3>
              {newsItems.length === 0 ? (
                <p className="text-sm text-foreground/60">No news items yet.</p>
              ) : (
                <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
                  {newsItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 transition ${
                        editingIds.news === item.id
                          ? 'border-primary/60 bg-primary/5'
                          : 'border-border/60 bg-background'
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                        {[item.badge, item.date].filter(Boolean).join(' - ') || 'News Item'}
                      </p>
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
                        <Button variant="outline" onClick={() => requestDeleteItem('news', item, newsItems, setNewsItems)}>
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
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {item.title || 'Untitled gallery item'}
                      </p>
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
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {item.title || 'Untitled book'}
                      </p>
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
              </div>
            </div>

            <div className={sectionCardClassName}>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Existing Magazines</h3>
              {magazineItems.length === 0 ? (
                <p className="text-sm text-foreground/60">No magazine issues yet.</p>
              ) : (
                <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
                  {magazineItems.map((item) => (
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
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {item.title || 'Untitled magazine'}
                      </p>
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
