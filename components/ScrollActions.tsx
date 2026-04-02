'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';

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
    <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-3">
      <a
        href="#top"
        aria-label="Back to top"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <ArrowUp className="h-5 w-5" />
      </a>
      <a
        href="https://wa.me/265992433333"
        aria-label="Chat on WhatsApp"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-[#1ebe57] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
      >
        <MessageCircle className="h-5 w-5" />
      </a>
    </div>
  );
}
