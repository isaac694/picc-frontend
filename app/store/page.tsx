'use client';

import { useState, useMemo, type FormEvent, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, X, CheckCircle2, 
  MessageCircle, ImageIcon, BookOpen, ExternalLink, Building2, Menu,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { products, type Product } from '@/components/data/products';

export default function StorePage() {
  const [searchInput, setSearchInput] = useState('');
  const [trendingTab, setTrendingTab] = useState<'Featured' | 'New arrivals' | 'Best sellers'>('Featured');
  
  // Selection Modal State
  const [selectedBook, setSelectedBook] = useState<Product | null>(null);

  // Cart & Checkout State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState('');

  const heroBook = products.find((product) => product.id === 'b2') || products[0];
  const bookProductsWithImages = useMemo(
    () => products.filter((product) => product.category === 'Books' && !product.image.includes('placeholder')),
    []
  );

  const classicTrendingProducts = useMemo(() => {
    const active = bookProductsWithImages.length ? bookProductsWithImages : products.filter((product) => product.category === 'Books');

    if (trendingTab === 'New arrivals') {
      return [...active].slice(-8).reverse();
    }

    if (trendingTab === 'Best sellers') {
      return [...active]
        .sort((a, b) => b.price - a.price)
        .slice(0, 8);
    }

    return active.slice(0, 8);
  }, [bookProductsWithImages, trendingTab]);

  const compactProductGroups = useMemo(() => {
    const findBook = (id: string) => products.find((product) => product.id === id) || bookProductsWithImages[0] || products[0];

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
  }, [bookProductsWithImages]);

  const promoCards = useMemo(() => {
    const findBook = (id: string) => products.find((product) => product.id === id) || bookProductsWithImages[0] || products[0];

    return [
      { title: 'Spiritual', subtitle: 'Get 45% Off', product: findBook('b21'), color: 'bg-[#63d5bc]' },
      { title: 'Business', subtitle: 'Get 45% Off', product: findBook('b40'), color: 'bg-[#55ad1d]' },
      { title: 'Audio Book', subtitle: 'Get 50% Off', product: findBook('b88'), color: 'bg-[#6fa4df]' },
    ];
  }, [bookProductsWithImages]);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const swapImage = (fallback: string) => (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.src = fallback;
  };

  const handleProductClick = (product: Product) => {
    if (product.category === 'Books') {
      setSelectedBook(product);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
    setSelectedBook(null);
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

  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const formatMWK = (amount: number) => `MWK ${amount.toLocaleString()}`;

  return (
    <>
      <Navigation />
      
      {/* Selection Modal for Books */}
      <AnimatePresence>
        {selectedBook && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBook(null)} className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-[70] rounded-2xl shadow-2xl p-6 overflow-hidden">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-black/5 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-black/20" />
                </div>
                <h3 className="text-xl font-bold">{selectedBook.name}</h3>
                <p className="text-sm text-black/50">Choose how you want to purchase this book</p>
              </div>

              <div className="grid gap-4">
                <button 
                  onClick={() => addToCart(selectedBook)}
                  className="group relative flex items-center gap-4 p-4 border rounded-xl hover:border-black transition-all text-left"
                >
                  <div className="p-3 bg-black text-white rounded-lg group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">Hard Copy</p>
                    <p className="text-xs text-black/50">Pay via Bank/Mobile Money & collect in person.</p>
                  </div>
                </button>

                <a 
                  href="https://www.amazon.com/stores/author/B0198LK6E6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-4 p-4 border rounded-xl hover:border-black transition-all text-left"
                >
                  <div className="p-3 bg-[#FF9900] text-white rounded-lg group-hover:scale-110 transition-transform">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">Soft Copy</p>
                    <p className="text-xs text-black/50">Purchase the digital version on Amazon.</p>
                  </div>
                </a>
              </div>

              <button onClick={() => setSelectedBook(null)} className="mt-6 w-full py-2 text-sm text-black/40 hover:text-black font-medium transition-colors">
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isCartOpen && cartCount > 0 && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-8 right-8 z-40 bg-black text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="font-bold">{cartCount}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <main className="min-h-screen bg-white text-slate-900">
        <section className="bg-white text-slate-950">
          <div className="bg-slate-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-700">
              <p>Support: support@propheticstore.com</p>
              <div className="flex flex-wrap items-center gap-4">
                <button type="button" className="hover:text-slate-950">Account</button>
                <span className="h-4 w-px bg-slate-300" />
                <span>MWK MK</span>
                <span className="h-4 w-px bg-slate-300" />
                <button type="button" className="hover:text-slate-950">English</button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(320px,1fr)_220px] lg:items-center">
              <div className="flex items-center gap-3">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <ShoppingCart className="h-12 w-12 text-slate-950" strokeWidth={1.5} />
                  <span className="absolute bottom-2 right-1 rounded bg-white px-1 text-[10px] font-black text-[#d71920]">S</span>
                </div>
                <div className="leading-none">
                  <p className="text-2xl font-black tracking-tight">Prophetic</p>
                  <p className="-mt-1 text-2xl font-black tracking-tight text-[#d71920]">Store</p>
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
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center justify-start gap-3 text-left lg:justify-center"
              >
                <ShoppingCart className="h-7 w-7 text-slate-950" />
                <span>
                  <span className="block font-serif text-base">Shopping Cart</span>
                  <span className="block text-xs text-slate-500">{cartCount} item{cartCount === 1 ? '' : 's'}</span>
                </span>
              </button>
            </div>
          </div>

          <div className="border-y border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <button
                type="button"
                onClick={() => {
                  setTrendingTab('Featured');
                }}
                className="inline-flex min-h-14 items-center gap-4 rounded-md bg-[#1688b4] px-7 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#0f759c]"
              >
                <Menu className="h-6 w-6" />
                All Categories
              </button>
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

        <section className="bg-[#fbfbff] py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-serif text-4xl font-semibold text-slate-950 md:text-5xl">Trending Products</h2>
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
            </div>

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
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{checkoutStep === 'success' ? 'Payment Details' : checkoutStep === 'checkout' ? 'Order Confirmation' : 'Your Cart'}</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {checkoutStep === 'cart' && (
                  <div className="space-y-6">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex gap-4">
                        <div className="relative w-20 h-20 bg-black/5 rounded-md overflow-hidden">
                           <Image src={item.product.image} alt={item.product.name} fill className="object-cover" onError={swapImage('/images/placeholder.png')} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm leading-tight">{item.product.name}</h4>
                          <p className="text-xs text-black/50 mt-1">{formatMWK(item.product.price)}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border rounded-md">
                              <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-black/5"><Minus className="w-3 h-3" /></button>
                              <span className="w-8 text-center text-xs">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-black/5"><Plus className="w-3 h-3" /></button>
                            </div>
                            <button onClick={() => updateQuantity(item.product.id, -item.quantity)} className="text-black/30 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {checkoutStep === 'checkout' && (
                  <div className="space-y-6">
                    <div className="bg-black/5 p-4 rounded-lg">
                      <p className="text-sm text-black/50 mb-1">Total to Pay</p>
                      <p className="text-2xl font-bold">{formatMWK(cartTotal)}</p>
                    </div>
                    
                    <div className="p-4 border border-black/10 rounded-xl space-y-3">
                      <h3 className="font-bold flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Bank Account Details
                      </h3>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-black/50">Bank:</span> <span className="font-medium">National Bank</span></div>
                        <div className="flex justify-between"><span className="text-black/50">Account Name:</span> <span className="font-medium">PICC AUDITORIUM</span></div>
                        <div className="flex justify-between"><span className="text-black/50">Account Number:</span> <span className="font-medium">1008844948</span></div>
                        <div className="flex justify-between"><span className="text-black/50">Branch:</span> <span className="font-medium">Capital City</span></div>
                      </div>
                      <p className="text-[10px] bg-black text-white p-2 rounded text-center font-bold">
                        IMPORTANT: INCLUDE YOUR NAME IN THE DESCRIPTION
                      </p>
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
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="h-full flex flex-col animate-in fade-in duration-500">
                    <div className="text-center mb-8">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Order Submitted!</h3>
                      <p className="text-sm text-black/60">Please complete your payment to the details below.</p>
                    </div>

                    <div className="bg-black p-6 rounded-2xl text-white space-y-4 mb-8">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-white/40">Account Name</p>
                        <p className="font-bold">PICC AUDITORIUM</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-white/40">Account Number</p>
                          <p className="font-bold">1008844948</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-white/40">Bank / Branch</p>
                          <p className="font-bold">National / Capital City</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-medium text-center px-4">
                        Once paid, send your <span className="font-bold underline">proof of payment</span> and <span className="font-bold underline">full name</span> to our team on WhatsApp:
                      </p>
                      <Button className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#25D366]/90 border-0 py-6" onClick={() => window.open(`https://wa.me/265888000000?text=Hello, I have made a payment for my PICC Store order. Name: `, '_blank')}>
                        <MessageCircle className="w-5 h-5" /> Send Proof on WhatsApp
                      </Button>
                      <p className="text-xs text-black/40 text-center">We will then contact you to organize collection.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50">
                {checkoutStep === 'cart' && cart.length > 0 && (
                  <Button className="w-full py-6 text-lg" onClick={() => setCheckoutStep('checkout')}>Next: Payment Information</Button>
                )}
                {checkoutStep === 'checkout' && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCheckoutStep('cart')}>Back</Button>
                    <Button className="flex-1" disabled={!paymentMethod} onClick={() => setCheckoutStep('success')}>Confirm & View Details</Button>
                  </div>
                )}
                {checkoutStep === 'success' && (
                  <Button className="w-full" variant="outline" onClick={() => { setIsCartOpen(false); setCart([]); setCheckoutStep('cart'); }}>Back to Store</Button>
                )}
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
    <button type="button" onClick={onSelect} className="group text-center">
      <div className="relative flex aspect-square items-center justify-center border border-slate-200 bg-white p-7 transition group-hover:border-slate-300 group-hover:shadow-lg">
        {showSaleBadge && (
          <span className="absolute left-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
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
      </div>
      <h3 className="mt-5 min-h-12 font-serif text-lg leading-6 text-slate-950">{product.name}</h3>
      <p className="mt-1 font-serif text-base text-slate-950">
        {originalPrice && <span className="mr-2 text-slate-400 line-through">{formatMWK(originalPrice)}</span>}
        <span>{formatMWK(product.price)}</span>
      </p>
    </button>
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
    <button type="button" onClick={onSelect} className="grid w-full grid-cols-[120px_1fr] items-center gap-3 text-left">
      <div className="relative flex h-32 w-32 items-center justify-center border border-slate-200 bg-white p-3">
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
      </div>
      <div className="min-w-0 font-serif">
        <h3 className="truncate text-base text-slate-950">{product.name}</h3>
        {showOriginalPrice && <p className="mt-2 text-sm text-slate-400 line-through">{formatMWK(originalPrice)}</p>}
        <p className="mt-1 text-base text-slate-950">{formatMWK(product.price)}</p>
      </div>
    </button>
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
