'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export default function WebsiteAdsPopup() {
  const pathname = usePathname();
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

  if (isAdminRoute || !adsReady || !current) return null;

  return (
    <>
      {/* Bottom-left tab — same row as chat FAB (bottom-5), mirrored on the left */}
      <div
        className={cn(
          'pointer-events-none fixed bottom-5 left-5 z-[9995] max-w-[min(calc(100vw-6rem),15.5rem)]',
          'transition-all duration-300 ease-out',
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        )}
        role="complementary"
        aria-label="Website announcements"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group pointer-events-auto relative flex w-full items-stretch gap-0 overflow-hidden rounded-lg border border-primary/30 bg-primary py-2 pl-0 pr-2.5 text-left text-primary-foreground shadow-lg outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:pr-3"
        >
          <span
            className="flex w-7 shrink-0 items-center justify-center bg-primary-foreground/10 sm:w-8"
            aria-hidden
          >
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
          <span className="min-w-0 flex-1 border-l border-primary-foreground/15 py-0.5 pl-2">
            <span className="block truncate text-[11px] font-semibold leading-tight sm:text-xs">
              {floaterCopy.title}
            </span>
            {floaterCopy.description ? (
              <span className="mt-1 block line-clamp-3 text-[10px] leading-snug text-primary-foreground/85 sm:line-clamp-2 sm:text-[11px]">
                {floaterCopy.description}
              </span>
            ) : (
              <span className="mt-0.5 block text-[10px] text-primary-foreground/70 sm:text-[11px]">
                Tap to read more
              </span>
            )}
          </span>
          <span className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-primary-foreground/40" />
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
          <div className="max-h-[min(92vh,780px)] overflow-y-auto">
            <div className="relative border-b border-border/30 bg-transparent">
            <button
              type="button"
              onClick={() => setOpen(false)}
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

            {currentLink ? (
              <Button asChild className="h-10 w-full rounded-lg text-sm shadow-md">
                <Link href={currentLink} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
                  View details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : null}

            {visibleAds.length > 1 ? (
              <div className="flex items-center justify-center gap-1 border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="rounded-lg"
                  disabled={safeIndex <= 0}
                  onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
                  aria-label="Previous announcement"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1 px-1">
                  {visibleAds.map((ad, i) => (
                    <button
                      key={ad.id}
                      type="button"
                      onClick={() => setIndex(i)}
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
                  onClick={() => setIndex((prev) => Math.min(visibleAds.length - 1, prev + 1))}
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
