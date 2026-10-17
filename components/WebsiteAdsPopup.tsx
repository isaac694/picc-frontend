'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import WebsiteAdThumbnail from '@/components/WebsiteAdThumbnail';
import {
  parseWebsiteAds,
  websiteAdLinkUrl,
  websiteAdThumbnailSource,
  type WebsiteAd,
} from '@/lib/website-ads';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function navigateToAdLink(router: ReturnType<typeof useRouter>, href: string) {
  const trimmed = href.trim();
  if (!trimmed) return;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    router.push(trimmed);
    return;
  }

  try {
    const url = new URL(trimmed);
    if (typeof window !== 'undefined' && url.origin === window.location.origin) {
      router.push(`${url.pathname}${url.search}${url.hash}`);
      return;
    }
  } catch {
    // Not an absolute URL — fall through.
  }

  window.location.assign(trimmed);
}

export default function WebsiteAdsPopup() {
  const pathname = usePathname();
  const router = useRouter();
  const [ads, setAds] = useState<WebsiteAd[]>([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [adsReady, setAdsReady] = useState(false);

  const isAdminRoute = (pathname || '').startsWith('/admin');

  const visibleAds = useMemo(() => ads.filter((ad) => ad.isActive), [ads]);

  const safeIndex = Math.min(index, Math.max(visibleAds.length - 1, 0));
  const current = visibleAds[safeIndex];
  const currentLink = current ? websiteAdLinkUrl(current) : '';
  const hasThumbnail = current ? Boolean(websiteAdThumbnailSource(current)) : false;

  const floaterCopy = useMemo(() => {
    if (!current) return { title: '', description: '' };
    const title = current.name?.trim() || 'Announcement';
    const description = current.description?.trim() || '';
    return { title, description };
  }, [current]);

  const goToCurrentAdLink = useCallback(() => {
    if (!currentLink) return;
    setOpen(false);
    navigateToAdLink(router, currentLink);
  }, [currentLink, router]);

  const handlePopupSurfaceClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!currentLink) return;
      if ((event.target as HTMLElement).closest('[data-popup-chrome]')) return;
      goToCurrentAdLink();
    },
    [currentLink, goToCurrentAdLink],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isAdminRoute) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch('/api/website-ads');
        if (cancelled) return;
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (response.ok) {
          setAds(parseWebsiteAds(data));
        }
      } catch {
        // Public popups are optional; ignore fetch errors.
      } finally {
        if (!cancelled) setAdsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdminRoute]);

  useEffect(() => {
    if (visibleAds.length === 0) {
      setOpen(false);
      return;
    }
    if (index >= visibleAds.length) {
      setIndex(0);
    }
  }, [visibleAds.length, index]);

  useEffect(() => {
    if (visibleAds.length <= 1 || open || isAdminRoute) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % visibleAds.length);
    }, 10_000);

    return () => window.clearInterval(timer);
  }, [visibleAds.length, open, isAdminRoute]);

  if (isAdminRoute || !adsReady || !current) return null;

  return (
    <>
      {/* Bottom-left tab — same row as chat FAB (bottom-5), mirrored on the left */}
      <div
        className={cn(
          'pointer-events-none fixed bottom-5 left-5 z-[9995] w-[min(calc(100vw-5.5rem),22rem)] sm:w-[min(calc(100vw-6rem),26rem)] md:w-[min(calc(100vw-8rem),32rem)]',
          'transition-all duration-300 ease-out',
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        )}
        role="complementary"
        aria-label="Website announcements"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group pointer-events-auto relative flex h-9 w-full items-center gap-0 overflow-hidden rounded-md border border-[#1a1a1a]/30 bg-primary pl-0 pr-2 text-left text-primary-foreground shadow-[0_4px_14px_rgba(26,26,26,0.35),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(26,26,26,0.2)] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-10 sm:pr-2.5"
        >
          <span className="flex h-full max-w-[min(52%,14rem)] shrink-0 items-stretch overflow-hidden rounded-l-md rounded-r-full bg-[#d4af37] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(26,26,26,0.15)] sm:max-w-[min(48%,16rem)]">
            <span
              className="flex h-full w-9 shrink-0 items-center justify-center sm:w-10"
              aria-hidden
            >
              <ChevronRight className="h-4 w-4 text-[#1a1a1a] transition group-hover:translate-x-0.5" />
            </span>
            <span className="flex min-w-0 flex-1 items-center truncate px-2.5 pr-3.5 text-xs font-semibold leading-tight text-[#1a1a1a] sm:px-3 sm:pr-4 sm:text-sm">
              {floaterCopy.title}
            </span>
          </span>
          <span className="flex h-full min-w-0 flex-1 items-stretch gap-0">
            {floaterCopy.description ? (
              <span
                className="relative flex min-w-0 flex-1 items-center overflow-hidden pl-2 pr-1 sm:pl-2.5"
                aria-label={floaterCopy.description}
              >
                <span
                  key={current.id}
                  className="website-ad-marquee-track flex w-max whitespace-nowrap text-xs leading-tight text-primary-foreground/90 sm:text-sm"
                >
                  <span className="pr-8">{floaterCopy.description}</span>
                  <span className="pr-8" aria-hidden="true">
                    {floaterCopy.description}
                  </span>
                </span>
              </span>
            ) : (
              <span className="flex min-w-0 flex-1 items-center truncate pl-2 pr-1 text-xs leading-tight text-primary-foreground/75 sm:pl-2.5 sm:text-sm">
                Tap to read more
              </span>
            )}
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            'max-h-[min(92vh,780px)] gap-0 overflow-hidden p-0 shadow-2xl sm:max-w-xl lg:max-w-2xl',
            'border border-border/40 !bg-background/55 backdrop-blur-xl',
            'supports-[backdrop-filter]:!bg-background/45',
          )}
          showCloseButton={false}
        >
          <div
            className={cn(
              'max-h-[min(92vh,780px)] overflow-y-auto',
              currentLink && 'cursor-pointer',
            )}
            {...(currentLink
              ? {
                  onClick: handlePopupSurfaceClick,
                  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    if ((event.target as HTMLElement).closest('[data-popup-chrome]')) return;
                    event.preventDefault();
                    goToCurrentAdLink();
                  },
                  role: 'button' as const,
                  tabIndex: 0,
                  'aria-label': `Open announcement: ${current.name || 'Update'}`,
                }
              : {})}
          >
            <div className="relative border-b border-border/30 bg-transparent">
            <button
              type="button"
              data-popup-chrome
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
              }}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background/50 text-foreground shadow-md backdrop-blur-md transition hover:bg-background/70"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <WebsiteAdThumbnail
              ad={current}
              variant="contain"
              className="w-full !bg-transparent px-3 py-3 sm:px-4 sm:py-4"
              priority
            />
          </div>

            <div className="space-y-3 bg-transparent px-5 py-4 sm:px-6 sm:py-5">
            <DialogHeader className="space-y-1 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Announcement</p>
              <DialogTitle className="text-xl font-semibold leading-tight sm:text-2xl">
                {current.name || 'Update'}
              </DialogTitle>
            </DialogHeader>

            <DialogDescription className="text-left text-sm leading-6 text-foreground/90">
              {current.description || (hasThumbnail ? 'View the full announcement below.' : 'Learn more on our website.')}
            </DialogDescription>

            {visibleAds.length > 1 ? (
              <div
                data-popup-chrome
                className="flex items-center justify-center gap-1 border-t border-border/60 pt-4"
                onClick={(event) => event.stopPropagation()}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="rounded-lg"
                  disabled={safeIndex <= 0}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIndex((prev) => Math.max(0, prev - 1));
                  }}
                  aria-label="Previous announcement"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1 px-1">
                  {visibleAds.map((ad, i) => (
                    <button
                      key={ad.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIndex(i);
                      }}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === safeIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                      )}
                      aria-label={`Show announcement ${i + 1}`}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="rounded-lg"
                  disabled={safeIndex >= visibleAds.length - 1}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIndex((prev) => Math.min(visibleAds.length - 1, prev + 1));
                  }}
                  aria-label="Next announcement"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
