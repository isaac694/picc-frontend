'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { CLOUDINARY_FOLDERS, uploadImageToCloudinary } from '@/lib/cloudinary-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { apiFetch } from '@/lib/api';
import { products, type Product } from '@/components/data/products';
import { Barcode, ImageIcon, Pencil, Plus, Power, RefreshCw, Tags, Trash2 } from 'lucide-react';
import BookCategoriesDialog from '@/components/admin/BookCategoriesDialog';
import BookBarcodeDialog from '@/components/admin/BookBarcodeDialog';
import BulkBarcodeExportDialog from '@/components/admin/BulkBarcodeExportDialog';
import { useBookCategories } from '@/hooks/use-book-categories';

/** A soft copy saved in the Supabase Storage bucket (private; served to buyers by /api/store/book-file). */
const isStorageLink = (url: string) => url.includes('/storage/v1/s3/');

type StoreBook = Product & {
  productId: string;
  barcode?: string | null;
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
  isFeatured: boolean;
  featuredTagline: string;
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
  isFeatured: false,
  featuredTagline: '',
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
  isFeatured: book.isFeatured === true,
  featuredTagline: book.featuredTagline || '',
});

const normalizeBook = (book: Partial<StoreBook>): StoreBook => ({
  id: String(book.id || book.productId || ''),
  productId: String(book.productId || book.id || ''),
  barcode: book.barcode || null,
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
  isFeatured: book.isFeatured === true,
  featuredTagline: book.featuredTagline || null,
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
  const { categories: bookCategories, setCategories: setBookCategories } = useBookCategories();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [labelBook, setLabelBook] = useState<StoreBook | null>(null);
  const [bulkLabelsOpen, setBulkLabelsOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [books, setBooks] = useState<StoreBook[]>([]);
  const [draft, setDraft] = useState<StoreBookDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const { progress, uploading, setProgress, setUploading } = useMediaUpload();
  const [search, setSearch] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [uploadTarget, setUploadTarget] = useState<'cover' | 'pdf' | ''>('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfPhase, setPdfPhase] = useState('Uploading PDF');
  // The PDF just uploaded (or the book's saved one), which every save sends as downloadUrl.
  const pdfUrlRef = useRef('');
  const editingIdRef = useRef<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const resetEditor = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setUploadName('');
    setPdfName('');
    setUploadTarget('');
    setPdfUploading(false);
    pdfUrlRef.current = '';
    editingIdRef.current = null;
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

  const uploadPdf = async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setStatus('Upload a PDF file for the soft copy.');
      return null;
    }
    if (file.size > 40 * 1024 * 1024) {
      setStatus('The PDF must be 40MB or smaller.');
      return null;
    }
    if (!token) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'store-book');
    setUploadTarget('pdf');
    setPdfUploading(true);
    setPdfProgress(0);
    setPdfPhase('Uploading PDF');
    try {
      // XHR rather than fetch so the bar follows the bytes as they go up. Sending is 0–90%; the last
      // stretch is the server putting the file into the storage bucket.
      const { status: httpStatus, data } = await new Promise<{ status: number; data: { url?: string; error?: string } | null }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/uploads');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setPdfProgress(Math.min(90, Math.round((event.loaded / event.total) * 90)));
        };
        xhr.upload.onload = () => {
          setPdfProgress(92);
          setPdfPhase('Saving to storage');
        };
        xhr.onload = () => {
          let parsed: { url?: string; error?: string } | null = null;
          try {
            parsed = JSON.parse(xhr.responseText);
          } catch {
            parsed = null;
          }
          resolve({ status: xhr.status, data: parsed });
        };
        xhr.onerror = () => reject(new Error('network'));
        xhr.send(formData);
      });
      if (httpStatus < 200 || httpStatus >= 300) {
        setStatus(data?.error || 'PDF upload failed.');
        return null;
      }
      const url = typeof data?.url === 'string' ? data.url.trim() : '';
      if (!/^https:\/\//.test(url)) {
        setStatus('The upload did not return a storage link.');
        return null;
      }
      setPdfProgress(100);
      return url;
    } catch {
      setStatus('PDF upload failed. Check your connection and try again.');
      return null;
    } finally {
      setPdfUploading(false);
      window.setTimeout(() => setPdfProgress(0), 600);
    }
  };

  const saveDownloadUrl = async (url: string) => {
    const id = editingIdRef.current;
    if (!id || !token) return true;
    const response = await apiFetch(`/api/admin/store/books/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...buildPayload(), downloadUrl: url }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(data?.error || 'The PDF uploaded, but the book still has the previous link. Save the book to keep the uploads URL.');
      return false;
    }
    setBooks((prev) => prev.map((book) => (book.id === id ? normalizeBook({ ...book, downloadUrl: url }) : book)));
    return true;
  };

  const uploadImage = async (file: File) => {
    const looksLikeImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|heic|heif)$/i.test(file.name);
    if (!looksLikeImage) {
      setStatus('Upload an image for the book cover.');
      return null;
    }

    setUploadTarget('cover');
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadImageToCloudinary(file, CLOUDINARY_FOLDERS.STORE_COVERS, {
        maxSizeMB: 10,
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/avif',
          'image/heic',
          'image/heif',
          file.type || 'image/jpeg',
        ],
        onProgress: setProgress,
      });
      if (!result.url.includes('res.cloudinary.com')) {
        setStatus('Cover upload did not reach Cloudinary.');
        return null;
      }
      return result.url;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Cover upload failed.');
      return null;
    } finally {
      setUploading(false);
      window.setTimeout(() => setProgress(0), 500);
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
    downloadUrl: (pdfUrlRef.current || draft.downloadUrl).trim(),
    bookContent: draft.bookContent.trim(),
    sortOrder: Number(draft.sortOrder || 0),
    isActive: draft.isActive,
    isFeatured: draft.isFeatured,
    featuredTagline: draft.featuredTagline.trim(),
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
      const id = editingIdRef.current;
      const response = await apiFetch(id ? `/api/admin/store/books/${id}` : '/api/admin/store/books', {
        method: id ? 'PUT' : 'POST',
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
      setStatus(id ? 'Book updated.' : 'Book created.');
    } catch {
      setStatus('Unable to save book.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (book: StoreBook) => {
    const id = book.isBuiltIn ? null : book.id;
    editingIdRef.current = id;
    setEditingId(id);
    const savedPdf = book.downloadUrl || '';
    pdfUrlRef.current = savedPdf;
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

  const toggleActive = async (book: StoreBook) => {
    if (!token) return;
    const isActive = !book.isActive;
    setTogglingId(book.id);
    try {
      // A built-in book has no saved record yet, so saving it is what creates the switch.
      const response = book.isBuiltIn
        ? await apiFetch('/api/admin/store/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...book, isActive }),
          })
        : await apiFetch(`/api/admin/store/books/${book.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isActive }),
          });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(data?.error || 'Unable to change this book.');
        return;
      }
      await fetchBooks();
      setStatus(isActive ? `${book.title} is active and on sale.` : `${book.title} is deactivated. It is hidden from the store and cannot be sold.`);
    } catch {
      setStatus('Unable to change this book.');
    } finally {
      setTogglingId(null);
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
          <Button variant="outline" onClick={() => setBulkLabelsOpen(true)} className="gap-2">
            <Barcode className="h-4 w-4" />
            Export all barcodes
          </Button>
          <Button variant="outline" onClick={() => setCategoriesOpen(true)} className="gap-2">
            <Tags className="h-4 w-4" />
            Categories
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
        saving={isSaving || uploading || pdfUploading}
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
              <label htmlFor="store-book-genre" className="text-sm font-medium text-foreground">Category</label>
              <select
                id="store-book-genre"
                value={draft.genre}
                onChange={(event) => setDraft((prev) => ({ ...prev, genre: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              >
                <option value="">Select category</option>
                {bookCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                {draft.genre && !bookCategories.some((category) => category.name === draft.genre) ? <option value={draft.genre}>{draft.genre}</option> : null}
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
                <p className="text-xs text-foreground/60">Cover images are stored on Cloudinary.</p>
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
                <MediaUploadProgress uploading={uploading && uploadTarget === 'cover'} progress={progress} label="Uploading cover" />
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
            {draft.softCopyEnabled ? (
              <div className="space-y-2 rounded-xl border border-border bg-background px-4 py-3 sm:col-span-3">
                <label htmlFor="store-book-pdf" className="text-sm font-medium text-foreground">Soft copy PDF</label>
                <p className="text-xs text-foreground/60">The PDF is saved privately in the bookshop storage bucket (up to 40MB). After payment, the reader opens it in My Books.</p>
                <input
                  id="store-book-pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    setPdfName(file.name);
                    const url = await uploadPdf(file);
                    if (!url) return;
                    // The storage URL goes into the payload; an existing book is saved with it straight away.
                    pdfUrlRef.current = url;
                    setDraft((prev) => ({ ...prev, downloadUrl: url }));
                    if (editingIdRef.current) {
                      const saved = await saveDownloadUrl(url);
                      setStatus(saved ? 'Soft copy PDF uploaded to storage and saved to this book.' : 'The PDF uploaded, but the book was not updated. Save the book to keep it.');
                    } else {
                      setStatus('Soft copy PDF uploaded to storage. Save the book to keep it.');
                    }
                  }}
                  disabled={pdfUploading}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20 disabled:opacity-60"
                />
                <MediaUploadProgress uploading={pdfUploading} progress={pdfProgress} label={pdfName ? `${pdfPhase}: ${pdfName}` : pdfPhase} />
                {draft.downloadUrl ? (
                  isStorageLink(draft.downloadUrl) ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{pdfName ? `Current PDF: ${pdfName}` : 'Soft copy PDF is in storage'}</p>
                      <p className="text-xs text-foreground/60">Stored privately in the bookshop storage bucket. Buyers open it in My Books after paying; the link itself does not download it.</p>
                      <p className="break-all font-mono text-[11px] text-foreground/50">{draft.downloadUrl}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <a href={draft.downloadUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-primary underline">
                        {pdfName ? `Current PDF: ${pdfName}` : 'Open the current soft copy PDF'}
                      </a>
                      <p className="break-all text-xs text-foreground/60">{draft.downloadUrl}</p>
                      <p className="text-xs text-foreground/70">This is an older link. Upload the PDF again to move it into the storage bucket.</p>
                    </div>
                  )
                ) : (
                  <p className="text-xs text-foreground/60">No PDF uploaded yet.</p>
                )}
              </div>
            ) : null}
            <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))} />
              Visible
            </label>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-amber-300/60 bg-amber-50/60 p-4 dark:bg-amber-500/10">
            <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft((prev) => ({ ...prev, isFeatured: event.target.checked }))} />
              Market this as the latest book
            </label>
            <p className="text-xs text-foreground/60">It is shown in the large spotlight at the top of the store. If several books are ticked, the first one in the list is used.</p>
            <input
              value={draft.featuredTagline}
              onChange={(event) => setDraft((prev) => ({ ...prev, featuredTagline: event.target.value }))}
              placeholder="Marketing line, e.g. A fresh word for a new season"
              maxLength={255}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
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
                      <td className="px-3 py-2 font-medium text-foreground">
                        {book.title}
                        {book.isFeatured ? <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">Latest book</span> : null}
                      </td>
                      <td className="px-3 py-2 text-foreground/70">{book.author || 'No author'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-foreground/70">MWK {book.hardCopyPrice.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-foreground/70">{book.hardCopyEnabled ? book.hardCopyStock ?? 0 : '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-foreground/70">
                        {book.softCopyPrice == null ? 'Not set' : `MWK ${book.softCopyPrice.toLocaleString()}`}
                      </td>
                      <td className="px-3 py-2">
                        <span className={book.isActive ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200'}>
                          {book.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 w-[104px] gap-1.5 px-2 text-xs"
                            disabled={togglingId === book.id}
                            aria-label={`${book.isActive ? 'Deactivate' : 'Activate'} ${book.title}`}
                            onClick={() => void toggleActive(book)}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {book.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${book.title}`}
                            onClick={() => openEditDialog(book)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {book.barcode ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              aria-label={`Barcode label for ${book.title}`}
                              title={`Barcode ${book.barcode}`}
                              onClick={() => setLabelBook(book)}
                            >
                              <Barcode className="h-4 w-4" />
                            </Button>
                          ) : null}
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
      {token ? (
        <BookCategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} token={token} categories={bookCategories} onChange={setBookCategories} />
      ) : null}
      <BulkBarcodeExportDialog
        open={bulkLabelsOpen}
        onOpenChange={setBulkLabelsOpen}
        books={books
          .filter((book) => book.barcode)
          .map((book) => ({ id: book.id, title: book.title, author: book.author, price: book.hardCopyPrice, barcode: book.barcode as string, stock: book.hardCopyStock }))}
      />
      <BookBarcodeDialog
        book={labelBook?.barcode ? { title: labelBook.title, author: labelBook.author, price: labelBook.hardCopyPrice, barcode: labelBook.barcode } : null}
        stock={labelBook?.hardCopyStock}
        onOpenChange={(open) => !open && setLabelBook(null)}
      />
    </div>
  );
}
