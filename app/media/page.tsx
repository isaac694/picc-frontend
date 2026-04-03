'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const CAMPUS_NEWS = [
  {
    badge: 'Community',
    date: 'March 2026',
    title: 'Easter Celebrations & Community Outreach',
    description:
      'A look at how our church came together this Easter season to serve families across the community.',
    image: '/hero/hero-4.JPG',
  },
  {
    badge: 'Youth',
    date: 'March 2026',
    title: 'Youth Revival Week Highlights',
    description:
      'Our youth ministry hosted an incredible week of worship, fellowship, and spiritual growth.',
    image: '/hero/hero-10.JPG',
  },
  {
    badge: 'Updates',
    date: 'February 2026',
    title: 'New Building Expansion Update',
    description:
      'Construction progress on our new fellowship hall — see the latest milestones and timeline.',
    image: '/hero/hero-8.JPG',
  },
  {
    badge: 'Worship',
    date: 'February 2026',
    title: 'Night of Praise Recap',
    description:
      'A beautiful night of worship, prayer, and testimonies that lifted hearts across the campus.',
    image: '/hero/hero-7.JPG',
  },
  {
    badge: 'Outreach',
    date: 'January 2026',
    title: 'Campus Volunteer Drive',
    description:
      'Members gathered to serve, share resources, and pray with families in the neighborhood.',
    image: '/hero/hero-5.jpg',
  },
  {
    badge: 'Ministry',
    date: 'January 2026',
    title: 'Women of Hope Gathering',
    description:
      'A powerful gathering featuring teaching, fellowship, and encouragement for every season.',
    image: '/hero/hero-3.JPG',
  },
];

const BOOKS = [
  {
    title: 'Fire on the Altar Volume 3',
    author: 'PICC Publishing',
    description: 'A focused teaching on prayer, consecration, and spiritual hunger.',
    cover: '/fire_altar/fire-on-altar-cover.jpg',
    file: '/fire_altar/FIRE%20ON%20THE%20ALTAR%20Vol%203.24.pdf',
  },
  {
    title: 'Fire on the Altar Volume 2',
    author: 'PICC Publishing',
    description: 'A focused teaching on prayer, consecration, and spiritual hunger.',
    cover: '/fire_altar/fire-on-altar-cover.jpg',
  },
  {
    title: 'Fire on the Altar Volume 1',
    author: 'PICC Publishing',
    description: 'A focused teaching on prayer, consecration, and spiritual hunger.',
    cover: '/fire_altar/fire-on-altar-cover.jpg',
  },
];

const EVENT_GALLERY = [
  { title: 'Worship Service', category: 'Worship', image: '/hero/hero-10.JPG' },
  { title: 'Community Outreach', category: 'Outreach', image: '/hero/hero-8.JPG' },
  { title: 'Youth Gathering', category: 'Youth', image: '/hero/hero-9.JPG' },
  { title: 'Night of Praise', category: 'Music', image: '/hero/hero-5.jpg' },
  { title: 'Celebration Sunday', category: 'Celebration', image: '/hero/hero-6.jpg' },
  { title: 'Morning Prayer', category: 'Prayer', image: '/hero/hero-4.JPG' },
  { title: 'Midweek Worship', category: 'Worship', image: '/hero/hero-2.jpg' },
  { title: 'Campus Fellowship', category: 'Youth', image: '/hero/hero-3.JPG' },
];

export default function MediaPage() {
  const [galleryFilter, setGalleryFilter] = useState('All');

  const galleryItems = useMemo(() => {
    if (galleryFilter === 'All') return EVENT_GALLERY;
    return EVENT_GALLERY.filter((item) => item.category === galleryFilter);
  }, [galleryFilter]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden py-24 sm:py-32 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)]" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4">
              Media Archive
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
              Media and Resources
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              Browse our magazine issues and book downloads. New releases will be added here.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20 md:py-24 bg-[#eef4fb]">
          <div className="w-full px-0">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.45em] text-primary/70 mb-3">
                What&apos;s happening
              </p>
              <h2 className="text-3xl md:text-5xl font-semibold text-foreground">
                Church News
              </h2>
              <div className="mx-auto mt-4 h-[3px] w-14 rounded-full bg-primary" />
              <p className="mt-4 text-foreground/70 max-w-2xl mx-auto">
                Quick updates and highlights from what&apos;s happening on campus.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 px-4 sm:px-6 lg:px-10">
              {CAMPUS_NEWS.slice(0, 6).map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-primary/10 bg-white/90 shadow-sm overflow-hidden"
                >
                  <div className="relative h-56 sm:h-64 lg:h-72">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
                        {item.badge}
                      </span>
                      <span className="uppercase tracking-[0.2em]">{item.date}</span>
                    </div>
                    <h3 className="mt-3 text-lg md:text-xl font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-foreground/70">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 md:py-24 bg-background">
          <div className="w-full px-0">
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-[0.45em] text-primary/70 mb-3">
                Memories &amp; Moments
              </p>
              <h2 className="text-3xl md:text-5xl font-semibold text-foreground">
                Event Gallery
              </h2>
              <div className="mx-auto mt-4 h-[3px] w-14 rounded-full bg-primary" />
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-10 px-4 sm:px-6 lg:px-10">
              {['All', 'Worship', 'Outreach', 'Youth', 'Music', 'Celebration', 'Prayer'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setGalleryFilter(label)}
                  className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition-colors cursor-pointer ${
                    label === galleryFilter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {galleryItems.map((item) => (
                <div
                  key={item.title}
                  className="group relative overflow-hidden rounded-2xl shadow-md"
                >
                  <div className="relative h-56 sm:h-64">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-4 left-4 rounded-full bg-primary/90 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-foreground">
                    {item.category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 md:py-24 bg-[#eef4fb]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start mb-12">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                  Books
                </p>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                  Fire on the altar
                </h2>
                <p className="text-foreground/70 mt-4 max-w-xl">
                  When books are uploaded, members can download them from this library.
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {BOOKS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  {item.cover && (
                    <div className="relative mb-4 h-56 overflow-hidden rounded-xl">
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-3">
                    {item.author}
                  </p>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-foreground/70 mb-6">
                    {item.description}
                  </p>
                  {item.file ? (
                    <a href={item.file} download>
                      <Button variant="outline" className="rounded-full px-5">
                        Download PDF
                      </Button>
                    </a>
                  ) : (
                    <Button variant="outline" className="rounded-full px-5" disabled>
                      Download (Coming Soon)
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 md:py-24 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Ready to Explore More?
            </h2>
            <p className="text-foreground/70 mb-8">
              Check back as we grow this library with devotionals, magazines, and teaching series.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/devotions">
                <Button className="rounded-full px-6 py-3">
                  Daily Devotions
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" className="rounded-full px-6 py-3">
                  Upcoming Events
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
