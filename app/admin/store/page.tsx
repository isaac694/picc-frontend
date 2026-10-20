'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { apiFetch } from '@/lib/api';
import { products, bookGenres, type Product } from '@/components/data/products';
import { ImageIcon, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';

type StoreBook = Product & {
  productId: string;
  title: string;
  coverImageUrl?: string | null;
  hardCopyPrice: number;
  softCopyPrice?: number | null;
  hardCopyStock: number;
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
  hardCopyStock: string;
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
  hardCopyStock: '',
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
  hardCopyStock: String(book.hardCopyStock ?? 0),
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
  hardCopyStock: Number(book.hardCopyStock ?? 0),
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
  } = useAdminAuth();

  const [books, setBooks] = useState<StoreBook[]>([]);
  const [draft, setDraft] = useState<StoreBookDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const { runUpload, progress, uploading } = useMediaUpload();
  const [search, setSearch] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const resetEditor = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setUploadName('');
  };

  const closeBookDialog = () => {
    setDialogOpen(false);
    resetEditor();
  };

  const openAddDialog = () => {
    resetEditor();
    setStatus('');
    setDialogOpen(true);
  };

  const openEditDialog = (book: StoreBook) => {
    startEditing(book);
    setDialogOpen(true);
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
    if (!token) return;
    const id = setTimeout(() => {
      void fetchBooks();
    }, 0);
    return () => clearTimeout(id);
  }, [token, fetchBooks]);

  const uploadImage = async (file: File) => {
    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
      setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }

    try {
      return await runUpload(file, 'store');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Cover upload failed.');
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
    hardCopyStock: draft.hardCopyEnabled ? Number(draft.hardCopyStock) : Number(draft.hardCopyStock || 0),
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
    if (draft.hardCopyEnabled && (!draft.hardCopyStock.trim() || !Number.isInteger(Number(draft.hardCopyStock)) || Number(draft.hardCopyStock) < 0)) {
      setStatus('Enter the number of hard copies in stock.');
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
      setDialogOpen(false);
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
      if (editingId === book.id) {
        setDialogOpen(false);
        resetEditor();
      }
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
          <Button type="button" onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add book
          </Button>
          <Button variant="outline" onClick={importExistingBooks} disabled={isImporting}>
            <RefreshCw className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import Existing Books'}
          </Button>
        </div>
      </div>

      {status && <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground/70">{status}</p>}
      <MediaUploadProgress uploading={uploading} progress={progress} />

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetEditor();
        }}
        title={editingId ? 'Edit book' : 'Create book'}
        description="Change prices, covers, and soft-copy settings."
        saving={isSaving}
        saveLabel={editingId ? 'Save book' : 'Create book'}
        onSave={() => void saveBook()}
        onCancel={closeBookDialog}
        maxWidthClass="sm:max-w-3xl"
      >
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
            {draft.hardCopyEnabled ? (
              <label className="grid gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm sm:col-span-3">
                <span className="font-medium text-foreground">Number of hard copies in stock</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.hardCopyStock}
                  onChange={(event) => setDraft((prev) => ({ ...prev, hardCopyStock: event.target.value }))}
                  placeholder="How many hard copies are available"
                  className="w-full max-w-xs rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </label>
            ) : null}
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

      </SchoolAdminDialogShell>

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

          <div className="mt-5 max-h-[760px] overflow-auto rounded-xl border border-border/70">
            {filteredBooks.length === 0 ? (
              <p className="p-6 text-center text-sm text-foreground/60">No store books yet.</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Book</th>
                    <th className="px-3 py-2 font-medium">Author</th>
                    <th className="px-3 py-2 font-medium">Hard copy</th>
                    <th className="px-3 py-2 font-medium">Stock</th>
                    <th className="px-3 py-2 font-medium">Soft copy</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="border-t border-border/60">
                      <td className="px-3 py-2 font-medium text-foreground">{book.title}</td>
                      <td className="px-3 py-2 text-foreground/70">{book.author || 'No author'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-foreground/70">MWK {book.hardCopyPrice.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-foreground/70">{book.hardCopyEnabled ? book.hardCopyStock ?? 0 : '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-foreground/70">
                        {book.softCopyPrice == null ? 'Not set' : `MWK ${book.softCopyPrice.toLocaleString()}`}
                      </td>
                      <td className="px-3 py-2 text-foreground/70">{book.isActive ? 'Visible' : 'Hidden'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${book.title}`}
                            onClick={() => openEditDialog(book)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!book.isBuiltIn ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              aria-label={`Delete ${book.title}`}
                              onClick={() => requestDelete(book)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
    </div>
  );
}
