'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { bookGenres } from '@/components/data/products';

export type BookCategory = { id: string; name: string; sortOrder: number; bookCount: number };

const FALLBACK: BookCategory[] = bookGenres.map((name, index) => ({ id: name, name, sortOrder: index, bookCount: 0 }));

/** Book categories managed by the bookshop, falling back to the built-in list if the API is unreachable. */
export function useBookCategories() {
  const [categories, setCategories] = useState<BookCategory[]>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const response = await apiFetch('/api/store/book-categories');
      const data = await response.json().catch(() => null);
      if (response.ok && Array.isArray(data?.categories)) setCategories(data.categories);
    } catch {
      // Keep the built-in list.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { categories, setCategories, reload, loaded };
}
