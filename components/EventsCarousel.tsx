'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiFetch, apiUrl } from '@/lib/api';

const FALLBACK_SLIDES = [
  { src: '/events/event-1.jpg', alt: 'Event 1' },
  { src: '/events/event-2.jpg', alt: 'Event 2' },
  { src: '/events/event-3.jpg', alt: 'Event 3' },
  { src: '/events/event-4.jpg', alt: 'Event 4' },
  { src: '/events/event-5.jpg', alt: 'Event 5' },
];

const AUTO_PLAY_MS = 4000;

export default function EventsCarousel({
  eventsHref = '/events',
  eventsLabel = 'Events',
  apiPath = '/api/events?take=12',
  title = 'Upcoming Events',
  subtitle = "Don't miss out on what's happening at our church",
  connectLabel = 'CONNECT WITH US',
  connectTitle = 'You belong here from Sunday services to midweek programs',
  connectSubtitle = 'Every service is a new beginning. Your seat is waiting.',
  showLivestream = true,
}: {
  eventsHref?: string;
  eventsLabel?: string;
  apiPath?: string;
  title?: string;
  subtitle?: string;
  connectLabel?: string;
  connectTitle?: string;
  connectSubtitle?: string;
  showLivestream?: boolean;
}) {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  // Start at index 1 (the real first slide, after the cloned last)
  const [index, setIndex] = useState(slides.length > 1 ? 1 : 0);
  const [paused, setPaused] = useState(false);
  const [transition, setTransition] = useState(true);
  const [visible, setVisible] = useState(false);
  const [jumping, setJumping] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const extended = useMemo(() => {
    if (slides.length <= 1) return slides;
    return [slides[slides.length - 1], ...slides, slides[0]];
  }, [slides]);

  // Real dot index (0-based, maps back to slides)
  const dotIndex = slides.length <= 1
    ? 0
    : index === 0
    ? slides.length - 1
    : index === extended.length - 1
    ? 0
    : index - 1;

  const goTo = useCallback((realIndex: number) => {
    if (slides.length <= 1) return;
    setTransition(true);
    setIndex(realIndex + 1); // +1 because EXTENDED is offset by 1
  }, [slides.length]);

  const next = useCallback(() => {
    if (jumping || slides.length <= 1) return;
    setTransition(true);
    setIndex((i) => i + 1);
  }, [jumping, slides.length]);

  const prev = useCallback(() => {
    if (jumping || slides.length <= 1) return;
    setTransition(true);
    setIndex((i) => i - 1);
  }, [jumping, slides.length]);

  // When we land on a clone, silently jump to the real slide
  const handleTransitionEnd = useCallback(() => {
    if (slides.length <= 1) return;
    if (index === 0) {
      // Landed on cloned-last -> jump to real last
      setJumping(true);
      setTransition(false);
      setIndex(slides.length);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setJumping(false);
        });
      });
    } else if (index === extended.length - 1) {
      // Landed on cloned-first -> jump to real first
      setJumping(true);
      setTransition(false);
      setIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setJumping(false);
        });
      });
    }
  }, [index, slides.length, extended.length]);

  // Auto-play
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [paused, index, next, slides.length]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiFetch(apiPath);
        if (!response.ok) return;
        const raw = (await response.json().catch(() => null)) as unknown;
        const events = (() => {
          if (!isRecord(raw)) return [];
          const value = raw.events;
          return Array.isArray(value) ? value : [];
        })();
        const resolveImageUrl = (url: string) => {
          if (url.startsWith('http')) return url;
          if (url.startsWith('/uploads')) return apiUrl(url);
          return url;
        };

        const incoming = events
          .filter(isRecord)
          .map((event, idx) => {
            const imageUrl = typeof event.imageUrl === 'string' ? event.imageUrl : '';
            const title = typeof event.title === 'string' ? event.title : '';
            return {
              src: imageUrl && !imageUrl.includes('placeholder-event') ? resolveImageUrl(imageUrl) : '',
              alt: title || `Event ${idx + 1}`,
            };
          })
          .filter((event) => Boolean(event.src));
        if (incoming.length > 0) {
          setSlides(incoming);
          setIndex(incoming.length > 1 ? 1 : 0);
        }
      } catch {
        // keep fallback slides
      }
    };

    fetchEvents();
  }, [apiPath]);

  // Scroll-triggered content animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 md:py-24 bg-muted/30">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-item { opacity: 0; }
        .content-visible .anim-item:nth-child(1) { animation: fadeSlideUp 0.6s ease forwards; animation-delay: 0.10s; }
        .content-visible .anim-item:nth-child(2) { animation: fadeSlideUp 0.6s ease forwards; animation-delay: 0.25s; }
        .content-visible .anim-item:nth-child(3) { animation: fadeSlideUp 0.6s ease forwards; animation-delay: 0.40s; }
        .content-visible .anim-item:nth-child(4) { animation: fadeSlideUp 0.6s ease forwards; animation-delay: 0.55s; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-primary mb-2">{title}</h2>
          <p className="text-foreground/70">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Carousel */}
          <div
            className="relative w-full overflow-hidden rounded-lg shadow-lg"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Slides strip */}
            <div
              className={transition ? 'flex transition-transform duration-700' : 'flex'}
              style={{ transform: `translateX(-${index * 100}%)` }}
              onTransitionEnd={handleTransitionEnd}
            >
              {extended.map((slide, i) => (
                <div
                  key={`${slide.src}-${i}`}
                  className="min-w-full h-[320px] sm:h-[420px] md:h-[520px] lg:h-[640px] relative"
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority={i === 1}
                  />
                </div>
              ))}
            </div>

            {/* Prev / Next */}
            {slides.length > 1 &&
              [
                { label: 'Previous slide', onClick: prev, side: 'left-3',  path: 'M15 18l-6-6 6-6' },
                { label: 'Next slide',     onClick: next, side: 'right-3', path: 'M9 6l6 6-6 6'    },
              ].map(({ label, onClick, side, path }) => (
                <button
                  key={label}
                  aria-label={label}
                  onClick={onClick}
                  className={`absolute ${side} top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/60 transition-colors`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={path} />
                  </svg>
                </button>
              ))}

            {/* Dot indicators - always reflect real slide position */}
            {slides.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === dotIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Animated Content */}
          <div
            ref={contentRef}
            className={`px-2 md:px-6 ${visible ? 'content-visible' : ''}`}
          >
            <p className="anim-item text-sm font-semibold tracking-wide text-foreground/60 mb-4">
              {connectLabel}
            </p>
            <h3 className="anim-item text-4xl md:text-5xl font-bold leading-tight mb-4">
              {connectTitle}
            </h3>
            <p className="anim-item text-foreground/70 mb-8">
              {connectSubtitle}
            </p>

            <div className="anim-item flex gap-4 flex-wrap">
              {showLivestream && (
                <Link href="/livestream">
                  <Button className="bg-red-600 text-white px-6 py-3 shadow-md hover:bg-red-700 transition-colors">
                    Livestream
                  </Button>
                </Link>
              )}
              <Link href={eventsHref}>
                <Button variant="outline" className="px-6 py-3">
                  {eventsLabel}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


