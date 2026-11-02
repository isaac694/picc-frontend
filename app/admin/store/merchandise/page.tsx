'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Boxes, ImageIcon, Pencil, Plus, RefreshCw, Star, Trash2, X } from 'lucide-react';
import BrandedStockDialog from '@/components/admin/BrandedStockDialog';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { apiFetch } from '@/lib/api';

type StoreItem = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  category: string;
  stock: number;
  lowStockThreshold?: number;
  sizes?: string[];
  gallery?: string[];
  isFeatured?: boolean;
  isActive: boolean;
  sortOrder: number;
};

type Draft = {
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  category: string;
  stock: string;
  lowStockThreshold: string;
  sizes: string;
  gallery: string[];
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  price: '',
  description: '',
  imageUrl: '',
  category: 'Shirt',
  stock: '0',
  lowStockThreshold: '5',
  sizes: '',
  gallery: [],
  isFeatured: false,
  isActive: true,
  sortOrder: '0',
};

const FALLBACK_CATEGORIES = ['Shirt', 'Sticker', 'Notebook', 'Calendar', 'Bible divider', 'PICC branded items', 'Other'];

export default function StoreMerchandiseAdminPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const { runUpload, progress, uploading } = useMediaUpload();
  const [stockItem, setStockItem] = useState<StoreItem | null>(null);

  const fetchItems = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch('/api/admin/store/merchandise', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(data?.error || 'Unable to load branded items.');
      return;
    }
    setItems(Array.isArray(data?.items) ? data.items : []);
    if (Array.isArray(data?.categories) && data.categories.length) setCategories(data.categories);
  }, [token]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError('');
    setUploadName('');
  };

  const openAddDialog = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError('');
    setUploadName('');
    setDialogOpen(true);
  };

  const uploadImage = async (file: File) => {
    try {
      return await runUpload(file, 'store');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Image upload failed.');
      return null;
    }
  };

  const saveItem = async () => {
    if (!token) return;
    if (!draft.name.trim()) {
      setFormError('Enter the item name.');
      return;
    }
    if (!draft.price.trim() || Number(draft.price) <= 0) {
      setFormError('Enter a price greater than zero.');
      return;
    }
    if (!draft.imageUrl.trim()) {
      setFormError('Upload an image.');
      return;
    }
    if (uploading) return;
    if (!Number.isInteger(Number(draft.stock)) || Number(draft.stock) < 0) {
      setFormError('Stock must be a whole number.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const response = await apiFetch(editingId ? `/api/admin/store/merchandise/${editingId}` : '/api/admin/store/merchandise', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: draft.name.trim(),
          price: Number(draft.price),
          description: draft.description.trim(),
          imageUrl: draft.imageUrl.trim(),
          category: draft.category,
          stock: Number(draft.stock),
          lowStockThreshold: Number(draft.lowStockThreshold || 0),
          sizes: draft.sizes.split(',').map((size) => size.trim()).filter(Boolean),
          gallery: draft.gallery,
          isFeatured: draft.isFeatured,
          isActive: draft.isActive,
          sortOrder: Number(draft.sortOrder || 0),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError(data?.error || 'Unable to save this item.');
        return;
      }
      setStatus(editingId ? 'Item updated.' : 'Item added.');
      closeDialog();
      await fetchItems();
    } catch {
      setFormError('Unable to save this item.');
    } finally {
      setSaving(false);
    }
  };

  const editItem = (item: StoreItem) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      price: String(item.price),
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      category: item.category || 'PICC branded items',
      stock: String(item.stock ?? 0),
      lowStockThreshold: String(item.lowStockThreshold ?? 5),
      sizes: (item.sizes || []).join(', '),
      gallery: item.gallery || [],
      isFeatured: item.isFeatured === true,
      isActive: item.isActive !== false,
      sortOrder: String(item.sortOrder ?? 0),
    });
    setFormError('');
    setUploadName('');
    setDialogOpen(true);
  };

  const removeItem = (item: StoreItem) => {
    if (!token) return;
    confirmDeleteToast({
      title: `Delete ${item.name}?`,
      description: 'This removes the item from the store.',
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/store/merchandise/${item.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          setStatus('Unable to delete this item.');
          return;
        }
        if (editingId === item.id) closeDialog();
        await fetchItems();
      },
    });
  };

  if (!token) return <AdminLoginCard />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/60">Shirts, stickers, and other Hope Store goods.</p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/store/merchandise/stats"><BarChart3 className="mr-2 h-4 w-4" />Statistics</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void fetchItems()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add branded item
          </Button>
        </div>
      </div>

      {status ? <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground/70">{status}</p> : null}

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-foreground/60">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-foreground/60">
                    No branded items yet. Use Add branded item to create one.
                  </td>
                </tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="m-3 h-6 w-6 text-foreground/30" />
                        )}
                      </div>
                      <div>
                        <p className="flex items-center gap-1 font-medium">
                          {item.name}
                          {item.isFeatured ? <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-label="Featured" /> : null}
                        </p>
                        {item.sizes?.length ? <p className="text-xs text-foreground/55">Sizes: {item.sizes.join(', ')}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-foreground/70">
                    <p className="line-clamp-2">{item.description || '—'}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{item.category}</td>
                  <td className="whitespace-nowrap px-4 py-3">MWK {item.price.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={item.stock <= 0 ? 'font-semibold text-destructive' : item.stock <= (item.lowStockThreshold ?? 5) ? 'font-semibold text-amber-600' : ''}>
                      {item.stock}
                    </span>
                    {item.stock <= 0 ? <span className="ml-2 text-xs text-destructive">Out</span> : item.stock <= (item.lowStockThreshold ?? 5) ? <span className="ml-2 text-xs text-amber-600">Low</span> : null}
                  </td>
                  <td className="px-4 py-3">{item.isActive ? 'Visible' : 'Hidden'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setStockItem(item)}>
                        <Boxes className="h-3.5 w-3.5" /> Stock
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => editItem(item)} aria-label={`Edit ${item.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(item)} aria-label={`Delete ${item.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setDialogOpen(true);
          else closeDialog();
        }}
        title={editingId ? 'Edit branded item' : 'Add branded item'}
        description="Name, price, image, and stock for shirts, stickers, and other goods."
        saving={saving || uploading}
        saveLabel={saving ? 'Saving...' : editingId ? 'Update item' : 'Add item'}
        onSave={() => void saveItem()}
        onCancel={closeDialog}
        maxWidthClass="sm:max-w-xl"
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Name</span>
            <input className="rounded-xl border border-border bg-background px-3 py-2" value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="PICC shirt" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Description</span>
            <textarea className="min-h-24 rounded-xl border border-border bg-background px-3 py-2" value={draft.description} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} placeholder="Short details about this item" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Price (MWK)</span>
            <input className="rounded-xl border border-border bg-background px-3 py-2" type="number" min="1" value={draft.price} onChange={(event) => setDraft((prev) => ({ ...prev, price: event.target.value }))} placeholder="15000" />
          </label>
          <div className="grid gap-2 text-sm">
            <span>Image</span>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                {draft.imageUrl ? (
                  <img src={draft.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="m-6 h-8 w-8 text-foreground/30" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  id="branded-item-image"
                  type="file"
                  accept="image/*,.heic,.heif,.avif"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (!url) return;
                    setDraft((prev) => ({ ...prev, imageUrl: url }));
                    setUploadName(file.name);
                    setFormError('');
                  }}
                  className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
                {uploadName ? <p className="mt-2 truncate text-xs text-foreground/60">{uploadName}</p> : null}
                <MediaUploadProgress uploading={uploading} progress={progress} className="mt-2" />
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Type</span>
              <select className="rounded-xl border border-border bg-background px-3 py-2" value={draft.category} onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Number in stock</span>
              <input className="rounded-xl border border-border bg-background px-3 py-2" type="number" min="0" step="1" value={draft.stock} onChange={(event) => setDraft((prev) => ({ ...prev, stock: event.target.value }))} />
              {editingId ? <span className="text-xs text-foreground/50">For deliveries use the Stock button, so the change is recorded.</span> : null}
            </label>
            <label className="grid gap-1 text-sm">
              <span>Sizes or options</span>
              <input className="rounded-xl border border-border bg-background px-3 py-2" value={draft.sizes} onChange={(event) => setDraft((prev) => ({ ...prev, sizes: event.target.value }))} placeholder="S, M, L, XL" />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Warn when stock is at or below</span>
              <input className="rounded-xl border border-border bg-background px-3 py-2" type="number" min="0" step="1" value={draft.lowStockThreshold} onChange={(event) => setDraft((prev) => ({ ...prev, lowStockThreshold: event.target.value }))} />
            </label>
          </div>
          <div className="grid gap-2 text-sm">
            <span>More photos (shown on the item page)</span>
            <div className="flex flex-wrap gap-2">
              {draft.gallery.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => setDraft((prev) => ({ ...prev, gallery: prev.gallery.filter((entry) => entry !== url) }))} className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-foreground/50 hover:bg-muted/40">
                <Plus className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.avif"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = '';
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (url) setDraft((prev) => ({ ...prev, gallery: [...prev.gallery, url] }));
                  }}
                />
              </label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft((prev) => ({ ...prev, isFeatured: event.target.checked }))} />
            Feature at the top of the branded items page
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))} />
            Visible in the store
          </label>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        </div>
      </SchoolAdminDialogShell>

      <BrandedStockDialog token={token} item={stockItem} onClose={() => setStockItem(null)} onChanged={() => void fetchItems()} />
    </div>
  );
}
