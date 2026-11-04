'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { apiFetch } from '@/lib/api';
import type { BookCategory } from '@/hooks/use-book-categories';

/** Add, rename, reorder and delete the bookshop's book categories. */
export default function BookCategoriesDialog({
  open,
  onOpenChange,
  token,
  categories,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  categories: BookCategory[];
  onChange: (categories: BookCategory[]) => void;
}) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (path: string, method: string, body?: unknown) => {
    setBusy(true);
    try {
      const response = await apiFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        adminErrorToast(data?.error || 'Unable to save the categories.');
        return null;
      }
      if (Array.isArray(data?.categories)) onChange(data.categories);
      return data;
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    if (await send('/api/admin/store/book-categories', 'POST', { name })) {
      setNewName('');
      adminSuccessToast(`Added ${name}.`);
    }
  };

  const rename = async (category: BookCategory) => {
    const name = editName.trim();
    if (!name || name === category.name) {
      setEditingId(null);
      return;
    }
    const data = await send(`/api/admin/store/book-categories/${category.id}`, 'PUT', { name });
    if (data) {
      setEditingId(null);
      adminSuccessToast(data.booksUpdated ? `Renamed. ${data.booksUpdated} book${data.booksUpdated === 1 ? '' : 's'} moved to ${name}.` : 'Category renamed.');
    }
  };

  const remove = (category: BookCategory) => {
    confirmDeleteToast({
      title: `Delete ${category.name}?`,
      description: category.bookCount
        ? `${category.bookCount} book${category.bookCount === 1 ? ' stays' : 's stay'} in the store without a category.`
        : 'No books use this category.',
      onConfirm: async () => {
        if (await send(`/api/admin/store/book-categories/${category.id}`, 'DELETE')) adminSuccessToast('Category deleted.');
      },
    });
  };

  const move = async (index: number, offset: number) => {
    const next = [...categories];
    const [item] = next.splice(index, 1);
    next.splice(index + offset, 0, item);
    onChange(next);
    await send('/api/admin/store/book-categories-order', 'PUT', { ids: next.map((entry) => entry.id) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book categories</DialogTitle>
          <DialogDescription>These are the categories shoppers filter by. Renaming one moves its books with it.</DialogDescription>
        </DialogHeader>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="New category name"
            maxLength={80}
            className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm"
          />
          <Button type="submit" size="sm" disabled={busy || !newName.trim()}><Plus className="h-4 w-4" /> Add</Button>
        </form>
        <ul className="max-h-[50vh] divide-y divide-border/60 overflow-y-auto rounded-lg border border-border/60">
          {categories.map((category, index) => (
            <li key={category.id} className="flex items-center gap-2 px-3 py-2">
              {editingId === category.id ? (
                <form
                  className="flex flex-1 gap-1"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void rename(category);
                  }}
                >
                  <input autoFocus value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={80} className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm" />
                  <Button type="submit" size="icon" variant="ghost" aria-label="Save name" disabled={busy}><Check className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" aria-label="Cancel" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                </form>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{category.name}</p>
                    <p className="text-[11px] text-muted-foreground">{category.bookCount} book{category.bookCount === 1 ? '' : 's'}</p>
                  </div>
                  <Button type="button" size="icon" variant="ghost" aria-label={`Move ${category.name} up`} disabled={busy || index === 0} onClick={() => void move(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" aria-label={`Move ${category.name} down`} disabled={busy || index === categories.length - 1} onClick={() => void move(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" aria-label={`Rename ${category.name}`} onClick={() => { setEditingId(category.id); setEditName(category.name); }}><Pencil className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="text-destructive" aria-label={`Delete ${category.name}`} onClick={() => remove(category)}><Trash2 className="h-4 w-4" /></Button>
                </>
              )}
            </li>
          ))}
          {categories.length === 0 ? <li className="px-3 py-6 text-center text-sm text-muted-foreground">No categories yet.</li> : null}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
