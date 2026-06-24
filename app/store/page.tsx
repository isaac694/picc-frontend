'use client';

import { useCallback, useEffect, useState, useMemo, type FormEvent, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, X, CheckCircle2, 
  MessageCircle, ImageIcon, BookOpen, Building2, Menu,
  ChevronLeft, ChevronRight, User, LogIn, Library, Download, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { bookGenres, products, type Product } from '@/components/data/products';
import { apiFetch } from '@/lib/api';

type StoreUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
};

type AuthMode = 'signin' | 'signup';

type DigitalPurchase = {
  id: string;
  product: Product;
  price: number;
  status: 'pending' | 'available' | 'cancelled';
  purchasedAt: string;
  downloadUrl?: string | null;
};

type BankTransferDetails = Record<string, string | number | null | undefined>;
type CartItem = { product: Product; quantity: number };
type StoreCartPayload = {
  cartToken: string | null;
  hard: CartItem[];
  soft: CartItem[];
  expiresAt: string | null;
};

const STORE_TOKEN_KEY = 'store_token';
const STORE_USER_KEY = 'store_user';
const STORE_CART_TOKEN_KEY = 'hope_store_cart_token';
const STORE_CART_STATE_KEY = 'hope_store_cart_state';
const CART_SYNC_DEBOUNCE_MS = 250;

type StoredStoreCartState = {
  cart: CartItem[];
  digitalCart: CartItem[];
  expiresAt: string | null;
};

function parseStoredStoreCartState(value: string | null): StoredStoreCartState | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredStoreCartState>;

    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      digitalCart: Array.isArray(parsed.digitalCart) ? parsed.digitalCart : [],
      expiresAt: typeof parsed.expiresAt === 'string' ? parsed.expiresAt : null,
    };
  } catch {
    return null;
  }
}

