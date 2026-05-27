'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { 
  ChevronLeft, ChevronRight, MapPin, 
  Phone, Mail, CalendarClock, BookOpen, StickyNote, Globe, 
  Target, MessageCircle, X, CreditCard, Landmark, Wallet
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

type YouTubePlayer = {
  pauseVideo: () => void;
  getCurrentTime?: () => number;
};

type YouTubePlayerStateChangeEvent = {
  data: number;
  target: YouTubePlayer;
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
    title: 'Midnight Prayers for Children Conference',
    date: '8th June to 11th June 2026',
    location: 'Online via YouTube & Facebook Live',
    description: 'Online midnight prayers running for several consecutive days, standing in the gap for the destinies of our children.',
    image: '/ministries/wailing-woman/ww-po-8jne.jpg',
  },
  {
    id: 2,
    title: 'Midnight Prayers for Children',
    date: '21 May 2026',
    location: 'Online Platforms',
    description: 'A special night of concentrated intercession breaking generational chains over families.',
    image: '/ministries/wailing-woman/ww-po-21may.jpg',
  },
];

const highlightGallery = [
  { id: 1, src: '/ministries/wailing-woman/ww1.jpg', caption: 'Wailing Woman My Seed Must Prosper, Midnight Prayers' },
  { id: 2, src: '/ministries/wailing-woman/ww2.jpg', caption: 'Wailing Woman My Seed Must Prosper, Midnight Prayers' },
  { id: 3, src: '/ministries/wailing-woman/ww3.jpg', caption: 'Wailing Woman My Seed Must Prosper, Midnight Prayers' },
  { id: 4, src: '/ministries/wailing-woman/ww4.jpg', caption: 'Wailing Woman My Seed Must Prosper, Midnight Prayers' },
  { id: 5, src: '/ministries/wailing-woman/ww5.jpg', caption: 'Wailing Woman My Seed Must Prosper, Midnight Prayers' },
  { id: 6, src: '/ministries/wailing-woman/ww7.jpg', caption: 'Wailing Woman My Seed Must Prosper, Midnight Prayers' },
];

const publishedMaterials = [
  { id: 1, type: 'Prosperity Arrows For My Seed', title: '18 May 2026 Confession', image: '/ministries/wailing-woman/pp-arrow-18-may.jpg' },
  { id: 2, type: 'Prosperity Arrows For My Seed', title: '11 May 2026 Confession', image: '/ministries/wailing-woman/pp-arrow-11-may.jpg' },
  { id: 3, type: 'Prosperity Arrows For My Seed', title: '27 April 2026 Confession', image: '/ministries/wailing-woman/pp-arrow-27-apr.jpg' },
  { id: 4, type: 'Prosperity Arrows For My Seed', title: '20 April 2026 Confession', image: '/ministries/wailing-woman/pp-arrow-20-apr.jpg' },
  { id: 5, type: 'Prosperity Arrows For My Seed', title: '13 April 2026 Confession', image: '/ministries/wailing-woman/pp-arrow-13-apr.jpg' },
  { id: 6, type: 'Prosperity Arrows For My Seed', title: '06 April 2026 Confession', image: '/ministries/wailing-woman/pp-arrow-6-apr.jpg' },
  { id: 7, type: 'Prosperity Arrows For My Seed', title: '30 March 2026 Confession', image: '/ministries/wailing-woman/pp-arrow-30-mar.jpg' },
];

