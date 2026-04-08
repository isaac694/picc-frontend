'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const SERMONS = [
  {
    id: 1,
    title: 'Faith for All-Round Possibilities',
    date: '10 April, 2025',
    image: '/hero/hero-6.jpg',
    views: '1,232',
  },
  {
    id: 2,
    title: 'Faith for Supernatural Supplies',
    date: '10 April, 2025',
    image: '/hero/hero-4.jpg',
    views: '1,127',
  },
  {
    id: 3,
    title: 'Impartation of the Spirit of Faith',
    date: '10 April, 2025',
    image: '/hero/hero-3.jpg',
    views: '981',
  },
  {
    id: 4,
    title: 'Operating in the Spirit of Faith',
    date: '16 February, 2023',
    image: '/hero/hero-2.jpg',
    views: '742',
  },
  {
    id: 5,
    title: 'The Faith That Works',
    date: '16 February, 2023',
    image: '/hero/hero-1.jpg',
    views: '839',
  },
  {
    id: 6,
    title: 'Faith-Provoking Praise (Part 4)',
    date: '16 February, 2023',
    image: '/hero/hero-5.jpg',
    views: '690',
  },
];

export default function SermonsPage() {
  const [selectedSermon, setSelectedSermon] = useState<(typeof SERMONS)[number] | null>(null);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32 md:py-48 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/sermons/header.JPG')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/35" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mt-24 md:mt-32">
              <div className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4 flex items-center gap-3">
                <a href="/" className="hover:text-white">Home</a>
                <span className="text-white/50">/</span>
                <a href="/sermons" className="hover:text-white">Sermons</a>
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold mb-4">Latest Sermons</h1>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            {selectedSermon && (
              <div className="mb-12 rounded-[28px] border border-primary/15 bg-white shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="relative min-h-[240px] sm:min-h-[320px] lg:min-h-[360px]">
                    <Image
                      src={selectedSermon.image}
                      alt={selectedSermon.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/10" />
                    <div className="absolute bottom-6 left-6 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                      Featured Sermon
                    </div>
                  </div>
                  <div className="p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-foreground/60 mb-2">
                          {selectedSermon.date}
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
                          {selectedSermon.title}
                        </h2>
                        <p className="text-foreground/70 mb-6">
                          Listen to this sermon and be encouraged in faith and purpose.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSermon(null)}
                        className="rounded-full border border-foreground/20 px-3 py-1 text-xs font-semibold text-foreground/70 hover:bg-foreground/5"
                      >
                        Close
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Play Sermon
                      </button>
                      <span className="text-sm text-foreground/60">{selectedSermon.views} views</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {SERMONS.map((sermon) => (
                <article key={sermon.id} className="group">
                  <div className="relative overflow-hidden rounded-[18px] bg-black/5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setSelectedSermon(sermon)}
                      className="relative aspect-[16/10] w-full text-left"
                      aria-label={`Open sermon ${sermon.title}`}
                    >
                      <Image
                        src={sermon.image}
                        alt={sermon.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-black/10" />
                    </button>
                    <div className="absolute right-4 -bottom-3 flex gap-2">
                      <span className="h-3 w-3 rounded-full bg-primary" />
                      <span className="h-3 w-3 rounded-full bg-primary/70" />
                    </div>
                  </div>

                  <div className="pt-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 mb-2">
                      {sermon.date}
                    </p>
                    <h3 className="text-lg font-semibold leading-snug text-foreground mb-3">
                      {sermon.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-foreground/60">
                      <span className="inline-flex items-center justify-center rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold">
                        PLAY
                      </span>
                      <span>{sermon.views}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Link
                href="/livestream"
                className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Watch Live
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

