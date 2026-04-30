'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const SECTION_KEYS = {
  news: 'media-news',
  gallery: 'media-gallery',
  books: 'media-books',
  magazines: 'media-magazines',
} as const;

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
const DEFAULT_GALLERY_ITEM: Omit<GalleryItem, 'id'> = { title: '', category: '', imageUrl: '' };
const DEFAULT_BOOK_ITEM: Omit<BookItem, 'id'> = { title: '', author: '', description: '', imageUrl: '', fileUrl: '' };
const DEFAULT_MAGAZINE_ITEM: Omit<MagazineItem, 'id'> = { title: '', issue: '', fileUrl: '', imageUrl: '' };

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
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});

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

  const handleAddItem = async <S extends SectionId>(
    section: S,
    draft: SectionDrafts[S],
    resetDraft: () => void,
    items: SectionItems[S][],
    setItems: (items: SectionItems[S][]) => void
  ) => {
    if (!token) return;

    if (!draft.title) {
      setStatus('Please add a title before saving.');
      return;
    }

    setStatus('');

    try {
      const nextItems = [...items, { ...draft, id: newId() }] as SectionItems[S][];
      const ok = await saveSection(SECTION_KEYS[section], nextItems);
      if (!ok) {
        setStatus('Unable to add item to the media section.');
        return;
      }

      setItems(nextItems);
      resetDraft();
      setStatus('Item added.');
    } catch {
      setStatus('Unable to add item to the media section.');
    }
  };

  const handleUpdateItem = async <S extends SectionId>(
    section: S,
    item: SectionItems[S],
    setItems: (items: SectionItems[S][]) => void,
    items: SectionItems[S][]
  ) => {
    if (!token) return;
    setStatus('');

    try {
      const nextItems = items.map((existing) => (existing.id === item.id ? item : existing));
      const ok = await saveSection(SECTION_KEYS[section], nextItems);
      if (!ok) {
        setStatus('Unable to update item.');
        return;
      }

      setItems(nextItems);
      setStatus('Item updated.');
    } catch {
      setStatus('Unable to update item.');
    }
  };

  const handleDeleteItem = async <S extends SectionId>(
    section: S,
    itemId: string,
    setItems: (items: SectionItems[S][]) => void,
    items: SectionItems[S][]
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
      setStatus('Item deleted.');
    } catch {
      setStatus('Unable to delete item.');
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
            Media Page Editor
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Manage church news, gallery items, Fire on the Altar books, and magazines.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="space-y-10">
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
                Church News
              </p>
              <p className="text-sm text-foreground/60">Create news stories and remove items as needed.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Badge (e.g. Updates)"
                value={draftNews.badge}
                onChange={(event) => setDraftNews((prev) => ({ ...prev, badge: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
              <input
                type="text"
                placeholder="Date (e.g. March 2026)"
                value={draftNews.date}
                onChange={(event) => setDraftNews((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
              <input
                type="text"
                placeholder="Headline"
                value={draftNews.title}
                onChange={(event) => setDraftNews((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground md:col-span-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Description"
                value={draftNews.description}
                onChange={(event) => setDraftNews((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground md:col-span-2"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (url) {
                      setDraftNews((prev) => ({ ...prev, imageUrl: url }));
                      updateUploadName('news-draft', file.name);
                    }
                  }}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>
            {uploadNames['news-draft'] && (
              <p className="text-xs text-foreground/60">Selected: {uploadNames['news-draft']}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  handleAddItem('news', draftNews, () => {
                    setDraftNews(DEFAULT_NEWS_ITEM);
                    updateUploadName('news-draft', '');
                  }, newsItems, setNewsItems)
                }
              >
                Add News Item
              </Button>
            </div>

            <div className="space-y-4">
              {newsItems.length === 0 ? (
                <p className="text-sm text-foreground/60">No news items yet.</p>
              ) : (
                newsItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/60 bg-background p-4 space-y-3"
                  >
                    <div className="grid gap-3 md:grid-cols-4">
                      <input
                        type="text"
                        value={item.badge || ''}
                        onChange={(event) =>
                          setNewsItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, badge: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        placeholder="Badge"
                      />
                      <input
                        type="text"
                        value={item.date || ''}
                        onChange={(event) =>
                          setNewsItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, date: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        placeholder="Date"
                      />
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(event) =>
                          setNewsItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, title: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground md:col-span-2"
                        placeholder="Headline"
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 mt-3">
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(event) =>
                          setNewsItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, description: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground md:col-span-2"
                        placeholder="Description"
                      />
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Upload Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            const url = await uploadImage(file);
                            if (!url) return;
                            setNewsItems((prev) =>
                              prev.map((current) =>
                                current.id === item.id ? { ...current, imageUrl: url } : current
                              )
                            );
                            updateUploadName(`news-${item.id}`, file.name);
                          }}
                          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                        />
                      </div>
                    </div>
                    {uploadNames[`news-${item.id}`] && (
                      <p className="text-xs text-foreground/60">Selected: {uploadNames[`news-${item.id}`]}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => handleUpdateItem('news', item, setNewsItems, newsItems)}>
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => handleDeleteItem('news', item.id, setNewsItems, newsItems)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
                Events Gallery
              </p>
              <p className="text-sm text-foreground/60">
                Manage featured gallery images shown on the media page.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Title (e.g. Worship Service)"
                value={draftGallery.title}
                onChange={(event) => setDraftGallery((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
              <input
                type="text"
                placeholder="Category (e.g. Worship)"
                value={draftGallery.category}
                onChange={(event) => setDraftGallery((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (url) {
                      setDraftGallery((prev) => ({ ...prev, imageUrl: url }));
                      updateUploadName('gallery-draft', file.name);
                    }
                  }}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>
            {uploadNames['gallery-draft'] && (
              <p className="text-xs text-foreground/60">Selected: {uploadNames['gallery-draft']}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  handleAddItem('gallery', draftGallery, () => {
                    setDraftGallery(DEFAULT_GALLERY_ITEM);
                    updateUploadName('gallery-draft', '');
                  }, galleryItems, setGalleryItems)
                }
              >
                Add Gallery Item
              </Button>
            </div>

            <div className="space-y-4">
              {galleryItems.length === 0 ? (
                <p className="text-sm text-foreground/60">No gallery items yet.</p>
              ) : (
                galleryItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/60 bg-background p-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(event) =>
                          setGalleryItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, title: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        placeholder="Title"
                      />
                      <input
                        type="text"
                        value={item.category || ''}
                        onChange={(event) =>
                          setGalleryItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, category: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        placeholder="Category"
                      />
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Upload Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            const url = await uploadImage(file);
                            if (!url) return;
                            setGalleryItems((prev) =>
                              prev.map((current) =>
                                current.id === item.id ? { ...current, imageUrl: url } : current
                              )
                            );
                            updateUploadName(`gallery-${item.id}`, file.name);
                          }}
                          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                        />
                      </div>
                    </div>
                    {uploadNames[`gallery-${item.id}`] && (
                      <p className="text-xs text-foreground/60">Selected: {uploadNames[`gallery-${item.id}`]}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => handleUpdateItem('gallery', item, setGalleryItems, galleryItems)}>
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => handleDeleteItem('gallery', item.id, setGalleryItems, galleryItems)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
                Fire on the Altar Books
              </p>
              <p className="text-sm text-foreground/60">
                Add or remove books in the Fire on the Altar section.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <input
                type="text"
                placeholder="Description"
                value={draftBook.description}
                onChange={(event) => setDraftBook((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
              <input
                type="text"
                placeholder="PDF link URL (optional)"
                value={draftBook.fileUrl}
                onChange={(event) => setDraftBook((prev) => ({ ...prev, fileUrl: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (url) {
                      setDraftBook((prev) => ({ ...prev, imageUrl: url }));
                      updateUploadName('books-draft', file.name);
                    }
                  }}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>
            {uploadNames['books-draft'] && (
              <p className="text-xs text-foreground/60">Selected: {uploadNames['books-draft']}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  handleAddItem('books', draftBook, () => {
                    setDraftBook(DEFAULT_BOOK_ITEM);
                    updateUploadName('books-draft', '');
                  }, bookItems, setBookItems)
                }
              >
                Add Book
              </Button>
            </div>

            <div className="space-y-4">
              {bookItems.length === 0 ? (
                <p className="text-sm text-foreground/60">No books yet.</p>
              ) : (
                bookItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/60 bg-background p-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-5">
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(event) =>
                          setBookItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, title: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                      />
                      <input
                        type="text"
                        value={item.author || ''}
                        onChange={(event) =>
                          setBookItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, author: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                      />
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(event) =>
                          setBookItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, description: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                      />
                      <input
                        type="text"
                        value={item.fileUrl || ''}
                        onChange={(event) =>
                          setBookItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, fileUrl: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                        placeholder="PDF link URL"
                      />
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            const url = await uploadImage(file);
                            if (!url) return;
                            setBookItems((prev) =>
                              prev.map((current) =>
                                current.id === item.id ? { ...current, imageUrl: url } : current
                              )
                            );
                            updateUploadName(`books-${item.id}`, file.name);
                          }}
                          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                        />
                      </div>
                    </div>
                    {uploadNames[`books-${item.id}`] && (
                      <p className="text-xs text-foreground/60">Selected: {uploadNames[`books-${item.id}`]}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => handleUpdateItem('books', item, setBookItems, bookItems)}>
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => handleDeleteItem('books', item.id, setBookItems, bookItems)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
                Church Magazines
              </p>
              <p className="text-sm text-foreground/60">
                Upload and manage magazine issues for the public media page.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <input
                type="text"
                placeholder="Link URL"
                value={draftMagazine.fileUrl}
                onChange={(event) => setDraftMagazine((prev) => ({ ...prev, fileUrl: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (url) {
                      setDraftMagazine((prev) => ({ ...prev, imageUrl: url }));
                      updateUploadName('magazines-draft', file.name);
                    }
                  }}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>
            {uploadNames['magazines-draft'] && (
              <p className="text-xs text-foreground/60">Selected: {uploadNames['magazines-draft']}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  handleAddItem('magazines', draftMagazine, () => {
                    setDraftMagazine(DEFAULT_MAGAZINE_ITEM);
                    updateUploadName('magazines-draft', '');
                  }, magazineItems, setMagazineItems)
                }
              >
                Add Magazine
              </Button>
            </div>

            <div className="space-y-4">
              {magazineItems.length === 0 ? (
                <p className="text-sm text-foreground/60">No magazine issues yet.</p>
              ) : (
                magazineItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/60 bg-background p-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-4">
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(event) =>
                          setMagazineItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, title: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                      />
                      <input
                        type="text"
                        value={item.issue || ''}
                        onChange={(event) =>
                          setMagazineItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, issue: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                      />
                      <input
                        type="text"
                        value={item.fileUrl || ''}
                        onChange={(event) =>
                          setMagazineItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, fileUrl: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                      />
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            const url = await uploadImage(file);
                            if (!url) return;
                            setMagazineItems((prev) =>
                              prev.map((current) =>
                                current.id === item.id ? { ...current, imageUrl: url } : current
                              )
                            );
                            updateUploadName(`magazines-${item.id}`, file.name);
                          }}
                          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                        />
                      </div>
                    </div>
                    {uploadNames[`magazines-${item.id}`] && (
                      <p className="text-xs text-foreground/60">Selected: {uploadNames[`magazines-${item.id}`]}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => handleUpdateItem('magazines', item, setMagazineItems, magazineItems)}>
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteItem('magazines', item.id, setMagazineItems, magazineItems)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
