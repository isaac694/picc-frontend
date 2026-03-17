'use client';

import Image from 'next/image';
import Link from 'next/link';
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
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="pt-10 md:pt-14">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[28px] md:rounded-[36px]">
              <div className="absolute inset-0">
                <Image
                  src="/hero/hero-6.jpg"
                  alt="Latest sermons"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/25" />
              <div className="relative px-6 py-12 md:px-10 md:py-16 text-white">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3">
                  Home / Sermons
                </p>
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
                  Latest Sermons
                </h1>
              </div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {SERMONS.map((sermon) => (
                <article key={sermon.id} className="group">
                  <div className="relative overflow-hidden rounded-[18px] bg-black/5 shadow-sm">
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={sermon.image}
                        alt={sermon.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-black/10" />
                    </div>
                    <div className="absolute right-4 -bottom-3 flex gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#2C3BEA]" />
                      <span className="h-3 w-3 rounded-full bg-[#2C3BEA]/80" />
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
