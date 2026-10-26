'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Library, ShoppingCart, User } from 'lucide-react';

const CART_STATE_KEY = 'hope_store_cart_state';

type StoreMobileTab = 'home' | 'books' | 'profile' | 'cart';

type StoreMobileNavProps = {
  cartCount?: number;
  active?: StoreMobileTab;
  onHome?: () => void;
  onBooks?: () => void;
  onProfile?: () => void;
  onCart?: () => void;
};

function readStoredCartCount() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STATE_KEY) || 'null') as {
      cart?: Array<{ quantity?: number }>;
      digitalCart?: Array<{ quantity?: number }>;
    } | null;
    const sum = (items?: Array<{ quantity?: number }>) =>
      Array.isArray(items) ? items.reduce((total, item) => total + (item.quantity || 0), 0) : 0;
    return sum(stored?.cart) + sum(stored?.digitalCart);
  } catch {
    return 0;
  }
}

export default function StoreMobileNav({
  cartCount,
  active,
  onHome,
  onBooks,
  onProfile,
  onCart,
}: StoreMobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [storedCount, setStoredCount] = useState(0);

  useEffect(() => {
    setStoredCount(readStoredCartCount());
  }, [pathname, cartCount]);

  const count = cartCount ?? storedCount;
  const current: StoreMobileTab = active || (pathname.startsWith('/store/library') ? 'books' : 'home');
  const items: Array<{
    id: StoreMobileTab;
    label: string;
    icon: typeof Home;
    href: string;
    action?: () => void;
  }> = [
    { id: 'home', label: 'Home', icon: Home, href: '/store', action: onHome },
    { id: 'books', label: 'My Books', icon: Library, href: '/store/library', action: onBooks },
    { id: 'profile', label: 'Profile', icon: User, href: '/store?panel=account', action: onProfile },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, href: '/store?panel=cart', action: onCart },
  ];

  return (
    <nav
      aria-label="Store"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid h-16 grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = current === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.action) {
                  item.action();
                  return;
                }
                router.push(item.href);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 ${selected ? 'text-[#0f759c]' : 'text-slate-500'}`}
              aria-current={selected ? 'page' : undefined}
            >
              <span className={`relative flex h-8 w-16 items-center justify-center rounded-full ${selected ? 'bg-[#1688b4]/15' : ''}`}>
                <Icon className="h-5 w-5" strokeWidth={selected ? 2.5 : 2} />
                {item.id === 'cart' && count > 0 ? (
                  <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b42318] px-1 text-[10px] font-bold leading-none text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </span>
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