export default function StorePage() {
  const [searchInput, setSearchInput] = useState('');
  const [trendingTab, setTrendingTab] = useState<'Featured' | 'New arrivals' | 'Best sellers'>('Featured');
  const [selectedBookGenre, setSelectedBookGenre] = useState<'All' | (typeof bookGenres)[number]>('All');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  
  // Selection Modal State
  const [selectedBook, setSelectedBook] = useState<Product | null>(null);
  const [pendingSoftCopyBook, setPendingSoftCopyBook] = useState<Product | null>(null);

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [digitalCart, setDigitalCart] = useState<CartItem[]>([]);
  const [hasLoadedStoredCart, setHasLoadedStoredCart] = useState(false);
  const [cartToken, setCartToken] = useState('');
  const [cartExpiresAt, setCartExpiresAt] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [cartMode, setCartMode] = useState<'hard' | 'soft'>('hard');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [storeToken, setStoreToken] = useState<string | null>(null);
  const [storeUser, setStoreUser] = useState<StoreUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [digitalLibrary, setDigitalLibrary] = useState<DigitalPurchase[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [isDigitalCheckoutSubmitting, setIsDigitalCheckoutSubmitting] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [paymentChargeId, setPaymentChargeId] = useState('');
  const [checkoutBankTransfer, setCheckoutBankTransfer] = useState<BankTransferDetails | null>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>(products);

  const heroBook = storeProducts.find((product) => product.id === 'b2') || storeProducts.find((product) => product.category === 'Books') || storeProducts[0];
  const bookProducts = useMemo(
    () => storeProducts.filter((product) => product.category === 'Books'),
    [storeProducts]
  );
  const bookProductsWithImages = useMemo(
    () => bookProducts.filter((product) => !product.image.includes('placeholder')),
    [bookProducts]
  );
  const visibleBookProducts = useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();

    return bookProducts.filter((product) => {
      const matchesGenre = selectedBookGenre === 'All' || product.genre === selectedBookGenre;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [product.name, product.author, product.genre, product.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      return matchesGenre && matchesSearch;
    });
  }, [bookProducts, searchInput, selectedBookGenre]);
  const visibleBookProductsWithImages = useMemo(
    () => visibleBookProducts.filter((product) => !product.image.includes('placeholder')),
    [visibleBookProducts]
  );

  const classicTrendingProducts = useMemo(() => {
    const active = visibleBookProductsWithImages.length ? visibleBookProductsWithImages : visibleBookProducts;

    if (trendingTab === 'New arrivals') {
      return [...active].slice(-8).reverse();
    }

    if (trendingTab === 'Best sellers') {
      return [...active]
        .sort((a, b) => b.price - a.price)
        .slice(0, 8);
    }

    return active.slice(0, 8);
  }, [trendingTab, visibleBookProducts, visibleBookProductsWithImages]);

  const compactProductGroups = useMemo(() => {
    const findBook = (id: string) => storeProducts.find((product) => product.id === id) || bookProductsWithImages[0] || storeProducts[0];

    return [
      {
        title: 'Night Of Deliverance',
        products: [findBook('b21'), findBook('b57'), findBook('b14')],
      },
      {
        title: 'On sale',
        products: [findBook('b88'), findBook('b87'), findBook('b92')],
        sale: true,
      },
      {
        title: 'Best Seller',
        products: [findBook('b87'), findBook('b64'), findBook('b15')],
        sale: true,
      },
    ];
  }, [bookProductsWithImages, storeProducts]);

  const promoCards = useMemo(() => {
    const findBook = (id: string) => storeProducts.find((product) => product.id === id) || bookProductsWithImages[0] || storeProducts[0];

    return [
      { title: 'Spiritual', subtitle: 'Get 45% Off', product: findBook('b21'), color: 'bg-[#63d5bc]' },
      { title: 'Business', subtitle: 'Get 45% Off', product: findBook('b40'), color: 'bg-[#55ad1d]' },
      { title: 'Audio Book', subtitle: 'Get 50% Off', product: findBook('b88'), color: 'bg-[#6fa4df]' },
    ];
  }, [bookProductsWithImages, storeProducts]);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const selectBookGenre = (genre: 'All' | (typeof bookGenres)[number]) => {
    setSelectedBookGenre(genre);
    setTrendingTab('Featured');
    setIsCategoryMenuOpen(false);
  };

  const swapImage = (fallback: string) => (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.src = fallback;
  };

  const mergeCartItemsWithCatalog = useCallback((items: CartItem[]) => {
    let changed = false;

    const merged = items.map((item) => {
      const product = storeProducts.find((candidate) => candidate.id === item.product.id) || item.product;
      if (product !== item.product) {
        changed = true;
        return { ...item, product };
      }
      return item;
    });

    return changed ? merged : items;
  }, [storeProducts]);

  const mergeCartLists = useCallback((current: CartItem[], incoming: CartItem[]) => {
    const merged = new Map<string, CartItem>();

    for (const item of current) {
      merged.set(item.product.id, item);
    }

    for (const item of incoming) {
      const existing = merged.get(item.product.id);
      if (!existing) {
        merged.set(item.product.id, item);
        continue;
      }

      merged.set(item.product.id, {
        product: item.product,
        quantity: Math.max(existing.quantity, item.quantity),
      });
    }

    return Array.from(merged.values());
  }, []);

  const mapManagedBook = (book: {
    productId?: string;
    id?: string;
    name?: string;
    title?: string;
    hardCopyPrice?: number;
    price?: number;
    softCopyPrice?: number | null;
    category?: string;
    image?: string | null;
    coverImageUrl?: string | null;
    author?: string | null;
    genre?: string | null;
    description?: string | null;
    hardCopyEnabled?: boolean;
    softCopyEnabled?: boolean;
    downloadUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }): Product => ({
    id: String(book.productId || book.id || ''),
    name: String(book.name || book.title || ''),
    price: Number(book.hardCopyPrice ?? book.price ?? 0),
    hardCopyPrice: Number(book.hardCopyPrice ?? book.price ?? 0),
    softCopyPrice: book.softCopyPrice == null ? null : Number(book.softCopyPrice),
    category: 'Books',
    image: String(book.image || book.coverImageUrl || '/store/books/placeholder.jpg'),
    author: book.author || undefined,
    genre: book.genre || undefined,
    description: book.description || undefined,
    hardCopyEnabled: book.hardCopyEnabled !== false,
    softCopyEnabled: book.softCopyEnabled !== false,
    downloadUrl: book.downloadUrl || null,
    sortOrder: Number(book.sortOrder || 0),
    isActive: book.isActive !== false,
  });

  const mapStorePurchase = (purchase: {
    id: string;
    productId: string;
    title: string;
    author?: string | null;
    genre?: string | null;
    imageUrl?: string | null;
    price: number;
    status: DigitalPurchase['status'];
    downloadUrl?: string | null;
    createdAt: string;
  }): DigitalPurchase => ({
    id: purchase.id,
    product: {
      id: purchase.productId,
      name: purchase.title,
      price: purchase.price,
      category: 'Books',
      author: purchase.author || undefined,
      genre: purchase.genre || undefined,
      image: purchase.imageUrl || '/store/books/placeholder.jpg',
    },
    price: purchase.price,
    status: purchase.status,
    downloadUrl: purchase.downloadUrl || null,
    purchasedAt: purchase.createdAt,
  });

  const handleProductClick = (product: Product) => {
    if (product.category === 'Books') {
      setSelectedBook(product);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: Product, options?: { openCart?: boolean }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartMode('hard');
    setCheckoutStep('cart');
    setCheckoutError('');
    if (options?.openCart !== false) {
      setIsCartOpen(true);
    }
    setSelectedBook(null);
  };

  const browseBooksFromCart = () => {
    setIsCartOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById('store-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    let cancelled = false;

    apiFetch('/api/store/books')
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const data = await response.json();
        const managedBooks: Product[] = Array.isArray(data?.books) ? data.books.map(mapManagedBook) : [];
        if (managedBooks.length === 0) return;

        const managedIds = new Set(managedBooks.map((book) => book.id));
        const remainingBuiltIns = products.filter((product) => product.category === 'Books' && !managedIds.has(product.id));
        const nonBooks = products.filter((product) => product.category !== 'Books');
        setStoreProducts([...managedBooks, ...remainingBuiltIns, ...nonBooks]);
      })
      .catch(() => {
        // Keep built-in products if the managed catalog is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addSoftCopyToCart = useCallback((product: Product) => {
    setDigitalCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartMode('soft');
    setCheckoutStep('cart');
    setCheckoutError('');
    setIsCartOpen(true);
    setSelectedBook(null);
    setPendingSoftCopyBook(null);
  }, []);

  const handleSoftCopySelect = (product: Product) => {
    addSoftCopyToCart(product);
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      const response = await apiFetch(authMode === 'signup' ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
        }),
      });

      if (!response.ok) {
        if (authMode === 'signup' && response.status === 409) {
          setAuthMode('signin');
          setAuthError('That email already has an account. Sign in to continue.');
          return;
        }

        setAuthError(authMode === 'signup' ? 'We could not create that account.' : 'Invalid email or password.');
        return;
      }

      const data = await response.json();
      persistStoreSession(data.token, data.user);
      setAuthPassword('');
      setAuthName('');
      setIsAuthOpen(false);

      if (pendingSoftCopyBook) {
        addSoftCopyToCart(pendingSoftCopyBook);
      }
    } catch {
      setAuthError('Unable to connect right now. Please try again.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.product.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const updateDigitalQuantity = (id: string, delta: number) => {
    setDigitalCart((prev) => prev.map((item) => {
      if (item.product.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const completeDigitalCheckout = async () => {
    const checkoutItems = cartMode === 'soft' ? digitalCart : cart;

    if (cartMode === 'soft' && (!storeToken || !storeUser)) {
      setPendingSoftCopyBook(null);
      setAuthMode('signin');
      setIsAuthOpen(true);
      return;
    }

    setCheckoutError('');
    setCheckoutBankTransfer(null);
    setPaymentChargeId('');
    setIsDigitalCheckoutSubmitting(true);

    try {
      const checkoutHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (cartMode === 'soft' && storeToken) {
        checkoutHeaders.Authorization = `Bearer ${storeToken}`;
      }

      const response = await apiFetch('/api/store/purchases', {
        method: 'POST',
        headers: checkoutHeaders,
        body: JSON.stringify({
          paymentMethod,
          phone: checkoutPhone,
          phoneCountry: '+265',
          format: cartMode === 'soft' ? 'soft' : 'hard',
          customerEmail: checkoutEmail,
          cartToken,
          items: checkoutItems.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            price: cartMode === 'soft' ? getSoftCopyPrice(item.product) : item.product.price,
            currency: 'MWK',
          })),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setCheckoutError(data?.error || 'Unable to save this digital order.');
        return;
      }

      const purchases = Array.isArray(data?.purchases) ? data.purchases.map(mapStorePurchase) : [];
      if (cartMode === 'soft') {
        setDigitalLibrary((prev) => [...purchases, ...prev]);
      }
      setPaymentChargeId(String(data?.chargeId || data?.payment?.chargeId || ''));
      setCheckoutBankTransfer(data?.payment?.bankTransfer || null);
      if (data?.payment?.checkoutUrl) {
        window.location.href = data.payment.checkoutUrl;
        return;
      }
      setCheckoutStep('success');
    } catch {
      setCheckoutError('Unable to start the store payment right now.');
    } finally {
      setIsDigitalCheckoutSubmitting(false);
    }
  };

  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const digitalCartTotal = digitalCart.reduce((total, item) => total + (getSoftCopyPrice(item.product) * item.quantity), 0);
  const digitalCartCount = digitalCart.reduce((count, item) => count + item.quantity, 0);
  const activeCart = cartMode === 'soft' ? digitalCart : cart;
  const activeCartTotal = cartMode === 'soft' ? digitalCartTotal : cartTotal;
  const activeCartLabel = cartMode === 'soft' ? 'Soft Copy' : 'Hard Copy';
  const formatMWK = (amount: number) => `MWK ${amount.toLocaleString()}`;
  function getSoftCopyPrice(book: Product) {
    if (typeof book.softCopyPrice === 'number') return book.softCopyPrice;
    return Math.max(1000, Math.round(book.price * 0.7));
  }

  const persistStoreSession = useCallback((token: string, user: StoreUser) => {
    localStorage.setItem(STORE_TOKEN_KEY, token);
    localStorage.setItem(STORE_USER_KEY, JSON.stringify(user));
    setStoreToken(token);
    setStoreUser(user);
  }, []);

  const clearStoreSession = useCallback(() => {
    localStorage.removeItem(STORE_TOKEN_KEY);
    localStorage.removeItem(STORE_USER_KEY);
    setStoreToken(null);
    setStoreUser(null);
    setDigitalLibrary([]);
  }, []);

  const fetchDigitalLibrary = useCallback(async (token: string) => {
    try {
      const response = await apiFetch('/api/store/library', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          clearStoreSession();
        }
        return;
      }

      const data = await response.json();
      const purchases = Array.isArray(data?.purchases) ? data.purchases.map(mapStorePurchase) : [];
      setDigitalLibrary(purchases);
    } catch {
      // Keep the current view if the library request is temporarily unavailable.
    }
  }, [clearStoreSession]);

  useEffect(() => {
    const token = localStorage.getItem(STORE_TOKEN_KEY);
    const storedUser = localStorage.getItem(STORE_USER_KEY);

    if (!token || !storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser);
      setStoreToken(token);
      setStoreUser(parsedUser);
    } catch {
      clearStoreSession();
    }
  }, [clearStoreSession]);

  useEffect(() => {
    if (!storeToken || !storeUser) return;
    fetchDigitalLibrary(storeToken);
  }, [fetchDigitalLibrary, storeToken, storeUser]);

  useEffect(() => {
    setCheckoutEmail(storeUser?.email || '');
  }, [storeUser]);

  useEffect(() => {
    if (!storeToken) return;

    let cancelled = false;
    apiFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${storeToken}` },
    })
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          clearStoreSession();
          return;
        }
        const user = await response.json();
        localStorage.setItem(STORE_USER_KEY, JSON.stringify(user));
        setStoreUser(user);
      })
      .catch(() => {
        // Keep the current browser session if the API is temporarily unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [clearStoreSession, storeToken]);

  useEffect(() => {
    const existingToken = localStorage.getItem(STORE_CART_TOKEN_KEY);
    const nextToken = existingToken || crypto.randomUUID();

    if (!existingToken) {
      localStorage.setItem(STORE_CART_TOKEN_KEY, nextToken);
    }

    setCartToken(nextToken);

    const storedCartState = parseStoredStoreCartState(localStorage.getItem(STORE_CART_STATE_KEY));
    if (storedCartState) {
      setCart(storedCartState.cart);
      setDigitalCart(storedCartState.digitalCart);
      setCartExpiresAt(storedCartState.expiresAt);
    }

    setHasLoadedStoredCart(true);
  }, []);

  useEffect(() => {
    if (!cartToken) return;

    let cancelled = false;

    apiFetch('/api/store/cart', {
      headers: {
        'x-store-cart-token': cartToken,
      },
    })
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as StoreCartPayload;
        if (cancelled) return;
        const serverHard = Array.isArray(data?.hard) ? data.hard : [];
        const serverSoft = Array.isArray(data?.soft) ? data.soft : [];
        setCart((current) => mergeCartLists(current, serverHard));
        setDigitalCart((current) => mergeCartLists(current, serverSoft));
        setCartExpiresAt(data?.expiresAt || null);
      })
      .catch(() => {
        // Keep the current in-memory cart if the server is temporarily unavailable.
      })
      .finally(() => {
        if (!cancelled) {
          setHasLoadedStoredCart(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cartToken, mergeCartLists]);

  useEffect(() => {
    if (!hasLoadedStoredCart || !cartToken) return;

    const timeout = window.setTimeout(() => {
      const hard = mergeCartItemsWithCatalog(cart);
      const soft = mergeCartItemsWithCatalog(digitalCart);

      if (hard.length === 0 && soft.length === 0) {
        apiFetch('/api/store/cart', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-store-cart-token': cartToken,
          },
          body: JSON.stringify({ cartToken }),
        })
          .then(() => {
            if (!cartToken) return;
            setCartExpiresAt(null);
          })
          .catch(() => {
            // Ignore temporary sync failures; the cart will retry on the next change.
          });
        return;
      }

      apiFetch('/api/store/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartToken,
          hard,
          soft,
        }),
      })
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json().catch(() => null)) as StoreCartPayload | null;
          if (data?.expiresAt) {
            setCartExpiresAt(data.expiresAt);
          }
        })
        .catch(() => {
          // Ignore temporary sync failures; the cart will retry on the next change.
        });
    }, CART_SYNC_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [cart, digitalCart, cartToken, hasLoadedStoredCart, mergeCartItemsWithCatalog]);

  useEffect(() => {
    if (!hasLoadedStoredCart) return;

    const hasItems = cart.length > 0 || digitalCart.length > 0;
    if (!hasItems) {
      localStorage.removeItem(STORE_CART_STATE_KEY);
      return;
    }

    localStorage.setItem(
      STORE_CART_STATE_KEY,
      JSON.stringify({
        cart,
        digitalCart,
        expiresAt: cartExpiresAt,
      } satisfies StoredStoreCartState),
    );
  }, [cart, digitalCart, cartExpiresAt, hasLoadedStoredCart]);

  useEffect(() => {
    if (!hasLoadedStoredCart) return;

    setCart((current) => mergeCartItemsWithCatalog(current));
    setDigitalCart((current) => mergeCartItemsWithCatalog(current));
  }, [hasLoadedStoredCart, mergeCartItemsWithCatalog]);

  const getBookOverview = (book: Product) => {
    const genreIntro: Record<string, string> = {
      Spiritual: 'This book is a faith-building resource written to strengthen your walk with God, sharpen your spiritual appetite, and help you live with conviction.',
      Marital: 'This book gives practical biblical wisdom for relationships, marriage, preparation, communication, and building a home that honors God.',
      Youth: 'This book speaks to young people with practical guidance for purpose, discipline, purity, excellence, and making choices that shape a meaningful future.',
      Prayer: 'This book is a prayer resource for believers who want to grow in spiritual discipline, intercession, and confidence before God.',
      Leadership: 'This book equips leaders and servants with biblical principles for responsibility, character, excellence, and effective ministry.',
      Success: 'This book explores biblical wisdom for progress, diligence, impact, and rising into the life God has prepared for you.',
      Men: 'This book offers biblical insight for men who want to grow in responsibility, purpose, discipline, and spiritual strength.',
      Women: 'This book encourages women to walk in wisdom, strength, distinction, and God-given purpose.',
    };

    return [
      genreIntro[book.genre || ''] || 'This book is a practical Christian resource designed to encourage, equip, and strengthen readers in their daily walk with God.',
      `${book.name} brings together biblical teaching and practical instruction so readers can understand the subject clearly and apply it with faith, discipline, and confidence.`,
      'Review the details below, then choose a hard copy for collection or a soft copy for your personal digital library.',
    ];
  };
  const getEstimatedPages = (book: Product) => {
    const numericId = Number(book.id.replace(/\D/g, '')) || book.name.length;
    return 88 + (numericId % 42);
  };

  return (
    <>
      <Navigation />
      
      {/* Book overview modal */}
      <AnimatePresence>
        {selectedBook && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBook(null)}
              className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              className="fixed left-1/2 top-1/2 z-[70] max-h-[92vh] w-[min(1180px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1688b4]">Book Overview</p>
                  <p className="truncate text-sm text-slate-500">Review before adding to cart</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
                  aria-label="Close book overview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-8 p-5 md:p-7 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
                <aside className="space-y-5">
                  <div className="relative mx-auto aspect-[0.72] w-full max-w-[280px] overflow-hidden border border-slate-200 bg-slate-50 shadow-[0_18px_34px_rgba(15,23,42,0.18)]">
                    <Image
                      src={selectedBook.image}
                      alt={selectedBook.name}
                      fill
                      sizes="(min-width: 1024px) 280px, 70vw"
                      className="object-cover"
                      onError={swapImage('/store/items/placeholder.png')}
                    />
                  </div>
                  <div className="mx-auto max-w-[280px] border-t border-slate-200 pt-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Author</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Image
                        src="/store/esau-banda.JPG"
                        alt={selectedBook.author || 'Author'}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                      />
                      <p className="text-sm font-semibold text-slate-950">{selectedBook.author || 'Hope Stores'}</p>
                    </div>
                  </div>
                </aside>

                <section className="min-w-0">
                  <div className="border-b border-slate-200 pb-5">
                    <h2 className="font-serif text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
                      {selectedBook.name}
                    </h2>
                    <p className="mt-3 text-base text-slate-600">
                      by <span className="font-semibold text-[#1688b4]">{selectedBook.author || 'Hope Stores'}</span>
                      <span className="mx-3 text-slate-300">|</span>
                      Format: Hard Copy or Soft Copy
                    </p>
                  </div>

                  <div className="space-y-5 py-6 text-base leading-8 text-slate-900">
                    {getBookOverview(selectedBook).map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-3">
                    <div className="text-center">
                      <BookOpen className="mx-auto h-7 w-7 text-slate-500" />
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Print length</p>
                      <p className="mt-1 text-sm font-semibold text-[#1688b4]">{getEstimatedPages(selectedBook)} pages</p>
                    </div>
                    <div className="text-center">
                      <Building2 className="mx-auto h-7 w-7 text-slate-500" />
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Category</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">{selectedBook.genre || selectedBook.category}</p>
                    </div>
                    <div className="text-center">
                      <CheckCircle2 className="mx-auto h-7 w-7 text-slate-500" />
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Language</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">English</p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-600">
                    Hard copy purchases are paid through bank transfer or mobile money. After payment, send proof of payment to the Hope Stores team and they will organize collection.
                  </p>
                </section>

                <aside className="space-y-5">
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="rounded-md border-2 border-[#1688b4] bg-[#e9f6fb] p-4">
                      <p className="font-bold text-slate-950">Hard Copy</p>
                      <p className="mt-1 text-xl font-bold text-slate-950">{formatMWK(selectedBook.price)}</p>
                      <p className="mt-1 text-sm text-slate-700">Available for collection</p>
                    </div>

                    <div className="mt-5">
                      <p className="text-4xl font-light text-slate-950">
                        <span className="text-base align-top">MWK</span>{' '}
                        {selectedBook.price.toLocaleString()}
                      </p>
                      <button
                        type="button"
                        onClick={() => addToCart(selectedBook)}
                        disabled={selectedBook.hardCopyEnabled === false}
                        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#f59e0b] px-5 py-3 text-base font-semibold text-slate-950 transition hover:bg-[#e58f00] disabled:pointer-events-none disabled:opacity-50"
                      >
                        {selectedBook.hardCopyEnabled === false ? 'Hard copy unavailable' : 'Add hard copy to cart'}
                      </button>
                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        You can review your cart and payment details before confirming your order.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <p className="text-lg font-semibold text-slate-950">Soft Copy</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Sign in or create an account to buy the digital edition. After payment confirmation, it will stay in My Books for reading or download.
                    </p>
                    <p className="mt-4 text-2xl font-light text-slate-950">
                      <span className="text-base align-top">MWK</span>{' '}
                      {getSoftCopyPrice(selectedBook).toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSoftCopySelect(selectedBook)}
                      disabled={selectedBook.softCopyEnabled === false}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-950 transition hover:border-slate-950"
                    >
                      <Download className="h-4 w-4" />
                      {selectedBook.softCopyEnabled === false ? 'Soft copy unavailable' : 'Add soft copy to cart'}
                    </button>
                  </div>
                </aside>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isCartOpen && cartCount + digitalCartCount > 0 && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-8 right-8 z-40 bg-black text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="font-bold">{cartCount + digitalCartCount}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <main className="min-h-screen bg-white text-slate-900">
        <section className="bg-white text-slate-950">
          <div className="bg-slate-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-700">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (storeUser) {
                      setIsLibraryOpen(true);
                      return;
                    }
                    setAuthMode('signin');
                    setIsAuthOpen(true);
                  }}
                  className="inline-flex items-center gap-2 hover:text-slate-950"
                >
                  <User className="h-4 w-4" />
                  {storeUser ? storeUser.name : 'Account'}
                </button>
                <span className="h-4 w-px bg-slate-300" />
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="inline-flex items-center gap-2 hover:text-slate-950"
                >
                  <Library className="h-4 w-4" />
                  My Books ({digitalLibrary.length})
                </button>
                <span className="h-4 w-px bg-slate-300" />
                <span>MWK MK</span>
                <span className="h-4 w-px bg-slate-300" />
                <button type="button" className="hover:text-slate-950">English</button>
                {storeUser && (
                  <>
                    <span className="h-4 w-px bg-slate-300" />
                    <button type="button" onClick={clearStoreSession} className="hover:text-slate-950">
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(320px,1fr)_220px] lg:items-center">
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-white">
                  <Image
                    src="/store/logo.jpeg"
                    alt="Hope Stores logo"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="leading-none">
                  <p className="text-2xl font-black tracking-tight">Hope</p>
                  <p className="-mt-1 text-2xl font-black tracking-tight text-[#d71920]">Stores</p>
                </div>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex w-full items-stretch">
                <label htmlFor="store-search-top" className="sr-only">Search</label>
                <input
                  id="store-search-top"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search"
                  className="min-h-14 flex-1 border-2 border-r-0 border-slate-950 bg-white px-5 text-base text-slate-950 outline-none placeholder:text-slate-500"
                />
                <button type="submit" className="min-h-14 w-16 bg-[#1688b4] text-white hover:bg-[#0f759c]" aria-label="Search products">
                  <Search className="mx-auto h-5 w-5" />
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setCartMode(cartCount > 0 ? 'hard' : 'soft');
                  setIsCartOpen(true);
                }}
                className="inline-flex items-center justify-start gap-3 text-left lg:justify-center"
              >
                <span className="relative inline-flex">
                  <ShoppingCart className="h-7 w-7 text-slate-950" />
                  {cartCount + digitalCartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d71920] px-1 text-[11px] font-bold leading-none text-white">
                      {cartCount + digitalCartCount}
                    </span>
                  )}
                </span>
                <span>
                  <span className="block font-serif text-base">Shopping Cart</span>
                  <span className="block text-xs text-slate-500">{cartCount + digitalCartCount} item{cartCount + digitalCartCount === 1 ? '' : 's'}</span>
                </span>
              </button>
            </div>
          </div>

          <div className="border-y border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryMenuOpen((current) => !current);
                }}
                className="inline-flex min-h-14 items-center gap-4 rounded-md bg-[#1688b4] px-7 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#0f759c]"
                aria-expanded={isCategoryMenuOpen}
                aria-controls="store-category-menu"
              >
                <Menu className="h-6 w-6" />
                All Categories
              </button>
              <AnimatePresence>
                {isCategoryMenuOpen && (
                  <motion.div
                    id="store-category-menu"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg"
                  >
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => selectBookGenre('All')}
                        className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition ${
                          selectedBookGenre === 'All'
                            ? 'border-[#1688b4] bg-[#1688b4] text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-[#1688b4]'
                        }`}
                      >
                        All Books
                      </button>
                      {bookGenres.map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => selectBookGenre(genre)}
                          className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition ${
                            selectedBookGenre === genre
                              ? 'border-[#1688b4] bg-[#1688b4] text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-[#1688b4]'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
                      <span>Pick a genre to filter the book grid.</span>
                      <button
                        type="button"
                        onClick={() => {
                          selectBookGenre('All');
                          setSearchInput('');
                        }}
                        className="font-semibold text-[#1688b4] hover:text-[#0f759c]"
                      >
                        Reset
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#142458] text-white">
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16)_0,transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%,transparent)] [background-size:900px_600px,18px_18px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(37,99,235,0.28),transparent_38%),linear-gradient(90deg,rgba(7,22,71,0.2),rgba(7,22,71,0.7))]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] items-center">
              <div className="relative mx-auto w-[min(76vw,390px)] aspect-[0.72] [perspective:1200px]">
                <div className="absolute -bottom-9 left-8 right-1 h-12 rounded-[50%] bg-black/45 blur-2xl" />
                <div className="relative h-full w-full origin-left [transform:rotateY(-7deg)]">
                  <div className="absolute -right-3 top-4 z-0 h-[calc(100%-32px)] w-4 skew-y-2 bg-gradient-to-r from-[#3b2018] to-[#160d0a] shadow-xl" />
                  <div className="absolute left-0 top-0 z-20 h-full w-[7%] bg-gradient-to-r from-black/35 via-white/14 to-transparent" />
                  <Image
                    src={heroBook.image}
                    alt={heroBook.name}
                    fill
                    priority
                    sizes="(min-width: 1024px) 390px, 76vw"
                    className="z-10 object-cover shadow-[22px_28px_48px_rgba(0,0,0,0.45)]"
                    onError={swapImage('/store/books/placeholder.png')}
                  />
                </div>
              </div>

              <div className="mx-auto max-w-2xl text-center">
                <p className="font-serif text-3xl md:text-4xl text-white">Now Available</p>
                <h1 className="mt-5 font-serif text-5xl md:text-7xl font-semibold leading-tight tracking-wide uppercase">
                  {heroBook.name}
                </h1>
                <p className="mx-auto mt-7 max-w-2xl font-serif text-lg leading-8 text-white">
                  A prophetic resource to strengthen your faith, sharpen your focus, and help you contend for the breakthroughs God has prepared for you.
                </p>
                <div className="mt-10">
                  <Button
                    onClick={() => handleProductClick(heroBook)}
                    className="rounded-md bg-[#1688b4] px-8 py-6 font-serif text-base font-bold uppercase tracking-wide text-white hover:bg-[#0f759c]"
                  >
                    Shop Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="store-products" className="scroll-mt-8 bg-[#fbfbff] py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-serif text-4xl font-semibold text-slate-950 md:text-5xl">Our Books</h2>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['Featured', 'New arrivals', 'Best sellers'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTrendingTab(tab as 'Featured' | 'New arrivals' | 'Best sellers')}
                    className={`min-h-12 rounded-md border px-8 font-serif text-base transition ${trendingTab === tab ? 'border-[#1688b4] bg-[#1688b4] text-white' : 'border-slate-200 bg-white text-slate-950 hover:border-[#1688b4]'}`}
                  >
                    {tab === 'New arrivals' ? 'New Arrivals' : tab === 'Best sellers' ? 'Best Sellers' : tab}
                  </button>
                ))}
              </div>
              <div className="mt-7">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Categories</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBookGenre('All')}
                    className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition ${
                      selectedBookGenre === 'All'
                        ? 'border-[#1688b4] bg-[#1688b4] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#1688b4]'
                    }`}
                  >
                    All Books
                  </button>
                  {bookGenres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedBookGenre(genre)}
                      className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition ${
                        selectedBookGenre === genre
                          ? 'border-[#1688b4] bg-[#1688b4] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-[#1688b4]'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Showing {classicTrendingProducts.length} book{classicTrendingProducts.length === 1 ? '' : 's'}
                  {selectedBookGenre === 'All' ? '' : ` in ${selectedBookGenre}`}
                  {searchInput.trim() ? ` matching "${searchInput.trim()}"` : ''}.
                </p>
              </div>
            </div>

            {classicTrendingProducts.length > 0 ? (
              <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                {classicTrendingProducts.map((product, index) => (
                  <ClassicProductTile
                    key={product.id}
                    product={product}
                    onSelect={() => handleProductClick(product)}
                    formatMWK={formatMWK}
                    showSaleBadge={index === 3 || index === 4 || index === 5}
                    originalPrice={index === 3 || index === 5 ? product.price + 2500 : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
                <p className="font-serif text-2xl text-slate-950">No books match that filter yet.</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Try a different category, or clear the filter to browse the full catalog.
                </p>
                <Button
                  type="button"
                  className="mt-6 rounded-md bg-[#1688b4] px-6 py-5 font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#0f759c]"
                  onClick={() => setSelectedBookGenre('All')}
                >
                  Show All Books
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#fbfbff] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-3">
              {compactProductGroups.map((group) => (
                <CompactProductColumn
                  key={group.title}
                  title={group.title}
                  products={group.products}
                  onSelect={handleProductClick}
                  formatMWK={formatMWK}
                  showOriginalPrice={group.sale}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {promoCards.map((card) => (
                <PromoProductBanner
                  key={card.title}
                  title={card.title}
                  subtitle={card.subtitle}
                  product={card.product}
                  color={card.color}
                  onSelect={() => handleProductClick(card.product)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {isAuthOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAuthOpen(false)} className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }} className="fixed left-1/2 top-1/2 z-[90] w-[min(460px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1688b4]">Hope Stores Account</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">{authMode === 'signin' ? 'Sign in to continue' : 'Create your account'}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Soft copies are saved to your personal My Books library after payment.
                  </p>
                </div>
                <button type="button" onClick={() => setIsAuthOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-950" aria-label="Close account dialog">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(''); }} className={`rounded-md px-3 py-2 text-sm font-semibold ${authMode === 'signin' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>
                  Sign in
                </button>
                <button type="button" onClick={() => { setAuthMode('signup'); setAuthError(''); }} className={`rounded-md px-3 py-2 text-sm font-semibold ${authMode === 'signup' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>
                  Sign up
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label htmlFor="store-auth-name" className="text-sm font-semibold text-slate-700">Full name</label>
                    <input id="store-auth-name" value={authName} onChange={(event) => setAuthName(event.target.value)} required className="mt-2 h-12 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-[#1688b4]" />
                  </div>
                )}
                <div>
                  <label htmlFor="store-auth-email" className="text-sm font-semibold text-slate-700">Email</label>
                  <input id="store-auth-email" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required className="mt-2 h-12 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-[#1688b4]" />
                </div>
                <div>
                  <label htmlFor="store-auth-password" className="text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative mt-2">
                    <input
                      id="store-auth-password"
                      type={showAuthPassword ? 'text' : 'password'}
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      required
                      minLength={6}
                      className="h-12 w-full rounded-md border border-slate-200 px-3 pr-12 outline-none focus:border-[#1688b4]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthPassword((value) => !value)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                      aria-label={showAuthPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAuthPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {authError && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{authError}</p>
                )}
                <Button type="submit" disabled={isAuthSubmitting} className="w-full gap-2 rounded-full bg-[#1688b4] py-6 text-white hover:bg-[#0f759c]">
                  <LogIn className="h-4 w-4" />
                  {isAuthSubmitting ? 'Please wait...' : authMode === 'signin' ? 'Sign in' : 'Create account'}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLibraryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLibraryOpen(false)} className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }} className="fixed left-1/2 top-1/2 z-[90] max-h-[88vh] w-[min(760px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1688b4]">Digital Library</p>
                  <h2 className="text-2xl font-bold text-slate-950">My Books</h2>
                </div>
                <button type="button" onClick={() => setIsLibraryOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-950" aria-label="Close library">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6">
                {!storeUser ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <Library className="mx-auto h-10 w-10 text-slate-300" />
                    <h3 className="mt-4 text-lg font-bold text-slate-950">Sign in to view your books</h3>
                    <p className="mt-2 text-sm text-slate-600">Your digital purchases are tied to your store account.</p>
                    <Button onClick={() => { setIsLibraryOpen(false); setAuthMode('signin'); setIsAuthOpen(true); }} className="mt-5 rounded-full bg-[#1688b4] px-6 text-white hover:bg-[#0f759c]">
                      Sign in
                    </Button>
                  </div>
                ) : digitalLibrary.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                    <h3 className="mt-4 text-lg font-bold text-slate-950">No soft copies yet</h3>
                    <p className="mt-2 text-sm text-slate-600">Books you buy in soft-copy format will appear here.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {digitalLibrary.map((purchase) => (
                      <div key={purchase.id} className="rounded-lg border border-slate-200 p-4">
                        <div className="flex gap-4">
                          <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                            <Image src={purchase.product.image} alt={purchase.product.name} fill sizes="80px" className="object-cover" onError={swapImage('/store/books/placeholder.jpg')} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 font-semibold leading-tight text-slate-950">{purchase.product.name}</h3>
                            <p className="mt-1 text-xs text-slate-500">{formatMWK(purchase.price)} - Soft Copy</p>
                            <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${purchase.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              <ShieldCheck className="h-3 w-3" />
                              {purchase.status === 'available' ? 'Available' : 'Pending payment'}
                            </span>
                          </div>
                        </div>
                        <Button disabled={purchase.status !== 'available'} variant="outline" className="mt-4 w-full gap-2 rounded-full">
                          <Download className="h-4 w-4" />
                          {purchase.status === 'available' ? 'Download book' : 'Awaiting confirmation'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(1060px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-[#f4f4f4] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-black/10 bg-white px-5 py-4 sm:px-7">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#1688b4]">Hope Stores</p>
                  <h2 className="mt-1 text-xl font-black uppercase tracking-[0.18em] text-slate-950">My Bag</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-black/5 hover:text-slate-950" aria-label="Close cart"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[minmax(0,1fr)_340px] md:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4">
                  <div className="bg-white px-5 py-4 shadow-sm sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-950">{activeCartLabel} Cart</p>
                        <p className="mt-1 text-xs text-slate-500">Items are saved in this browser for 30 days.</p>
                      </div>
                      <div className="text-sm font-semibold text-slate-500">
                        {activeCart.length} item{activeCart.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    {(cartCount > 0 || digitalCartCount > 0) && (
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-black/5 p-1">
                        <button
                          type="button"
                          onClick={() => setCartMode('hard')}
                          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${cartMode === 'hard' ? 'bg-white shadow-sm' : 'text-black/60 hover:text-black'}`}
                        >
                          Hard Copy ({cartCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCartMode('soft')}
                          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${cartMode === 'soft' ? 'bg-white shadow-sm' : 'text-black/60 hover:text-black'}`}
                        >
                          Soft Copy ({digitalCartCount})
                        </button>
                      </div>
                    )}
                  </div>

                  {activeCart.length === 0 && (
                    <div className="bg-white p-8 text-center shadow-sm">
                      <ShoppingCart className="mx-auto h-8 w-8 text-black/30" />
                      <p className="mt-3 text-sm font-semibold">No {activeCartLabel.toLowerCase()} books yet.</p>
                      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">
                        Click below to choose a book, then select hard copy or soft copy from the book details.
                      </p>
                      <Button
                        type="button"
                        onClick={browseBooksFromCart}
                        className="mt-5 rounded-none bg-[#1688b4] px-6 py-5 text-sm font-black uppercase tracking-[0.16em] text-white hover:bg-[#0f759c]"
                      >
                        Click to add books
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {activeCart.map((item) => (
                      <div key={item.product.id} className="grid gap-4 bg-white p-4 shadow-sm sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center">
                        <div className="relative mx-auto h-32 w-24 overflow-hidden rounded-md bg-black/5 sm:mx-0 sm:h-28 sm:w-20">
                          <Image src={item.product.image} alt={item.product.name} fill className="object-cover" onError={swapImage('/images/placeholder.png')} />
                        </div>
                        <div className="min-w-0 text-center sm:text-left">
                          <h4 className="text-base font-bold leading-tight text-slate-950">{item.product.name}</h4>
                          <p className="mt-1 text-xs text-black/50">{formatMWK(cartMode === 'soft' ? getSoftCopyPrice(item.product) : item.product.price)} - {activeCartLabel}</p>
                          <div className="mt-3 flex items-center justify-center gap-3 sm:justify-start">
                            <div className="flex items-center border rounded-md">
                              <button onClick={() => cartMode === 'soft' ? updateDigitalQuantity(item.product.id, -1) : updateQuantity(item.product.id, -1)} className="p-1 hover:bg-black/5"><Minus className="w-3 h-3" /></button>
                              <span className="w-8 text-center text-xs">{item.quantity}</span>
                              <button onClick={() => cartMode === 'soft' ? updateDigitalQuantity(item.product.id, 1) : updateQuantity(item.product.id, 1)} className="p-1 hover:bg-black/5"><Plus className="w-3 h-3" /></button>
                            </div>
                            <button onClick={() => cartMode === 'soft' ? updateDigitalQuantity(item.product.id, -item.quantity) : updateQuantity(item.product.id, -item.quantity)} className="text-black/30 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="rounded-md bg-slate-50 px-4 py-3 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">Item total</p>
                          <p className="mt-1 whitespace-nowrap font-bold text-slate-950">{formatMWK((cartMode === 'soft' ? getSoftCopyPrice(item.product) : item.product.price) * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-black uppercase tracking-[0.18em] text-slate-950">Total</h3>
                    <div className="mt-5 space-y-3 border-t border-black/10 pt-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-bold text-slate-700">Sub-total</span>
                        <span className="font-bold text-slate-950">{formatMWK(activeCartTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-bold text-slate-700">Order type</span>
                        <span className="text-right text-slate-600">{activeCartLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-bold text-slate-700">Saved for</span>
                        <span className="text-right text-slate-600">30 days</span>
                      </div>
                    </div>
                    {checkoutStep === 'cart' && activeCart.length > 0 && (
                      <Button className="mt-5 w-full rounded-none bg-[#05944f] py-6 text-sm font-black uppercase tracking-[0.18em] text-white hover:bg-[#047d43]" onClick={() => setCheckoutStep('checkout')}>Checkout</Button>
                    )}
                    {checkoutStep === 'cart' && (
                      <p className="mt-4 text-xs leading-5 text-slate-500">Payment details and confirmation will appear here while your cart stays visible.</p>
                    )}
                  </div>

                  {checkoutStep === 'checkout' && (
                    <div className="space-y-4 bg-white p-5 shadow-sm">
                      <div className="bg-black/5 p-4 rounded-lg">
                        <p className="text-sm text-black/50 mb-1">Total to Pay</p>
                        <p className="text-2xl font-bold">{formatMWK(activeCartTotal)}</p>
                        <p className="mt-1 text-xs text-black/50">{activeCartLabel} order</p>
                      </div>

                      <div className="p-4 border border-black/10 rounded-xl space-y-3">
                        <h3 className="font-bold flex items-center gap-2">
                          <Building2 className="w-4 h-4" /> Bank Account Details
                        </h3>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between gap-4"><span className="text-black/50">Bank:</span> <span className="font-medium">National Bank</span></div>
                          <div className="flex justify-between gap-4"><span className="text-black/50">Account Name:</span> <span className="text-right font-medium">PICC AUDITORIUM</span></div>
                          <div className="flex justify-between gap-4"><span className="text-black/50">Account Number:</span> <span className="font-medium">1008844948</span></div>
                          <div className="flex justify-between gap-4"><span className="text-black/50">Branch:</span> <span className="font-medium">Capital City</span></div>
                        </div>
                        <p className="text-[10px] bg-black text-white p-2 rounded text-center font-bold">
                          IMPORTANT: INCLUDE YOUR NAME IN THE DESCRIPTION
                        </p>
                      </div>

                      {cartMode === 'soft' && (
                        <div className="rounded-xl border border-[#1688b4]/25 bg-[#e9f6fb] p-4 text-sm leading-6 text-slate-800">
                          <p className="font-bold text-slate-950">Digital delivery</p>
                          <p className="mt-1">
                            Your soft copy will appear in My Books after payment confirmation. Keep this account signed in so the book stays tied to your email.
                          </p>
                        </div>
                      )}
                      {checkoutError && (
                        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{checkoutError}</p>
                      )}

                      <div>
                        <label htmlFor="store-checkout-email" className="mb-2 block text-sm font-semibold text-black/70">Receipt email</label>
                        <input
                          id="store-checkout-email"
                          value={checkoutEmail}
                          onChange={(event) => setCheckoutEmail(event.target.value)}
                          type="email"
                          placeholder="you@example.com"
                          className="h-12 w-full rounded-lg border border-black/10 px-3 text-sm outline-none"
                        />
                        <p className="mt-1 text-xs text-black/50">
                          We&apos;ll send your confirmation email with the book list here.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="store-checkout-phone" className="mb-2 block text-sm font-semibold text-black/70">Payment phone number</label>
                        <div className="flex overflow-hidden rounded-lg border border-black/10">
                          <span className="flex items-center border-r border-black/10 bg-black/5 px-3 text-sm font-semibold text-black/60">+265</span>
                          <input
                            id="store-checkout-phone"
                            value={checkoutPhone}
                            onChange={(event) => setCheckoutPhone(event.target.value)}
                            inputMode="tel"
                            placeholder="991234567"
                            className="h-12 min-w-0 flex-1 px-3 text-sm outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-black/40">Select Payment Method</h3>
                        <div className="space-y-2">
                          {['Airtel Money', 'TNM Mpamba', 'Bank Transfer'].map(m => (
                            <label key={m} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === m ? 'border-black bg-black/5' : 'border-black/10'}`}>
                              <input type="radio" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="mr-3" />
                              <span className="text-sm font-medium">{m}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" onClick={() => setCheckoutStep('cart')}>Back</Button>
                        <Button className="flex-1" disabled={!paymentMethod || !checkoutPhone.trim() || !checkoutEmail.trim() || isDigitalCheckoutSubmitting} onClick={completeDigitalCheckout}>
                          {isDigitalCheckoutSubmitting ? 'Processing...' : 'Pay with PayChangu'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {checkoutStep === 'success' && (
                    <div className="flex flex-col bg-white p-5 shadow-sm animate-in fade-in duration-500">
                      <div className="text-center mb-8">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Order Submitted!</h3>
                        <p className="text-sm text-black/60">
                          {cartMode === 'soft'
                            ? 'Please complete your PayChangu payment. Your soft copy will unlock automatically after confirmation.'
                            : 'Please complete your PayChangu payment. We will organize collection after confirmation.'}
                        </p>
                      </div>

                      <div className="bg-black p-6 rounded-2xl text-white space-y-4 mb-8">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-white/40">Payment Reference</p>
                          <p className="break-all font-bold">{paymentChargeId || 'PayChangu request sent'}</p>
                        </div>
                        {checkoutBankTransfer && Object.keys(checkoutBankTransfer).length > 0 && (
                          <div className="grid gap-3 text-sm">
                            {Object.entries(checkoutBankTransfer).map(([key, value]) => (
                              <div key={key} className="flex justify-between gap-4">
                                <span className="text-white/50">{key.replace(/_/g, ' ')}</span>
                                <span className="text-right font-semibold">{String(value ?? '')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <p className="text-sm font-medium text-center px-4">
                          Keep this reference for your records. You may contact the Hope Stores team if you need help with the payment:
                        </p>
                        <Button className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#25D366]/90 border-0 py-6" onClick={() => window.open(`https://wa.me/265888000000?text=Hello, I have made a payment for my Hope Stores ${cartMode === 'soft' ? 'soft copy' : 'hard copy'} order. Name: `, '_blank')}>
                          <MessageCircle className="w-5 h-5" /> Contact Hope Stores
                        </Button>
                        <p className="text-xs text-black/40 text-center">
                          {cartMode === 'soft'
                            ? 'Your book remains pending in My Books until PayChangu confirms payment.'
                            : 'Your order remains pending until PayChangu confirms payment.'}
                        </p>
                        <Button className="w-full" variant="outline" onClick={() => {
                          setIsCartOpen(false);
                          if (cartMode === 'soft') {
                            setDigitalCart([]);
                            setIsLibraryOpen(true);
                          } else {
                            setCart([]);
                          }
                          setCheckoutStep('cart');
                        }}>{cartMode === 'soft' ? 'Open My Books' : 'Back to Hope Stores'}</Button>
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ClassicProductTile({
  product,
  onSelect,
  formatMWK,
  showSaleBadge,
  originalPrice,
}: {
  product: Product;
  onSelect: () => void;
  formatMWK: (a: number) => string;
  showSaleBadge?: boolean;
  originalPrice?: number;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group text-center">
      <div className="relative flex aspect-square items-center justify-center border border-slate-200 bg-white p-7 transition group-hover:border-slate-300 group-hover:shadow-lg">
        <button
          type="button"
          onClick={onSelect}
          className="absolute inset-0 z-10"
          aria-label={`View ${product.name}`}
        />
        {showSaleBadge && (
          <span className="absolute left-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            Sale
          </span>
        )}
        {!imgError ? (
          <Image
            src={product.image}
            alt={product.name}
            width={260}
            height={360}
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 35vw, 70vw"
            className="h-full w-auto object-contain drop-shadow-[0_16px_18px_rgba(15,23,42,0.18)] transition duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center text-slate-300">
            <ImageIcon className="h-12 w-12" />
            <span className="mt-2 text-[10px] font-bold uppercase tracking-widest">Image Coming Soon</span>
          </div>
        )}
        <button
          type="button"
          onClick={onSelect}
          className="absolute bottom-4 right-4 z-20 flex h-12 w-12 translate-y-2 items-center justify-center rounded-md bg-[#1688b4] text-white opacity-0 shadow-lg transition hover:bg-[#0f759c] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          aria-label={`Choose format for ${product.name}`}
        >
          <BookOpen className="h-5 w-5" />
        </button>
      </div>
      <div className="relative mt-5 min-h-[84px] overflow-hidden">
        <div className="absolute inset-x-0 top-0 transition duration-200 group-hover:-translate-y-2 group-hover:opacity-0 group-focus-visible:-translate-y-2 group-focus-visible:opacity-0">
          <button type="button" onClick={onSelect} className="w-full">
            <h3 className="min-h-12 font-serif text-lg leading-6 text-slate-950">{product.name}</h3>
          </button>
          <p className="mt-1 font-serif text-base text-slate-950">
            {originalPrice && <span className="mr-2 text-slate-400 line-through">{formatMWK(originalPrice)}</span>}
            <span>{formatMWK(product.price)}</span>
          </p>
        </div>
        <div className="absolute inset-x-0 top-0 flex min-h-[72px] translate-y-2 items-center justify-center opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#1688b4] px-5 font-serif text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#0f759c]"
          >
            <BookOpen className="h-4 w-4" />
            Choose Format
          </button>
        </div>
      </div>
    </div>
  );
}

function CompactProductColumn({
  title,
  products,
  onSelect,
  formatMWK,
  showOriginalPrice,
}: {
  title: string;
  products: Product[];
  onSelect: (product: Product) => void;
  formatMWK: (a: number) => string;
  showOriginalPrice?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="font-serif text-2xl text-slate-950">{title}</h2>
        <div className="flex gap-2">
          {[ChevronLeft, ChevronRight].map((Icon, index) => (
            <button
              key={index}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded bg-[#1688b4] text-white transition hover:bg-[#0f759c]"
              aria-label={index === 0 ? 'Previous products' : 'Next products'}
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {products.map((product) => (
          <CompactProductItem
            key={product.id}
            product={product}
            onSelect={() => onSelect(product)}
            formatMWK={formatMWK}
            showOriginalPrice={showOriginalPrice}
          />
        ))}
      </div>
    </div>
  );
}

function CompactProductItem({
  product,
  onSelect,
  formatMWK,
  showOriginalPrice,
}: {
  product: Product;
  onSelect: () => void;
  formatMWK: (a: number) => string;
  showOriginalPrice?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const originalPrice = product.price + 2500;

  return (
    <div className="group grid w-full grid-cols-[120px_1fr] items-center gap-3 text-left">
      <div className="relative flex h-32 w-32 items-center justify-center border border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={onSelect}
          className="absolute inset-0 z-10"
          aria-label={`View ${product.name}`}
        />
        {!imgError ? (
          <Image
            src={product.image}
            alt={product.name}
            width={92}
            height={120}
            sizes="120px"
            className="h-full w-auto object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center text-slate-300">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        <button
          type="button"
          onClick={onSelect}
          className="absolute bottom-2 right-2 z-20 flex h-9 w-9 translate-y-2 items-center justify-center rounded-md bg-[#1688b4] text-white opacity-0 shadow-md transition hover:bg-[#0f759c] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          aria-label={`Choose format for ${product.name}`}
        >
          <BookOpen className="h-4 w-4" />
        </button>
      </div>
      <div className="relative min-h-20 min-w-0 overflow-hidden font-serif">
        <div className="absolute inset-x-0 top-1 transition duration-200 group-hover:-translate-y-2 group-hover:opacity-0 group-focus-visible:-translate-y-2 group-focus-visible:opacity-0">
          <button type="button" onClick={onSelect} className="max-w-full">
            <h3 className="truncate text-base text-slate-950">{product.name}</h3>
          </button>
          {showOriginalPrice && <p className="mt-2 text-sm text-slate-400 line-through">{formatMWK(originalPrice)}</p>}
          <p className="mt-1 text-base text-slate-950">{formatMWK(product.price)}</p>
        </div>
        <div className="absolute inset-x-0 top-1 flex min-h-16 translate-y-2 items-center opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1688b4] px-4 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#0f759c]"
          >
            <BookOpen className="h-4 w-4" />
            Choose Format
          </button>
        </div>
      </div>
    </div>
  );
}

function PromoProductBanner({
  title,
  subtitle,
  product,
  color,
  onSelect,
}: {
  title: string;
  subtitle: string;
  product: Product;
  color: string;
  onSelect: () => void;
}) {
  return (
    <div className={`relative min-h-64 overflow-hidden ${color}`}>
      <div className="absolute inset-y-0 left-0 w-[48%]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 200px, 48vw"
          className="object-contain object-center p-5 drop-shadow-[0_18px_16px_rgba(15,23,42,0.28)]"
        />
      </div>
      <div className="relative ml-auto flex min-h-64 w-[58%] flex-col items-end justify-center px-5 py-8 text-right font-serif text-slate-900">
        <h2 className="text-3xl font-bold leading-tight">{title}</h2>
        <p className="mt-3 text-base">{subtitle}</p>
        <Button onClick={onSelect} className="mt-5 rounded bg-[#1688b4] px-7 font-serif text-sm uppercase tracking-wide text-white hover:bg-[#0f759c]">
          Buy Now
        </Button>
      </div>
    </div>
  );
}
