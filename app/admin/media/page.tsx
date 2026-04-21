'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const SECTION_PATHS: Record<string, string> = {
  news: '/api/media/news',
  gallery: '/api/media/gallery',
  books: '/api/media/books',
  magazines: '/api/media/magazines',
};

const DEFAULT_NEWS_ITEM = { title: '', summary: '', imageUrl: '' };
const DEFAULT_GALLERY_ITEM = { caption: '', imageUrl: '' };
const DEFAULT_BOOK_ITEM = { title: '', author: '', description: '', imageUrl: '' };
const DEFAULT_MAGAZINE_ITEM = { title: '', issue: '', fileUrl: '', imageUrl: '' };

const sectionDefinitions = [
  {
    id: 'news',
    title: 'Church News',
    description: 'Publish or remove news items shown on the media page.',
    labels: { title: 'Headline', subtitle: 'Summary' },
  },
  {
    id: 'gallery',
    title: 'Events Gallery',
    description: 'Manage the gallery images shown on the media page.',
    labels: { title: 'Caption', subtitle: 'Image' },
  },
  {
    id: 'books',
    title: 'Fire on the Altar Books',
    description: 'Update books shown in the Fire on the Altar section.',
    labels: { title: 'Book Title', subtitle: 'Author' },
  },
  {
    id: 'magazines',
    title: 'Church Magazines',
    description: 'Upload and remove church magazine issues.',
    labels: { title: 'Magazine Title', subtitle: 'Issue' },
  },
];

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
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [bookItems, setBookItems] = useState<any[]>([]);
  const [magazineItems, setMagazineItems] = useState<any[]>([]);
  const [draftNews, setDraftNews] = useState(DEFAULT_NEWS_ITEM);
  const [draftGallery, setDraftGallery] = useState(DEFAULT_GALLERY_ITEM);
  const [draftBook, setDraftBook] = useState(DEFAULT_BOOK_ITEM);
  const [draftMagazine, setDraftMagazine] = useState(DEFAULT_MAGAZINE_ITEM);
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});

  const normalizeRemoteUrl = (value: string) => {
    if (!value) return '';
    return value.startsWith('http') ? value : apiUrl(value);
  };

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
  };

  const uploadImage = async (file: File) => {
    if (!token) return null;
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
    } catch (error) {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const fetchSection = async (path: string, setState: (value: any) => void) => {
    try {
      const response = await apiFetch(path);
      if (!response.ok) {
        setState([]);
        return;
      }
      const data = await response.json();
      const items = Array.isArray(data) ? data : data.items || [];
      setState(
        items.map((item: any) => ({
          ...item,
          imageUrl: item.imageUrl ? normalizeRemoteUrl(item.imageUrl) : '',
          fileUrl: item.fileUrl ? normalizeRemoteUrl(item.fileUrl) : '',
        }))
      );
    } catch (error) {
      setState([]);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchSection(SECTION_PATHS.news, setNewsItems);
    fetchSection(SECTION_PATHS.gallery, setGalleryItems);
    fetchSection(SECTION_PATHS.books, setBookItems);
    fetchSection(SECTION_PATHS.magazines, setMagazineItems);
  }, [token]);

  const handleAddItem = async (
    section: 'news' | 'gallery' | 'books' | 'magazines',
    draft: Record<string, any>,
    resetDraft: () => void,
    items: any[],
    setItems: (items: any[]) => void
  ) => {
    if (!token) return;
    const url = SECTION_PATHS[section];

    if (!draft.title && !draft.caption) {
      setStatus('Please add a title or caption before saving.');
      return;
    }

    setStatus('');

    try {
      const response = await apiFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        setStatus('Unable to add item to the media section.');
        return;
      }

      const data = await response.json();
      setItems([...items, { ...data, ...draft }]);
      resetDraft();
      setStatus('Item added.');
    } catch (error) {
      setStatus('Unable to add item to the media section.');
    }
  };

  const handleUpdateItem = async (
    section: 'news' | 'gallery' | 'books' | 'magazines',
    item: any,
    setItems: (items: any[]) => void,
    items: any[]
  ) => {
    if (!token) return;
    const url = `${SECTION_PATHS[section]}/${item.id}`;
    setStatus('');

    try {
      const response = await apiFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        setStatus('Unable to update item.');
        return;
      }

      setItems(items.map((existing) => (existing.id === item.id ? item : existing)));
      setStatus('Item updated.');
    } catch (error) {
      setStatus('Unable to update item.');
    }
  };

  const handleDeleteItem = async (
    section: 'news' | 'gallery' | 'books' | 'magazines',
    itemId: string,
    setItems: (items: any[]) => void,
    items: any[]
  ) => {
    if (!token) return;
    const url = `${SECTION_PATHS[section]}/${itemId}`;
    setStatus('');

    try {
      const response = await apiFetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setStatus('Unable to delete item.');
        return;
      }

      setItems(items.filter((item) => item.id !== itemId));
      setStatus('Item deleted.');
    } catch (error) {
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Headline"
                value={draftNews.title}
                onChange={(event) => setDraftNews((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
              <input
                type="text"
                placeholder="Summary"
                value={draftNews.summary}
                onChange={(event) => setDraftNews((prev) => ({ ...prev, summary: event.target.value }))}
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
                    <div className="grid gap-3 md:grid-cols-3">
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
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                      />
                      <input
                        type="text"
                        value={item.summary || ''}
                        onChange={(event) =>
                          setNewsItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, summary: event.target.value } : current
                            )
                          )
                        }
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
                placeholder="Caption"
                value={draftGallery.caption}
                onChange={(event) => setDraftGallery((prev) => ({ ...prev, caption: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
              <div className="md:col-span-2">
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
                        value={item.caption || ''}
                        onChange={(event) =>
                          setGalleryItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id ? { ...current, caption: event.target.value } : current
                            )
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                      />
                      <div className="md:col-span-2">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <div className="grid gap-3 md:grid-cols-4">
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
