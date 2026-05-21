'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LivestreamFooter from '@/components/LivestreamFooter';
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import GiveTool from '@/components/livestream/GiveTool';
import PrayerRequestTool from '@/components/livestream/PrayerRequestTool';
import BibleTool from '@/components/livestream/BibleTool';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenText, MessageSquareText, StickyNote } from 'lucide-react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type ToolKey = "bible" | "notepad" | "chat" | "testimony" | "prayer" | "give" | null;

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
  canEmbed?: boolean;
};

type YouTubeThumbnail = {
  url?: string;
};

type YouTubeSnippet = {
  title?: string;
  publishedAt?: string;
  channelTitle?: string;
  description?: string;
  liveBroadcastContent?: string;
  thumbnails?: {
    high?: YouTubeThumbnail;
    medium?: YouTubeThumbnail;
  };
};

type YouTubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: YouTubeSnippet;
};

type YouTubePlaylistItem = {
  contentDetails?: {
    videoId?: string;
  };
  snippet?: YouTubeSnippet;
};

type YouTubePlayer = {
  pauseVideo: () => void;
  getCurrentTime?: () => number;
};

type YouTubePlayerStateChangeEvent = {
  data: number;
  target: YouTubePlayer;
};

type YouTubeIframeApi = {
  Player: new (
    iframe: HTMLIFrameElement,
    options: {
      events: {
        onStateChange: (event: YouTubePlayerStateChangeEvent) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: {
    PLAYING: number;
  };
};

const CHANNEL_ID = "UC5iA3dWaUBlP_PBlGSQvgNQ";
const YOUTH_CHURCH_CHANNEL_ID = "UC_aXxxQF62jKWRK3xjzOZPg";
const RELATED_CHANNEL_IDS = [
  "UC8JUC-G4wKhrrPr7xjxYWJw",
  YOUTH_CHURCH_CHANNEL_ID,
  "UC6auo8Q1xb5cgyY_pGJbfdw",
];
const FALLBACK_HERO_ID = "ydTADwZRquA";

const TOOL_TABS: Array<{
  key: ToolKey;
  label: string;
  kind: "embed" | "component" | "form";
}> = [
  { key: "chat", label: "Live Chat", kind: "component" },
  { key: "notepad", label: "Notepad", kind: "component" },
  { key: "bible", label: "Bible", kind: "component" },
  { key: "testimony", label: "Send Testimony", kind: "form" },
  { key: "prayer", label: "Prayer Request", kind: "form" },
  { key: "give", label: "Give", kind: "form" },
];

export default function LivestreamPage() {
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileResumeAt, setMobileResumeAt] = useState<number | null>(null);
  const playersRef = useRef<Map<string, YouTubePlayer>>(new Map());

  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

  const featuredVideo = videos[0] || null;
  const gridVideos = videos.slice(1, 4);

  const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Africa/Blantyre",
    });
  };

  useEffect(() => {
    let isMounted = true;

    const toVideoFromSearch = (
      item?: YouTubeSearchItem,
      canEmbed = true,
    ): YouTubeVideo | null => {
      const videoId = item?.id?.videoId;
      if (!videoId) return null;
      const snippet = item.snippet || {};
      return {
        videoId,
        title: snippet.title || "",
        publishedAt: snippet.publishedAt || "",
        updatedAt: snippet.publishedAt || "",
        channelTitle: snippet.channelTitle || "",
        description: snippet.description || "",
        thumbnail:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        isLive: snippet.liveBroadcastContent === "live",
        canEmbed,
      };
    };

    const toVideoFromPlaylist = (
      item?: YouTubePlaylistItem,
      canEmbed = true,
    ): YouTubeVideo | null => {
      const videoId = item?.contentDetails?.videoId;
      if (!videoId) return null;
      const snippet = item.snippet || {};
      return {
        videoId,
        title: snippet.title || "",
        publishedAt: snippet.publishedAt || "",
        updatedAt: snippet.publishedAt || "",
        channelTitle: snippet.channelTitle || "",
        description: snippet.description || "",
        thumbnail:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        isLive: false,
        canEmbed,
      };
    };

    const fetchJson = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to load videos");
      }
      return response.json();
    };

    const fetchLatestUpload = async (
      channelId: string,
      canEmbed = true,
      maxResults = 1,
    ) => {
      const channelUrl = new URL(
        "https://www.googleapis.com/youtube/v3/channels",
      );
      channelUrl.searchParams.set("part", "contentDetails");
      channelUrl.searchParams.set("id", channelId);
      channelUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const channelData = await fetchJson(channelUrl.toString());
      const uploadsPlaylistId =
        channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) return null;

      const uploadsUrl = new URL(
        "https://www.googleapis.com/youtube/v3/playlistItems",
      );
      uploadsUrl.searchParams.set("part", "snippet,contentDetails");
      uploadsUrl.searchParams.set("playlistId", uploadsPlaylistId);
      uploadsUrl.searchParams.set("maxResults", String(maxResults));
      uploadsUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const uploadsData = await fetchJson(uploadsUrl.toString());
      const playlistVideos: YouTubeVideo[] = Array.isArray(uploadsData?.items)
        ? uploadsData.items
            .map((item: YouTubePlaylistItem) =>
              toVideoFromPlaylist(item, canEmbed),
            )
            .filter((item: YouTubeVideo | null): item is YouTubeVideo =>
              Boolean(item),
            )
        : [];

      return playlistVideos[0] || null;
    };

    const fetchLatestEmbeddableVideo = async (channelId: string) => {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("channelId", channelId);
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("order", "date");
      searchUrl.searchParams.set("videoEmbeddable", "true");
      searchUrl.searchParams.set("maxResults", "1");
      searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const searchData = await fetchJson(searchUrl.toString());
      return Array.isArray(searchData?.items)
        ? toVideoFromSearch(searchData.items[0])
        : null;
    };

    const fetchRelatedVideo = async (channelId: string) => {
      const [embeddableVideo, latestUpload] = await Promise.all([
        fetchLatestEmbeddableVideo(channelId),
        fetchLatestUpload(channelId, false),
      ]);

      return embeddableVideo || latestUpload;
    };

    const fetchHeroVideo = async () => {
      const liveUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      liveUrl.searchParams.set("part", "snippet");
      liveUrl.searchParams.set("channelId", CHANNEL_ID);
      liveUrl.searchParams.set("eventType", "live");
      liveUrl.searchParams.set("type", "video");
      liveUrl.searchParams.set("maxResults", "1");
      liveUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const [liveData, latestUpload] = await Promise.all([
        fetchJson(liveUrl.toString()),
        fetchLatestUpload(CHANNEL_ID, true),
      ]);

      const liveVideo = Array.isArray(liveData?.items)
        ? toVideoFromSearch(liveData.items[0])
        : null;

      return liveVideo || latestUpload;
    };

    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (!YOUTUBE_API_KEY) {
          throw new Error("Missing API key");
        }

        const [heroVideo, relatedVideos] = await Promise.all([
          fetchHeroVideo(),
          Promise.all(
            RELATED_CHANNEL_IDS.map((channelId) =>
              fetchRelatedVideo(channelId),
            ),
          ),
        ]);

        const merged = [
          heroVideo,
          ...relatedVideos,
        ].filter((item: YouTubeVideo | null): item is YouTubeVideo =>
          Boolean(item),
        );

        if (isMounted) {
          setVideos(merged.slice(0, 4));
        }
      } catch {
        if (isMounted) {
          setLoadError("Unable to load the latest videos right now.");
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
    if (typeof window === "undefined") return;
    const existingScript = document.getElementById("youtube-iframe-api");

    const handleReady = () => setYtReady(true);

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = handleReady;
    } else if (window.YT && window.YT.Player) {
      handleReady();
    } else {
      window.onYouTubeIframeAPIReady = handleReady;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileViewport(event.matches);
    };
    handleChange(mediaQuery);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    legacyMediaQuery.addListener?.(
      handleChange as (event: MediaQueryListEvent) => void,
    );
    return () =>
      legacyMediaQuery.removeListener?.(
        handleChange as (event: MediaQueryListEvent) => void,
      );
  }, []);

  useEffect(() => {
    if (!ytReady || typeof window === "undefined" || !window.YT?.Player) return;
    const yt = window.YT;
    const players = playersRef.current;
    const iframes = Array.from(
      document.querySelectorAll<HTMLIFrameElement>("[data-yt-id]"),
    );

    iframes.forEach((iframe) => {
      const videoId = iframe.dataset.ytId;
      if (!videoId || players.has(videoId)) return;
      const player = new yt.Player(iframe, {
        events: {
          onStateChange: (event: YouTubePlayerStateChangeEvent) => {
            if (event.data === yt.PlayerState.PLAYING) {
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
  const activeEmbedTool = TOOL_TABS.find(t => t.key === activeTool && t.kind === "embed") as { url: string; label: string } | undefined;

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

  useEffect(() => {
    if (!isMobileViewport || !activeTool) return;
    const videoId = featuredVideo?.videoId || FALLBACK_HERO_ID;
    const player = playersRef.current.get(videoId);
    if (!player || typeof player.getCurrentTime !== 'function') {
      setMobileResumeAt(null);
      return;
    }
    try {
      const currentTime = player.getCurrentTime();
      if (Number.isFinite(currentTime)) {
        setMobileResumeAt(Math.floor(currentTime));
      } else {
        setMobileResumeAt(null);
      }
    } catch {
      setMobileResumeAt(null);
    }
  }, [activeTool, isMobileViewport, featuredVideo?.videoId]);

  const mobileVideoId = featuredVideo?.videoId || FALLBACK_HERO_ID;
  const mobileVideoStart = mobileResumeAt && mobileResumeAt > 0 ? `&start=${mobileResumeAt}` : '';

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black text-white">
        {!mobilePlayerActive && (
          <>
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
                  <div className="relative aspect-video bg-black">
                    <iframe
                      className="h-full w-full"
                      data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                      id="yt-hero"
                      src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                      title={featuredVideo?.title || "Sunday Livestream"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <div className="bg-white text-black px-6 py-5">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(360px,auto)] md:items-center">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">
                          {featuredVideo?.title || "Stream in English"}
                        </h3>
                        {featuredVideo?.publishedAt && (
                          <p className="text-xs text-black/60 mt-1">
                            {formatDate(featuredVideo.publishedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveTool("bible")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-medium text-[#1E4FA3] hover:bg-[#DCEAFF] transition-colors"
                        >
                          <BookOpenText size={12} />
                          Bible
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("notepad")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#FFF2DA] px-3 py-1 text-xs font-medium text-[#8A5A00] hover:bg-[#FFE9C2] transition-colors"
                        >
                          <StickyNote size={12} />
                          Notepad
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("chat")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#E8FFF3] px-3 py-1 text-xs font-medium text-[#0F7A3E] hover:bg-[#D8F7E7] transition-colors"
                        >
                          <MessageSquareText size={12} />
                          Live Chat
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("testimony")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#CFF6DF] px-3 py-1 text-xs font-medium text-[#137A3D] hover:bg-[#BDEFD3] transition-colors"
                        >
                          Send Testimony
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("prayer")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-medium text-[#1E4FA3] hover:bg-[#DCEAFF] transition-colors"
                        >
                          Prayer Request
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("give")}
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
          </>
        )}
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
                            ? "bg-white text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {tool.label}
                      </button>
                    ))}
                  </div>
                  {activeTool === "bible" && <BibleTool />}
                  {activeTool === "chat" && (
                    <div className="h-[400px] w-full bg-black">
                      <LiveChat
                        videoId={featuredVideo?.videoId || FALLBACK_HERO_ID}
                        videoTitle={featuredVideo?.title || 'Sunday Livestream'}
                      />
                    </div>
                  )}
                  {activeTool === "notepad" && <NotepadTool />}
                  {activeTool === "testimony" && (
                    <div className="px-5 py-6 text-white">
                      <TestimonyTool />
                    </div>
                  )}
                  {activeTool === "prayer" && (
                    <div className="px-5 py-6 text-white">
                      <PrayerRequestTool />
                    </div>
                  )}
                  {activeTool === "give" && (
                    <div className="px-5 py-6 text-white">
                      <GiveTool isMobile={false} />
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/70">
                    <span>
                      {activeTool === "testimony"
                        ? "Testimony Form"
                        : activeTool === "prayer"
                          ? "Prayer Request Form"
                        : activeTool === "give"
                          ? "Giving Form"
                          : activeTool === "chat"
                            ? "Live Chat"
                            : activeTool === "bible"
                              ? "Bible"
                              : ""}
                      {activeTool === "notepad" && (
                        <span className="ml-2 text-white/50">
                          Tip: use the save/download button inside the notepad.
                        </span>
                      )}
                    </span>
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
                      data-yt-id={mobileVideoId}
                      id="yt-hero-mobile"
                      src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0&autoplay=1&playsinline=1${mobileVideoStart}`}
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
                    {activeTool === "chat" && (
                      <div className="h-[300px] w-full bg-black mb-4">
                        <LiveChat
                          videoId={featuredVideo?.videoId || FALLBACK_HERO_ID}
                          videoTitle={featuredVideo?.title || 'Sunday Livestream'}
                        />
                      </div>
                    )}
                    {activeTool === "bible" && (
                      <div className="mb-4">
                        <BibleTool />
                      </div>
                    )}
                    {activeTool === "notepad" && (
                      <div className="mb-4">
                        <NotepadTool />
                      </div>
                    )}
                    {activeTool === "testimony" && (
                      <div className="px-4 py-5 text-white">
                        <TestimonyTool />
                      </div>
                    )}
                    {activeTool === "prayer" && (
                      <div className="px-4 py-5 text-white">
                        <PrayerRequestTool />
                      </div>
                    )}
                    {activeTool === "give" && (
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
                          <LiveChat
                            videoId={featuredVideo?.videoId || FALLBACK_HERO_ID}
                            videoTitle={featuredVideo?.title || 'Sunday Livestream'}
                          />
                        </div>
                      )}
                      {activeTool === 'bible' && (
                        <div className="mb-4">
                          <BibleTool />
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
                      {activeTool === 'prayer' && (
                        <div className="px-4 py-5 text-white">
                          <PrayerRequestTool />
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
                <p className="text-lg text-white/70">
                  Loading videos from other channels...
                </p>
              </div>
            ) : loadError ? (
              <div className="text-center py-12">
                <p className="text-lg text-white/70">{loadError}</p>
              </div>
            ) : gridVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridVideos.map((stream) => (
                  <Card
                    key={stream.videoId}
                    className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-white border-black/10 text-black"
                  >
                    <div className="aspect-video bg-black">
                      {stream.canEmbed === false ? (
                        <Link
                          href={stream.url}
                          target="_blank"
                          rel="noreferrer"
                          className="relative block h-full w-full"
                          aria-label={`Watch ${stream.title} on YouTube`}
                        >
                          {stream.thumbnail ? (
                            <Image
                              src={stream.thumbnail}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-black" />
                          )}
                          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg">
                              Watch on YouTube
                            </span>
                          </span>
                        </Link>
                      ) : (
                        <iframe
                          className="h-full w-full"
                          data-yt-id={stream.videoId}
                          id={`yt-${stream.videoId}`}
                          src={`${stream.embedUrl}?enablejsapi=1&rel=0`}
                          title={stream.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      )}
                    </div>
                    <div className="p-4 flex flex-col">
                      <h3 className="font-bold text-lg text-black mb-2 line-clamp-2">
                        {stream.title}
                      </h3>
                      <p className="text-sm text-black/70 mb-3 line-clamp-2">
                        {stream.description}
                      </p>
                      <div className="space-y-1 text-sm text-black/60 mb-2">
                        <p>{stream.channelTitle}</p>
                        {stream.publishedAt && (
                          <p>{formatDate(stream.publishedAt)}</p>
                        )}
                      </div>
                      {stream.url && (
                        <Button
                          asChild
                          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                          <Link
                            href={stream.url}
                            target="_blank"
                            rel="noreferrer"
                          >
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
                <p className="text-lg text-white/70">
                  No recent videos available yet.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      {!mobilePlayerActive && <LivestreamFooter />}
    </>
  );
}
