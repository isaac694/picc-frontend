'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Library, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

type LibraryPurchase = {
  id: string;
  productId: string;
  title: string;
  author?: string | null;
  genre?: string | null;
  imageUrl?: string | null;
  price: number;
  status: 'pending' | 'available' | 'cancelled';
  paidAt?: string | null;
  createdAt: string;
  bookContent?: string | null;
};

const STORE_TOKEN_KEY = 'store_token';
const STORE_USER_KEY = 'store_user';

const SAMPLE_CONTENT = [
  'This soft-copy reader is ready for the full book content. Once the admin adds chapters or reading material for this book, the saved content will appear here for users who have paid.',
  'Sample Chapter 1: Walking in Faith\nFaith grows through hearing, meditation, and obedience. This opening section can later be replaced with the real chapter text from the admin dashboard.',
  'Sample Chapter 2: Practical Application\nReaders can use this space to follow lessons, prayers, declarations, and study notes. The layout is designed for comfortable reading on phones, tablets, and desktop screens.',
];

function splitContent(content?: string | null) {
  const source = content?.trim() ? content : SAMPLE_CONTENT.join('\n\n');
  return source
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value?: string | null) {
  if (!value) return 'Pending';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function StoreLibraryPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<LibraryPurchase[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLibrary = async (authToken: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/store/library', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.status === 401) {
        localStorage.removeItem(STORE_TOKEN_KEY);
        localStorage.removeItem(STORE_USER_KEY);
        setToken(null);
        setPurchases([]);
        return;
      }

      if (!response.ok) {
        setError('Unable to load your books right now.');
        return;
      }

      const data = await response.json();
      const nextPurchases = Array.isArray(data?.purchases) ? data.purchases : [];
      setPurchases(nextPurchases);
      setSelectedId((current) => current || nextPurchases.find((purchase: LibraryPurchase) => purchase.status === 'available')?.id || nextPurchases[0]?.id || '');
    } catch {
      setError('Unable to load your books right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(STORE_TOKEN_KEY);
    setToken(storedToken);
    if (storedToken) {
      void fetchLibrary(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const availablePurchases = useMemo(
    () => purchases.filter((purchase) => purchase.status === 'available'),
    [purchases],
  );
  const selectedPurchase = purchases.find((purchase) => purchase.id === selectedId) || availablePurchases[0] || purchases[0] || null;
  const contentBlocks = splitContent(selectedPurchase?.bookContent);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#f7f7fb] text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/store" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                <ArrowLeft className="h-4 w-4" />
                Back to Hope Stores
              </Link>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">My Books</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Your paid soft-copy books are kept here for reading.
              </p>
            </div>
            {token && (
              <Button variant="outline" onClick={() => fetchLibrary(token)} disabled={isLoading} className="gap-2 rounded-md">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>

          {!token ? (
            <section className="border border-dashed border-slate-300 bg-white p-8 text-center">
              <LockKeyhole className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-xl font-bold">Sign in to view My Books</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Your library is connected to the account used during soft-copy checkout.
              </p>
              <Button className="mt-5 rounded-md bg-[#1688b4] text-white hover:bg-[#0f759c]" onClick={() => router.push('/store')}>
                Go to store sign in
              </Button>
            </section>
          ) : (
            <div className="grid min-h-[640px] overflow-hidden border border-slate-200 bg-white lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="border-b border-slate-200 bg-slate-950 text-white lg:border-b-0 lg:border-r">
                <div className="border-b border-white/10 p-5">
                  <div className="flex items-center gap-2">
                    <Library className="h-5 w-5 text-[#63d5bc]" />
                    <h2 className="text-lg font-bold">My Books</h2>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/55">
                    {availablePurchases.length} paid soft cop{availablePurchases.length === 1 ? 'y' : 'ies'}
                  </p>
                </div>

                <div className="max-h-[560px] overflow-y-auto p-3">
                  {isLoading ? (
                    <p className="p-4 text-sm text-white/60">Loading books...</p>
                  ) : purchases.length === 0 ? (
                    <div className="p-4 text-sm text-white/60">
                      <BookOpen className="mb-3 h-8 w-8 text-white/25" />
                      No soft-copy purchases yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {purchases.map((purchase) => {
                        const isAvailable = purchase.status === 'available';
                        const isSelected = selectedPurchase?.id === purchase.id;
                        return (
                          <button
                            key={purchase.id}
                            type="button"
                            onClick={() => setSelectedId(purchase.id)}
                            className={`w-full rounded-md p-3 text-left transition ${isSelected ? 'bg-white text-slate-950' : 'bg-white/5 text-white hover:bg-white/10'}`}
                          >
                            <div className="flex gap-3">
                              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-white/10">
                                {purchase.imageUrl ? (
                                  <Image src={purchase.imageUrl} alt={purchase.title} fill sizes="44px" className="object-cover" />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-sm font-semibold leading-tight">{purchase.title}</p>
                                <p className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                  <ShieldCheck className="h-3 w-3" />
                                  {isAvailable ? 'Paid' : 'Pending'}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>

              <section className="min-w-0">
                {error && <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">{error}</p>}
                {!selectedPurchase ? (
                  <div className="flex min-h-[560px] items-center justify-center p-8 text-center">
                    <div>
                      <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                      <h2 className="mt-4 text-xl font-bold">Choose a book</h2>
                      <p className="mt-2 text-sm text-slate-600">Paid soft copies will open in this reader.</p>
                    </div>
                  </div>
                ) : (
                  <article className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-12">
                    <div className="border-b border-slate-200 pb-6">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1688b4]">
                        {selectedPurchase.status === 'available' ? 'Ready to read' : 'Awaiting payment confirmation'}
                      </p>
                      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">{selectedPurchase.title}</h2>
                      <p className="mt-3 text-sm text-slate-600">
                        {selectedPurchase.author || 'Hope Stores'} | {selectedPurchase.genre || 'Soft Copy'} | {formatDate(selectedPurchase.paidAt)}
                      </p>
                    </div>

                    {selectedPurchase.status !== 'available' ? (
                      <div className="mt-8 border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                        This book is in your library, but it will unlock after PayChangu confirms the payment.
                      </div>
                    ) : (
                      <div className="prose prose-slate mt-8 max-w-none">
                        {contentBlocks.map((block, index) => {
                          const [firstLine, ...rest] = block.split('\n');
                          if (firstLine?.toLowerCase().startsWith('chapter') || firstLine?.toLowerCase().startsWith('sample chapter')) {
                            return (
                              <section key={block} className={index > 0 ? 'mt-10' : undefined}>
                                <h3 className="text-2xl font-bold text-slate-950">{firstLine}</h3>
                                {rest.length > 0 && <p className="mt-4 text-base leading-8 text-slate-700">{rest.join(' ')}</p>}
                              </section>
                            );
                          }
                          return <p key={block} className="text-base leading-8 text-slate-700">{block}</p>;
                        })}
                      </div>
                    )}
                  </article>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
