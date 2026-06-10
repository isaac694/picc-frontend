'use client';

import { useState, useEffect, useRef, type FormEvent, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { 
  MapPin, Phone, Mail, CalendarClock, BookOpen, StickyNote,
  Target, MessageCircle, MessageSquareText, X, CreditCard, Landmark, Wallet, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- LIVESTREAM COMPONENTS ---
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import PrayerRequestTool from '@/components/livestream/PrayerRequestTool';
import WailingWomanGiveTool from '@/components/livestream/WailingWomanGiveTool';
import BibleTool from '@/components/livestream/BibleTool';

// --- NEWS COMPONENTS ---
import NewsSection from '@/components/NewsSection';
import { WAILING_WOMAN_NEWS_ITEMS } from '@/components/wailingWomanNews';

// --- TYPES & GLOBALS ---
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

type LivestreamYouTubePlayer = {
  pauseVideo: () => void;
  getCurrentTime?: () => number;
};

type YouTubePlayerStateChangeEvent = {
  data: number;
  target: LivestreamYouTubePlayer;
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
  snippet?: YouTubeSearchItem['snippet'];
};

const PASTOR_ESAU_BANDA_CHANNEL_ID = "UC-v_ov21EZf8f";
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
  { key: "give", label: "Give", kind: "component" },
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
  { id: 1, type: 'Prosperity Arrows For My Seed', title: '18 May 2026 Confession', date: '2026-05-18', image: '/ministries/wailing-woman/pp-arrow-18-may.jpg' },
  { id: 2, type: 'Prosperity Arrows For My Seed', title: '11 May 2026 Confession', date: '2026-05-11', image: '/ministries/wailing-woman/pp-arrow-11-may.jpg' },
  { id: 3, type: 'Prosperity Arrows For My Seed', title: '27 April 2026 Confession', date: '2026-04-27', image: '/ministries/wailing-woman/pp-arrow-27-apr.jpg' },
  { id: 4, type: 'Prosperity Arrows For My Seed', title: '20 April 2026 Confession', date: '2026-04-20', image: '/ministries/wailing-woman/pp-arrow-20-apr.jpg' },
  { id: 5, type: 'Prosperity Arrows For My Seed', title: '13 April 2026 Confession', date: '2026-04-13', image: '/ministries/wailing-woman/pp-arrow-13-apr.jpg' },
  { id: 6, type: 'Prosperity Arrows For My Seed', title: '06 April 2026 Confession', date: '2026-04-06', image: '/ministries/wailing-woman/pp-arrow-6-apr.jpg' },
  { id: 7, type: 'Prosperity Arrows For My Seed', title: '30 March 2026 Confession', date: '2026-03-30', image: '/ministries/wailing-woman/pp-arrow-30-mar.jpg' },
];

export default function WailingWomenPage() {
  // --- STATE ---
  // New Interactive Modal / Popup States
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<typeof highlightGallery[0] | null>(null);
  const [selectedArrowImage, setSelectedArrowImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<typeof pastEvents[0] | null>(null);
  const [selectedProject, setSelectedProject] = useState<typeof pastEvents[0] | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [eventSearchInput, setEventSearchInput] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Projects section state (mirror of events)
  const [projectSearchInput, setProjectSearchInput] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectSlide, setProjectSlide] = useState(0);

  // --- LIVESTREAM STATE ---
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileResumeAt, setMobileResumeAt] = useState<number | null>(null);
  const [arrowSearchInput, setArrowSearchInput] = useState('');
  const [arrowSearchQuery, setArrowSearchQuery] = useState('');
  const playersRef = useRef<Map<string, LivestreamYouTubePlayer>>(new Map());

  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";
  const featuredVideo = videos[0] || null;

  const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const swapImage = (fallback: string) => (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.src = fallback;
  };

  const normalizeSearchText = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const normalizedEventSearchQuery = normalizeSearchText(eventSearchQuery);
  const displayedEventItems = normalizedEventSearchQuery
    ? pastEvents.filter((event) => {
        const searchableText = normalizeSearchText([
          event.title,
          event.date,
          event.location,
          event.description,
        ].join(' '));
        return searchableText.includes(normalizedEventSearchQuery);
      })
    : pastEvents;

  const safeCurrentSlide = displayedEventItems.length
    ? ((currentSlide % displayedEventItems.length) + displayedEventItems.length) % displayedEventItems.length
    : 0;

  const featuredEvent = displayedEventItems[safeCurrentSlide] || pastEvents[0];
  const remainingEvents = displayedEventItems.filter((_, idx) => idx !== safeCurrentSlide);

  const handleEventSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEventSearchQuery(eventSearchInput.trim());
    setCurrentSlide(0);
  };

  const clearEventSearch = () => {
    setEventSearchInput('');
    setEventSearchQuery('');
    setCurrentSlide(0);
  };

  // Projects & Outreaches data (use images in public/ministries/wailing-woman)
  const projectItems = [
    {
      id: 1,
      title: 'Community Outreach 1',
      date: 'June 2026',
      description: 'Outreach to local communities, offering support and prayer.',
      location: 'Lilongwe, Malawi',
      image: '/ministries/wailing-woman/outreach-1.jpg',
    },
    {
      id: 2,
      title: 'Community Outreach 2',
      date: 'July 2026',
      description: 'Prayer and practical help for families in need.',
      location: 'Lilongwe, Malawi',
      image: '/ministries/wailing-woman/outreach-2.jpg',
    },
  ];

  const normalizedProjectSearchQuery = normalizeSearchText(projectSearchQuery);
  const displayedProjectItems = normalizedProjectSearchQuery
    ? projectItems.filter((proj) => {
        const searchableText = normalizeSearchText([proj.title, proj.date, proj.location, proj.description].join(' '));
        return searchableText.includes(normalizedProjectSearchQuery);
      })
    : projectItems;

  const safeProjectSlide = displayedProjectItems.length
    ? ((projectSlide % displayedProjectItems.length) + displayedProjectItems.length) % displayedProjectItems.length
    : 0;

  const featuredProject = displayedProjectItems[safeProjectSlide] || projectItems[0];
  const remainingProjects = displayedProjectItems.filter((_, idx) => idx !== safeProjectSlide);

  const handleProjectSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProjectSearchQuery(projectSearchInput.trim());
    setProjectSlide(0);
  };

  const clearProjectSearch = () => {
    setProjectSearchInput('');
    setProjectSearchQuery('');
    setProjectSlide(0);
  };

  // --- EFFECTS ---
  useEffect(() => {
    let isMounted = true;

    const toVideoFromSearch = (item: YouTubeSearchItem | undefined): YouTubeVideo | null => {
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

    const fetchLatestWailingWomanVideos = async (channelId: string) => {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("channelId", channelId);
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("order", "date");
      searchUrl.searchParams.set("q", "Wailing Woman");
      searchUrl.searchParams.set("videoEmbeddable", "true");
      searchUrl.searchParams.set("maxResults", "10");
      searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const searchData = await fetchJson(searchUrl.toString());
      return Array.isArray(searchData?.items)
        ? searchData.items.map(toVideoFromSearch).filter((v): v is YouTubeVideo => 
            v !== null && v.title.toLowerCase().includes("wailing woman")
          )
        : [];
    };

    const fetchVideos = async () => {
      try {
        if (!YOUTUBE_API_KEY) throw new Error("Missing API key");

        const liveUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        liveUrl.searchParams.set("part", "snippet");
        liveUrl.searchParams.set("channelId", PASTOR_ESAU_BANDA_CHANNEL_ID);
        liveUrl.searchParams.set("eventType", "live");
        liveUrl.searchParams.set("type", "video");
        liveUrl.searchParams.set("q", "Wailing Woman");
        liveUrl.searchParams.set("videoEmbeddable", "true");
        liveUrl.searchParams.set("maxResults", "1");
        liveUrl.searchParams.set("key", YOUTUBE_API_KEY);

        const [liveData, wwVideos] = await Promise.all([
          fetchJson(liveUrl.toString()),
          fetchLatestWailingWomanVideos(PASTOR_ESAU_BANDA_CHANNEL_ID),
        ]);

        const liveVideo = Array.isArray(liveData?.items) ? toVideoFromSearch(liveData.items[0]) : null;
        
        let finalVideos: YouTubeVideo[] = [];
        if (liveVideo && liveVideo.title.toLowerCase().includes("wailing woman")) {
          finalVideos.push(liveVideo);
        }
        finalVideos = [...finalVideos, ...wwVideos];
        
        // Remove duplicates if any
        const seen = new Set();
        const uniqueVideos = finalVideos.filter(v => {
          if (seen.has(v.videoId)) return false;
          seen.add(v.videoId);
          return true;
        });

        if (isMounted) {
          if (uniqueVideos.length > 0) {
            setVideos(uniqueVideos);
          } else {
            setVideos([{
              videoId: FALLBACK_HERO_ID,
              title: "Wailing Woman Live Prayers",
              publishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              channelTitle: "Wailing Woman",
              description: "Midnight warfare prayers and prophetic declarations for the destinies of our children.",
              thumbnail: "",
              url: `https://www.youtube.com/watch?v=${FALLBACK_HERO_ID}`,
              embedUrl: `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`,
              isLive: false
            }]);
          }
        }
      } catch {
        if (isMounted) {
          setVideos([]);
        }
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
        videoId,
        events: {
          onStateChange: (event) => {
            const stateChangeEvent = event as YouTubePlayerStateChangeEvent;
            if (event.data === yt.PlayerState.PLAYING) {
              players.forEach((p) => {
                if (p !== stateChangeEvent.target) p.pauseVideo();
              });
            }
          },
        },
      });
      players.set(videoId, player as unknown as LivestreamYouTubePlayer);
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

  const mobileVideoId = featuredVideo?.videoId || FALLBACK_HERO_ID;
  const mobileVideoStart = mobileResumeAt && mobileResumeAt > 0 ? `&start=${mobileResumeAt}` : '';

  // Derived properties for Prosperity Arrows splitting logic
  const mainArrow = publishedMaterials[0];
  const sideArrows = publishedMaterials.slice(1);
  const visibleSideArrows = arrowSearchQuery
    ? publishedMaterials.filter((arrow) => {
        const searchableText = [
          arrow.title,
          arrow.type,
          arrow.date,
          formatDate(arrow.date),
        ].join(' ').toLowerCase();

        return searchableText.includes(arrowSearchQuery.toLowerCase());
      })
    : sideArrows;

  const handleArrowSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setArrowSearchQuery(arrowSearchInput.trim());
  };

  const clearArrowSearch = () => {
    setArrowSearchInput('');
    setArrowSearchQuery('');
  };

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

        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
              className="bg-white text-black max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-purple-100">
                <Image src={selectedProject.image} alt={selectedProject.title} fill className="object-cover" />
              </div>
              <div className="p-6 md:p-8 w-full md:w-1/2 flex flex-col justify-center">
                <span className="text-xs uppercase font-bold text-purple-600 tracking-wider mb-2">Outreach Project</span>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">{selectedProject.title}</h3>
                <div className="space-y-3 mb-6 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-purple-600" /> {selectedProject.date}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-600" /> {selectedProject.location}</div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{selectedProject.description}</p>
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
                <Image
                  src="/logos/wailing-woman-logo.png"
                  alt="Wailing Women Logo"
                  fill
                  className="object-contain p-2 rounded-full"
                  onError={(event: SyntheticEvent<HTMLImageElement>) => {
                    event.currentTarget.src = '/logo.png';
                  }}
                />
              </div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">My Seed Must Prosper</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">Wailing Woman</h1>
              <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
                <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                  &quot;Contending for the lives and destinies of our children through intensive warfare midnight prayers.&quot;
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
                  The &quot;Wailing Woman - My Seed Must Prosper!&quot; is an interdenominational online warfare prayer ministry. It was founded by Pastor (Mrs.) Loyce Banda, the wife of Pastor Esau Banda, Senior Pastor of the Pentecost International Christian Centre (PICC).
                </p>
                <p className="text-lg text-black/70 leading-relaxed">
                  Inspired by God, the ministry awakens mothers globally to take up the responsibility of shaping and securing the glorious destinies of their children through corporate intensive midnight prayers. We seek to resist Satan&apos;s schemes against children and enforce victories over them through word-based warfare prayers and prophetic declarations.
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
                  <p className="text-black/60">&quot;My Seed Must Prosper&quot; devotional is shared every second and fourth Thursday to empower mothers.</p>
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
                {highlightGallery.slice(0, 6).map((item) => (
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
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Previous Arrows</span>
                    <form onSubmit={handleArrowSearch} className="flex items-center gap-2">
                      <input
                        type="search"
                        value={arrowSearchInput}
                        onChange={(event) => setArrowSearchInput(event.target.value)}
                        placeholder="21 may"
                        className="h-9 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        aria-label="Search previous arrows"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center gap-1 rounded-lg bg-purple-700 px-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
                      >
                        <Search className="h-3.5 w-3.5" />
                        Search
                      </button>
                    </form>
                  </div>
                  {arrowSearchQuery && (
                    <button
                      type="button"
                      onClick={clearArrowSearch}
                      className="mb-3 w-fit text-xs font-semibold text-purple-700 hover:text-purple-900"
                    >
                      Clear search
                    </button>
                  )}
                  
                  {/* Restricts desktop view to show 4 rows smoothly (~370px) before turning into an active scrollbar */}
                  <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto lg:max-h-[460px] pb-4 lg:pb-0 scrollbar-thin scrollbar-thumb-purple-200 pr-1 snap-x">
                    {visibleSideArrows.map((arrow) => (
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
                    {visibleSideArrows.length === 0 && (
                      <div className="w-64 sm:w-72 lg:w-full rounded-2xl border border-dashed border-purple-200 bg-white p-5 text-sm text-gray-500">
                        No Prosperity Arrows found for this search.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. THE LIVE ALTAR (Livestream Section) */}
        {!mobilePlayerActive && (
          <section className="py-16 md:py-24 bg-[#021830] text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Wailing Woman Live Prayers</h2>
                <p className="text-white/70 max-w-2xl mx-auto">Join our midnight warfare prayers, prophetic declarations, and intercession for the destinies of our children.</p>
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
                      <h3 className="text-lg font-semibold text-[#045BB4]">
                        {featuredVideo?.title || "Wailing Woman Broadcast"}
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
                        <MessageSquareText size={12} /> Live Chat
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "testimony" ? null : "testimony")} className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-100 transition-colors">
                        Send Testimony
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "prayer" ? null : "prayer")} className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-900 hover:bg-purple-100 transition-colors">
                        Prayer Request
                      </button>
                      <button onClick={() => setActiveTool(activeTool === "give" ? null : "give")} className="inline-flex items-center gap-2 rounded-full bg-[#045BB4] px-4 py-1 text-xs font-semibold text-white hover:bg-[#033D7A] transition-colors shadow-sm">
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
                        <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={`rounded-full px-3 py-1 transition-colors ${activeTool === tool.key ? "bg-[#045BB4] text-white" : "bg-white text-black hover:bg-gray-200"}`}>
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
                    {activeTool === "prayer" && <div className="px-5 py-6"><PrayerRequestTool ministryKey="wailing-woman" /></div>}
                    {activeTool === "give" && <div className="px-5 py-6"><WailingWomanGiveTool isMobile={false} /></div>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* RECENT PRAYERS SECTION */}
        {!mobilePlayerActive && videos.length > 1 && (
          <section className="py-20 bg-white text-black border-b border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Recent Midnight Prayers</h2>
                  <p className="text-gray-500 mt-2">Catch up on previous warfare intercessions and prophetic sessions.</p>
                </div>
                <a 
                  href={`https://www.youtube.com/channel/${PASTOR_ESAU_BANDA_CHANNEL_ID}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="hidden sm:flex items-center gap-2 text-purple-600 font-bold hover:text-purple-800 transition-colors"
                >
                  View All on YouTube <Search className="w-4 h-4" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.slice(1, 7).map((video) => (
                  <motion.div 
                    key={video.videoId}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group"
                  >
                    <a href={video.url} target="_blank" rel="noreferrer" className="block">
                      <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-shadow">
                        <Image 
                          src={video.thumbnail} 
                          alt={video.title} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-purple-900/0 group-hover:bg-purple-900/20 transition-colors duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                             <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-purple-600 border-b-[8px] border-b-transparent ml-1" />
                          </div>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-purple-700 transition-colors">
                        {video.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                        <CalendarClock className="w-4 h-4" />
                        {formatDate(video.publishedAt)}
                      </p>
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* MOBILE FULLSCREEN PLAYER OVERRIDE */}
        {mobilePlayerActive && (
          <section className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-[#021830]">
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
                      <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={`rounded-full px-3 py-1 transition-colors ${activeTool === tool.key ? 'bg-[#045BB4] text-white' : 'bg-white border border-black/10 text-black'}`}>
                        {tool.label}
                      </button>
                    ))}
                    <button onClick={() => setActiveTool(null)} className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">Close</button>
                  </div>
                </div>
                {activeTool === "chat" && <div className="h-[300px] w-full bg-white mb-4 rounded-xl overflow-hidden border border-black/10"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Wailing Woman Live'} /></div>}
                {activeTool === "bible" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><BibleTool /></div>}
                {activeTool === "notepad" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><NotepadTool /></div>}
                {activeTool === "testimony" && <div className="px-4 py-5"><TestimonyTool /></div>}
                {activeTool === "prayer" && <div className="px-4 py-5"><PrayerRequestTool ministryKey="wailing-woman" /></div>}
                {activeTool === "give" && <div className="px-4 py-5"><WailingWomanGiveTool isMobile={true} /></div>}
              </div>
            </div>
          </section>
        )}
        {/* 5. UPCOMING EVENTS (Clickable Match to Youth Layout Module) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 text-black overflow-hidden border-y border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Events</h2>
                  <p className="text-black/60 max-w-xl">A record of our commitment to continuous spiritual and leadership development.</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end w-full md:w-auto">
                  <form onSubmit={handleEventSearch} className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="search"
                      value={eventSearchInput}
                      onChange={(event) => setEventSearchInput(event.target.value)}
                      placeholder="Search by title, date, or keyword"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#045BB4] focus:ring-2 focus:ring-[#045BB4]/15 sm:w-64"
                      aria-label="Search events"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#045BB4] px-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#033D7A] focus:outline-none focus:ring-2 focus:ring-[#045BB4]/30"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Search
                    </button>
                  </form>
                  {eventSearchQuery && (
                    <button
                      type="button"
                      onClick={clearEventSearch}
                      className="text-xs font-semibold text-[#045BB4] hover:text-[#033D7A]"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>

              {displayedEventItems.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(featuredEvent)}
                    className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group text-left w-full focus:outline-none focus:ring-4 focus:ring-[#045BB4]"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={featuredEvent.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={featuredEvent.image}
                          alt={featuredEvent.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8">
                          <span className="bg-[#045BB4] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3 flex items-center gap-2">
                            <CalendarClock className="w-4 h-4" />
                            Event
                          </span>
                          <h3 className="text-white text-3xl md:text-4xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4">{featuredEvent.title}</h3>
                          <p className="text-white/90 text-sm md:text-base font-medium flex items-center gap-2 mb-1">
                            <CalendarClock className="w-4 h-4" /> {featuredEvent.date}
                          </p>
                          <p className="text-white/70 text-sm leading-relaxed">{featuredEvent.description}</p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      Select this event
                    </div>
                  </button>

                  <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-[#045BB4]/30">
                    {remainingEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="relative h-48 w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-black/5 group text-left focus:outline-none focus:ring-2 focus:ring-[#045BB4] sm:w-72 lg:h-[113px] lg:w-full"
                      >
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                          <span className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">Event</span>
                          <h4 className="text-white text-sm font-semibold leading-tight mb-1 group-hover:underline underline-offset-2">{event.title}</h4>
                          <p className="text-white/60 text-[10px] truncate">{event.date}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#045BB4]/25 bg-white p-8 text-center text-sm text-black/55">
                  No events match your search.
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6. PROJECTS AND OUTREACHES (copy of Events section) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black overflow-hidden border-b border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Projects and Outreaches</h2>
                  <p className="text-black/60 max-w-xl">A record of our outreach seasons and mission impact activities.</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end w-full md:w-auto">
                  <form onSubmit={handleProjectSearch} className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="search"
                      value={projectSearchInput}
                      onChange={(event) => setProjectSearchInput(event.target.value)}
                      placeholder="Search by title, date, or keyword"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#045BB4] focus:ring-2 focus:ring-[#045BB4]/15 sm:w-64"
                      aria-label="Search projects and outreaches"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#045BB4] px-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#033D7A] focus:outline-none focus:ring-2 focus:ring-[#045BB4]/30"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Search
                    </button>
                  </form>
                  {projectSearchQuery && (
                    <button
                      type="button"
                      onClick={clearProjectSearch}
                      className="text-xs font-semibold text-[#045BB4] hover:text-[#033D7A]"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>

              {displayedProjectItems.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(featuredProject)}
                    className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group text-left w-full focus:outline-none focus:ring-4 focus:ring-[#045BB4]"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={featuredProject.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={featuredProject.image}
                          alt={featuredProject.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8">
                          <span className="bg-[#045BB4] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3 flex items-center gap-2">
                            <CalendarClock className="w-4 h-4" />
                            Project
                          </span>
                          <h3 className="text-white text-3xl md:text-4xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4">{featuredProject.title}</h3>
                          <p className="text-white/90 text-sm md:text-base font-medium flex items-center gap-2 mb-1">
                            <CalendarClock className="w-4 h-4" /> {featuredProject.date}
                          </p>
                          <p className="text-white/70 text-sm leading-relaxed">{featuredProject.description}</p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      Select this project
                    </div>
                  </button>

                  <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-[#045BB4]/30">
                    {remainingProjects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => setSelectedProject(project)}
                        className="relative h-48 w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-black/5 group text-left focus:outline-none focus:ring-2 focus:ring-[#045BB4] sm:w-72 lg:h-[113px] lg:w-full"
                      >
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                          <span className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">Project</span>
                          <h4 className="text-white text-sm font-semibold leading-tight mb-1 group-hover:underline underline-offset-2">{project.title}</h4>
                          <p className="text-white/60 text-[10px] truncate">{project.date}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#045BB4]/25 bg-white p-8 text-center text-sm text-black/55">
                  No projects match your search.
                </div>
              )}

              <div className="mt-12 text-center">
                <Link 
                  href="/ministries/wailing-woman/archive"
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#045BB4] transition hover:bg-slate-50 hover:border-black/20"
                >
                  View Archive <Search className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 7. NEWS SECTION */}
        {!mobilePlayerActive && (
          <NewsSection
            kicker="Wailing Woman updates"
            title="Latest News"
            description="Stay updated with the latest stories, testimonies, and announcements from the Wailing Woman global network."
            items={WAILING_WOMAN_NEWS_ITEMS}
            backgroundClassName="bg-slate-50 text-black border-y border-black/5"
            maxItems={6}
          />
        )}

        <div className="bg-slate-50 pb-16 text-center">
          <Link 
            href="/ministries/wailing-woman/archive"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#045BB4] transition hover:bg-slate-50 hover:border-black/20"
          >
            View News Archive <Search className="w-4 h-4" />
          </Link>
        </div>

        {/* 8. SUPPORT THE MINISTRY SECTOR */}
        {!mobilePlayerActive && (
          <section className="py-16 bg-[linear-gradient(135deg,#6B21A8_0%,#4C1D95_100%)] text-white text-center relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 relative z-10">
              <h2 className="text-3xl font-bold mb-4">Support the Devotional & Warfare Missions</h2>
              <p className="text-purple-100 text-base max-w-2xl mx-auto mb-8">
                Partner with us in distributing the &quot;My Seed Must Prosper&quot; devotional globally and sustaining online prayer vectors across communities.
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
