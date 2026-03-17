'use client';

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, X } from 'lucide-react';

type Moment = {
  id: number;
  href: string;
  images: string[];
  title: string;
  caption: string;
  likes: number;
  comments: number;
  date: string;
  handle: string;
};

const MOMENTS: Moment[] = [
  {
    id: 1,
    href: 'https://web.facebook.com/photo?fbid=1513295583485291&set=a.211134133701449',
    images: ['/moments/1.jpg', '/moments/2.jpg'],
    title: 'Moment 1',
    caption:
      'When we engage in prayer, the Kingdom of God advances. Make it a commitment to begin your prayer life today.',
    likes: 616,
    comments: 2,
    date: '10/12',
    handle: '@piccworldwide',
  },
  {
    id: 2,
    href: 'https://web.facebook.com/photo?fbid=1512882233526626&set=a.211134133701449',
    images: ['/moments/2.jpg'],
    title: 'Moment 2',
    caption:
      'A moment of worship and gratitude. Thank you for being part of the PICC family.',
    likes: 382,
    comments: 4,
    date: '10/12',
    handle: '@piccworldwide',
  },
  {
    id: 3,
    href: 'https://web.facebook.com/photo?fbid=1512502576897925&set=a.211134133701449',
    images: ['/moments/3.jpg', '/moments/4.jpg'],
    title: 'Moment 3',
    caption:
      'Faith grows when we gather. Here are highlights from our recent service.',
    likes: 415,
    comments: 3,
    date: '10/12',
    handle: '@piccworldwide',
  },
  {
    id: 4,
    href: 'https://web.facebook.com/photo/?fbid=1511974113617438&set=pcb.1511978686950314',
    images: ['/moments/4.jpg'],
    title: 'Moment 4',
    caption:
      'The joy of the Lord is our strength. We celebrate every testimony.',
    likes: 290,
    comments: 1,
    date: '10/12',
    handle: '@piccworldwide',
  },
  {
    id: 5,
    href: 'https://web.facebook.com/photo/?fbid=1511968180284698&set=pcb.1511970876951095',
    images: ['/moments/5.jpg', '/moments/6.jpg'],
    title: 'Moment 5',
    caption:
      'A beautiful snapshot of fellowship and unity across generations.',
    likes: 338,
    comments: 5,
    date: '10/12',
    handle: '@piccworldwide',
  },
  {
    id: 6,
    href: 'https://web.facebook.com/photo/?fbid=1511906870290829&set=pcb.1511916916956491',
    images: ['/moments/6.jpg'],
    title: 'Moment 6',
    caption:
      'A powerful reminder to keep your faith active every day.',
    likes: 271,
    comments: 2,
    date: '10/12',
    handle: '@piccworldwide',
  },
  {
    id: 7,
    href: 'https://web.facebook.com/photo?fbid=1511748960306620&set=a.211134133701449',
    images: ['/moments/7.jpg', '/moments/8.jpg'],
    title: 'Moment 7',
    caption:
      'We are family. Thank you for showing up with love and joy.',
    likes: 401,
    comments: 6,
    date: '10/12',
    handle: '@piccworldwide',
  },
  {
    id: 8,
    href: 'https://web.facebook.com/photo/?fbid=1511067390374777&set=pcb.1511075417040641',
    images: ['/moments/8.jpg'],
    title: 'Moment 8',
    caption:
      'Moments like these remind us why we serve and worship together.',
    likes: 329,
    comments: 3,
    date: '10/12',
    handle: '@piccworldwide',
  },
  {
    id: 9,
    href: 'https://web.facebook.com/photo/?fbid=1511051377043045&set=a.211134133701449',
    images: ['/moments/9.jpg'],
    title: 'Moment 9',
    caption:
      'Celebrating the goodness of God with our church family.',
    likes: 355,
    comments: 2,
    date: '10/12',
    handle: '@piccworldwide',
  },
];

export default function MomentsSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const active = useMemo(
    () => (activeIndex === null ? null : MOMENTS[activeIndex]),
    [activeIndex]
  );

  const close = useCallback(() => {
    setActiveIndex(null);
    setActiveImageIndex(0);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((index) => {
      if (index === null) return null;
      return (index - 1 + MOMENTS.length) % MOMENTS.length;
    });
    setActiveImageIndex(0);
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((index) => {
      if (index === null) return null;
      return (index + 1) % MOMENTS.length;
    });
    setActiveImageIndex(0);
  }, []);

  // Inner (multi-image) navigation is disabled for now.

  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="w-full px-0">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">We Are Family</h2>
          <p className="text-foreground/70 mt-2">
            Snapshots of life together. Click any image to see the full post details.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MOMENTS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                setActiveImageIndex(0);
              }}
              className="group relative block overflow-hidden shadow-lg text-left"
              aria-label={`Open ${item.title}`}
            >
              <div className="relative h-[34rem] md:h-[36rem]">
                <Image
                  src={item.images[0]}
                  alt={item.title}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-3 left-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <div className="facebook-badge group/fb flex items-center gap-2 rounded-full bg-[#1877F2] text-white px-2.5 py-1 text-xs font-semibold shadow-lg">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-[#1877F2] font-bold">f</span>
                  <span className="facebook-label max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover/fb:max-w-[120px]">
                    View Details
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={close}>
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              className="hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
              aria-label="Previous post"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              className="hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
              aria-label="Next post"
            >
              <ChevronRight size={22} />
            </button>
            <div
              className="relative bg-white rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="relative min-h-[360px] md:min-h-[520px] bg-black">
                <Image
                  src={active.images[activeImageIndex]}
                  alt={active.title}
                  fill
                  className="object-contain"
                />
                {/* Inner image navigation disabled for now */}
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">PICC Worldwide</p>
                    <p className="text-xs text-foreground/60">{active.handle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full border border-border p-2 text-foreground/70 hover:text-foreground"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs text-foreground/50">
                  <span>{active.date}</span>
                  <span className="uppercase tracking-[0.2em]">Facebook</span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                  {active.caption}
                </p>

                <div className="mt-6 flex items-center gap-6 text-sm text-foreground/70">
                  <span className="inline-flex items-center gap-2">
                    <Heart size={16} /> {active.likes}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle size={16} /> {active.comments}
                  </span>
                </div>

                <div className="mt-6">
                  <Link
                    href={active.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    View on Facebook
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
