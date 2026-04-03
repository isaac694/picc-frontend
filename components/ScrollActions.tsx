'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

type ScrollActionsProps = {
  showAfter?: number;
};

export default function ScrollActions({ showAfter = 240 }: ScrollActionsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfter);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter]);

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-3">
      <a
        href="#top"
        aria-label="Back to top"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <ArrowUp className="h-5 w-5" />
      </a>
      </div>
      <div className="fixed bottom-6 left-5 z-50 flex flex-col gap-3">
        <a
          href="https://wa.me/265992433333"
          aria-label="Chat on WhatsApp"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-[#1ebe57] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 32 32"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M19.11 17.22c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.16-.43-2.22-1.37-.82-.73-1.37-1.64-1.53-1.91-.16-.27-.02-.42.12-.56.13-.13.27-.34.41-.5.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.02-.34-.02-.52-.02-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.26 0 1.33.98 2.61 1.12 2.79.14.18 1.93 2.95 4.69 4.13.66.28 1.17.45 1.57.58.66.21 1.27.18 1.74.11.53-.08 1.6-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z" />
            <path d="M27.2 4.8A15.48 15.48 0 0 0 16.07 0C7.2 0 0 7.2 0 16.07c0 2.83.74 5.58 2.14 8.01L0 32l8.23-2.09A15.99 15.99 0 0 0 16.07 32C24.94 32 32 24.8 32 15.93c0-4.27-1.66-8.28-4.8-11.13zM16.07 29.2c-2.49 0-4.93-.66-7.05-1.92l-.5-.3-4.87 1.23 1.3-4.74-.33-.5a13.09 13.09 0 0 1-2.06-7c0-7.25 5.89-13.14 13.14-13.14 3.5 0 6.79 1.36 9.27 3.84a13.02 13.02 0 0 1 3.87 9.26c0 7.25-5.92 13.27-13.77 13.27z" />
          </svg>
        </a>
      </div>
    </>
  );
}
