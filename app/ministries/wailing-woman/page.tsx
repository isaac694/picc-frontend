'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { 
  ChevronLeft, ChevronRight, Waves, MapPin, 
  Phone, Mail, CalendarClock, BookOpen, Globe, 
  Target, MessageCircle, BookOpenText, MessageSquareText, StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- LIVESTREAM COMPONENTS ---
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import GiveTool from '@/components/livestream/GiveTool';
import PrayerRequestTool from '@/components/livestream/PrayerRequestTool';
import BibleTool from '@/components/livestream/BibleTool';

// --- TYPES & GLOBALS ---
declare global {
  interface Window {
    YT?: YouTubeIframeApi;
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

// --- MOCK DATA ---
const pastEvents = [
  {
    id: 1,
    title: 'Midnight for Children Prayer Conference',
    date: 'Consecutive Days',
    description: 'Online midnight prayers running for several consecutive days, standing in the gap for the destinies of our children.',
    image: '/hero/hero-1.jpg',
  },
  {
    id: 2,
    title: 'Ministry Launch',
    date: 'January 17, 2025',
    description: 'The official launch of our midnight prayers, which has now grown to over 2,500 members globally.',
    image: '/hero/hero-2.jpg',
  },
];

const highlightGallery = [
  { id: 1, src: '/moments/ww-1.jpg', caption: 'Deep intercession during the midnight watch.' },
  { id: 2, src: '/moments/ww-2.jpg', caption: 'Mothers standing in the gap for their children.' },
  { id: 3, src: '/moments/ww-3.jpg', caption: 'The Altar of Prayer ablaze.' },
  { id: 4, src: '/moments/ww-4.jpg', caption: 'Prophetic declarations over the next generation.' },
  { id: 5, src: '/moments/ww-5.jpg', caption: 'Tears of travail birthing new destinies.' },
  { id: 6, src: '/moments/ww-6.jpg', caption: 'Corporate worship and warfare.' },
];

const publishedMaterials = [
  { id: 1, type: 'Prosperity Arrow', title: 'Week 42 Confession', date: 'April 27, 2026', image: '/materials/arrow-current.jpg' },
  { id: 2, type: 'Weekly Devotional', title: 'The Power of the Secret Place', date: 'April 23, 2026', image: '/materials/devo-1.jpg' },
  { id: 3, type: 'Prosperity Arrow', title: 'Week 41 Confession', date: 'April 20, 2026', image: '/materials/arrow-old1.jpg' },
  { id: 4, type: 'Weekly Devotional', title: 'Birthing Through Prayer', date: 'April 9, 2026', image: '/materials/devo-2.jpg' },
  { id: 5, type: 'Prosperity Arrow', title: 'Week 40 Confession', date: 'April 13, 2026', image: '/materials/arrow-old2.jpg' },
];

export default function WailingWomenPage() {
  // --- STATE ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeGalleryId, setActiveGalleryId] = useState<number | null>(null);

  // --- LIVESTREAM STATE ---
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

  const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  // --- EFFECTS ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % pastEvents.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % pastEvents.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? pastEvents.length - 1 : prev - 1));

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
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || "",
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
      if (!response.ok) throw new Error("Failed to load videos");
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
          if (merged.length > 0) {
            setVideos(merged);
          } else {
            setVideos([{
              videoId: FALLBACK_HERO_ID,
              title: "Wailing Woman - Midnight Prayers",
              publishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              channelTitle: "Wailing Woman",
              description: "Join us for our scheduled midnight warfare prayers.",
              thumbnail: "",
              url: `https://www.youtube.com/watch?v=${FALLBACK_HERO_ID}`,
              embedUrl: `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`,
              isLive: false
            }]);
          }
        }
      } catch {
        if (isMounted) {
          setLoadError("Unable to load the live video right now.");
          setVideos([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchVideos();
    return () => { isMounted = false; };
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
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => setIsMobileViewport(event.matches);
    handleChange(mediaQuery);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  useEffect(() => {
    if (!ytReady || typeof window === "undefined" || !window.YT?.Player) return;
    const yt = window.YT;
    const players = playersRef.current;
    const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("[data-yt-id]"));

    iframes.forEach((iframe) => {
      const videoId = iframe.dataset.ytId;
      if (!videoId || players.has(videoId)) return;
      const player = new yt.Player(iframe, {
        events: {
          onStateChange: (event: YouTubePlayerStateChangeEvent) => {
            if (event.data === yt.PlayerState.PLAYING) {
              players.forEach((p) => {
                if (p !== event.target) p.pauseVideo();
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
      {/* 
        Navbar Wrapper to force Wailing Woman purple.
        Uses arbitrary variants to target inner header/nav tags.
      */}
      <div className="[&>header]:!bg-[#6B21A8] [&_header]:!bg-[#6B21A8] [&>nav]:!bg-[#6B21A8] [&_nav]:!bg-[#6B21A8]">
        <Navigation />
      </div>
      
      <main className="min-h-screen">
        
        {/* 1. HERO SECTION */}
        {!mobilePlayerActive && (
          <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-[radial-gradient(circle_at_top,#9333EA_0%,#6B21A8_45%,#4C1D95_100%)] text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
                <Image 
                  src="/logos/wailing-woman-logo.png" 
                  alt="Wailing Women Logo" 
                  fill 
                  className="object-contain p-2 rounded-full"
                  onError={(e: any) => e.target.src = '/logos/wailing-woman-logo.png'} 
                />
              </div>

              <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">My Seed Must Prosper</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">Wailing Woman</h1>
              
              <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
                <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                  "Contending for the lives and destinies of our children through intensive warfare midnight prayers."
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 2. ABOUT SECTION (Now contains the Cards) */}
        {!mobilePlayerActive && (
          <section className="py-20 md:py-28 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">About the Ministry</h2>
                <div className="w-16 h-1 bg-[#6B21A8] mx-auto mb-8 rounded-full" />
                <p className="text-lg text-black/70 leading-relaxed mb-6">
                  The "Wailing Woman - My Seed Must Prosper!" is an interdenominational online warfare prayer ministry. It was founded by Pastor (Mrs.) Loyce Banda, the wife of Pastor Esau Banda, Senior Pastor of the Pentecost International Christian Centre (PICC). 
                </p>
                <p className="text-lg text-black/70 leading-relaxed">
                  Inspired by God, the ministry awakens mothers globally to take up the responsibility of shaping and securing the glorious destinies of their children through corporate intensive midnight prayers. We seek to resist Satan's schemes against children and enforce victories over them through word-based warfare prayers and prophetic declarations.
                </p>
              </div>

              {/* Informational Cards moved inside About Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <Card className="p-6 text-center shadow-md hover:shadow-xl transition-shadow border-t-4 border-t-[#6B21A8]">
                  <Target className="w-12 h-12 mx-auto text-[#6B21A8] mb-4" />
                  <h3 className="text-xl font-bold mb-2">Prosperity Arrows</h3>
                  <p className="text-black/60">Weekly confessions for our children shared every Monday via WhatsApp, Telegram, and Facebook based on Job 22:28.</p>
                </Card>
                <Card className="p-6 text-center shadow-md hover:shadow-xl transition-shadow border-t-4 border-t-[#6B21A8]">
                  <BookOpen className="w-12 h-12 mx-auto text-[#6B21A8] mb-4" />
                  <h3 className="text-xl font-bold mb-2">Weekly Devotional</h3>
                  <p className="text-black/60">"My Seed Must Prosper" devotional is shared every second and fourth Thursday to empower mothers.</p>
                </Card>
                <Card className="p-6 text-center shadow-md hover:shadow-xl transition-shadow border-t-4 border-t-[#6B21A8]">
                  <MessageCircle className="w-12 h-12 mx-auto text-[#6B21A8] mb-4" />
                  <h3 className="text-xl font-bold mb-2">Preparatory Prayers</h3>
                  <p className="text-black/60">Prayers of salvation and repentance are shared mornings before midnight prayers to ensure right standing with God.</p>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* 3. MINISTRY HIGHLIGHTS (6-Grid Gallery with Interactive Captions) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-purple-50 border-y border-black/5 text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Highlights</h2>
                <p className="text-black/60 max-w-2xl mx-auto">Capturing moments of power, intercession, and devotion at the altar.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {highlightGallery.map((item) => (
                  <div 
                    key={item.id} 
                    className="relative h-48 md:h-64 bg-purple-200 rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => setActiveGalleryId(activeGalleryId === item.id ? null : item.id)}
                  >
                    <Image 
                      src={item.src} 
                      alt={`Gallery Highlight ${item.id}`} 
                      fill 
                      className={`object-cover transition-transform duration-700 ease-in-out ${activeGalleryId === item.id ? 'scale-110' : 'group-hover:scale-105'}`}
                      onError={(e: any) => e.target.src = '/hero/hero-store.jpg'} 
                    />
                    
                    {/* Caption Overlay - Shows on Click */}
                    <AnimatePresence>
                      {activeGalleryId === item.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute inset-0 bg-black/70 flex items-center justify-center p-6 text-center"
                        >
                          <p className="text-white font-medium text-lg sm:text-xl drop-shadow-md">
                            {item.caption}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hint overlay to indicate it's clickable if not active */}
                    <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${activeGalleryId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                ))}
              </div>
              <p className="text-center text-black/50 text-sm mt-6 italic">Click or tap any image to view details.</p>
            </div>
          </section>
        )}

        {/* 4. THE LIVE ALTAR (Livestream Section) */}
        {!mobilePlayerActive && (
          <section className="py-16 md:py-24 bg-[#1a0b2e] text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">The Live Altar</h2>
                <p className="text-white/70 max-w-2xl mx-auto">Join our intensive midnight warfare prayers live, no matter where you are in the world.</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl">
                <div className="relative aspect-video bg-black">
                  <iframe
                    className="h-full w-full"
                    data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                    id="yt-hero"
                    src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                    title={featuredVideo?.title || "Wailing Woman Live"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                {/* Tool Selection Bar */}
                <div className="bg-white text-black px-6 py-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-semibold text-[#6B21A8]">
                        {featuredVideo?.title || "Wailing Woman Broadcast"}
                      </h3>
                      {featuredVideo?.publishedAt && (
                        <p className="text-xs text-black/60 mt-1">
                          {formatDate(featuredVideo.publishedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setActiveTool(activeTool === "bible" ? null : "bible")} className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-900 hover:bg-purple-200 transition-colors">
                        <BookOpenText size={12} /> Bible
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "notepad" ? null : "notepad")} className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-900 hover:bg-orange-200 transition-colors">
                        <StickyNote size={12} /> Notepad
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "chat" ? null : "chat")} className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900 hover:bg-blue-200 transition-colors">
                        <MessageSquareText size={12} /> Live Chat
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "testimony" ? null : "testimony")} className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-200 transition-colors">
                        Send Testimony
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "prayer" ? null : "prayer")} className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-900 hover:bg-cyan-200 transition-colors">
                        Prayer Request
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "give" ? null : "give")} className="inline-flex items-center gap-2 rounded-full bg-[#6B21A8] px-4 py-1 text-xs font-semibold text-white hover:bg-[#581c87] transition-colors shadow-sm">
                        Give
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Tool Content Area */}
                {activeTool && (
                  <div className="border-t border-black/10 bg-gray-50 text-black">
                    <div className="flex flex-wrap items-center gap-2 border-b border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/50 bg-gray-100">
                      {TOOL_TABS.map((tool) => (
                        <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={`rounded-full px-3 py-1 transition-colors ${activeTool === tool.key ? "bg-[#6B21A8] text-white" : "bg-white text-black hover:bg-gray-200"}`}>
                          {tool.label}
                        </button>
                      ))}
                      <button onClick={() => setActiveTool(null)} className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200 transition-colors">
                        Close Tools
                      </button>
                    </div>

                    {activeTool === "bible" && <BibleTool />}
                    {activeTool === "chat" && <div className="h-[400px] w-full bg-white"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Wailing Woman Live'} /></div>}
                    {activeTool === "notepad" && <NotepadTool />}
                    {activeTool === "testimony" && <div className="px-5 py-6"><TestimonyTool /></div>}
                    {activeTool === "prayer" && <div className="px-5 py-6"><PrayerRequestTool /></div>}
                    {activeTool === "give" && <div className="px-5 py-6"><GiveTool isMobile={false} /></div>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 5. PROSPERITY ARROWS & WEEKLY DEVOTIONALS (Picture Feed) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Arrows & Devotionals</h2>
                  <p className="text-black/60 max-w-xl">Equip yourself with our weekly picture confessions and devotional materials.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Large Featured Image (Current/Latest) */}
                <div className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group">
                  <Image 
                    src={publishedMaterials[0].image} 
                    alt={publishedMaterials[0].title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                    <span className="bg-[#6B21A8] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3">
                      Latest {publishedMaterials[0].type}
                    </span>
                    <h3 className="text-white text-2xl md:text-3xl font-bold mb-1">{publishedMaterials[0].title}</h3>
                    <p className="text-white/80 text-sm font-medium">{publishedMaterials[0].date}</p>
                  </div>
                </div>

                {/* Grid of Smaller Previous Publications */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                  {publishedMaterials.slice(1).map((material) => (
                    <div key={material.id} className="relative h-48 lg:h-[113px] rounded-xl overflow-hidden shadow-md border border-black/5 group">
                      <Image 
                        src={material.image} 
                        alt={material.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                      />
                      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                        <span className="text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                          {material.type}
                        </span>
                        <h4 className="text-white text-sm font-semibold leading-tight mb-1">{material.title}</h4>
                        <p className="text-white/60 text-[10px]">{material.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* MOBILE FULLSCREEN PLAYER OVERRIDE */}
        {mobilePlayerActive && (
          <section className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-[#1a0b2e]">
            <div className="h-full flex flex-col">
              <div className="flex-[0_0_40%] bg-black">
                <iframe
                  className="h-full w-full"
                  data-yt-id={mobileVideoId}
                  id="yt-hero-mobile"
                  src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0&autoplay=1&playsinline=1${mobileVideoStart}`}
                  title={featuredVideo?.title || 'Wailing Woman Live'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="flex-[1_1_60%] px-4 py-5 text-black overflow-y-auto bg-gray-50">
                <div className="mb-4 border-b border-black/10 pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-black/70">
                    {TOOL_TABS.map((tool) => (
                      <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={`rounded-full px-3 py-1 transition-colors ${activeTool === tool.key ? 'bg-[#6B21A8] text-white' : 'bg-white border border-black/10 text-black'}`}>
                        {tool.label}
                      </button>
                    ))}
                    <button onClick={() => setActiveTool(null)} className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">Close</button>
                  </div>
                </div>
                {activeEmbedTool && <div className="aspect-[4/3] w-full bg-white mb-4 rounded-xl overflow-hidden border border-black/10"><iframe className="h-full w-full" src={activeEmbedTool.url} title={activeEmbedTool.label} allow="clipboard-write; fullscreen" /></div>}
                {activeTool === "chat" && <div className="h-[300px] w-full bg-white mb-4 rounded-xl overflow-hidden border border-black/10"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Wailing Woman Live'} /></div>}
                {activeTool === "bible" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><BibleTool /></div>}
                {activeTool === "notepad" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><NotepadTool /></div>}
                {activeTool === "testimony" && <div className="px-4 py-5"><TestimonyTool /></div>}
                {activeTool === "prayer" && <div className="px-4 py-5"><PrayerRequestTool /></div>}
                {activeTool === "give" && <div className="px-4 py-5"><GiveTool isMobile={true} /></div>}
              </div>
            </div>
          </section>
        )}

        {/* 6. EVENTS SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 text-black overflow-hidden border-y border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Events & Meetings</h2>
                  <p className="text-black/60 max-w-xl">Join us at the altar of prayer to contend for the next generation.</p>
                </div>
              </div>

              <div className="bg-[#6B21A8] text-white rounded-2xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between shadow-xl">
                <div className="flex items-center gap-4 mb-6 md:mb-0">
                  <div className="p-4 bg-white/20 rounded-full">
                    <CalendarClock className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Midnight Warfare Prayers</h3>
                    <p className="text-white/80 mt-1">Every First and Third Thursdays of each month.</p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-3xl font-black">11:30 PM - 01:00 AM</p>
                  <p className="text-white/80 text-sm mt-1">Via Telegram, Facebook, and YouTube</p>
                </div>
              </div>

              <div className="relative w-full max-w-4xl mx-auto">
                <div className="relative h-[450px] sm:h-[400px] w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      <Card className="flex flex-col sm:flex-row h-full overflow-hidden border border-black/10 shadow-lg bg-white">
                        <div className="relative w-full sm:w-1/2 h-48 sm:h-full bg-purple-50 flex-shrink-0">
                          <Image 
                            src={pastEvents[currentSlide]?.image || pastEvents[0].image} 
                            alt={pastEvents[currentSlide]?.title || 'Event Image'} 
                            fill 
                            className="object-cover"
                            onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                          />
                        </div>
                        <div className="p-8 sm:p-10 flex flex-col justify-center w-full sm:w-1/2">
                          <div className="flex items-center gap-2 text-[#6B21A8] font-semibold text-sm mb-4 bg-purple-50 w-fit px-3 py-1 rounded-full">
                            <Waves className="w-4 h-4" />
                            <span>{pastEvents[currentSlide]?.date || pastEvents[0].date}</span>
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                            {pastEvents[currentSlide]?.title || pastEvents[0].title}
                          </h3>
                          <p className="text-black/60 leading-relaxed">
                            {pastEvents[currentSlide]?.description || pastEvents[0].description}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex items-center justify-center gap-6 mt-8">
                  <button onClick={prevSlide} className="p-2 rounded-full bg-white shadow hover:bg-purple-50 border border-black/5">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextSlide} className="p-2 rounded-full bg-white shadow hover:bg-purple-50 border border-black/5">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 7. OUTREACH / PROJECT SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Global Outreach Project</h2>
                  <div className="w-16 h-1 bg-[#6B21A8] mb-6 rounded-full" />
                  <p className="text-lg text-black/70 mb-4">
                    Launched on the 17th of January, 2025, our outreach has expanded rapidly. We now have over 2,500 members spanning across different countries. 
                  </p>
                  <p className="text-lg text-black/70 mb-6">
                    Our goal is to ensure that through this ministry, children accept Jesus Christ, walk in the fear of God, and enjoy success in their education, careers, and marriages. 
                  </p>
                  
                  <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-black/5">
                    <h3 className="font-bold text-xl mb-4 text-[#6B21A8]">Support the Vision</h3>
                    <div className="space-y-2 text-sm text-black/70">
                      <p><strong>National Bank (Gateway Mall):</strong> 1012674801 (SWIFT: NBMAMWMW007)</p>
                      <p><strong>Airtel Money:</strong> 0986337644 (Catherine Kulemeka)</p>
                      <p><strong>TNM Mpamba:</strong> 0882550238 (Catherine Kulemeka)</p>
                    </div>
                  </div>
                </div>
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                  <Image 
                    src="/hero/outreach.jpg" 
                    alt="Global Outreach" 
                    fill 
                    className="object-cover"
                    onError={(e: any) => e.target.src = '/hero/hero-store.jpg'} 
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 8. NEWS SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 text-black border-y border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Globe className="w-12 h-12 mx-auto text-[#6B21A8] mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Latest News</h2>
              <p className="text-lg text-black/70 max-w-2xl mx-auto mb-8">
                The Wailing Woman WhatsApp Forum is now active! All ministry communications, including daily devotionals and prayer points, take place here. Secretariat now begins studio prayers at 22:00 hours prior to midnight sessions.
              </p>
            </div>
          </section>
        )}

        {/* 9. CONTACTS SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-purple-900 text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Contact & Join Us</h2>
                <p className="text-white/80 max-w-2xl mx-auto">
                  If you are a mother or guardian ready to contend for your children, contact us to join our WhatsApp forum.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <MapPin className="w-10 h-10 mx-auto text-purple-300 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Location</h3>
                  <p className="text-white/70">Wailing Woman-My Seed Must Prosper!</p>
                  <p className="text-white/70">P.O Box 31841, Lilongwe</p>
                  <p className="text-white/70">Malawi, Central Africa</p>
                </Card>

                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Phone className="w-10 h-10 mx-auto text-purple-300 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Phone</h3>
                  <p className="text-white/70">+265 995 46 55 40</p>
                  <p className="text-white/70">+265 999 31 77 81</p>
                  <p className="text-white/70">+265 888 380 732</p>
                </Card>

                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Mail className="w-10 h-10 mx-auto text-purple-300 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Email</h3>
                  <p className="text-white/70 break-all">
                    wailingwomanprayers@gmail.com
                  </p>
                </Card>
              </div>
            </div>
          </section>
        )}

      </main>
      {!mobilePlayerActive && <Footer />}
    </>
  );
}
