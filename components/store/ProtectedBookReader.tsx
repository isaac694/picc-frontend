'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Maximize, Minimize, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

type ProtectedBookReaderProps = {
  purchaseId: string;
  title: string;
  token: string;
  coverUrl?: string | null;
};

type FlipbookProps = Omit<ProtectedBookReaderProps, 'coverUrl'> & {
  onClose: () => void;
};

type Flip = { dir: 'next' | 'prev'; target: number };
type SpreadPages = [number | null, number | null];

const RENDER_WIDTH = 1400;
const FLIP_MS = 700;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;

// Two-page spreads keep the cover alone on the right, like a printed book.
function spreadOf(page: number, double: boolean) {
  return double ? Math.floor(page / 2) : page - 1;
}

function firstPageOf(spread: number, double: boolean) {
  return double ? Math.max(1, spread * 2) : spread + 1;
}

function lastSpreadOf(pageCount: number, double: boolean) {
  return double ? Math.floor(pageCount / 2) : pageCount - 1;
}

function spreadPages(spread: number, double: boolean, pageCount: number): SpreadPages {
  if (spread < 0 || spread > lastSpreadOf(pageCount, double)) return [null, null];
  if (!double) return [spread + 1, null];
  const left = spread === 0 ? null : spread * 2;
  const right = spread * 2 + 1 <= pageCount ? spread * 2 + 1 : null;
  return [left, right];
}

