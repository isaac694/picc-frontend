'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LivestreamFooter from '@/components/LivestreamFooter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenText, MessageSquareText, StickyNote } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type ToolKey = 'bible' | 'notepad' | 'chat' | null;

type YouTubeVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
  updatedAt: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
  url: string;
  embedUrl: string;
  isLive?: boolean;
};

const TOOL_CONFIG = {
  bible: {
    label: 'Bible',
    url: 'https://app.fetch.bible',
  },
  notepad: {
    label: 'Notepad',
    url: 'https://notepadweb.co/',
  },
  chat: {
    label: 'Live Chat',
    url: 'https://embed.tlk.io/picc-worldwide-live',
  },
} as const;

export default function LivestreamPage() {
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const CHANNEL_ID = 'UC6auo8Q1xb5cgyY_pGJbfdw';
  const FALLBACK_HERO_ID = 'ydTADwZRquA';
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

  const featuredVideo = videos[0] || null;
  const gridVideos = videos.slice(1, 4);

  const formatDate = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    let isMounted = true;

    const toVideo = (item: any): YouTubeVideo | null => {
      const videoId = item?.id?.videoId;
      if (!videoId) return null;
      const snippet = item.snippet || {};
      return {
        videoId,
        title: snippet.title || '',
        publishedAt: snippet.publishedAt || '',
        updatedAt: snippet.publishedAt || '',
        channelTitle: snippet.channelTitle || '',
        description: snippet.description || '',
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        isLive: snippet.liveBroadcastContent === 'live',
      };
    };

    const fetchJson = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load videos');
      }
      return response.json();
    };

    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (!YOUTUBE_API_KEY) {
          throw new Error('Missing API key');
        }

        const liveUrl = new URL('https://www.googleapis.com/youtube/v3/search');
        liveUrl.searchParams.set('part', 'snippet');
        liveUrl.searchParams.set('channelId', CHANNEL_ID);
        liveUrl.searchParams.set('eventType', 'live');
        liveUrl.searchParams.set('type', 'video');
        liveUrl.searchParams.set('maxResults', '1');
        liveUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const recentUrl = new URL('https://www.googleapis.com/youtube/v3/search');
        recentUrl.searchParams.set('part', 'snippet');
        recentUrl.searchParams.set('channelId', CHANNEL_ID);
        recentUrl.searchParams.set('order', 'date');
        recentUrl.searchParams.set('type', 'video');
        recentUrl.searchParams.set('maxResults', '4');
        recentUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const [liveData, recentData] = await Promise.all([
          fetchJson(liveUrl.toString()),
          fetchJson(recentUrl.toString()),
        ]);

        const liveVideo = Array.isArray(liveData?.items) ? toVideo(liveData.items[0]) : null;
        const recentVideos: YouTubeVideo[] = Array.isArray(recentData?.items)
          ? recentData.items
            .map(toVideo)
            .filter((item: YouTubeVideo | null): item is YouTubeVideo => Boolean(item))
          : [];

        const merged: YouTubeVideo[] = [];
        if (liveVideo) merged.push(liveVideo);
        recentVideos.forEach((video: YouTubeVideo) => {
          if (!merged.find((existing) => existing.videoId === video?.videoId) && video) {
            merged.push(video);
          }
        });

        if (isMounted) {
          setVideos(merged.slice(0, 4));
        }
      } catch (error) {
        if (isMounted) {
          setLoadError('Unable to load the latest videos right now.');
          setVideos([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchVideos();
    return () => {
      isMounted = false;
    };
  }, [YOUTUBE_API_KEY]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const existingScript = document.getElementById('youtube-iframe-api');

    const handleReady = () => setYtReady(true);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = handleReady;
    } else if (window.YT && window.YT.Player) {
      handleReady();
    } else {
      window.onYouTubeIframeAPIReady = handleReady;
    }
  }, []);

  useEffect(() => {
    if (!ytReady || typeof window === 'undefined' || !window.YT?.Player) return;
    const players = new Map<string, any>();
    const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>('[data-yt-id]'));

    iframes.forEach((iframe) => {
      const videoId = iframe.dataset.ytId;
      if (!videoId || players.has(videoId)) return;
      const player = new window.YT.Player(iframe, {
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              players.forEach((p) => {
                if (p !== event.target) {
                  p.pauseVideo();
                }
              });
            }
          },
        },
      });
      players.set(videoId, player);
    });
  }, [ytReady]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <section className="py-16 sm:py-20 md:py-24 bg-black text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Watch <span className="text-red-500">Live</span> Services
            </h1>
            <p className="text-base md:text-lg text-white/80">
              Experience the Presence of God Anytime, Anywhere.
            </p>
          </div>
        </section>

        {/* Sunday Livestream Section */}
        <section className="py-12 md:py-16 bg-black">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <div className="aspect-video bg-black">
                <iframe
                  className="h-full w-full"
                  data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                  id="yt-hero"
                  src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                  title={featuredVideo?.title || 'Sunday Livestream'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="bg-white text-black px-6 py-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {featuredVideo?.title || 'Stream in English'}
                    </h3>
                    {featuredVideo?.publishedAt && (
                      <p className="text-xs text-black/60 mt-1">
                        {formatDate(featuredVideo.publishedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTool('bible')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-medium text-[#1E4FA3] hover:bg-[#DCEAFF] transition-colors"
                    >
                      <BookOpenText size={12} />
                      Bible
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool('notepad')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#FFF2DA] px-3 py-1 text-xs font-medium text-[#8A5A00] hover:bg-[#FFE9C2] transition-colors"
                    >
                      <StickyNote size={12} />
                      Notepad
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool('chat')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#E8FFF3] px-3 py-1 text-xs font-medium text-[#0F7A3E] hover:bg-[#D8F7E7] transition-colors"
                    >
                      <MessageSquareText size={12} />
                      Live Chat
                    </button>
                    <Link
                      href="/forms"
                      className="inline-flex items-center gap-2 rounded-full bg-[#CFF6DF] px-3 py-1 text-xs font-medium text-[#137A3D] hover:bg-[#BDEFD3] transition-colors"
                    >
                      Church Forms
                    </Link>
                    <Button asChild size="sm" className="rounded-full px-4 bg-[#39D98A] text-black hover:bg-[#2FC77C]">
                      <Link href="/give">Give</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {activeTool && (
          <section className="pb-12 md:pb-16 bg-black">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  {Object.entries(TOOL_CONFIG).map(([key, tool]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTool(key as ToolKey)}
                      className={`rounded-full px-3 py-1 transition-colors ${
                        activeTool === key
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {tool.label}
                    </button>
                  ))}
                  <span className="ml-auto text-[10px] normal-case tracking-normal text-white/50">
                    Embedded view
                  </span>
                </div>
                <div className="aspect-[4/3] w-full bg-black">
                  <iframe
                    className="h-full w-full"
                    src={TOOL_CONFIG[activeTool].url}
                    title={TOOL_CONFIG[activeTool].label}
                    allow="clipboard-write; fullscreen"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/70">
                  <span>{TOOL_CONFIG[activeTool].label}</span>
                  <Link
                    href={TOOL_CONFIG[activeTool].url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/80 hover:text-white hover:underline"
                  >
                    Open in new tab
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Search Section */}
        <section className="py-10 md:py-12 bg-black border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          </div>
        </section>

        {/* Livestreams Grid */}
        <section className="py-16 sm:py-20 md:py-24 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-lg text-white/70">Loading latest videos...</p>
              </div>
            ) : loadError ? (
              <div className="text-center py-12">
                <p className="text-lg text-white/70">{loadError}</p>
              </div>
            ) : gridVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridVideos.map((stream) => (
                  <Card key={stream.videoId} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-white border-black/10 text-black">
                    <div className="aspect-video bg-black">
                      <iframe
                        className="h-full w-full"
                        data-yt-id={stream.videoId}
                        id={`yt-${stream.videoId}`}
                        src={`${stream.embedUrl}?enablejsapi=1&rel=0`}
                        title={stream.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-4 flex flex-col">
                      <h3 className="font-bold text-lg text-black mb-2 line-clamp-2">{stream.title}</h3>
                      <p className="text-sm text-black/70 mb-3 line-clamp-2">{stream.description}</p>
                      <div className="space-y-1 text-sm text-black/60 mb-2">
                        <p>{stream.channelTitle}</p>
                        {stream.publishedAt && <p>{formatDate(stream.publishedAt)}</p>}
                      </div>
                      {stream.url && (
                        <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                          <Link href={stream.url} target="_blank" rel="noreferrer">
                            Watch on YouTube
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-white/70">No recent videos available yet.</p>
              </div>
            )}
          </div>
        </section>

      </main>
      <LivestreamFooter />
    </>
  );
}
