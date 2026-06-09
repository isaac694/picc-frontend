'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import ChurchNewsSection from '@/components/ChurchNewsSection';
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
import { X } from 'lucide-react';

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

type YouTubeVideo = {
  videoId: string;
  title: string;
  thumbnail: string;
  url: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeAssetUrl = (value?: string | null) => {
  if (!value) return '';
  return value.startsWith('http') ? value : apiUrl(value);
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

async function fetchSiteList<T>(key: string): Promise<T[] | null> {
  try {
    const response = await apiFetch(`/api/site-content/${key}`);
    if (response.status === 404) return [];
    if (!response.ok) return null;
    const record = (await response.json().catch(() => null)) as unknown;
    const body = isRecord(record) ? record.body : null;
    const items = parseListBody(body);
    return items.filter(isRecord) as T[];
  } catch {
    return null;
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
  const [musicVideos, setMusicVideos] = useState<YouTubeVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);

  const MUSIC_CHANNEL_ID = "UCsrF1bC3s230vmduZSjEsBQ";
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

  useEffect(() => {
    if (!YOUTUBE_API_KEY) return;

    const fetchMusicVideos = async () => {
      try {
        const url = new URL("https://www.googleapis.com/youtube/v3/search");
        url.searchParams.set("part", "snippet");
        url.searchParams.set("channelId", MUSIC_CHANNEL_ID);
        url.searchParams.set("order", "date");
        url.searchParams.set("type", "video");
        url.searchParams.set("maxResults", "8");
        url.searchParams.set("key", YOUTUBE_API_KEY);

        const response = await fetch(url.toString());
        if (!response.ok) return;
        
        const data = await response.json();
        const videos = (data.items || []).map((item: any) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));
        setMusicVideos(videos);
      } catch (error) {
        console.error("Error fetching music videos:", error);
      }
    };

    void fetchMusicVideos();
  }, [YOUTUBE_API_KEY]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const [newsItems, galleryItems, bookItems, magazineItems] = await Promise.all([
        fetchSiteList<MediaNewsItem>('media-news'),
        fetchSiteList<MediaGalleryItem>('media-gallery'),
        fetchSiteList<MediaBookItem>('media-books'),
        fetchSiteList<MediaMagazineItem>('media-magazines'),
      ]);

      if (!alive) return;

      if (Array.isArray(newsItems)) {
        const adminNews = newsItems.map((item) => ({
          badge: item.badge || 'Updates',
          date: item.date || '',
          title: item.title || '',
          description: item.description || '',
          image: normalizeAssetUrl(item.imageUrl) || '/hero/hero-4.JPG',
        }));
        const overriddenIndexes = new Set(
          newsItems
            .map((item) => item.fallbackIndex)
            .filter((value): value is number => typeof value === 'number'),
        );
        const remainingFallback = CAMPUS_NEWS.filter((_, index) => !overriddenIndexes.has(index));
        setNews(adminNews.length > 0 ? [...adminNews, ...remainingFallback] : CAMPUS_NEWS);
      }

      if (Array.isArray(galleryItems)) {
        const adminGallery = galleryItems.map((item) => ({
          title: item.title || 'Gallery Item',
          category: item.category || 'gallery',
          image: normalizeAssetUrl(item.imageUrl) || '/hero/hero-4.JPG',
        }));
        const overriddenIndexes = new Set(
          galleryItems
            .map((item) => item.fallbackIndex)
            .filter((value): value is number => typeof value === 'number'),
        );
        const remainingFallback = EVENT_GALLERY.filter((_, index) => !overriddenIndexes.has(index));
        setGallery(adminGallery.length > 0 ? [...adminGallery, ...remainingFallback] : EVENT_GALLERY);
      }

      if (Array.isArray(bookItems)) {
        const adminBooks = bookItems.map((item) => ({
          title: item.title || '',
          author: item.author || '',
          description: item.description || '',
          cover: normalizeAssetUrl(item.imageUrl) || '/fire_altar/fire-on-altar-cover.jpg',
          file: item.fileUrl ? normalizeAssetUrl(item.fileUrl) : undefined,
        }));
        const overriddenIndexes = new Set(
          bookItems
            .map((item) => item.fallbackIndex)
            .filter((value): value is number => typeof value === 'number'),
        );
        const remainingFallback = BOOKS.filter((_, index) => !overriddenIndexes.has(index));
        setBooks(adminBooks.length > 0 ? [...adminBooks, ...remainingFallback] : BOOKS);
      }

      if (Array.isArray(magazineItems)) {
        const adminMagazines = magazineItems.map((item) => ({
          title: item.title || '',
          issue: item.issue || '',
          cover: normalizeAssetUrl(item.imageUrl) || '/magazine/magazine-1.jpeg',
          file: item.fileUrl ? normalizeAssetUrl(item.fileUrl) : undefined,
        }));
        const overriddenIndexes = new Set(
          magazineItems
            .map((item) => item.fallbackIndex)
            .filter((value): value is number => typeof value === 'number'),
        );
        const remainingFallback = MAGAZINES.filter((_, index) => !overriddenIndexes.has(index));
        setMagazines(adminMagazines.length > 0 ? [...adminMagazines, ...remainingFallback] : MAGAZINES);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const galleryItems = useMemo(() => {
    const baseGallery = gallery.map(item => {
      if (item.category === 'music' && musicVideos.length > 0) {
        return {
          ...item,
          image: musicVideos[0].thumbnail,
          title: musicVideos[0].title,
          isVideo: true,
          videoId: musicVideos[0].videoId,
          videoUrl: musicVideos[0].url
        };
      }
      return item;
    });

    if (galleryFilter === 'All') return baseGallery;
    if (galleryFilter === 'music' && musicVideos.length > 0) {
      return musicVideos.map(v => ({
        title: v.title,
        category: 'music',
        image: v.thumbnail,
        isVideo: true,
        videoId: v.videoId,
        videoUrl: v.url
      }));
    }
    return baseGallery.filter((item) => item.category === galleryFilter);
  }, [galleryFilter, gallery, musicVideos]);

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
              Browse our magazine issues and book downloads. New releases will be added here.
            </p>
          </div>
        </section>

        <ChurchNewsSection items={news} />

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
                  className="group relative overflow-hidden rounded-2xl shadow-md cursor-pointer"
                  onClick={() => {
                    if ((item as any).isVideo) {
                      setActiveVideo({
                        videoId: (item as any).videoId,
                        title: item.title,
                        thumbnail: item.image,
                        url: (item as any).videoUrl
                      });
                    }
                  }}
                >
                  <div className="relative h-56 sm:h-64">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {(item as any).isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                        <div className="h-12 w-12 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors pointer-events-none" />
                  <div className="absolute bottom-4 left-4 rounded-full bg-primary/90 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-foreground">
                    {(item as any).isVideo ? 'Music Video' : item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </div>
                  {!(item as any).isVideo && (
                    <div className="absolute right-4 bottom-4 opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0" onClick={(e) => e.stopPropagation()}>
                      <a href={item.image} download>
                        <Button variant="outline" className="rounded-full px-4 py-2 text-[11px]">
                          Download Photo
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Video Modal */}
            {activeVideo && (
              <div 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
                onClick={() => setActiveVideo(null)}
              >
                <div 
                  className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => setActiveVideo(null)}
                    className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1`}
                    title={activeVideo.title}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
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
              {books.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  {item.cover && (
                    <div className="relative mb-4 h-56 overflow-hidden rounded-xl">
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
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
                    <div className="flex flex-wrap gap-3">
                      <a href={item.file} target="_blank" rel="noreferrer">
                        <Button variant="outline" className="rounded-full px-5">
                          View PDF
                        </Button>
                      </a>
                      <a href={item.file} download>
                        <Button variant="outline" className="rounded-full px-5">
                          Download PDF
                        </Button>
                      </a>
                    </div>
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start mb-12">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                  Magazines
                </p>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                  Church Magazines
                </h2>
                <p className="text-foreground/70 mt-4 max-w-xl">
                  Explore recent church magazine covers. Full issues will be available soon.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {magazines.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  <div className="relative mb-4 h-56 overflow-hidden rounded-xl">
                    <Image
                      src={item.cover}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-3">
                    PICC Magazine
                  </p>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  {item.file ? (
                    <div className="flex flex-wrap gap-3">
                      <a href={item.file} target="_blank" rel="noreferrer">
                        <Button variant="outline" className="rounded-full px-5">
                          View
                        </Button>
                      </a>
                      <a href={item.file} download>
                        <Button variant="outline" className="rounded-full px-5">
                          Download
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <Button variant="outline" className="rounded-full px-5" disabled>
                      Coming Soon
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>


      </main>
      <Footer />
    </>
  );
}
