'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Minus, Trash2, X, CheckCircle2, Download, Printer, Mail, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MOCK DATA ---
const categories = ['All', 'Books', 'Stickers', 'Calendars', 'PICC branded items', 'Bible dividers', 'Notebooks'];
const bookAuthors = ['Pastor Esau Banda', 'Pastor Mrs Loyce Banda'];
const bookGenres = ['Spiritual', 'Marital', 'Youth', 'Men', 'Women', 'Prayer'];

type Product = {
  id: string;
  name: string;
  price: number; // Stored in MWK (Malawi Kwacha)
  category: string;
  image: string;
  author?: string;
  genre?: string;
};

// Sample products based on your requirements
const products: Product[] = [
  { id: 'b1', name: 'The Power of Prevailing Prayer', price: 15000, category: 'Books', author: 'Pastor Esau Banda', genre: 'Prayer', image: '/hero/hero-1.jpg' },
  { id: 'b2', name: 'Wisdom for Marriage', price: 12000, category: 'Books', author: 'Pastor Mrs Loyce Banda', genre: 'Marital', image: '/hero/hero-2.jpg' },
  { id: 'b3', name: 'Youth Arise', price: 10000, category: 'Books', author: 'Pastor Esau Banda', genre: 'Youth', image: '/hero/hero-3.jpg' },
  { id: 'p1', name: '2026 Theme Sticker', price: 2000, category: 'PICC branded items', image: '/hero/hero-4.jpg' },
  { id: 'p2', name: '2026 Theme Insurance Disk', price: 3000, category: 'PICC branded items', image: '/hero/hero-5.jpg' },
  { id: 'p3', name: '2026 Wall Calendar', price: 5000, category: 'PICC branded items', image: '/hero/hero-6.jpg' },
  { id: 'p4', name: 'Premium PICC Pen', price: 1500, category: 'PICC branded items', image: '/hero/hero-7-mov.jpg' },
  { id: 'n1', name: 'Sermon Notes Journal', price: 6000, category: 'Notebooks', image: '/hero/hero-8-woh.jpg' },
  { id: 'd1', name: 'Leather Bible Divider', price: 4000, category: 'Bible dividers', image: '/hero/hero-9-ww.jpg' },
];

