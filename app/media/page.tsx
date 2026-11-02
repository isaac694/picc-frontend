'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import NewsFeed from '@/components/news/NewsFeed';
import MusicSection from '@/components/media/MusicSection';
import PublicationShowcase from '@/components/media/PublicationShowcase';
import { apiFetch, apiUrl } from '@/lib/api';
import {
  DEFAULT_MEDIA_BOOKS,
  DEFAULT_MEDIA_GALLERY,
  DEFAULT_MEDIA_MAGAZINES,
  DEFAULT_MEDIA_NEWS,
  type MediaBookItem,
  type MediaGalleryItem,
  type MediaMagazineItem,
  type MediaNewsItem,
} from '@/lib/mediaDefaults';

type NewsItem = {
  badge: string;
  date: string;
  title: string;
  description: string;
  image: string;
};

type GalleryItem = {
  title: string;
  category: string;
  image: string;
};

type BookItem = {
  title: string;
  author: string;
  description: string;
  cover: string;
  file?: string;
};

type MagazineItem = {
  title: string;
  issue: string;
  cover: string;
  file?: string;
};


const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeAssetUrl = (value?: string | null) => {
  if (!value) return '';
  return value.startsWith('http') ? value : apiUrl(value);
};

const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const parseListBody = (body: unknown): unknown[] => {
  if (typeof body !== 'string' || !body) return [];
  try {
    const parsed = JSON.parse(body) as unknown;
    if (Array.isArray(parsed)) return parsed;
    if (isRecord(parsed) && Array.isArray(parsed.items)) return parsed.items as unknown[];
    return [];
  } catch {
    return [];
  }
};

async function fetchSiteList<T>(key: string): Promise<{ items: T[]; deletedFallbackIndexes: number[] }> {
  try {
    const response = await apiFetch(`/api/site-content/${key}`);
    if (response.status === 404) return { items: [], deletedFallbackIndexes: [] };
    if (!response.ok) return { items: [], deletedFallbackIndexes: [] };

    const record = (await response.json().catch(() => null)) as unknown;
    const body = isRecord(record) ? record.body : null;
    const parsed = parseJson(body);

    if (Array.isArray(parsed)) {
      return { items: parsed.filter(isRecord) as T[], deletedFallbackIndexes: [] };
    }

    if (isRecord(parsed)) {
      return {
        items: Array.isArray(parsed.items) ? parsed.items.filter(isRecord) as T[] : [],
        deletedFallbackIndexes: Array.isArray(parsed.deletedFallbackIndexes)
          ? parsed.deletedFallbackIndexes.filter((value): value is number => typeof value === 'number')
          : [],
      };
    }

    return { items: [], deletedFallbackIndexes: [] };
  } catch {
    return { items: [], deletedFallbackIndexes: [] };
  }
}

const CAMPUS_NEWS: NewsItem[] = DEFAULT_MEDIA_NEWS.map((item) => ({
  badge: item.badge,
  date: item.date,
  title: item.title,
  description: item.description,
  image: item.imageUrl,
}));

const EVENT_GALLERY: GalleryItem[] = DEFAULT_MEDIA_GALLERY.map((item) => ({
  title: item.title,
  category: item.category,
  image: item.imageUrl,
}));

const BOOKS: BookItem[] = DEFAULT_MEDIA_BOOKS.map((item) => ({
  title: item.title,
  author: item.author,
  description: item.description,
  cover: item.imageUrl,
  file: item.fileUrl || undefined,
}));

const MAGAZINES: MagazineItem[] = DEFAULT_MEDIA_MAGAZINES.map((item) => ({
  title: item.title,
  issue: item.issue,
  cover: item.imageUrl,
  file: item.fileUrl || undefined,
}));

