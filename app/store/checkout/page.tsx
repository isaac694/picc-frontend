'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, CreditCard, Library, Loader2, ShieldCheck } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import type { Product } from '@/components/data/products';

type CartItem = { product: Product; quantity: number };
type StoreUser = { id: string; email: string; name: string };
type StoredStoreCartState = {
  cart?: CartItem[];
  digitalCart?: CartItem[];
  expiresAt?: string | null;
};

const STORE_TOKEN_KEY = 'store_token';
const STORE_USER_KEY = 'store_user';
const STORE_CART_TOKEN_KEY = 'hope_store_cart_token';
const STORE_CART_STATE_KEY = 'hope_store_cart_state';

function parseCartState(value: string | null): StoredStoreCartState {
  if (!value) return {};
  try {
    return JSON.parse(value) as StoredStoreCartState;
  } catch {
    return {};
  }
}

function formatMWK(amount: number) {
  return `MWK ${amount.toLocaleString()}`;
}

function getSoftCopyPrice(book: Product) {
  if (typeof book.softCopyPrice === 'number') return book.softCopyPrice;
  return Math.max(1000, Math.round(book.price * 0.7));
}

function clearSoftCart() {
  const current = parseCartState(localStorage.getItem(STORE_CART_STATE_KEY));
  localStorage.setItem(
    STORE_CART_STATE_KEY,
    JSON.stringify({
      cart: Array.isArray(current.cart) ? current.cart : [],
      digitalCart: [],
      expiresAt: current.expiresAt || null,
    }),
  );
}

export default function StoreCheckoutPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<StoreUser | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartToken, setCartToken] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Airtel Money');
  const [error, setError] = useState('');
  const [successReference, setSuccessReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORE_TOKEN_KEY);
    const storedUser = localStorage.getItem(STORE_USER_KEY);
    const storedCart = parseCartState(localStorage.getItem(STORE_CART_STATE_KEY));
    const storedCartToken = localStorage.getItem(STORE_CART_TOKEN_KEY) || crypto.randomUUID();

    if (!localStorage.getItem(STORE_CART_TOKEN_KEY)) {
      localStorage.setItem(STORE_CART_TOKEN_KEY, storedCartToken);
    }

    setCartToken(storedCartToken);
    setItems(Array.isArray(storedCart.digitalCart) ? storedCart.digitalCart : []);
    setToken(storedToken);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as StoreUser;
        setUser(parsedUser);
        setCheckoutEmail(parsedUser.email || '');
      } catch {
        localStorage.removeItem(STORE_USER_KEY);
      }
    }
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + getSoftCopyPrice(item.product) * item.quantity, 0),
    [items],
  );

  const submitPayment = async () => {
    if (!token || !user) {
      router.push('/store');
      return;
    }

    if (items.length === 0) {
      setError('Your soft-copy cart is empty.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiFetch('/api/store/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod,
          phone: checkoutPhone,
          phoneCountry: '+265',
          format: 'soft',
          customerEmail: checkoutEmail,
          cartToken,
          items: items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            price: getSoftCopyPrice(item.product),
            currency: 'MWK',
          })),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Unable to start the soft-copy payment.');
        return;
      }

      clearSoftCart();
      setSuccessReference(String(data?.chargeId || data?.payment?.chargeId || ''));

      if (data?.payment?.checkoutUrl) {
        window.location.href = data.payment.checkoutUrl;
      }
    } catch {
      setError('Unable to start payment right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadyToPay = Boolean(token && user && items.length > 0 && checkoutPhone.trim() && checkoutEmail.trim() && paymentMethod);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/store" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                <ArrowLeft className="h-4 w-4" />
                Back to Hope Stores
              </Link>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">Soft Copy Payment</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Complete your PayChangu payment to unlock these books in your personal library.
              </p>
            </div>
            <Link href="/store/library" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-slate-400">
              <Library className="h-4 w-4" />
              My Books
            </Link>
          </div>

          {!token || !user ? (
            <section className="border border-dashed border-slate-300 bg-white p-8 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-xl font-bold">Sign in required</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Soft-copy purchases must be linked to an account so they can appear in My Books.
              </p>
              <Button className="mt-5 rounded-md bg-[#1688b4] text-white hover:bg-[#0f759c]" onClick={() => router.push('/store')}>
                Sign in from store
              </Button>
            </section>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <section className="space-y-4">
                <div className="border border-slate-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1688b4]">Order</p>
                  <h2 className="mt-1 text-2xl font-bold">Soft copies</h2>
                </div>

                {items.length === 0 ? (
                  <div className="border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="font-semibold">Your soft-copy cart is empty.</p>
                    <Button className="mt-5 rounded-md bg-[#1688b4] text-white hover:bg-[#0f759c]" onClick={() => router.push('/store')}>
                      Choose books
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.product.id} className="grid gap-4 border border-slate-200 bg-white p-4 sm:grid-cols-[76px_minmax(0,1fr)_auto] sm:items-center">
                        <div className="relative h-28 w-20 overflow-hidden bg-slate-100">
                          <Image src={item.product.image} alt={item.product.name} fill sizes="80px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold leading-tight">{item.product.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">{item.product.author || 'Hope Stores'}</p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1688b4]">Soft Copy x {item.quantity}</p>
                        </div>
                        <p className="font-bold">{formatMWK(getSoftCopyPrice(item.product) * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <aside className="border border-slate-200 bg-white p-5">
                <div className="rounded-md bg-slate-950 p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Total to pay</p>
                  <p className="mt-2 text-3xl font-bold">{formatMWK(total)}</p>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="soft-checkout-email" className="text-sm font-semibold text-slate-700">Receipt email</label>
                    <input
                      id="soft-checkout-email"
                      type="email"
                      value={checkoutEmail}
                      onChange={(event) => setCheckoutEmail(event.target.value)}
                      className="mt-2 h-12 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-[#1688b4]"
                    />
                  </div>

                  <div>
                    <label htmlFor="soft-checkout-phone" className="text-sm font-semibold text-slate-700">Payment phone number</label>
                    <div className="mt-2 flex overflow-hidden rounded-md border border-slate-200">
                      <span className="flex items-center border-r border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">+265</span>
                      <input
                        id="soft-checkout-phone"
                        value={checkoutPhone}
                        onChange={(event) => setCheckoutPhone(event.target.value)}
                        inputMode="tel"
                        placeholder="991234567"
                        className="h-12 min-w-0 flex-1 px-3 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">Payment method</p>
                    <div className="mt-2 space-y-2">
                      {['Airtel Money', 'TNM Mpamba', 'Bank Transfer'].map((method) => (
                        <label key={method} className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm font-semibold ${paymentMethod === method ? 'border-slate-950 bg-slate-50' : 'border-slate-200'}`}>
                          <input type="radio" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                          {method}
                        </label>
                      ))}
                    </div>
                  </div>

                  {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

                  {successReference ? (
                    <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
                      <CheckCircle2 className="mb-2 h-5 w-5" />
                      Payment request created. Reference: <span className="font-semibold">{successReference}</span>
                    </div>
                  ) : null}

                  <Button
                    disabled={!isReadyToPay || isSubmitting}
                    onClick={submitPayment}
                    className="min-h-12 w-full gap-2 rounded-md bg-[#05944f] text-white hover:bg-[#047d43]"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    {isSubmitting ? 'Starting payment...' : 'Pay with PayChangu'}
                  </Button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
