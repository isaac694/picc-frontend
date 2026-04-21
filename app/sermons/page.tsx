'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, apiUrl } from '@/lib/api';

// Extract YouTube video ID from a URL (handles ?v=, /embed/, youtu.be, and &t= timestamps)
function getYouTubeId(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : '';
}

// Extract start time (seconds) from a YouTube URL's &t= parameter
function getYouTubeStart(url: string): number {
  const match = url.match(/[?&]t=(\d+)s?/);
  return match ? parseInt(match[1], 10) : 0;
}

interface Sermon {
  id: number;
  title: string;
  date: string;
  image: string;
  views: string;
  youtubeUrl: string;
  audioSrc: string;
}

const SERMON_AUDIO = '/audio/sermon-audio.mp3';

const SERMONS = [
  {
    id: 1,
    title: 'Faith for All-Round Possibilities',
    date: '10 April, 2025',
    image: '/hero/hero-6.jpg',
    views: '1,232',
    youtubeUrl: 'https://www.youtube.com/watch?v=joxnOHDoQvk',
    audioSrc: SERMON_AUDIO,
  },
  {
    id: 2,
    title: 'Faith for Supernatural Supplies',
    date: '10 April, 2025',
    image: '/hero/hero-4.jpg',
    views: '1,127',
    youtubeUrl: 'https://www.youtube.com/watch?v=IloZ7uo2UYY',
    audioSrc: SERMON_AUDIO,
  },
  {
    id: 3,
    title: 'Impartation of the Spirit of Faith',
    date: '10 April, 2025',
    image: '/hero/hero-3.jpg',
    views: '981',
    youtubeUrl: 'https://www.youtube.com/watch?v=joxnOHDoQvk&t=250s',
    audioSrc: SERMON_AUDIO,
  },
  {
    id: 4,
    title: 'Operating in the Spirit of Faith',
    date: '16 February, 2023',
    image: '/hero/hero-2.jpg',
    views: '742',
    youtubeUrl: 'https://www.youtube.com/watch?v=ubcp3QMiMAE&t=280s',
    audioSrc: SERMON_AUDIO,
  },
  {
    id: 5,
    title: 'The Faith That Works',
    date: '16 February, 2023',
    image: '/hero/hero-1.jpg',
    views: '839',
    youtubeUrl: 'https://www.youtube.com/watch?v=hMJUnkBimKg',
    audioSrc: SERMON_AUDIO,
  },
  {
    id: 6,
    title: 'Faith-Provoking Praise (Part 4)',
    date: '16 February, 2023',
    image: '/hero/hero-5.png',
    views: '690',
    youtubeUrl: 'https://www.youtube.com/watch?v=UxOOG7_fhD0',
    audioSrc: SERMON_AUDIO,
  },
];

export default function SermonsPage() {
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const selectedSermonRef = useRef<HTMLElement | null>(null);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [headerImage, setHeaderImage] = useState('/sermons/header.JPG');
  const [loading, setLoading] = useState(true);

  const normalizeImageUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return apiUrl(url);
  };

  useEffect(() => {
    const fetchSermonsData = async () => {
      try {
        // Fetch sermons list
        const sermonsResponse = await apiFetch('/api/sermons');
        if (sermonsResponse.ok) {
          const sermonsData = await sermonsResponse.json();
          setSermons(sermonsData);
        } else {
          // Fallback to static data if API fails
          setSermons(SERMONS);
        }

        // Fetch header image
        const headerResponse = await apiFetch('/api/site-content/sermons-header-image');
        if (headerResponse.ok) {
          const headerData = await headerResponse.json();
          if (headerData.imageUrl) {
            setHeaderImage(normalizeImageUrl(headerData.imageUrl));
          }
        }
      } catch (error) {
        // Fallback to static data if API fails
        setSermons(SERMONS);
      } finally {
        setLoading(false);
      }
    };

    fetchSermonsData();
  }, []);

  useEffect(() => {
    if (!selectedSermon) return;
    setIsPlaying(false); // reset player when a new sermon is selected
    selectedSermonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedSermon]);

  useEffect(() => {
    if (!selectedSermon) return;
    setIsPlaying(false); // reset player when a new sermon is selected
    selectedSermonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedSermon]);

  // Build the YouTube embed URL with optional start time
  function buildEmbedUrl(youtubeUrl: string, autoplay = false): string {
    const videoId = getYouTubeId(youtubeUrl);
    const start = getYouTubeStart(youtubeUrl);
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      ...(autoplay && { autoplay: '1' }),
      ...(start > 0 && { start: String(start) }),
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* ── Hero / Selected Sermon ── */}
        {selectedSermon ? (
          <section
            ref={selectedSermonRef}
            className="relative overflow-hidden py-20 sm:py-24 md:py-32 text-white rounded-b-[36px] md:rounded-b-[48px]"
          >
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)]" />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4">
                  Now watching
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
                  {selectedSermon.title}
                </h1>
                <p className="text-white/80 mb-6">{selectedSermon.date}</p>

                {/* Video player area */}
                <div className="relative w-full max-w-4xl aspect-[16/9] rounded-[24px] overflow-hidden shadow-2xl bg-black">
                  {isPlaying ? (
                    /* Embedded YouTube iframe — plays in-page, no redirect */
                    <iframe
                      key={selectedSermon.id}
                      src={buildEmbedUrl(selectedSermon.youtubeUrl, true)}
                      title={selectedSermon.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  ) : (
                    /* Thumbnail with play button overlay */
                    <>
                      <Image
                        src={normalizeImageUrl(selectedSermon.image)}
                        alt={selectedSermon.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setIsPlaying(true)}
                          aria-label="Play sermon video"
                          className="group flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 hover:bg-white/30 transition-all duration-200 hover:scale-105"
                        >
                          {/* Triangle play icon */}
                          <svg
                            className="w-8 h-8 text-white ml-1"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Audio player */}
                <div className="w-full max-w-4xl mt-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60 mb-2 text-center">
                    Listen to Audio
                  </p>
                  <audio
                    key={selectedSermon.id}
                    controls
                    className="w-full rounded-full"
                    src={normalizeImageUrl(selectedSermon.audioSrc)}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {!isPlaying && (
                    <button
                      type="button"
                      onClick={() => setIsPlaying(true)}
                      className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Play Sermon
                    </button>
                  )}
                  <span className="text-sm text-white/80">{selectedSermon.views} views</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSermon(null);
                      setIsPlaying(false);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors"
                  >
                    Back to all sermons
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* ── Default hero banner ── */
          <section className="relative overflow-hidden py-24 sm:py-32 md:py-48 text-white rounded-b-[36px] md:rounded-b-[48px]">
            <div className="absolute inset-0">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${headerImage})` }}
              />
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
        )}

        {/* ── Sermons Grid ── */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(sermons || []).map((sermon) => (
                <article key={sermon.id} className="group">
                  <div className="relative overflow-hidden rounded-[18px] bg-black/5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setSelectedSermon(sermon)}
                      className="relative aspect-[16/10] w-full text-left"
                      aria-label={`Watch sermon: ${sermon.title}`}
                    >
                      <Image
                        src={normalizeImageUrl(sermon.image)}
                        alt={sermon.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      {/* Thumbnail overlay with play icon */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="flex items-center justify-center w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm border border-white/50">
                          <svg className="w-6 h-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </div>
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