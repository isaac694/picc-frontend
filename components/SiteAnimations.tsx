'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Elements that fade up into view as visitors scroll. Pages can opt more elements in with
// `data-reveal`, or animate a grid's children one after another with `data-reveal-stagger`.
const REVEAL_SELECTOR = [
  'main section',
  'main [data-reveal]',
  'main [data-reveal-stagger] > *',
  'footer',
].join(',');

export default function SiteAnimations() {
  const pathname = usePathname() || '';

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Elements this run hid and has not revealed yet; cleanup hands them back.
    const pending = new Set<HTMLElement>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('reveal-in');
          pending.delete(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    const prepare = (element: Element) => {
      if (!(element instanceof HTMLElement) || element.dataset.revealReady) return;
      element.dataset.revealReady = '1';
      // Leave anything already on screen alone so the first paint never flickers.
      if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      const parent = element.parentElement;
      if (parent?.hasAttribute('data-reveal-stagger')) {
        const index = Array.prototype.indexOf.call(parent.children, element);
        // Repeat every six so long lists don't make later items wait.
        element.style.setProperty('--reveal-delay', `${(index % 6) * 70}ms`);
      }
      element.classList.add('reveal');
      pending.add(element);
      observer.observe(element);
    };

    const scan = () => document.querySelectorAll(REVEAL_SELECTOR).forEach(prepare);
    scan();

    // Sections that render after data loads get the same treatment.
    let frame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
      // Without this, elements that outlive the effect (the footer across page changes, or
      // everything under React's double-run in development) would stay hidden for good.
      for (const element of pending) {
        element.classList.remove('reveal');
        delete element.dataset.revealReady;
      }
      pending.clear();
    };
  }, [pathname]);

  return null;
}
