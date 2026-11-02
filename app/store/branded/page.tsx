'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Sparkles, X } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

type BrandedItem = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  category: string;
  stock: number;
  lowStockThreshold?: number;
  sizes?: string[];
  gallery?: string[];
  isFeatured?: boolean;
};

const CART_KEY = 'hope_store_cart_state';
const PLACEHOLDER = '/store/items/placeholder.jpg';

const itemImage = (item: BrandedItem) => resolveMediaImageUrl(item.imageUrl || item.image) || PLACEHOLDER;
const itemPhotos = (item: BrandedItem) => [itemImage(item), ...(item.gallery || []).map((url) => resolveMediaImageUrl(url) || url)];

function StockNote({ item, light = false }: { item: BrandedItem; light?: boolean }) {
  if (item.stock <= 0) return <span className="text-sm font-semibold text-red-500">Out of stock</span>;
  if (item.stock <= (item.lowStockThreshold ?? 5)) {
    return <span className={cn('text-sm font-semibold', light ? 'text-amber-300' : 'text-amber-600')}>Only {item.stock} left</span>;
  }
  return <span className={cn('flex items-center gap-1 text-sm', light ? 'text-emerald-300' : 'text-emerald-700')}><Check className="h-4 w-4" /> In stock</span>;
}

export default function BrandedStorePage() {
  const router = useRouter();
  const [items, setItems] = useState<BrandedItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('All');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<BrandedItem | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

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

  const usedCategories = useMemo(() => categories.filter((entry) => items.some((item) => item.category === entry)), [categories, items]);
  const featured = useMemo(() => items.find((item) => item.isFeatured && item.stock > 0) || items.find((item) => item.isFeatured) || null, [items]);
  const visible = useMemo(() => items.filter((item) => category === 'All' || item.category === category), [items, category]);

  const open = (item: BrandedItem) => {
    setViewing(item);
    setPhotoIndex(0);
    setQuantity(1);
  };

  const addToStoreCart = (item: BrandedItem, count = 1) => {
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
    const nextQuantity = (existing?.quantity || 0) + count;
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
      image: item.imageUrl || item.image || PLACEHOLDER,
      hardCopyEnabled: true,
      hardCopyStock: item.stock,
      isActive: true,
    };
    const nextCart = existing
      ? cart.map((entry) => (entry.product.id === item.id ? { ...entry, product, quantity: nextQuantity } : entry))
      : [...cart, { product, quantity: count }];
    localStorage.setItem(CART_KEY, JSON.stringify({ cart: nextCart, digitalCart: stored?.digitalCart || [], expiresAt: stored?.expiresAt || null }));
    setNotice(`${item.name} added. Opening your cart.`);
    router.push('/store');
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#faf8f4] pb-20">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0f1c2e] pb-20 pt-28 text-white md:pb-28 md:pt-32">
          <div className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-secondary/25 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-[#1688b4]/40 blur-[120px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:px-8">
            <div>
              <Link href="/store" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5" /> Hope Stores
              </Link>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.45em] text-secondary">PICC branded collection</p>
              <h1 className="font-display mt-4 text-5xl font-semibold leading-[1.02] md:text-7xl">
                Wear your faith.
                <br />
                <span className="italic text-secondary">Carry the vision.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">
                Shirts, notebooks, calendars, stickers and more, made for the PICC family. Every item goes into the same cart as your books.
              </p>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/70">
                <span><strong className="block text-3xl font-semibold text-white">{items.length || '—'}</strong>items</span>
                <span><strong className="block text-3xl font-semibold text-white">{usedCategories.length || '—'}</strong>collections</span>
              </div>
            </div>

            {featured ? (
              <button type="button" onClick={() => open(featured)} className="group relative text-left">
                <div className="animate-soft-float relative overflow-hidden rounded-[2.5rem] bg-white/5 ring-1 ring-white/10">
                  <img src={itemImage(featured)} alt={featured.name} className="aspect-[4/3.4] w-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-secondary-foreground">
                    <Sparkles className="h-3 w-3" /> Featured
                  </span>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-7">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/60">{featured.category}</p>
                      <p className="font-display mt-1 text-3xl font-semibold">{featured.name}</p>
                      <div className="mt-2"><StockNote item={featured} light /></div>
                    </div>
                    <p className="shrink-0 text-2xl font-light">MWK {featured.price.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ) : items[0] ? (
              <div className="grid grid-cols-2 gap-4">
                {items.slice(0, 4).map((item, index) => (
                  <button key={item.id} type="button" onClick={() => open(item)} className={cn('overflow-hidden rounded-3xl ring-1 ring-white/10', index % 2 === 1 && 'translate-y-8')}>
                    <img src={itemImage(item)} alt={item.name} className="aspect-square w-full object-cover transition-transform duration-700 hover:scale-105" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Collections */}
          <div className="sticky top-16 z-20 -mx-4 mt-10 flex gap-2 overflow-x-auto bg-[#faf8f4]/90 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
            {['All', ...usedCategories].map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setCategory(entry)}
                className={cn(
                  'shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all',
                  category === entry ? 'border-[#0f1c2e] bg-[#0f1c2e] text-white shadow-lg' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400',
                )}
              >
                {entry}
                <span className="ml-2 text-xs opacity-60">{entry === 'All' ? items.length : items.filter((item) => item.category === entry).length}</span>
              </button>
            ))}
          </div>

          {notice ? <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{notice}</p> : null}
          {loading ? <p className="mt-10 text-sm text-slate-500">Loading items...</p> : null}
          {!loading && visible.length === 0 ? (
            <p className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-600">No branded items are listed yet.</p>
          ) : null}

          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
            {visible.map((item) => {
              const photos = itemPhotos(item);
              return (
                <article key={item.id} className="group">
                  <button type="button" onClick={() => open(item)} className="relative block w-full overflow-hidden rounded-[2rem] bg-white text-left shadow-sm transition-shadow duration-500 hover:shadow-2xl">
                    <img src={photos[0]} alt={item.name} className={cn('aspect-[4/5] w-full object-cover transition-all duration-700 group-hover:scale-105', photos[1] && 'group-hover:opacity-0')} />
                    {photos[1] ? <img src={photos[1]} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100" /> : null}
                    {item.stock <= 0 ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm font-bold uppercase tracking-[0.3em] text-slate-700 backdrop-blur-[2px]">Sold out</span>
                    ) : null}
                    {item.isFeatured ? (
                      <span className="absolute left-4 top-4 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-foreground">Featured</span>
                    ) : null}
                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 rounded-full bg-[#0f1c2e] px-6 py-2.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      Quick view
                    </span>
                  </button>
                  <div className="mt-5 flex items-start justify-between gap-4 px-1">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.category}</p>
                      <h2 className="font-display mt-1 text-2xl font-semibold text-slate-950">{item.name}</h2>
                      <div className="mt-1"><StockNote item={item} /></div>
                    </div>
                    <p className="shrink-0 text-xl font-light text-slate-950">MWK {item.price.toLocaleString()}</p>
                  </div>
                  <button
                    type="button"
                    disabled={item.stock <= 0}
                    onClick={() => addToStoreCart(item)}
                    className="mx-1 mt-4 inline-flex min-h-12 w-[calc(100%-0.5rem)] items-center justify-center gap-2 rounded-full bg-[#f59e0b] px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-[#e58f00] disabled:opacity-40"
                  >
                    <ShoppingBag className="h-4 w-4" /> {item.stock <= 0 ? 'Out of stock' : 'Add to cart'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </main>

      {viewing ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setViewing(null)}>
          <div className="relative grid max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] bg-white sm:rounded-[2rem] md:grid-cols-[1.1fr_1fr]" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setViewing(null)} aria-label="Close" className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow">
              <X className="h-5 w-5" />
            </button>
            <div className="bg-slate-100">
              <img src={itemPhotos(viewing)[photoIndex]} alt={viewing.name} className="aspect-square w-full object-cover" />
              {itemPhotos(viewing).length > 1 ? (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {itemPhotos(viewing).map((photo, index) => (
                    <button key={photo} type="button" onClick={() => setPhotoIndex(index)} className={cn('h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2', index === photoIndex ? 'ring-[#0f1c2e]' : 'ring-transparent')}>
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-col p-7 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{viewing.category}</p>
              <h2 className="font-display mt-2 text-4xl font-semibold text-slate-950">{viewing.name}</h2>
              <p className="mt-3 text-3xl font-light text-slate-950">MWK {viewing.price.toLocaleString()}</p>
              <div className="mt-2"><StockNote item={viewing} /></div>
              {viewing.description ? <p className="mt-6 whitespace-pre-wrap leading-7 text-slate-600">{viewing.description}</p> : null}
              {viewing.sizes?.length ? (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Available sizes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {viewing.sizes.map((size) => <span key={size} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold">{size}</span>)}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Tell the store your size when you collect your order.</p>
                </div>
              ) : null}
              <div className="mt-auto pt-8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-slate-300">
                    <button type="button" aria-label="Fewer" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="p-3"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center font-semibold tabular-nums">{quantity}</span>
                    <button type="button" aria-label="More" onClick={() => setQuantity((value) => Math.min(Math.max(viewing.stock, 1), value + 1))} className="p-3"><Plus className="h-4 w-4" /></button>
                  </div>
                  <button
                    type="button"
                    disabled={viewing.stock <= 0}
                    onClick={() => addToStoreCart(viewing, quantity)}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#0f1c2e] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1e3a5f] disabled:opacity-40"
                  >
                    <ShoppingBag className="h-4 w-4" /> {viewing.stock <= 0 ? 'Out of stock' : `Add ${quantity} to cart`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </>
  );
}