export default function MediaPage() {
  const [galleryFilter, setGalleryFilter] = useState('All');
  const [news, setNews] = useState<NewsItem[]>(CAMPUS_NEWS);
  const [gallery, setGallery] = useState<GalleryItem[]>(EVENT_GALLERY);
  const [books, setBooks] = useState<BookItem[]>(BOOKS);
  const [magazines, setMagazines] = useState<MagazineItem[]>(MAGAZINES);
  useEffect(() => {
    let alive = true;

    const load = async () => {
      const [newsResult, galleryResult, bookResult, magazineResult] = await Promise.all([
        fetchSiteList<MediaNewsItem>('media-news'),
        fetchSiteList<MediaGalleryItem>('media-gallery'),
        fetchSiteList<MediaBookItem>('media-books'),
        fetchSiteList<MediaMagazineItem>('media-magazines'),
      ]);

      if (!alive) return;

      const newsItems = newsResult.items;
      const newsDeletedIndexes = newsResult.deletedFallbackIndexes;
      const adminNews = newsItems.map((item) => ({
        badge: item.badge || 'Updates',
        date: item.date || '',
        title: item.title || '',
        description: item.description || '',
        image: normalizeAssetUrl(item.imageUrl) || '/hero/hero-4.JPG',
      }));
      const overriddenNewsIndexes = new Set(
        newsItems
          .map((item) => item.fallbackIndex)
          .filter((value): value is number => typeof value === 'number'),
      );
      const remainingNewsFallback = CAMPUS_NEWS.filter(
        (_, index) => !overriddenNewsIndexes.has(index) && !newsDeletedIndexes.includes(index),
      );
      setNews(adminNews.length > 0 || newsDeletedIndexes.length > 0 ? [...adminNews, ...remainingNewsFallback] : CAMPUS_NEWS);

      const galleryItems = galleryResult.items;
      const galleryDeletedIndexes = galleryResult.deletedFallbackIndexes;
      const adminGallery = galleryItems.map((item) => ({
        title: item.title || 'Gallery Item',
        category: item.category || 'gallery',
        image: normalizeAssetUrl(item.imageUrl) || '/hero/hero-4.JPG',
      }));
      const overriddenGalleryIndexes = new Set(
        galleryItems
          .map((item) => item.fallbackIndex)
          .filter((value): value is number => typeof value === 'number'),
      );
      const remainingGalleryFallback = EVENT_GALLERY.filter(
        (_, index) => !overriddenGalleryIndexes.has(index) && !galleryDeletedIndexes.includes(index),
      );
      setGallery(adminGallery.length > 0 || galleryDeletedIndexes.length > 0 ? [...adminGallery, ...remainingGalleryFallback] : EVENT_GALLERY);

      const bookItems = bookResult.items;
      const bookDeletedIndexes = bookResult.deletedFallbackIndexes;
      const adminBooks = bookItems.map((item) => ({
        title: item.title || '',
        author: item.author || '',
        description: item.description || '',
        cover: normalizeAssetUrl(item.imageUrl) || '/fire_altar/fire-on-altar-cover.jpg',
        file: item.fileUrl ? normalizeAssetUrl(item.fileUrl) : undefined,
      }));
      const overriddenBookIndexes = new Set(
        bookItems
          .map((item) => item.fallbackIndex)
          .filter((value): value is number => typeof value === 'number'),
      );
      const remainingBookFallback = BOOKS.filter(
        (_, index) => !overriddenBookIndexes.has(index) && !bookDeletedIndexes.includes(index),
      );
      setBooks(adminBooks.length > 0 || bookDeletedIndexes.length > 0 ? [...adminBooks, ...remainingBookFallback] : BOOKS);

      const magazineItems = magazineResult.items;
      const magazineDeletedIndexes = magazineResult.deletedFallbackIndexes;
      const adminMagazines = magazineItems.map((item) => ({
        title: item.title || '',
        issue: item.issue || '',
        cover: normalizeAssetUrl(item.imageUrl) || '/magazine/magazine-1.jpeg',
        file: item.fileUrl ? normalizeAssetUrl(item.fileUrl) : undefined,
      }));
      const overriddenMagazineIndexes = new Set(
        magazineItems
          .map((item) => item.fallbackIndex)
          .filter((value): value is number => typeof value === 'number'),
      );
      const remainingMagazineFallback = MAGAZINES.filter(
        (_, index) => !overriddenMagazineIndexes.has(index) && !magazineDeletedIndexes.includes(index),
      );
      setMagazines(adminMagazines.length > 0 || magazineDeletedIndexes.length > 0 ? [...adminMagazines, ...remainingMagazineFallback] : MAGAZINES);
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const galleryItems = useMemo(
    () => (galleryFilter === 'All' ? gallery : gallery.filter((item) => item.category === galleryFilter)),
    [galleryFilter, gallery],
  );

  const galleryFilters = useMemo(() => {
    const categories = Array.from(new Set(gallery.map((item) => item.category).filter(Boolean)));
    return ['All', ...categories];
  }, [gallery]);

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
              Church news, photos, music, books and magazines from the PICC family.
            </p>
          </div>
        </section>

        <NewsFeed
          scope="church"
          kicker="What&apos;s happening"
          title="Church News"
          description="Stories and highlights from across the PICC family."
          fallbackItems={news}
          limit={7}
          allHref="/news"
          allLabel="Read all church news"
        />

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
                  {galleryFilters.map((label) => (
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
                  {label === 'All' ? label : label.charAt(0).toUpperCase() + label.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-10">
              {galleryItems.map((item, idx) => (
                <div
                  key={`${item.title}-${idx}`}
                  className="group relative overflow-hidden rounded-2xl shadow-md"
                >
                  <div className="relative h-56 sm:h-64">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-4 left-4 rounded-full bg-primary/90 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-foreground">
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </div>
                  <div className="absolute bottom-4 right-4 translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <a href={item.image} download>
                      <Button variant="outline" className="rounded-full px-4 py-2 text-[11px]">
                        Download Photo
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <MusicSection />

        <PublicationShowcase
          kicker="Books"
          title="Fire on the Altar"
          description="Teachings on prayer, consecration and spiritual hunger from PICC Publishing. Read online or download a copy."
          items={books.map((item) => ({ title: item.title, meta: item.author, description: item.description, cover: item.cover, file: item.file }))}
          label="Latest volume"
          tone="dark"
        />

        <PublicationShowcase
          kicker="Magazines"
          title="PICC Magazine"
          description="Stories, testimonies and teachings from the church family, issue by issue."
          items={magazines.map((item) => ({ title: item.title, meta: item.issue || 'PICC Magazine', cover: item.cover, file: item.file }))}
          label="Latest issue"
          tone="light"
          archiveHref="/media/archive"
          archiveLabel="All magazines"
        />

      </main>
      <Footer />
    </>
  );
}