export default function WailingWomenPage() {
  // --- STATE ---
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // New Interactive Modal / Popup States
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<typeof highlightGallery[0] | null>(null);
  const [selectedArrowImage, setSelectedArrowImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<typeof pastEvents[0] | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

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

    const toVideoFromSearch = (item?: any, canEmbed = true): YouTubeVideo | null => {
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

    const toVideoFromPlaylist = (item?: any, canEmbed = true): YouTubeVideo | null => {
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
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || "",
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

    const fetchLatestUpload = async (channelId: string, canEmbed = true, maxResults = 1) => {
      const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      channelUrl.searchParams.set("part", "contentDetails");
      channelUrl.searchParams.set("id", channelId);
      channelUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const channelData = await fetchJson(channelUrl.toString());
      const uploadsPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) return null;

      const uploadsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      uploadsUrl.searchParams.set("part", "snippet,contentDetails");
      uploadsUrl.searchParams.set("playlistId", uploadsPlaylistId);
      uploadsUrl.searchParams.set("maxResults", String(maxResults));
      uploadsUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const uploadsData = await fetchJson(uploadsUrl.toString());
      const playlistVideos: YouTubeVideo[] = Array.isArray(uploadsData?.items)
        ? uploadsData.items
            .map((item: any) => toVideoFromPlaylist(item, canEmbed))
            .filter((item: YouTubeVideo | null): item is YouTubeVideo => Boolean(item))
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
      return Array.isArray(searchData?.items) ? toVideoFromSearch(searchData.items[0]) : null;
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

      const liveVideo = Array.isArray(liveData?.items) ? toVideoFromSearch(liveData.items[0]) : null;
      return liveVideo || latestUpload;
    };

    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        if (!YOUTUBE_API_KEY) throw new Error("Missing API key");

        const [heroVideo, relatedVideos] = await Promise.all([
          fetchHeroVideo(),
          Promise.all(RELATED_CHANNEL_IDS.map((channelId) => fetchRelatedVideo(channelId))),
        ]);

        const merged = [heroVideo, ...relatedVideos].filter((item: YouTubeVideo | null): item is YouTubeVideo => Boolean(item));

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
    const handleChange = (event: any) => setIsMobileViewport(event.matches);
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
          onStateChange: (event: any) => {
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

  // Derived properties for Prosperity Arrows splitting logic
  const mainArrow = publishedMaterials[0];
  const sideArrows = publishedMaterials.slice(1);

  return (
    <>
      <Navigation />

      {/* --- ALL INTERACTIVE POPUPS & MODALS --- */}
      <AnimatePresence>
        {/* 1. Highlights Full View Popup */}
        {selectedGalleryImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
            onClick={() => setSelectedGalleryImage(null)}
          >
            <button className="absolute top-6 right-6 text-white hover:text-purple-400 transition-colors p-2 bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative max-w-4xl w-full h-[70vh] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={selectedGalleryImage.src} alt="Gallery view" fill className="object-contain" />
            </motion.div>
            <p className="text-white text-center mt-4 text-lg font-medium max-w-xl px-4">{selectedGalleryImage.caption}</p>
          </motion.div>
        )}

        {/* 2. Prosperity Arrows Popup */}
        {selectedArrowImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedArrowImage(null)}
          >
            <button className="absolute top-6 right-6 text-white hover:text-purple-400 transition-colors p-2 bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="relative max-w-2xl w-full h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={selectedArrowImage} alt="Confession Card View" fill className="object-contain" />
            </motion.div>
          </motion.div>
        )}

        {/* 3. Upcoming Events Full Card Popup (Matching Youth Page Structure) */}
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
              className="bg-white text-black max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-purple-100">
                <Image src={selectedEvent.image} alt={selectedEvent.title} fill className="object-cover" />
              </div>
              <div className="p-6 md:p-8 w-full md:w-1/2 flex flex-col justify-center">
                <span className="text-xs uppercase font-bold text-purple-600 tracking-wider mb-2">Special Gathering</span>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">{selectedEvent.title}</h3>
                <div className="space-y-3 mb-6 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-purple-600" /> {selectedEvent.date}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-600" /> {selectedEvent.location}</div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{selectedEvent.description}</p>
                <a href="https://wa.me/265995465540" target="_blank" rel="noreferrer" className="w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors text-sm">
                  Inquire on WhatsApp
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 4. Support Payment Options Matrix Popup */}
        {isSupportOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsSupportOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white text-black max-w-2xl w-full rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsSupportOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Ministry Offering Methods</h3>
                <p className="text-gray-500 text-sm mt-1">Partnership channels for Wailing Woman - My Seed Must Prosper</p>
              </div>

              <div className="space-y-4">
                {/* Bank Account */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                  <Landmark className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">National Bank of Malawi</h4>
                    <p className="text-xs text-gray-600 mt-1">Account Name: Wailing Woman Ministry</p>
                    <p className="text-xs text-gray-600">Account Number: 1007654321</p>
                    <p className="text-xs text-gray-600">Branch: Lilongwe Service Centre</p>
                  </div>
                </div>

                {/* Mobile Money Wallet */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Mobile Money Transfers</h4>
                    <p className="text-xs text-gray-600 mt-1">Airtel Money: +265 995 46 55 40</p>
                    <p className="text-xs text-gray-600">TNM Mpamba: +265 888 38 07 32</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen">
        {/* 1. HERO SECTION */}
        {!mobilePlayerActive && (
          <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-[radial-gradient(circle_at_top,#9333EA_0%,#6B21A8_45%,#4C1D95_100%)] text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10"
          style={{
              backgroundImage: `linear-gradient(rgba(60,20,95,0.82), rgba(45,90,140,0.76)), url('/ministries/wailing-woman/ww1.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
                <Image src="/logos/wailing-woman-logo.png" alt="Wailing Women Logo" fill className="object-contain p-2 rounded-full" onError={(e: any) => e.target.src = '/logo.png'} />
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

        {/* 2. ABOUT SECTION */}
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
                  <p className="text-black/60">Prayers of salvation and repentance are shared mornings preceding the corporate intercessory midnight meetings.</p>
                </Card>
              </div>
            </div>
          </section>
        )}

{/* 6. HIGHLIGHTS GALLERY SECTION (With Image Popups) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 text-black border-t border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900">Ministry Intercession Highlights</h2>
                <p className="text-gray-500 mt-2">Mothers standing globally in unified midnight warfare. Click any highlight to enlarge.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {highlightGallery.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedGalleryImage(item)}
                    className="relative h-48 sm:h-64 rounded-2xl overflow-hidden group shadow-md cursor-pointer bg-purple-50"
                  >
                    <Image src={item.src} alt={`Highlight Grid ${item.id}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-purple-900/10 group-hover:bg-purple-900/40 transition-colors duration-300" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}



{/* 3. PROSPERITY ARROWS SECTION (Strict 4-Item Constrained Scroll Layout) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 text-black border-y border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center md:text-left mb-12">
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Prosperity Arrows Declarations</h2>
                <p className="mt-3 text-lg text-gray-500">Speak the Word over your children. Click any confession card to view full scale.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main/Latest Confession */}
                <div className="lg:col-span-2">
                  <div 
                    onClick={() => setSelectedArrowImage(mainArrow.image)}
                    className="relative h-[450px] md:h-[550px] rounded-3xl overflow-hidden group cursor-pointer border border-gray-200 shadow-lg"
                  >
                    <Image src={mainArrow.image} alt={mainArrow.title} fill className="object-cover group-hover:scale-102 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
                      <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full w-fit mb-2 font-semibold uppercase">{mainArrow.type}</span>
                      <h3 className="text-white text-2xl md:text-3xl font-bold">{mainArrow.title}</h3>
                    </div>
                  </div>
                </div>

                {/* Smaller Side Confessions Sidebar with strict height constraint and vertical scrolling */}
                <div className="flex flex-col h-full">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 hidden lg:block">Previous Arrows</span>
                  
                  {/* Restricts desktop view to show 4 rows smoothly (~370px) before turning into an active scrollbar */}
                  <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto lg:max-h-[460px] pb-4 lg:pb-0 scrollbar-thin scrollbar-thumb-purple-200 pr-1 snap-x">
                    {sideArrows.map((arrow) => (
                      <div 
                        key={arrow.id}
                        onClick={() => setSelectedArrowImage(arrow.image)}
                        className="flex-shrink-0 w-64 sm:w-72 lg:w-full bg-white border border-gray-100 rounded-2xl p-3 flex gap-4 items-center cursor-pointer hover:shadow-md hover:border-purple-200 transition-all snap-start"
                      >
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          <Image src={arrow.image} alt={arrow.title} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase text-purple-600 font-bold block truncate">{arrow.type}</span>
                          <h4 className="text-sm font-bold text-gray-900 truncate mt-0.5">{arrow.title}</h4>
                          <span className="text-xs text-gray-400 block mt-1">Click to view</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. THE LIVE ALTAR (Livestream Section for Youth Church) */}
        {!mobilePlayerActive && (
          <section className="py-16 md:py-24 bg-[#0a1424] text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Youth Church Live</h2>
                <p className="text-white/70 max-w-2xl mx-auto">Tune into our high-energy worship and relevant word sessions from wherever you are.</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl">
                <div className="relative aspect-video bg-black">
                  <iframe
                    className="h-full w-full"
                    data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                    id="yt-hero"
                    src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                    title={featuredVideo?.title || "Youth Church Live"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                {/* Tool Selection Bar */}
                <div className="bg-white text-black px-6 py-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2D5A8C]">
                        {featuredVideo?.title || "Youth Church Broadcast"}
                      </h3>
                      {featuredVideo?.publishedAt && (
                        <p className="text-xs text-black/60 mt-1">
                          {formatDate(featuredVideo.publishedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setActiveTool(activeTool === "bible" ? null : "bible")} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-900 hover:bg-blue-100 transition-colors">
                        <BookOpen size={12} /> Bible
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "notepad" ? null : "notepad")} className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-900 hover:bg-orange-100 transition-colors">
                        <StickyNote size={12} /> Notepad
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "chat" ? null : "chat")} className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-900 hover:bg-cyan-100 transition-colors">
                        <MessageCircle size={12} /> Live Chat
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "testimony" ? null : "testimony")} className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-100 transition-colors">
                        Send Testimony
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "give" ? null : "give")} className="inline-flex items-center gap-2 rounded-full bg-[#2D5A8C] px-4 py-1 text-xs font-semibold text-white hover:bg-[#1E3A5F] transition-colors shadow-sm">
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
                        <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={`rounded-full px-3 py-1 transition-colors ${activeTool === tool.key ? "bg-[#2D5A8C] text-white" : "bg-white text-black hover:bg-gray-200"}`}>
                          {tool.label}
                        </button>
                      ))}
                      <button onClick={() => setActiveTool(null)} className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200 transition-colors">
                        Close Tools
                      </button>
                    </div>

                    {activeTool === "bible" && <BibleTool />}
                    {activeTool === "chat" && <div className="h-100 w-full bg-white"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Youth Church Live'} /></div>}
                    {activeTool === "notepad" && <NotepadTool />}
                    {activeTool === "testimony" && <div className="px-5 py-6"><TestimonyTool /></div>}
                    {activeTool === "give" && <div className="px-5 py-6"><GiveTool isMobile={false} /></div>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {/* 5. UPCOMING EVENTS (Clickable Match to Youth Layout Module) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900">Upcoming Gatherings & Warfare Programs</h2>
                <div className="w-12 h-1 bg-purple-600 mx-auto mt-4 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {pastEvents.map((event) => (
                  <Card 
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group cursor-pointer"
                  >
                    <div className="relative h-64 w-full bg-gray-50 overflow-hidden">
                      <Image src={event.image} alt={event.title} fill className="object-cover group-hover:scale-103 transition-transform duration-500" />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">
                          <CalendarClock className="w-4 h-4" /> {event.date}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{event.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                      </div>
                      <span className="text-xs font-bold text-purple-600 mt-4 block group-hover:underline">View Program Details →</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 7. SUPPORT THE MINISTRY SECTOR */}
        {!mobilePlayerActive && (
          <section className="py-16 bg-[linear-gradient(135deg,#6B21A8_0%,#4C1D95_100%)] text-white text-center relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 relative z-10">
              <h2 className="text-3xl font-bold mb-4">Support the Devotional & Warfare Missions</h2>
              <p className="text-purple-100 text-base max-w-2xl mx-auto mb-8">
                Partner with us in distributing the "My Seed Must Prosper" devotional globally and sustaining online prayer vectors across communities.
              </p>
              <button 
                onClick={() => setIsSupportOpen(true)}
                className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-3.5 rounded-full font-bold shadow-lg transition-transform hover:scale-102"
              >
                View Payment Options
              </button>
            </div>
          </section>
        )}

        {/* 8. CONTACT INFRASTRUCTURE */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-zinc-900 text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-zinc-800 border-0 text-white p-8 text-center rounded-2xl shadow-lg">
                  <MapPin className="w-10 h-10 mx-auto text-purple-400 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Location</h3>
                  <p className="text-zinc-400 text-sm">Camp of God Cathedral
                    <br/>
                    Area 49, Lilongwe
                    <br/>
                    Malawi
                  </p>
                </Card>

                <Card className="bg-zinc-800 border-0 text-white p-8 text-center rounded-2xl shadow-lg">
                  <Phone className="w-10 h-10 mx-auto text-purple-400 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Phone Contacts</h3>
                  <p className="text-zinc-400 text-sm">+265 995 46 55 40
                    <br/>
                    +265 999 31 77 81
                    <br/>
                    +265 888 38 07 32
                  </p>

                </Card>

                <Card className="bg-zinc-800 border-0 text-white p-8 text-center rounded-2xl shadow-lg">
                  <Mail className="w-10 h-10 mx-auto text-purple-400 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Email</h3>
                  <p className="text-zinc-400 text-sm break-all">wailingwomanprayers@gmail.com</p>
                </Card>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}