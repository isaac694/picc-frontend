'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch } from '@/lib/api';

type BrandedItem = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  category: string;
  stock: number;
};

const CART_KEY = 'hope_store_cart_state';

export default function BrandedStorePage() {
  const router = useRouter();
  const [items, setItems] = useState<BrandedItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('All');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/store/merchandise')
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (cancelled || !response.ok) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () => items.filter((item) => category === 'All' || item.category === category),
    [items, category],
  );

  const addToStoreCart = (item: BrandedItem) => {
    if (item.stock <= 0) {
      setNotice(`${item.name} is out of stock.`);
      return;
    }
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || 'null') as {
      cart?: Array<{ product: { id: string; hardCopyStock?: number }; quantity: number }>;
      digitalCart?: unknown[];
      expiresAt?: string | null;
    } | null;
    const cart = Array.isArray(stored?.cart) ? stored.cart : [];
    const existing = cart.find((entry) => entry.product.id === item.id);
    const nextQuantity = (existing?.quantity || 0) + 1;
    if (nextQuantity > item.stock) {
      setNotice(`Only ${item.stock} ${item.name} ${item.stock === 1 ? 'is' : 'are'} in stock.`);
      return;
    }
    const product = {
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description || undefined,
      category: item.category || 'PICC branded items',
      image: item.imageUrl || item.image || '/store/items/placeholder.jpg',
      hardCopyEnabled: true,
      hardCopyStock: item.stock,
      isActive: true,
    };
    const nextCart = existing
      ? cart.map((entry) => entry.product.id === item.id ? { ...entry, product, quantity: nextQuantity } : entry)
      : [...cart, { product, quantity: 1 }];
    localStorage.setItem(CART_KEY, JSON.stringify({
      cart: nextCart,
      digitalCart: stored?.digitalCart || [],
      expiresAt: stored?.expiresAt || null,
    }));
    setNotice(`${item.name} added. Opening your cart.`);
    router.push('/store');
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#fbfbff] pb-16 pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1688b4]">Hope Stores</p>
              <h1 className="mt-2 font-serif text-4xl font-semibold text-slate-950 md:text-5xl">Shirts, stickers, and more</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Branded PICC items sold with the bookshop. Choose an item and it is added to the same store cart.
              </p>
            </div>
            <Link href="/store" className="text-sm font-semibold text-[#1688b4] hover:underline">
              Back to books
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('All')}
              className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${category === 'All' ? 'border-[#1688b4] bg-[#1688b4] text-white' : 'border-slate-200 bg-white text-slate-700'}`}
            >
              All
            </button>
            {categories.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setCategory(entry)}
                className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${category === entry ? 'border-[#1688b4] bg-[#1688b4] text-white' : 'border-slate-200 bg-white text-slate-700'}`}
              >
                {entry}
              </button>
            ))}
          </div>

          {notice ? <p className="mt-4 text-sm text-slate-700">{notice}</p> : null}

          {loading ? <p className="mt-10 text-sm text-slate-500">Loading items...</p> : null}
          {!loading && visible.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-600">
              No branded items are listed yet.
            </p>
          ) : null}

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-square bg-slate-100">
                  {item.imageUrl || item.image ? (
                    <img src={item.imageUrl || item.image || ''} alt={item.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.category}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{item.name}</h2>
                  {item.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p> : null}
                  <p className="mt-2 text-xl font-light text-slate-950">MWK {item.price.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}</p>
                  <button
                    type="button"
                    disabled={item.stock <= 0}
                    onClick={() => addToStoreCart(item)}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#f59e0b] px-4 text-sm font-semibold text-slate-950 hover:bg-[#e58f00] disabled:opacity-50"
                  >
                    {item.stock <= 0 ? 'Out of stock' : 'Add to cart'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
