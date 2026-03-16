'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const SLIDES = [
  { src: '/events/event-1.jpg', alt: 'Event 1' },
  { src: '/events/event-2.jpg', alt: 'Event 2' },
  { src: '/events/event-3.jpg', alt: 'Event 3' },
  { src: '/events/event-4.jpg', alt: 'Event 4' },
  { src: '/events/event-5.jpg', alt: 'Event 5' },
];

// Cloned list: [last, ...all, first] for seamless infinite loop
const EXTENDED = [SLIDES[SLIDES.length - 1], ...SLIDES, SLIDES[0]];

const AUTO_PLAY_MS = 4000;

export default function EventsCarousel() {
  // Start at index 1 (the real first slide, after the cloned last)
  const [index, setIndex]       = useState(1);
  const [paused, setPaused]     = useState(false);
  const [transition, setTransition] = useState(true);
  const [visible, setVisible]   = useState(false);
  const contentRef              = useRef(null);
  const isJumping               = useRef(false);

  // Real dot index (0-based, maps back to SLIDES)
  const dotIndex = index === 0
    ? SLIDES.length - 1
    : index === EXTENDED.length - 1
    ? 0
    : index - 1;

  const goTo = (realIndex) => {
    setTransition(true);
    setIndex(realIndex + 1); // +1 because EXTENDED is offset by 1
  };

  const next = () => {
    if (isJumping.current) return;
    setTransition(true);
    setIndex((i) => i + 1);
  };

  const prev = () => {
    if (isJumping.current) return;
    setTransition(true);
    setIndex((i) => i - 1);
  };

  // When we land on a clone, silently jump to the real slide
  const handleTransitionEnd = () => {
    if (index === 0) {
      // Landed on cloned-last → jump to real last
      isJumping.current = true;
      setTransition(false);
      setIndex(SLIDES.length);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { isJumping.current = false; });
      });
    } else if (index === EXTENDED.length - 1) {
      // Landed on cloned-first → jump to real first
      isJumping.current = true;
      setTransition(false);
      setIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { isJumping.current = false; });
      });
    }
  };

  // Auto-play
  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [paused, index]);

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
          <h2 className="text-3xl font-bold text-primary mb-2">Upcoming Events</h2>
          <p className="text-foreground/70">Don&apos;t miss out on what&apos;s happening at our church</p>
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
              {EXTENDED.map((slide, i) => (
                <div key={`${slide.src}-${i}`} className="min-w-full h-[480px] md:h-[640px] relative">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                    priority={i === 1}
                  />
                </div>
              ))}
            </div>

            {/* Prev / Next */}
            {[
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

            {/* Dot indicators — always reflect real slide position */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {SLIDES.map((_, i) => (
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
          </div>

          {/* Animated Content */}
          <div
            ref={contentRef}
            className={`px-2 md:px-6 ${visible ? 'content-visible' : ''}`}
          >
        <p className="anim-item text-sm font-semibold tracking-wide text-foreground/60 mb-4">
              CONNECT WITH US
            </p>
            <h3 className="anim-item text-4xl md:text-5xl font-bold leading-tight mb-4">
              You belong here from Sunday services to midweek programs
            </h3>
            <p className="anim-item text-foreground/70 mb-8">
              Every service is a new beginning. Your seat is waiting.
            </p>

            <div className="anim-item flex gap-4 flex-wrap">
              <Link href="/livestream">
                <Button className="bg-red-600 text-white px-6 py-3 shadow-md hover:bg-red-700 transition-colors">
                  Livestream
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" className="px-6 py-3">
                  View Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