function PageFace({
  page,
  src,
  side,
  blank = false,
  style,
}: {
  page: number | null;
  src?: string;
  side: 'left' | 'right' | 'single';
  blank?: boolean;
  style?: CSSProperties;
}) {
  if (page === null && !blank) return null;
  const shade =
    side === 'left'
      ? 'linear-gradient(to left, rgba(0,0,0,0.22), rgba(0,0,0,0) 9%)'
      : side === 'right'
        ? 'linear-gradient(to right, rgba(0,0,0,0.22), rgba(0,0,0,0) 9%)'
        : 'none';

  return (
    <div className="absolute top-0 overflow-hidden bg-white" style={style}>
      {page !== null && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Page ${page}`} draggable={false} className="pointer-events-none h-full w-full select-none object-fill" />
      ) : page !== null ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: shade }} />
    </div>
  );
}

function FlipbookLightbox({ purchaseId, title, token, onClose }: FlipbookProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const requestedRef = useRef(new Set<number>());
  const pageUrlsRef = useRef<string[]>([]);
  const touchStartRef = useRef<number | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [ratio, setRatio] = useState(0.707);
  const [images, setImages] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(1);
  const [flip, setFlip] = useState<Flip | null>(null);
  const [zoom, setZoom] = useState(1);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shielded, setShielded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const double = stage.width >= 768;

  useEffect(() => {
    const blockMenu = (event: Event) => event.preventDefault();
    const hide = () => setShielded(true);
    const show = () => setShielded(document.visibilityState === 'hidden');
    const syncFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.addEventListener('contextmenu', blockMenu);
    document.addEventListener('visibilitychange', show);
    document.addEventListener('fullscreenchange', syncFullscreen);
    window.addEventListener('blur', hide);
    window.addEventListener('focus', show);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('contextmenu', blockMenu);
      document.removeEventListener('visibilitychange', show);
      document.removeEventListener('fullscreenchange', syncFullscreen);
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', show);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setStage({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const requested = requestedRef.current;
    const pageUrls = pageUrlsRef.current;

    const openBook = async () => {
      const response = await fetch(`/api/store/book-file?purchaseId=${encodeURIComponent(purchaseId)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'This book could not be opened.');
      }
      const data = new Uint8Array(await response.arrayBuffer());
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const pdf = await pdfjs.getDocument({ data }).promise;
      if (cancelled) {
        void pdf.loadingTask.destroy();
        return;
      }
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      pdfRef.current = pdf;
      setRatio(viewport.width / viewport.height);
      setPageCount(pdf.numPages);
    };

    openBook()
      .catch((openError: unknown) => {
        if (!cancelled) setError(openError instanceof Error ? openError.message : 'This book could not be opened.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      pageUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
      requested.clear();
      void pdfRef.current?.loadingTask.destroy();
      pdfRef.current = null;
    };
  }, [purchaseId, token]);

  const renderPage = useCallback(async (pageNumber: number) => {
    const pdf = pdfRef.current;
    if (!pdf || pageNumber < 1 || pageNumber > pdf.numPages || requestedRef.current.has(pageNumber)) return;
    requestedRef.current.add(pageNumber);
    try {
      const page = await pdf.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: RENDER_WIDTH / base.width });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob || pdfRef.current !== pdf) return;
      const url = URL.createObjectURL(blob);
      pageUrlsRef.current.push(url);
      setImages((previous) => ({ ...previous, [pageNumber]: url }));
    } catch {
      requestedRef.current.delete(pageNumber);
    }
  }, []);

  // Render the visible spread first, then a couple of spreads around it.
  useEffect(() => {
    if (!pageCount) return;
    const spread = spreadOf(current, double);
    [spread, spread + 1, spread - 1, spread + 2].forEach((item) => {
      spreadPages(item, double, pageCount).forEach((page) => {
        if (page) void renderPage(page);
      });
    });
  }, [current, double, pageCount, renderPage]);

  const spread = spreadOf(current, double);
  const lastSpread = pageCount ? lastSpreadOf(pageCount, double) : 0;

  const go = useCallback(
    (dir: Flip['dir']) => {
      if (flip || !pageCount) return;
      const target = dir === 'next' ? spread + 1 : spread - 1;
      if (target < 0 || target > lastSpread) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setCurrent(firstPageOf(target, double));
        return;
      }
      setFlip({ dir, target });
    },
    [double, flip, lastSpread, pageCount, spread],
  );

  const finishFlip = () => {
    if (!flip) return;
    setCurrent(firstPageOf(flip.target, double));
    setFlip(null);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void rootRef.current?.requestFullscreen().catch(() => undefined);
    }
  };

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const command = event.ctrlKey || event.metaKey;
      if (key === 'printscreen' || (command && ['s', 'p', 'u', 'c'].includes(key))) {
        event.preventDefault();
        setShielded(true);
        window.setTimeout(() => setShielded(false), 1500);
        return;
      }
      if (key === 'escape') onClose();
      if (key === 'arrowright' || key === 'pagedown') go('next');
      if (key === 'arrowleft' || key === 'pageup') go('prev');
    };
    document.addEventListener('keydown', handleKeys);
    return () => document.removeEventListener('keydown', handleKeys);
  }, [go, onClose]);

  const handleBookClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    go(event.clientX - rect.left > rect.width / 2 ? 'next' : 'prev');
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const end = event.changedTouches[0]?.clientX;
    if (start === null || end === undefined || zoom > 1) return;
    if (Math.abs(end - start) > 50) go(end < start ? 'next' : 'prev');
  };

  const horizontalPad = double ? 72 : 12;
  const availableWidth = Math.max(0, stage.width - horizontalPad * 2);
  const availableHeight = Math.max(0, stage.height - 32);
  const baseHeight = Math.min(availableHeight, availableWidth / (double ? 2 : 1) / ratio);
  const pageHeight = baseHeight * zoom;
  const pageWidth = pageHeight * ratio;

  const [currentLeft, currentRight] = spreadPages(spread, double, pageCount);
  const [targetLeft, targetRight] = flip ? spreadPages(flip.target, double, pageCount) : [null, null];
  const shownSpread = flip ? flip.target : spread;
  const [shownLeft, shownRight] = spreadPages(shownSpread, double, pageCount);

  // Centre the book on the cover (or a lone back page) the way a closed book would sit.
  let offset = 0;
  if (double && shownLeft === null) offset = -pageWidth / 2;
  if (double && shownRight === null && shownLeft !== null) offset = pageWidth / 2;

  let staticPages: SpreadPages;
  if (!flip) staticPages = [currentLeft, currentRight];
  else if (!double) staticPages = [flip.dir === 'next' ? targetLeft : currentLeft, null];
  else if (flip.dir === 'next') staticPages = [currentLeft, targetRight];
  else staticPages = [targetLeft, currentRight];

  const visiblePages = [currentLeft, currentRight].filter((page): page is number => page !== null);
  const pageLabel = pageCount ? `${visiblePages.join('–')} / ${pageCount}` : '';

  const pageBox = (left: number): CSSProperties => ({ left, width: pageWidth, height: pageHeight });

  let leaf = null;
  if (flip) {
    const singleLeaf = !double;
    const front = singleLeaf ? (flip.dir === 'next' ? currentLeft : targetLeft) : flip.dir === 'next' ? currentRight : currentLeft;
    const back = singleLeaf ? null : flip.dir === 'next' ? targetLeft : targetRight;
    const animation = singleLeaf ? (flip.dir === 'next' ? 'flipbook-forward' : 'flipbook-return') : flip.dir === 'next' ? 'flipbook-forward' : 'flipbook-backward';
    const left = !double || flip.dir === 'next' ? (double ? pageWidth : 0) : 0;
    const origin = !double || flip.dir === 'next' ? 'left center' : 'right center';
    const faceStyle: CSSProperties = { inset: 0, width: '100%', height: '100%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };

    leaf = (
      <div
        key={`${flip.dir}-${flip.target}`}
        className="absolute top-0"
        style={{
          left,
          width: pageWidth,
          height: pageHeight,
          transformOrigin: origin,
          transformStyle: 'preserve-3d',
          animation: `${animation} ${FLIP_MS}ms cubic-bezier(0.45, 0.05, 0.35, 1) forwards`,
          zIndex: 10,
        }}
        onAnimationEnd={finishFlip}
      >
        <PageFace page={front} src={front ? images[front] : undefined} side={double ? (flip.dir === 'next' ? 'right' : 'left') : 'single'} blank style={faceStyle} />
        <PageFace
          page={back}
          src={back ? images[back] : undefined}
          side={double ? (flip.dir === 'next' ? 'left' : 'right') : 'single'}
          blank
          style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
        />
      </div>
    );
  }

  const controlButton = 'inline-flex h-9 w-9 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30';

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} reader`}
      className="protected-book fixed inset-0 z-[100] flex select-none flex-col bg-[radial-gradient(circle_at_center,#3b4252_0%,#161a22_75%)] text-white"
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <p className="truncate text-sm font-semibold text-white/85">{title}</p>
        <button type="button" onClick={onClose} className={controlButton} aria-label="Close reader">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={stageRef}
        className={`relative flex min-h-0 flex-1 ${zoom > 1 ? 'overflow-auto' : 'overflow-hidden'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="m-auto flex items-center gap-3 text-sm text-white/70">
            <Loader2 className="h-5 w-5 animate-spin" />
            Opening book...
          </div>
        ) : error ? (
          <p className="m-auto max-w-md rounded-md border border-red-300/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">{error}</p>
        ) : pageWidth > 0 ? (
          <div className="m-auto p-4">
            <div
              className="relative cursor-pointer"
              style={{
                width: pageWidth * (double ? 2 : 1),
                height: pageHeight,
                perspective: '2600px',
                transform: `translateX(${offset}px)`,
                transition: `transform ${FLIP_MS}ms ease`,
                filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))',
              }}
              onClick={handleBookClick}
            >
              <PageFace page={staticPages[0]} src={staticPages[0] ? images[staticPages[0]] : undefined} side={double ? 'left' : 'single'} style={pageBox(0)} />
              {double ? (
                <PageFace page={staticPages[1]} src={staticPages[1] ? images[staticPages[1]] : undefined} side="right" style={pageBox(pageWidth)} />
              ) : null}
              {leaf}
            </div>
          </div>
        ) : null}

        {!loading && !error && double ? (
          <>
            <button
              type="button"
              onClick={() => go('prev')}
              disabled={spread <= 0}
              className="absolute left-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition hover:bg-black/50 disabled:opacity-0"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button
              type="button"
              onClick={() => go('next')}
              disabled={spread >= lastSpread}
              className="absolute right-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition hover:bg-black/50 disabled:opacity-0"
              aria-label="Next page"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-1 border-t border-white/10 bg-black/30 px-3 py-2">
        <button type="button" onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - 0.25))} disabled={zoom <= MIN_ZOOM} className={controlButton} aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + 0.25))} disabled={zoom >= MAX_ZOOM} className={controlButton} aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </button>
        <span className="mx-2 h-5 w-px bg-white/15" />
        <button type="button" onClick={() => go('prev')} disabled={!pageCount || spread <= 0} className={controlButton} aria-label="Previous page">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-20 text-center text-xs font-semibold tabular-nums text-white/80">{pageLabel}</span>
        <button type="button" onClick={() => go('next')} disabled={!pageCount || spread >= lastSpread} className={controlButton} aria-label="Next page">
          <ChevronRight className="h-5 w-5" />
        </button>
        <span className="mx-2 h-5 w-px bg-white/15" />
        <button type="button" onClick={toggleFullscreen} className={controlButton} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>

      {shielded ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950 text-sm text-white/60" aria-hidden="true">
          Reader hidden
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

export default function ProtectedBookReader({ purchaseId, title, token, coverUrl }: ProtectedBookReaderProps) {
  const [open, setOpen] = useState(false);
  const closeReader = useCallback(() => setOpen(false), []);

  return (
    <div className="mt-8">
      <style>{`
        @media print {
          .protected-book, .protected-book * { display: none !important; }
        }
        @keyframes flipbook-forward { from { transform: rotateY(0deg); } to { transform: rotateY(-180deg); } }
        @keyframes flipbook-backward { from { transform: rotateY(0deg); } to { transform: rotateY(180deg); } }
        @keyframes flipbook-return { from { transform: rotateY(-180deg); } to { transform: rotateY(0deg); } }
      `}</style>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative aspect-[3/4] w-48 shrink-0 overflow-hidden rounded-r-md bg-slate-800 shadow-[0_18px_35px_-12px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-1"
          aria-label={`Open ${title}`}
        >
          {coverUrl ? (
            <Image src={coverUrl} alt={title} fill sizes="192px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1688b4] to-slate-900 p-5 text-center text-lg font-bold leading-tight text-white">
              {title}
            </span>
          )}
          <span className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 to-transparent" />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/55 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100">
            <BookOpen className="h-7 w-7" />
            Open book
          </span>
        </button>
        <div className="text-center sm:text-left">
          <p className="max-w-sm text-sm leading-6 text-slate-600">
            Click the cover to read {title} as a flipbook. Downloading and printing are turned off.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#1688b4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f759c]"
          >
            <BookOpen className="h-4 w-4" />
            Open book
          </button>
        </div>
      </div>
      {open ? <FlipbookLightbox purchaseId={purchaseId} title={title} token={token} onClose={closeReader} /> : null}
    </div>
  );
}
