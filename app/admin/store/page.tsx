'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { products, bookGenres, type Product } from '@/components/data/products';
import { ImageIcon, RefreshCw, Trash2 } from 'lucide-react';

type StoreBook = Product & {
  productId: string;
  title: string;
  coverImageUrl?: string | null;
  hardCopyPrice: number;
  softCopyPrice?: number | null;
  hardCopyEnabled: boolean;
  softCopyEnabled: boolean;
  downloadUrl?: string | null;
  bookContent?: string | null;
  sortOrder: number;
  isActive: boolean;
  isBuiltIn?: boolean;
};

type StoreBookDraft = {
  productId: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  coverImageUrl: string;
  hardCopyPrice: string;
  softCopyPrice: string;
  hardCopyEnabled: boolean;
  softCopyEnabled: boolean;
  downloadUrl: string;
  bookContent: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_DRAFT: StoreBookDraft = {
  productId: '',
  title: '',
  author: 'Pastor Esau Banda',
  genre: '',
  description: '',
  coverImageUrl: '',
  hardCopyPrice: '',
  softCopyPrice: '',
  hardCopyEnabled: true,
  softCopyEnabled: true,
  downloadUrl: '',
  bookContent: '',
  sortOrder: '0',
  isActive: true,
};

const cardClassName = 'rounded-2xl border border-border/60 bg-card p-6 shadow-sm';

const toDraft = (book: StoreBook): StoreBookDraft => ({
  productId: book.productId || book.id,
  title: book.title || book.name || '',
  author: book.author || '',
  genre: book.genre || '',
  description: book.description || '',
  coverImageUrl: book.coverImageUrl || book.image || '',
  hardCopyPrice: String(book.hardCopyPrice ?? book.price ?? ''),
  softCopyPrice: book.softCopyPrice == null ? '' : String(book.softCopyPrice),
  hardCopyEnabled: book.hardCopyEnabled !== false,
  softCopyEnabled: book.softCopyEnabled !== false,
  downloadUrl: book.downloadUrl || '',
  bookContent: book.bookContent || '',
  sortOrder: String(book.sortOrder ?? 0),
  isActive: book.isActive !== false,
});

const normalizeBook = (book: Partial<StoreBook>): StoreBook => ({
  id: String(book.id || book.productId || ''),
  productId: String(book.productId || book.id || ''),
  name: String(book.name || book.title || ''),
  title: String(book.title || book.name || ''),
  price: Number(book.price ?? book.hardCopyPrice ?? 0),
  hardCopyPrice: Number(book.hardCopyPrice ?? book.price ?? 0),
  softCopyPrice: book.softCopyPrice == null ? null : Number(book.softCopyPrice),
  category: 'Books',
  image: String(book.image || book.coverImageUrl || '/store/books/placeholder.jpg'),
  coverImageUrl: book.coverImageUrl || book.image || '/store/books/placeholder.jpg',
  author: book.author || '',
  genre: book.genre || '',
  description: book.description || '',
  hardCopyEnabled: book.hardCopyEnabled !== false,
  softCopyEnabled: book.softCopyEnabled !== false,
  downloadUrl: book.downloadUrl || '',
  bookContent: book.bookContent || '',
  sortOrder: Number(book.sortOrder || 0),
  isActive: book.isActive !== false,
  isBuiltIn: book.isBuiltIn === true,
});

const builtInStoreBooks: StoreBook[] = products
  .filter((product) => product.category === 'Books')
  .map((product, index) => normalizeBook({
    ...product,
    id: `built-in-${product.id}`,
    productId: product.id,
    title: product.name,
    hardCopyPrice: product.hardCopyPrice ?? product.price,
    softCopyPrice: product.softCopyPrice ?? null,
    hardCopyEnabled: product.hardCopyEnabled !== false,
    softCopyEnabled: product.softCopyEnabled !== false,
    coverImageUrl: product.image,
    sortOrder: product.sortOrder ?? index,
    isActive: product.isActive !== false,
    isBuiltIn: true,
  }));

export default function AdminStorePage() {
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

  const [books, setBooks] = useState<StoreBook[]>([]);
  const [draft, setDraft] = useState<StoreBookDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const resetEditor = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setUploadName('');
  };

  const fetchBooks = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiFetch('/api/admin/store/books', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setStatus('Unable to load store books.');
        return;
      }
      const data = await response.json();
      setBooks(Array.isArray(data?.books) ? data.books.map(normalizeBook) : []);
    } catch {
      setStatus('Unable to load store books.');
    }
  }, [token]);

  useEffect(() => {
    void fetchBooks();
  }, [fetchBooks]);

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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        setStatus('Cover upload failed.');
        return null;
      }
      const data = await response.json();
      return data.url as string;
    } catch {
      setStatus('Cover upload failed.');
      return null;
    }
  };

  const buildPayload = () => ({
    productId: draft.productId.trim(),
    title: draft.title.trim(),
    author: draft.author.trim(),
    genre: draft.genre.trim(),
    description: draft.description.trim(),
    coverImageUrl: draft.coverImageUrl.trim(),
    hardCopyPrice: Number(draft.hardCopyPrice),
    softCopyPrice: draft.softCopyPrice.trim() ? Number(draft.softCopyPrice) : null,
    hardCopyEnabled: draft.hardCopyEnabled,
    softCopyEnabled: draft.softCopyEnabled,
    downloadUrl: draft.downloadUrl.trim(),
    bookContent: draft.bookContent.trim(),
    sortOrder: Number(draft.sortOrder || 0),
    isActive: draft.isActive,
  });

  const saveBook = async () => {
    if (!token) return;
    if (!draft.title.trim()) {
      setStatus('Please enter a book title.');
      return;
    }
    if (!draft.hardCopyPrice.trim() || Number.isNaN(Number(draft.hardCopyPrice))) {
      setStatus('Please enter a valid hard copy price.');
      return;
    }

    setIsSaving(true);
    setStatus('');

    try {
      const response = await apiFetch(editingId ? `/api/admin/store/books/${editingId}` : '/api/admin/store/books', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload()),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(data?.error || 'Unable to save book.');
        return;
      }
      await fetchBooks();
      resetEditor();
      setStatus(editingId ? 'Book updated.' : 'Book created.');
    } catch {
      setStatus('Unable to save book.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (book: StoreBook) => {
    setEditingId(book.isBuiltIn ? null : book.id);
    setDraft(toDraft(book));
    setUploadName('');
    setStatus(book.isBuiltIn ? 'Save this built-in book to customize it for the store.' : '');
  };

  const deleteBook = async (book: StoreBook) => {
    if (!token) return;
    if (book.isBuiltIn) {
      setStatus('Built-in books cannot be deleted here. Edit and save one to manage its visibility.');
      return;
    }
    try {
      const response = await apiFetch(`/api/admin/store/books/${book.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setStatus('Unable to delete book.');
        return;
      }
      setBooks((prev) => prev.filter((item) => item.id !== book.id));
      if (editingId === book.id) resetEditor();
      setStatus('Book deleted.');
    } catch {
      setStatus('Unable to delete book.');
    }
  };

  const requestDelete = (book: StoreBook) => {
    if (book.isBuiltIn) {
      setStatus('Built-in books cannot be deleted here. Edit and save one to manage its visibility.');
      return;
    }
    confirmDeleteToast({
      title: 'Delete this store book?',
      description: book.title,
      onConfirm: () => deleteBook(book),
    });
  };

  const importExistingBooks = async () => {
    if (!token) return;
    setIsImporting(true);
    setStatus('');

    try {
      const existingProductIds = new Set(books.map((book) => book.productId));
      const importBooks = products
        .filter((product) => product.category === 'Books' && !existingProductIds.has(product.id))
        .map((product, index) => ({
          productId: product.id,
          title: product.name,
          author: product.author || '',
          genre: product.genre || '',
          description: product.description || '',
          coverImageUrl: product.image,
          hardCopyPrice: product.price,
          softCopyPrice: Math.max(1000, Math.round(product.price * 0.7)),
          hardCopyEnabled: true,
          softCopyEnabled: true,
          sortOrder: index,
          isActive: true,
        }));

      if (importBooks.length === 0) {
        setStatus('All built-in books are already in the store catalog.');
        return;
      }

      const response = await apiFetch('/api/admin/store/books/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ books: importBooks }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(data?.error || 'Unable to import existing books.');
        return;
      }
      setBooks(Array.isArray(data?.books) ? data.books.map(normalizeBook) : []);
      setStatus(`${data?.imported || importBooks.length} existing books imported.`);
    } catch {
      setStatus('Unable to import existing books.');
    } finally {
      setIsImporting(false);
    }
  };

  const catalogBooks = useMemo(() => {
    const savedProductIds = new Set(books.map((book) => book.productId || book.id));
    const remainingBuiltIns = builtInStoreBooks.filter((book) => !savedProductIds.has(book.productId));
    return [...books, ...remainingBuiltIns].sort((a, b) => {
      if (a.isBuiltIn !== b.isBuiltIn) return a.isBuiltIn ? 1 : -1;
      return (a.sortOrder || 0) - (b.sortOrder || 0) || a.title.localeCompare(b.title);
    });
  }, [books]);

  const filteredBooks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalogBooks
      .filter((book) => {
        if (!term) return true;
        return [book.title, book.author, book.genre, book.productId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      });
  }, [catalogBooks, search]);

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
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Store Page Editor</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage book prices, cover images, soft copy availability, and catalog visibility.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={importExistingBooks} disabled={isImporting}>
            <RefreshCw className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import Existing Books'}
          </Button>
          <Button variant="outline" onClick={handleLogout}>Log out</Button>
        </div>
      </div>

      {status && <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground/70">{status}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className={`${cardClassName} space-y-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{editingId ? 'Edit Book' : 'Create Book'}</h2>
              <p className="text-sm text-foreground/60">Use the editor to change prices, covers, and soft-copy settings.</p>
            </div>
            {editingId && <Button variant="outline" onClick={resetEditor}>New Book</Button>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="store-book-title" className="text-sm font-medium text-foreground">Book title</label>
              <input
                id="store-book-title"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Book title"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="store-book-author" className="text-sm font-medium text-foreground">Author</label>
              <input
                id="store-book-author"
                value={draft.author}
                onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
                placeholder="Author"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="store-book-product-id" className="text-sm font-medium text-foreground">Product ID</label>
              <input
                id="store-book-product-id"
                value={draft.productId}
                onChange={(event) => setDraft((prev) => ({ ...prev, productId: event.target.value }))}
                placeholder="Product ID (optional)"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="store-book-genre" className="text-sm font-medium text-foreground">Genre</label>
              <select
                id="store-book-genre"
                value={draft.genre}
                onChange={(event) => setDraft((prev) => ({ ...prev, genre: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              >
                <option value="">Select genre</option>
                {bookGenres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="store-book-hard-price" className="text-sm font-medium text-foreground">Hard copy price</label>
              <input
                id="store-book-hard-price"
                type="number"
                min="0"
                value={draft.hardCopyPrice}
                onChange={(event) => setDraft((prev) => ({ ...prev, hardCopyPrice: event.target.value }))}
                placeholder="Hard copy price"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="store-book-soft-price" className="text-sm font-medium text-foreground">Soft copy price</label>
              <input
                id="store-book-soft-price"
                type="number"
                min="0"
                value={draft.softCopyPrice}
                onChange={(event) => setDraft((prev) => ({ ...prev, softCopyPrice: event.target.value }))}
                placeholder="Soft copy price"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="store-book-description" className="text-sm font-medium text-foreground">Book description</label>
            <textarea
              id="store-book-description"
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              rows={4}
              placeholder="Book description"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="store-book-content" className="text-sm font-medium text-foreground">Soft copy reader content</label>
            <textarea
              id="store-book-content"
              value={draft.bookContent}
              onChange={(event) => setDraft((prev) => ({ ...prev, bookContent: event.target.value }))}
              rows={10}
              placeholder="Enter chapters or reading content for users who paid for the soft copy. Leave blank to show sample content."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[160px_1fr]">
            <div className="relative flex aspect-[0.72] items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
              {draft.coverImageUrl ? (
                <Image src={draft.coverImageUrl} alt={draft.title || 'Book cover'} fill sizes="160px" className="object-cover" />
              ) : (
                <div className="text-center text-foreground/40">
                  <ImageIcon className="mx-auto h-9 w-9" />
                  <p className="mt-2 text-xs">No cover</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="store-book-cover-url" className="text-sm font-medium text-foreground">Cover image URL</label>
                <input
                  id="store-book-cover-url"
                  value={draft.coverImageUrl}
                  onChange={(event) => setDraft((prev) => ({ ...prev, coverImageUrl: event.target.value }))}
                  placeholder="Cover image URL"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="store-book-cover-upload" className="block text-sm font-medium text-foreground">Upload cover image</label>
                <input
                  id="store-book-cover-upload"
                  type="file"
                  accept="image/*,.heic,.heif,.avif"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (!url) return;
                    setDraft((prev) => ({ ...prev, coverImageUrl: url }));
                    setUploadName(file.name);
                  }}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
                {uploadName && <p className="mt-2 text-xs text-foreground/60">Selected: {uploadName}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="store-book-download-url" className="text-sm font-medium text-foreground">Soft copy download URL</label>
                <input
                  id="store-book-download-url"
                  value={draft.downloadUrl}
                  onChange={(event) => setDraft((prev) => ({ ...prev, downloadUrl: event.target.value }))}
                  placeholder="Soft copy download URL (optional)"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Availability and visibility</p>
            <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <input type="checkbox" checked={draft.hardCopyEnabled} onChange={(event) => setDraft((prev) => ({ ...prev, hardCopyEnabled: event.target.checked }))} />
              Hard copy
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <input type="checkbox" checked={draft.softCopyEnabled} onChange={(event) => setDraft((prev) => ({ ...prev, softCopyEnabled: event.target.checked }))} />
              Soft copy
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))} />
              Visible
            </label>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="store-book-sort-order" className="text-sm font-medium text-foreground">Sort order</label>
            <input
              id="store-book-sort-order"
              type="number"
              value={draft.sortOrder}
              onChange={(event) => setDraft((prev) => ({ ...prev, sortOrder: event.target.value }))}
              placeholder="Sort order"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={saveBook} disabled={isSaving}>{isSaving ? 'Saving...' : editingId ? 'Save Book' : 'Create Book'}</Button>
            <Button variant="outline" onClick={resetEditor}>Clear</Button>
            {editingId && (
              <Button variant="destructive" onClick={() => {
                const book = books.find((item) => item.id === editingId);
                if (book) requestDelete(book);
              }}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </section>

        <section className={cardClassName}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Store Books</h2>
              <p className="text-sm text-foreground/60">
                {filteredBooks.length} shown of {catalogBooks.length} books
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label htmlFor="store-book-search" className="text-sm font-medium text-foreground">Search books</label>
            <input
              id="store-book-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search books..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>

          <div className="mt-5 max-h-[760px] space-y-3 overflow-y-auto pr-2">
            {filteredBooks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-foreground/60">No store books yet.</p>
            ) : filteredBooks.map((book) => (
              <div key={book.id} className={`rounded-2xl border p-4 transition ${editingId === book.id ? 'border-primary/60 bg-primary/5' : 'border-border/60 bg-background'}`}>
                <div className="flex gap-4">
                  <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {book.image ? <Image src={book.image} alt={book.title} fill sizes="64px" className="object-cover" /> : <ImageIcon className="m-auto h-8 w-8 text-foreground/30" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="truncate text-sm font-semibold text-foreground">{book.title}</p>
                        <p className="mt-1 text-xs text-foreground/50">{book.author || 'No author'} - {book.genre || 'No genre'}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${book.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-foreground/50'}`}>
                          {book.isActive ? 'Visible' : 'Hidden'}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase text-foreground/50">
                          {book.isBuiltIn ? 'Built-in' : 'Managed'}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-foreground/60">
                      Hard: MWK {book.hardCopyPrice.toLocaleString()} | Soft: {book.softCopyPrice == null ? 'Not set' : `MWK ${book.softCopyPrice.toLocaleString()}`}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => startEditing(book)}>
                        {editingId === book.id ? 'Editing' : 'Edit'}
                      </Button>
                      {!book.isBuiltIn && <Button variant="outline" onClick={() => requestDelete(book)}>Delete</Button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
