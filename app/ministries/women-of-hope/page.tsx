'use client';

import { useState, useEffect, useRef, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { apiFetch, apiUrl } from '@/lib/api';
import { 
  ChevronLeft, ChevronRight, Waves, MapPin, 
  Phone, Mail, CalendarClock, BookOpen, Globe, 
  Target, MessageCircle, BookOpenText, MessageSquareText, StickyNote,
  Heart, Briefcase, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- LIVESTREAM COMPONENTS ---
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import GiveTool from '@/components/livestream/GiveTool';
import BibleTool from '@/components/livestream/BibleTool';

// --- TYPES & GLOBALS ---
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type ToolKey = "bible" | "notepad" | "chat" | "testimony" | "give" | null;

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

const TOOL_TABS: Array<{
  key: ToolKey;
  label: string;
  kind: "embed" | "component" | "form";
}> = [
  { key: "chat", label: "Live Chat", kind: "component" },
  { key: "notepad", label: "Notepad", kind: "component" },
  { key: "bible", label: "Bible", kind: "component" },
  { key: "testimony", label: "Send Testimony", kind: "form" },
  { key: "give", label: "Give", kind: "form" },
];

type PartnershipDetail = {
  label: string;
  value: string;
};

type MinistryInfo = {
  name: string | null;
  motto: string | null;
  about: string | null;
  heroImageUrl: string | null;
  logoImageUrl: string | null;
  liveSessionYoutubeUrl: string | null;
  partnershipTitle: string | null;
  partnershipBody: string | null;
  partnershipDetails: PartnershipDetail[] | null;
  partnershipImageUrl: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  contactIntro: string | null;
};

type MinistryItem = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  label: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

const toAssetUrl = (value: string | null | undefined) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const videoIdFromUrl = (value: string | null | undefined) => {
  const raw = (value || '').trim();
  if (!raw) return '';

  const youtubeMatch = raw.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return youtubeMatch ? youtubeMatch[1] : '';
};

const mergeItemsWithFallback = (loaded: MinistryItem[], fallback: MinistryItem[]) => {
  if (!loaded.length) return fallback;
  if (!fallback.length) return loaded;

  const remainingFallback = fallback.filter(
    (fallbackItem) =>
      !loaded.some(
        (loadedItem) =>
          loadedItem.category === fallbackItem.category &&
          loadedItem.sortOrder === fallbackItem.sortOrder,
      ),
  );

  return [...loaded, ...remainingFallback].sort((first, second) => {
    const sortDifference = (first.sortOrder ?? 0) - (second.sortOrder ?? 0);
    if (sortDifference !== 0) return sortDifference;
    return first.title.localeCompare(second.title);
  });
};

const defaultInfo: MinistryInfo = {
  name: 'Women of Hope',
  motto: 'Building Women of faith, purpose and impact.',
  about:
    'PICC respects women as those who have a special place in God’s heart and are very important in the work of God. The Garden of Eden was not complete until God created the woman.\n\nIt was a woman, Mary Magdalene, who first witnessed the risen Jesus, and women equally supported the ministry of Jesus in the early church. Building on this biblical foundation, Women of Hope was established to equip women for their divine assignments.',
  heroImageUrl: '/hero/hero-8-woh.jpg',
  logoImageUrl: '/logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Support Our Projects',
  partnershipBody:
    'You can support our ongoing "500+ mattress" procurement, skills training, or borehole planting initiatives.\n\nContact the national office for official banking and mobile money details.',
  partnershipDetails: [],
  partnershipImageUrl: '/hero/hero-store.jpg',
  phone: 'Check with your local PICC branch for contact details.',
  email: 'info@picc.org',
  location: 'PICC Women of Hope\nCamp of God Cathedral',
  contactIntro:
    'Whether you are seeking spiritual liberation, emotional healing, or simply a sisterhood to walk alongside you, you are welcome here.',
};

const defaultPillars: MinistryItem[] = [
  {
    id: 'pillar-1',
    category: 'pillar',
    title: 'Empowerment Meetings',
    description:
      'Through conferences, summits, workshops, and panel discussions, women are built up and established both in life and in spirit to take on leadership.',
    label: null,
    imageUrl: null,
    sortOrder: 0,
  },
  {
    id: 'pillar-2',
    category: 'pillar',
    title: 'Work-Life Balance',
    description:
      'Scheduled meetings and teachings ensure the observance of time, allowing women to assume other roles and responsibilities without hindrances.',
    label: null,
    imageUrl: null,
    sortOrder: 1,
  },
  {
    id: 'pillar-3',
    category: 'pillar',
    title: 'Community Service',
    description:
      'We actively contribute to society through hospital visitations, the giving of alms, and the preaching of the gospel to the surrounding communities.',
    label: null,
    imageUrl: null,
    sortOrder: 2,
  },
];

const defaultHighlights: MinistryItem[] = [
  {
    id: 'highlight-1',
    category: 'highlight',
    title: 'Empowerment meetings building women in life and spirit.',
    description: null,
    label: null,
    imageUrl: '/hero/hero-8-woh.jpg',
    sortOrder: 0,
  },
  {
    id: 'highlight-2',
    category: 'highlight',
    title: 'Taking on family and societal leadership.',
    description: null,
    label: null,
    imageUrl: '/moments/6.jpg',
    sortOrder: 1,
  },
  {
    id: 'highlight-3',
    category: 'highlight',
    title: 'Hospital visitations and community service.',
    description: null,
    label: null,
    imageUrl: '/moments/7.jpg',
    sortOrder: 2,
  },
  {
    id: 'highlight-4',
    category: 'highlight',
    title: 'Preaching the gospel to communities around us.',
    description: null,
    label: null,
    imageUrl: '/moments/8.jpg',
    sortOrder: 3,
  },
  {
    id: 'highlight-5',
    category: 'highlight',
    title: 'Summits, workshops, and panel discussions.',
    description: null,
    label: null,
    imageUrl: '/moments/9.jpg',
    sortOrder: 4,
  },
  {
    id: 'highlight-6',
    category: 'highlight',
    title: 'Supporting the ministry of the church.',
    description: null,
    label: null,
    imageUrl: '/hero/hero-2.jpg',
    sortOrder: 5,
  },
];

const defaultProjects: MinistryItem[] = [
  {
    id: 'project-1',
    category: 'initiative',
    title: '500+ Mattress Procurement',
    description: 'Current Project',
    label: 'Ongoing',
    imageUrl: '/moments/6.jpg',
    sortOrder: 0,
  },
  {
    id: 'project-2',
    category: 'initiative',
    title: 'Skills Training Initiative',
    description: 'Current Project',
    label: 'Ongoing',
    imageUrl: '/moments/7.jpg',
    sortOrder: 1,
  },
  {
    id: 'project-3',
    category: 'initiative',
    title: 'Borehole Planting',
    description: 'Current Project',
    label: 'Ongoing',
    imageUrl: '/moments/8.jpg',
    sortOrder: 2,
  },
  {
    id: 'project-4',
    category: 'initiative',
    title: 'Orphanage Establishment',
    description: 'Future Project',
    label: 'Upcoming',
    imageUrl: '/moments/9.jpg',
    sortOrder: 3,
  },
  {
    id: 'project-5',
    category: 'initiative',
    title: 'Bus Procurement',
    description: 'Future Project',
    label: 'Upcoming',
    imageUrl: '/hero/hero-2.jpg',
    sortOrder: 4,
  },
];

const defaultEvents: MinistryItem[] = [
  {
    id: 'event-1',
    category: 'event',
    title: 'Daughters of the King Conference',
    description: 'A transformative three-day summit focused on spiritual identity, emotional healing, and empowering women for leadership.',
    label: 'March 10-12, 2025',
    imageUrl: '/hero/hero-2.jpg',
    sortOrder: 0,
  },
  {
    id: 'event-2',
    category: 'event',
    title: 'Annual Mother\'s Day Luncheon',
    description: 'A beautiful afternoon celebrating the mothers and maternal figures in our congregation with worship, food, and fellowship.',
    label: 'May 14, 2025',
    imageUrl: '/moments/7.jpg',
    sortOrder: 1,
  },
  {
    id: 'event-3',
    category: 'event',
    title: 'Hospital Maternity Outreach',
    description: 'Women of Hope visited the local maternity wards, praying for new mothers and providing care packages with essential baby supplies.',
    label: 'September 22, 2025',
    imageUrl: '/moments/8.jpg',
    sortOrder: 2,
  },
];

export default function WomenOfHopePage() {
  // --- STATE ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);

  // --- LIVESTREAM STATE ---
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileResumeAt, setMobileResumeAt] = useState<number | null>(null);
  const playersRef = useRef<Map<string, any>>(new Map());

  // --- LIVESTREAM CONSTANTS ---
  const CHANNEL_ID = "UC5iA3dWaUBlP_PBlGSQvgNQ";
  const FALLBACK_HERO_ID = "ydTADwZRquA";
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

  const featuredVideo = videos[0] || null;

  const [ministryInfo, setMinistryInfo] = useState<MinistryInfo>(defaultInfo);
  const [ministryItems, setMinistryItems] = useState<MinistryItem[]>([]);

  const ministryItemGroups = {
    pillars: ministryItems.filter((item) => item.category === 'pillar'),
    highlights: ministryItems.filter((item) => item.category === 'highlight'),
    projects: ministryItems.filter((item) => item.category === 'initiative'),
    events: ministryItems.filter((item) => item.category === 'event'),
  };

  const pillarCards = mergeItemsWithFallback(ministryItemGroups.pillars, defaultPillars);
  const highlightGalleryItems = mergeItemsWithFallback(ministryItemGroups.highlights, defaultHighlights).map((item) => ({
    id: item.id,
    src: toAssetUrl(item.imageUrl) || '/hero/hero-store.jpg',
    caption: item.description || item.title,
  }));
  const projectCards = mergeItemsWithFallback(ministryItemGroups.projects, defaultProjects).map((item) => ({
    id: item.id,
    type: item.description || 'Project',
    title: item.title,
    status: item.label || 'Ongoing',
    image: toAssetUrl(item.imageUrl) || '/hero/hero-store.jpg',
  }));
  const eventCards = mergeItemsWithFallback(ministryItemGroups.events, defaultEvents).map((item) => ({
    id: item.id,
    title: item.title,
    date: item.label || 'TBA',
    description: item.description || '',
    image: toAssetUrl(item.imageUrl) || '/hero/hero-store.jpg',
  }));

  const fallbackHeroId = videoIdFromUrl(ministryInfo.liveSessionYoutubeUrl) || FALLBACK_HERO_ID;

  const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Africa/Blantyre" });
  };

  useEffect(() => {
    let isMounted = true;

    const loadMinistryContent = async () => {
      try {
        const response = await apiFetch('/api/ministries/women-of-hope/content');
        if (!response.ok) return;

        const data = await response.json().catch(() => ({}));
        if (!isMounted) return;

        if (data?.info) {
          setMinistryInfo({
            ...defaultInfo,
            ...data.info,
            partnershipDetails: Array.isArray(data.info.partnershipDetails)
              ? data.info.partnershipDetails
              : defaultInfo.partnershipDetails,
          });
        }

        if (Array.isArray(data?.items)) {
          setMinistryItems(data.items);
        }
      } catch {
        // Keep the built-in Women of Hope content as the public fallback.
      }
    };

    void loadMinistryContent();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- EFFECTS ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % eventCards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [eventCards.length]);

  const nextSlide = () => setCurrentSlide((prev) => (eventCards.length ? (prev + 1) % eventCards.length : 0));
  const prevSlide = () => setCurrentSlide((prev) => (eventCards.length ? (prev === 0 ? eventCards.length - 1 : prev - 1) : 0));

  useEffect(() => {
    let isMounted = true;

    const toVideoFromSearch = (item: any): YouTubeVideo | null => {
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
      };
    };

    const fetchJson = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load videos");
      return response.json();
    };

    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (!YOUTUBE_API_KEY) throw new Error("Missing API key");

        const liveUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        liveUrl.searchParams.set("part", "snippet");
        liveUrl.searchParams.set("channelId", CHANNEL_ID);
        liveUrl.searchParams.set("eventType", "live");
        liveUrl.searchParams.set("type", "video");
        liveUrl.searchParams.set("maxResults", "1");
        liveUrl.searchParams.set("key", YOUTUBE_API_KEY);

        const liveData = await fetchJson(liveUrl.toString());
        const liveVideo = Array.isArray(liveData?.items) ? toVideoFromSearch(liveData.items[0]) : null;

        if (isMounted) {
          if (liveVideo) {
            setVideos([liveVideo]);
          } else {
            setVideos([{
              videoId: FALLBACK_HERO_ID,
              title: "Women of Hope Service",
              publishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              channelTitle: "Women of Hope",
              description: "Building Women of faith, purpose and impact.",
              thumbnail: "",
              url: `https://www.youtube.com/watch?v=${FALLBACK_HERO_ID}`,
              embedUrl: `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`,
              isLive: false
            }]);
          }
        }
      } catch (error) {
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
    const players = playersRef.current;
    const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("[data-yt-id]"));

    iframes.forEach((iframe) => {
      const videoId = iframe.dataset.ytId;
      if (!videoId || players.has(videoId)) return;
      const player = new window.YT.Player(iframe, {
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
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
      <Navigation />
      
      <main className="min-h-screen">
        
        {/* 1. HERO SECTION */}
        {!mobilePlayerActive && (
          <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-[radial-gradient(circle_at_top,#45BFFF_0%,#029EFB_45%,#0178C0_100%)] text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10">
            <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
                <Image 
                  src={toAssetUrl(ministryInfo.logoImageUrl) || '/logo.png'} 
                  alt={`${ministryInfo.name || 'Women of Hope'} Logo`} 
                  fill 
                  className="object-contain p-2 rounded-full"
                  onError={(e: any) => e.target.src = '/logo.png'} 
                />
              </div>

              <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">PICC Ministry</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">{ministryInfo.name || 'Women of Hope'}</h1>
              
              <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
                <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                  {ministryInfo.motto || 'Building Women of faith, purpose and impact.'}
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
                <div className="w-16 h-1 bg-[#029EFB] mx-auto mb-8 rounded-full" />
                {(ministryInfo.about || '').split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-lg text-black/70 leading-relaxed mb-6">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Informational Cards inside About Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {pillarCards.map((item) => (
                  <Card key={item.id} className="p-6 text-center shadow-md hover:shadow-xl transition-shadow border-t-4 border-t-[#029EFB]">
                    <Target className="w-12 h-12 mx-auto text-[#029EFB] mb-4" />
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-black/60">{item.description || 'Discover more about how this ministry strengthens women.'}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 3. MINISTRY HIGHLIGHTS (6-Grid Gallery with Interactive Captions) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-sky-50 border-y border-black/5 text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Highlights</h2>
                <p className="text-black/60 max-w-2xl mx-auto">Capturing moments of empowerment, community service, and sisterhood in action.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {highlightGalleryItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="relative h-48 md:h-64 bg-sky-200 rounded-xl overflow-hidden cursor-pointer group"
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
                          className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 text-center"
                        >
                          <p className="text-white font-medium text-lg sm:text-xl drop-shadow-md">
                            {item.caption}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hint overlay */}
                    <div className={`absolute inset-0 bg-[#029EFB]/20 transition-opacity duration-300 ${activeGalleryId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                ))}
              </div>
              <p className="text-center text-black/50 text-sm mt-6 italic">Click or tap any image to view details.</p>
            </div>
          </section>
        )}

        {/* 4. THE LIVE ALTAR (Livestream Section) */}
        {!mobilePlayerActive && (
          <section className="py-16 md:py-24 bg-[#0a192f] text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Women of Hope Live</h2>
                <p className="text-white/70 max-w-2xl mx-auto">Join our empowerment services and conferences live, from anywhere in the world.</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl">
                <div className="relative aspect-video bg-black">
                  <iframe
                    className="h-full w-full"
                    data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                    id="yt-hero"
                    src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                    title={featuredVideo?.title || "Women of Hope Live"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                {/* Tool Selection Bar */}
                <div className="bg-white text-black px-6 py-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-semibold text-[#029EFB]">
                        {featuredVideo?.title || "Women of Hope Broadcast"}
                      </h3>
                      {featuredVideo?.publishedAt && (
                        <p className="text-xs text-black/60 mt-1">
                          {formatDate(featuredVideo.publishedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setActiveTool(activeTool === "bible" ? null : "bible")} className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900 hover:bg-sky-200 transition-colors">
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
                      <button onClick={() => setActiveTool(activeTool === "give" ? null : "give")} className="inline-flex items-center gap-2 rounded-full bg-[#029EFB] px-4 py-1 text-xs font-semibold text-white hover:bg-[#0178C0] transition-colors shadow-sm">
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
                        <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={`rounded-full px-3 py-1 transition-colors ${activeTool === tool.key ? "bg-[#029EFB] text-white" : "bg-white text-black hover:bg-gray-200"}`}>
                          {tool.label}
                        </button>
                      ))}
                      <button onClick={() => setActiveTool(null)} className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200 transition-colors">
                        Close Tools
                      </button>
                    </div>

                    {activeTool === "bible" && <BibleTool />}
                    {activeTool === "chat" && <div className="h-[400px] w-full bg-white"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Women of Hope Live'} /></div>}
                    {activeTool === "notepad" && <NotepadTool />}
                    {activeTool === "testimony" && <div className="px-5 py-6"><TestimonyTool /></div>}
                    {activeTool === "give" && <div className="px-5 py-6"><GiveTool isMobile={false} /></div>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 5. MINISTRY PROJECTS (Replaces Arrows & Devotionals Picture Feed) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Projects & Milestones</h2>
                  <p className="text-black/60 max-w-xl">The ministry has taken a project-focused form of implementation of activities with timelines, embracing learning, measuring, and reporting impact over time.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Large Featured Image (Current/Latest Project) */}
                <div className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group">
                  <Image 
                    src={projectCards[0]?.image || '/hero/hero-store.jpg'} 
                    alt={projectCards[0]?.title || 'Ministry Project'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                    <span className="bg-[#029EFB] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3">
                      {projectCards[0]?.type || 'Project'}
                    </span>
                    <h3 className="text-white text-2xl md:text-3xl font-bold mb-1">{projectCards[0]?.title || 'Latest Initiative'}</h3>
                    <p className="text-white/80 text-sm font-medium">Status: {projectCards[0]?.status || 'Ongoing'}</p>
                  </div>
                </div>

                {/* Grid of Smaller Previous/Future Publications */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                  {projectCards.slice(1).map((material) => (
                    <div key={material.id} className="relative h-48 lg:h-[113px] rounded-xl overflow-hidden shadow-md border border-black/5 group">
                      <Image 
                        src={material.image} 
                        alt={material.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                      />
                      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                        <span className="text-sky-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                          {material.type}
                        </span>
                        <h4 className="text-white text-sm font-semibold leading-tight mb-1">{material.title}</h4>
                        <p className="text-white/60 text-[10px]">Status: {material.status}</p>
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
          <section className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-[#0a192f]">
            <div className="h-full flex flex-col">
              <div className="flex-[0_0_40%] bg-black">
                <iframe
                  className="h-full w-full"
                  data-yt-id={mobileVideoId}
                  id="yt-hero-mobile"
                  src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0&autoplay=1&playsinline=1${mobileVideoStart}`}
                  title={featuredVideo?.title || 'Women of Hope Live'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="flex-[1_1_60%] px-4 py-5 text-black overflow-y-auto bg-gray-50">
                <div className="mb-4 border-b border-black/10 pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-black/70">
                    {TOOL_TABS.map((tool) => (
                      <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={`rounded-full px-3 py-1 transition-colors ${activeTool === tool.key ? 'bg-[#029EFB] text-white' : 'bg-white border border-black/10 text-black'}`}>
                        {tool.label}
                      </button>
                    ))}
                    <button onClick={() => setActiveTool(null)} className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">Close</button>
                  </div>
                </div>
                {activeEmbedTool && <div className="aspect-[4/3] w-full bg-white mb-4 rounded-xl overflow-hidden border border-black/10"><iframe className="h-full w-full" src={activeEmbedTool.url} title={activeEmbedTool.label} allow="clipboard-write; fullscreen" /></div>}
                {activeTool === "chat" && <div className="h-[300px] w-full bg-white mb-4 rounded-xl overflow-hidden border border-black/10"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Women of Hope Live'} /></div>}
                {activeTool === "bible" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><BibleTool /></div>}
                {activeTool === "notepad" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><NotepadTool /></div>}
                {activeTool === "testimony" && <div className="px-4 py-5"><TestimonyTool /></div>}
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
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming & Past Events</h2>
                  <p className="text-black/60 max-w-xl">Highlights from our recent gatherings, conferences, and community outreach programs.</p>
                </div>
              </div>

              <div className="bg-[#029EFB] text-white rounded-2xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between shadow-xl">
                <div className="flex items-center gap-4 mb-6 md:mb-0">
                  <div className="p-4 bg-white/20 rounded-full">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Women of Hope Services</h3>
                    <p className="text-white/80 mt-1">Scheduled empowerment meetings and services.</p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-white/80 text-sm mt-1">Check local branch for specific timings</p>
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
                        <div className="relative w-full sm:w-1/2 h-48 sm:h-full bg-sky-50 flex-shrink-0">
                          <Image 
                            src={eventCards[currentSlide]?.image || eventCards[0]?.image} 
                            alt={eventCards[currentSlide]?.title || eventCards[0]?.title || 'Event Image'} 
                            fill 
                            className="object-cover"
                            onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                          />
                        </div>
                        <div className="p-8 sm:p-10 flex flex-col justify-center w-full sm:w-1/2">
                          <div className="flex items-center gap-2 text-[#029EFB] font-semibold text-sm mb-4 bg-sky-50 w-fit px-3 py-1 rounded-full">
                            <CalendarClock className="w-4 h-4" />
                            <span>{eventCards[currentSlide]?.date || eventCards[0]?.date || 'TBA'}</span>
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                            {eventCards[currentSlide]?.title || eventCards[0]?.title || 'Upcoming Event'}
                          </h3>
                          <p className="text-black/60 leading-relaxed">
                            {eventCards[currentSlide]?.description || eventCards[0]?.description || 'Stay tuned for upcoming details.'}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex items-center justify-center gap-6 mt-8">
                  <button onClick={prevSlide} className="p-2 rounded-full bg-white shadow hover:bg-sky-50 border border-black/5">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextSlide} className="p-2 rounded-full bg-white shadow hover:bg-sky-50 border border-black/5">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 7. GLOBAL VISION SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Global Vision & Expansion</h2>
                  <div className="w-16 h-1 bg-[#029EFB] mb-6 rounded-full" />
                  <p className="text-lg text-black/70 mb-4">
                    The ministry has now expanded its structure to incorporate a global focus. An international office and bearers have been set up with offices across regions, allowing for flexible decentralized decision-making power while maintaining focus on the vision and mandate of the church. 
                  </p>
                  <p className="text-lg text-black/70 mb-6">
                    We envision operating as a global ministry driven by Spirit-filled, empowered, diligent, committed, resilient, and enthusiastic leadership and membership. Our goal is to take the message of hope to the ends of the world, with well-defined structures and buildings across continents.
                  </p>
                  
                  <div className="bg-sky-50 p-6 rounded-xl shadow-sm border border-black/5">
                    <h3 className="font-bold text-xl mb-4 text-[#029EFB]">{ministryInfo.partnershipTitle || 'Support Our Projects'}</h3>
                    <div className="space-y-2 text-sm text-black/70">
                      {(ministryInfo.partnershipBody || 'Contact the national office for official banking and mobile money details.').split('\n\n').map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                  <Image 
                    src="/hero/hero-store.jpg" 
                    alt="Global Vision" 
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
              <Globe className="w-12 h-12 mx-auto text-[#029EFB] mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Latest News</h2>
              <p className="text-lg text-black/70 max-w-2xl mx-auto mb-8">
                Recent developments in the ministry include setting up international offices across regions. We are also actively running the "500+ mattress" procurement, skills training, and borehole planting projects at the Camp of God Cathedral.
              </p>
            </div>
          </section>
        )}

        {/* 9. CONTACTS SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-sky-900 text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Involved</h2>
                <p className="text-white/80 max-w-2xl mx-auto">
                  Whether you are seeking spiritual liberation, emotional healing, or simply a sisterhood to walk alongside you, you are welcome here.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <MapPin className="w-10 h-10 mx-auto text-sky-300 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Location</h3>
                  {(ministryInfo.location || '').split('\n').map((line, idx) => (
                    <p key={idx} className="text-white/70">{line}</p>
                  ))}
                </Card>

                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Phone className="w-10 h-10 mx-auto text-sky-300 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Phone</h3>
                  <p className="text-white/70">{ministryInfo.phone || 'Check with your local PICC branch for contact details.'}</p>
                </Card>

                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Mail className="w-10 h-10 mx-auto text-sky-300 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Email</h3>
                  <p className="text-white/70 break-all">{ministryInfo.email || 'woh@piccworldwide.org'}</p>
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