export default function StorePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeAuthor, setActiveAuthor] = useState('All');
  const [activeGenre, setActiveGenre] = useState('All');
  
  // Cart State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (activeCategory !== 'All' && product.category !== activeCategory) return false;
      if (activeCategory === 'Books') {
        if (activeAuthor !== 'All' && product.author !== activeAuthor) return false;
        if (activeGenre !== 'All' && product.genre !== activeGenre) return false;
      }
      return true;
    });
  }, [activeCategory, activeAuthor, activeGenre]);

  // Cart Functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.product.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Helper to format currency
  const formatMWK = (amount: number) => `MWK ${amount.toLocaleString()}`;

  return (
    <>
      <Navigation />
      
      {/* Floating Cart Button (Visible when cart is closed and has items) */}
      <AnimatePresence>
        {!isCartOpen && cartCount > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-8 right-8 z-40 bg-black text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="font-bold">{cartCount}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <main className="min-h-screen bg-white text-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-36 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/hero/hero-store.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mt-20">
              <div className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4 flex items-center gap-3">
                <a href="/" className="hover:text-white transition-colors">Home</a>
                <span className="text-white/50">/</span>
                <span className="text-white">Store</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold mb-4">PICC Resource Store</h1>
              <p className="text-lg text-white/80 max-w-xl">
                Equip yourself with materials designed to help you grow spiritually and proudly represent our ministry.
              </p>
            </div>
          </div>
        </section>

        {/* Store Layout */}
        <section className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
              <div>
                <h3 className="font-semibold text-lg mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setActiveCategory(category);
                        setActiveAuthor('All');
                        setActiveGenre('All');
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === category ? 'bg-black text-white' : 'hover:bg-black/5 text-black/70'}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Book Filters */}
              {activeCategory === 'Books' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-4 border-t border-black/10">
                  <div>
                    <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-black/50">Filter by Author</h3>
                    <select 
                      className="w-full p-2 border border-black/20 rounded-md text-sm bg-white"
                      value={activeAuthor}
                      onChange={(e) => setActiveAuthor(e.target.value)}
                    >
                      <option value="All">All Authors</option>
                      {bookAuthors.map(author => <option key={author} value={author}>{author}</option>)}
                    </select>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-black/50">Filter by Genre</h3>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setActiveGenre('All')}
                        className={`px-3 py-1 text-xs rounded-full border ${activeGenre === 'All' ? 'bg-black text-white border-black' : 'border-black/20 text-black/70 hover:bg-black/5'}`}
                      >
                        All
                      </button>
                      {bookGenres.map(genre => (
                        <button
                          key={genre}
                          onClick={() => setActiveGenre(genre)}
                          className={`px-3 py-1 text-xs rounded-full border ${activeGenre === genre ? 'bg-black text-white border-black' : 'border-black/20 text-black/70 hover:bg-black/5'}`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">{activeCategory === 'All' ? 'All Items' : activeCategory}</h2>
                <p className="text-sm text-black/50">{filteredProducts.length} results</p>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-black/20 rounded-xl">
                  <p className="text-black/50">No products found for these filters.</p>
                  <Button variant="link" onClick={() => setActiveCategory('All')} className="mt-2 text-black">Clear Filters</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="group overflow-hidden border-black/10 bg-white flex flex-col">
                      <div className="relative h-64 bg-black/5 overflow-hidden">
                        <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <p className="text-xs text-black/50 font-medium uppercase tracking-wider mb-1">{product.category}</p>
                        <h3 className="font-semibold text-lg leading-tight mb-2">{product.name}</h3>
                        {product.author && <p className="text-sm text-black/60 mb-4">{product.author}</p>}
                        
                        <div className="mt-auto pt-4 flex items-center justify-between">
                          <span className="font-bold">{formatMWK(product.price)}</span>
                          <Button size="sm" onClick={() => addToCart(product)} className="rounded-full px-4">
                            Add
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Slide-out Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            
            {/* Sidebar */}
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-black/10 flex items-center justify-between bg-white">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {checkoutStep === 'success' ? 'Order Complete' : checkoutStep === 'checkout' ? 'Checkout' : 'Your Cart'}
                </h2>
                <button onClick={() => { setIsCartOpen(false); if(checkoutStep==='success') setCheckoutStep('cart'); }} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 && checkoutStep !== 'success' ? (
                  <div className="h-full flex flex-col items-center justify-center text-black/40 gap-4">
                    <ShoppingCart className="w-16 h-16 opacity-20" />
                    <p>Your cart is empty.</p>
                    <Button variant="outline" onClick={() => setIsCartOpen(false)}>Continue Shopping</Button>
                  </div>
                ) : checkoutStep === 'cart' ? (
                  /* --- STEP 1: CART VIEW --- */
                  <div className="space-y-6">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex gap-4">
                        <div className="relative w-20 h-20 bg-black/5 rounded-md overflow-hidden flex-shrink-0">
                          <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm leading-tight">{item.product.name}</h4>
                          <p className="text-xs text-black/50 mt-1">{formatMWK(item.product.price)}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border border-black/20 rounded-md">
                              <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1.5 hover:bg-black/5"><Minus className="w-3 h-3" /></button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1.5 hover:bg-black/5"><Plus className="w-3 h-3" /></button>
                            </div>
                            <button onClick={() => updateQuantity(item.product.id, -item.quantity)} className="text-black/40 hover:text-red-500 transition-colors p-2">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : checkoutStep === 'checkout' ? (
                  /* --- STEP 2: CHECKOUT / PAYMENT --- */
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-black/5 p-4 rounded-lg mb-6">
                      <p className="text-sm font-medium mb-1">Total to Pay</p>
                      <p className="text-2xl font-bold">{formatMWK(cartTotal)}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Select Payment Method</h3>
                      <div className="space-y-3">
                        {['Airtel Money', 'TNM Mpamba', 'Visa', 'Cash (Visit Church in person)'].map(method => (
                          <label key={method} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === method ? 'border-black bg-black/5' : 'border-black/10 hover:border-black/30'}`}>
                            <input 
                              type="radio" 
                              name="payment" 
                              value={method} 
                              checked={paymentMethod === method}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="mr-3"
                            />
                            <span className="font-medium">{method}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 text-blue-900 p-4 rounded-lg text-sm border border-blue-100">
                      <strong>Important Note:</strong> After confirming your order, you must provide proof of payment. A receipt will be issued to your preferred method upon verification.
                    </div>
                  </div>
                ) : (
                  /* --- STEP 3: SUCCESS / RECEIPT --- */
                  <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
                    <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                    <h3 className="text-2xl font-bold mb-2">Order Submitted!</h3>
                    <p className="text-black/60 mb-8 max-w-[280px]">
                      Your order for {formatMWK(cartTotal)} via {paymentMethod} has been recorded. 
                      Please submit your proof of payment.
                    </p>
                    
                    <div className="w-full space-y-4">
                      <p className="font-semibold text-sm text-left">Get your preliminary receipt:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="flex gap-2 w-full"><Download className="w-4 h-4" /> Download</Button>
                        <Button variant="outline" className="flex gap-2 w-full"><Printer className="w-4 h-4" /> Print</Button>
                        <Button variant="outline" className="flex gap-2 w-full bg-[#25D366] text-white hover:bg-[#25D366]/90 border-0"><MessageCircle className="w-4 h-4" /> WhatsApp</Button>
                        <Button variant="outline" className="flex gap-2 w-full"><Mail className="w-4 h-4" /> Email</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Footer Actions */}
              {cart.length > 0 && checkoutStep !== 'success' && (
                <div className="p-6 border-t border-black/10 bg-gray-50">
                  {checkoutStep === 'cart' ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-black/60">Subtotal</span>
                        <span className="text-xl font-bold">{formatMWK(cartTotal)}</span>
                      </div>
                      <Button className="w-full text-lg py-6 rounded-xl" onClick={() => setCheckoutStep('checkout')}>
                        Proceed to Checkout
                      </Button>
                    </>
                  ) : (
                    <div className="flex gap-3">
                      <Button variant="outline" className="w-1/3" onClick={() => setCheckoutStep('cart')}>Back</Button>
                      <Button 
                        className="w-2/3" 
                        disabled={!paymentMethod}
                        onClick={() => {
                          setCheckoutStep('success');
                          // In a real app, you would clear the cart here or after closing
                          // setCart([]); 
                        }}
                      >
                        Confirm Order
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {checkoutStep === 'success' && (
                <div className="p-6 border-t border-black/10 bg-gray-50">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setIsCartOpen(false);
                      setCart([]);
                      setCheckoutStep('cart');
                      setPaymentMethod('');
                    }}
                  >
                    Done
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}