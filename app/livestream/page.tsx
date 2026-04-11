'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LivestreamFooter from '@/components/LivestreamFooter';
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import GiveTool from '@/components/livestream/GiveTool';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenText, MessageSquareText, StickyNote } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type ToolKey = 'bible' | 'notepad' | 'chat' | 'testimony' | 'give' | null;

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
} as const;

const TOOL_TABS: Array<{ key: ToolKey; label: string; kind: 'embed' | 'component' | 'form' }> = [
  { key: 'chat', label: 'Live Chat', kind: 'component' },
  { key: 'notepad', label: 'Notepad', kind: 'component' },
  { key: 'bible', label: 'Bible', kind: 'embed' },
  { key: 'testimony', label: 'Send Testimony', kind: 'form' },
  { key: 'give', label: 'Give', kind: 'form' },
];

export default function LivestreamPage() {
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const playersRef = useRef<Map<string, any>>(new Map());

  const CHANNEL_ID = 'UC5iA3dWaUBlP_PBlGSQvgNQ';
  const FALLBACK_HERO_ID = 'ydTADwZRquA';
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
  const activeEmbedTool = activeTool && activeTool !== 'testimony' && activeTool !== 'give' && activeTool !== 'chat' && activeTool !== 'notepad'
    ? TOOL_CONFIG[activeTool]
    : null;

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

    const toVideoFromSearch = (item: any): YouTubeVideo | null => {
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

    const toVideoFromPlaylist = (item: any): YouTubeVideo | null => {
      const videoId = item?.contentDetails?.videoId;
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
        isLive: false,
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

        const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
        channelUrl.searchParams.set('part', 'contentDetails');
        channelUrl.searchParams.set('id', CHANNEL_ID);
        channelUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const liveUrl = new URL('https://www.googleapis.com/youtube/v3/search');
        liveUrl.searchParams.set('part', 'snippet');
        liveUrl.searchParams.set('channelId', CHANNEL_ID);
        liveUrl.searchParams.set('eventType', 'live');
        liveUrl.searchParams.set('type', 'video');
        liveUrl.searchParams.set('maxResults', '1');
        liveUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const channelData = await fetchJson(channelUrl.toString());
        const uploadsPlaylistId =
          channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) {
          throw new Error('Missing uploads playlist');
        }

        const uploadsUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        uploadsUrl.searchParams.set('part', 'snippet,contentDetails');
        uploadsUrl.searchParams.set('playlistId', uploadsPlaylistId);
        uploadsUrl.searchParams.set('maxResults', '6');
        uploadsUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const [liveData, uploadsData] = await Promise.all([
          fetchJson(liveUrl.toString()),
          fetchJson(uploadsUrl.toString()),
        ]);

        const liveVideo = Array.isArray(liveData?.items)
          ? toVideoFromSearch(liveData.items[0])
          : null;
        const recentVideos: YouTubeVideo[] = Array.isArray(uploadsData?.items)
          ? uploadsData.items
            .map(toVideoFromPlaylist)
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
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileViewport(event.matches);
    };
    handleChange(mediaQuery);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    legacyMediaQuery.addListener?.(handleChange as (event: MediaQueryListEvent) => void);
    return () => legacyMediaQuery.removeListener?.(handleChange as (event: MediaQueryListEvent) => void);
  }, []);

  useEffect(() => {
    if (!ytReady || typeof window === 'undefined' || !window.YT?.Player) return;
    const players = playersRef.current;
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
  }, [ytReady, activeTool]);

  const mobilePlayerActive = isMobileViewport && activeTool;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!mobilePlayerActive) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [mobilePlayerActive]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <section className={`py-16 sm:py-20 md:py-24 bg-black text-white ${mobilePlayerActive ? 'hidden md:block' : ''}`}>
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
        <section className={`py-12 md:py-16 bg-black ${mobilePlayerActive ? 'hidden md:block' : ''}`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <div
                className={
                  mobilePlayerActive
                    ? 'sticky top-16 z-40 h-[40svh] bg-black'
                    : 'relative aspect-video bg-black'
                }
              >
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
              <div className={`bg-white text-black px-6 py-5 ${mobilePlayerActive ? 'hidden md:block' : ''}`}>
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
                    <button
                      type="button"
                      onClick={() => setActiveTool('testimony')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#CFF6DF] px-3 py-1 text-xs font-medium text-[#137A3D] hover:bg-[#BDEFD3] transition-colors"
                    >
                      Send Testimony
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool('give')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#39D98A] px-3 py-1 text-xs font-semibold text-black hover:bg-[#2FC77C] transition-colors"
                    >
                      Give
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {activeTool && (
          <>
            <section className="pb-12 md:pb-16 bg-black hidden md:block">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                  <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    {TOOL_TABS.map((tool) => (
                      <button
                        key={tool.key}
                        type="button"
                        onClick={() => setActiveTool(tool.key)}
                        className={`rounded-full px-3 py-1 transition-colors ${
                          activeTool === tool.key
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
                  {activeEmbedTool && (
                    <div className="aspect-[4/3] w-full bg-black">
                      <iframe
                        className="h-full w-full"
                        src={activeEmbedTool.url}
                        title={activeEmbedTool.label}
                        allow="clipboard-write; fullscreen"
                      />
                    </div>
                  )}
                  {activeTool === 'chat' && (
                    <div className="h-[400px] w-full bg-black">
                      <LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} />
                    </div>
                  )}
                  {activeTool === 'notepad' && (
                    <NotepadTool />
                  )}
                  {activeTool === 'testimony' && (
                    <div className="px-5 py-6 text-white text-black">
                      <TestimonyTool />
                    </div>
                  )}
                  {activeTool === 'give' && (
                    <div className="px-5 text-white">
                      <GiveTool isMobile={false} />
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/70">
                    <span>
                      {activeTool === 'testimony'
                        ? 'Testimony Form'
                        : activeTool === 'give'
                          ? 'Giving Form'
                          : activeTool === 'chat'
                            ? 'Live Chat'
                            : activeEmbedTool?.label}
                      {activeTool === 'notepad' && (
                        <span className="ml-2 text-white/50">
                          Tip: use the save/download button inside the notepad.
                        </span>
                      )}
                    </span>
                    {activeEmbedTool && (
                      <Link
                        href={activeEmbedTool.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white/80 hover:text-white hover:underline"
                      >
                        Open in new tab
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </section>
            {mobilePlayerActive ? (
              <section className="md:hidden fixed top-16 left-0 right-0 bottom-0 z-40 bg-black">
                <div className="h-full flex flex-col">
                  <div className="flex-[0_0_40%] bg-black">
                    <iframe
                      className="h-full w-full"
                      data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                      id="yt-hero-mobile"
                      src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                      title={featuredVideo?.title || 'Sunday Livestream'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex-[1_1_60%] px-4 py-5 text-white overflow-y-auto bg-black">
                    <div className="mb-4 border-b border-white/10 pb-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/70">
                        {TOOL_TABS.map((tool) => (
                          <button
                            key={tool.key}
                            type="button"
                            onClick={() => setActiveTool(tool.key)}
                            className={`rounded-full px-3 py-1 transition-colors ${
                              activeTool === tool.key
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            {tool.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setActiveTool(null)}
                          className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    {activeEmbedTool && (
                      <div className="aspect-[4/3] w-full bg-black mb-4">
                        <iframe
                          className="h-full w-full"
                          src={activeEmbedTool.url}
                          title={activeEmbedTool.label}
                          allow="clipboard-write; fullscreen"
                        />
                      </div>
                    )}
                    {activeTool === 'chat' && (
                      <div className="h-[300px] w-full bg-black mb-4">
                        <LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} />
                      </div>
                    )}
                    {activeTool === 'notepad' && (
                      <div className="mb-4">
                        <NotepadTool />
                      </div>
                    )}
                    {activeTool === 'testimony' && (
                      <div className="px-4 py-5 text-white">
                        <TestimonyTool />
                      </div>
                    )}
                    {activeTool === 'give' && (
                      <div className="px-4 py-5 text-white">
                        <GiveTool isMobile={true} />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className="md:hidden pb-12 bg-black">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 h-[60vh] flex flex-col">
                    <div className="border-b border-white/10 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/70">
                        {TOOL_TABS.map((tool) => (
                          <button
                            key={tool.key}
                            type="button"
                            onClick={() => setActiveTool(tool.key)}
                            className={`rounded-full px-3 py-1 transition-colors ${
                              activeTool === tool.key
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            {tool.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setActiveTool(null)}
                          className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-5 text-white flex-1 overflow-y-auto">
                      {activeEmbedTool && (
                        <div className="aspect-[4/3] w-full bg-black mb-4">
                          <iframe
                            className="h-full w-full"
                            src={activeEmbedTool.url}
                            title={activeEmbedTool.label}
                            allow="clipboard-write; fullscreen"
                          />
                        </div>
                      )}
                      {activeTool === 'chat' && (
                        <div className="h-[300px] w-full bg-black mb-4">
                          <LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} />
                        </div>
                      )}
                      {activeTool === 'notepad' && (
                        <div className="mb-4">
                          <NotepadTool />
                        </div>
                      )}
                      {activeTool === 'testimony' && (
                        <div className="px-4 py-5 text-white">
                          <TestimonyTool />
                        </div>
                      )}
                      {activeTool === 'give' && (
                        <div className="px-4 py-5 text-white">
                          <GiveTool isMobile={true} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Search Section */}
        <section className={`py-10 md:py-12 bg-black border-b border-white/10 ${mobilePlayerActive ? 'hidden md:block' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          </div>
        </section>

        {/* Livestreams Grid */}
        <section className={`py-16 sm:py-20 md:py-24 bg-black ${mobilePlayerActive ? 'hidden md:block' : ''}`}>
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
      {!mobilePlayerActive && <LivestreamFooter />}
    </>
  );
}
