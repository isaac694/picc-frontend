'use client';

import { useState, useEffect, useRef, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { apiFetch, apiUrl } from '@/lib/api';
import { 
  ChevronLeft, ChevronRight, MapPin, 
  Phone, Mail, CalendarClock, BookOpen, Globe, 
  BookOpenText, MessageSquareText, StickyNote,
  Shield, HandHeart, Ear
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- LIVESTREAM COMPONENTS ---
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import GiveTool from '@/components/livestream/GiveTool';
import BibleTool from '@/components/livestream/BibleTool';

// --- TYPES & GLOBALS ---
type YouTubePlayer = {
  pauseVideo: () => void;
  getCurrentTime?: () => number;
};

type YouTubeStateChangeEvent = {
  data: number;
  target: YouTubePlayer;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLIFrameElement,
        options: { events: { onStateChange: (event: YouTubeStateChangeEvent) => void } },
      ) => YouTubePlayer;
      PlayerState: {
        PLAYING: number;
      };
    };
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

type YouTubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    publishedAt?: string;
    channelTitle?: string;
    description?: string;
    liveBroadcastContent?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
    };
  };
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

const toAssetUrl = (value: string | null | undefined) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const videoIdFromUrl = (value: string | null | undefined) => {
  const raw = (value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace(/^\//, '');
    }
    return url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop() || '';
  } catch {
    return raw;
  }
};

const swapImage = (fallback: string) => (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.src = fallback;
};

// --- MOCK DATA ---
const defaultInfo: MinistryInfo = {
  name: 'ICD',
  motto: 'Raising leaders and disciples through intentional Christian development.',
  about: `ICD is an intercessory and developmental ministry arm of PICC. Our goal is to move believers from being mere spectators to becoming active, effective disciples of Jesus Christ who are capable of leading and guiding others.

We provide structured modules covering biblical foundations, leadership development, and practical ministry skills. By combining sound doctrine with practical application, ICD ensures that every member is thoroughly equipped for every good work in the Kingdom.`,
  heroImageUrl: '/hero/hero-icd.jpg',
  logoImageUrl: '/logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Partner With Us',
  partnershipBody: `The work of building disciples, ministering deliverance, and reaching out to our community through initiatives like our hospital visits is vast.

By partnering with the ICD Ministry financially, you ensure that we can continue bringing hope to the hopeless and life to the dying.`,
  partnershipDetails: [
    { label: 'Bank', value: 'National Bank' },
    { label: 'Account Name', value: 'PICC ICD MINISTRY' },
    { label: 'Account Number', value: '1010850537' },
    { label: 'Branch', value: 'Gateway Mall' },
  ],
  partnershipImageUrl: '/images/icd/ICD-MAY-26.png',
  phone: 'Check with your local PICC branch for contact details.',
  email: 'info@picc.org',
  location: 'PICC ICD Department\nCamp of God Cathedral',
  contactIntro:
    'Whether you need counselling, deliverance, or wish to grow as an active disciple, we are here to walk alongside you.',
};

const pastEvents = [
  {
    id: 1,
    title: 'Kamuzu Central Hospital Visit',
    date: 'May 3 & 17, 2026',
    description: 'Join us from 8:00 AM at Kamuzu Central Hospital as we visit the sick, pray for healing, and share the love and hope of Christ with Pastor Mrs Loyce Banda.',
    image: '/hero/hero-icd.jpg',
  },
  {
    id: 2,
    title: 'Discipleship Intensive',
    date: 'January 15 - February 20, 2025',
    description: 'A 6-week foundational course designed to root believers in the core doctrines of faith and effective Christian living.',
    image: '/hero/hero-1.jpg',
  },
  {
    id: 3,
    title: 'Marketplace Apostles Summit',
    date: 'April 22, 2025',
    description: 'Equipping professionals to take the principles of the Kingdom into their various spheres of influence and industry.',
    image: '/hero/hero-2.jpg',
  },
  {
    id: 4,
    title: 'School of Ministry Graduation',
    date: 'June 30, 2025',
    description: 'Celebrating the latest cohort of leaders who have successfully completed their intentional development modules.',
    image: '/hero/hero-3.jpg',
  },
];

const defaultEventItems: MinistryItem[] = pastEvents.map((event, index) => ({
  id: `default-event-${event.id}`,
  category: 'event',
  title: event.title,
  description: event.description,
  label: event.date,
  imageUrl: event.image,
  sortOrder: index,
}));

const defaultIcdCards = [
  { id: 'default-card-1', category: 'card', title: 'Intercession', description: "Standing in the gap through fervent, strategic prayer to birth God's purposes in the church, our families, and the nations.", label: null, imageUrl: null, sortOrder: 0 },
  { id: 'default-card-2', category: 'card', title: 'Counselling', description: "Providing biblical guidance, wisdom, and a listening ear to help believers navigate life's challenges with spiritual clarity.", label: null, imageUrl: null, sortOrder: 1 },
  { id: 'default-card-3', category: 'card', title: 'Deliverance', description: 'Ministering spiritual freedom and healing to those bound by chains, ensuring total liberty through the power of Christ.', label: null, imageUrl: null, sortOrder: 2 },
];

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

const highlightGallery = [
  { id: 1, src: '/hero/hero-icd.jpg', caption: 'Moving believers from spectators to active disciples.' },
  { id: 2, src: '/moments/icd-1.jpg', caption: 'Structured modules covering biblical foundations.' },
  { id: 3, src: '/moments/icd-2.jpg', caption: 'Leadership development and practical ministry skills.' },
  { id: 4, src: '/moments/icd-3.jpg', caption: 'Intercession, Counselling, and Deliverance in action.' },
  { id: 5, src: '/moments/icd-4.jpg', caption: 'Combining sound doctrine with practical application.' },
  { id: 6, src: '/moments/icd-5.jpg', caption: 'Equipping every member for good works.' },
];

const defaultLearningItems: MinistryItem[] = highlightGallery.map((item, index) => ({
  id: `default-learning-${item.id}`,
  category: 'learning',
  title: `Learning Experience ${item.id}`,
  description: item.caption,
  label: null,
  imageUrl: item.src,
  sortOrder: index,
}));

const ministryProjects = [
  { id: 1, type: 'Upcoming Event', title: 'Hospital Visitation Ministry', status: '3 May 2026', image: '/images/icd/ICD-MAY-26.png' },
  { id: 2, type: 'Upcoming Event', title: 'Hospital Visitation Ministry', status: '17 May 2026', image: '/images/icd/ICD-MAY-26.png' },
  { id: 3, type: 'Current Initiative', title: 'Counselling Programs', status: 'Active', image: '/moments/icd-2.jpg' },
  { id: 4, type: 'Training Project', title: 'School of Ministry', status: 'Ongoing', image: '/moments/icd-3.jpg' },
  { id: 5, type: 'Outreach', title: 'Deliverance Workshops', status: 'Upcoming', image: '/moments/icd-4.jpg' },
];

const defaultInitiativeItems: MinistryItem[] = ministryProjects.map((project, index) => ({
  id: `default-initiative-${project.id}`,
  category: 'initiative',
  title: project.title,
  description: project.status,
  label: project.type,
  imageUrl: project.image,
  sortOrder: index,
}));

export default function IcdMinistryPage() {
  // --- STATE ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeGalleryId, setActiveGalleryId] = useState<number | null>(null);

  // --- LIVESTREAM STATE ---
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileResumeAt, setMobileResumeAt] = useState<number | null>(null);
  const [ministryInfo, setMinistryInfo] = useState<MinistryInfo>(defaultInfo);
  const [ministryItems, setMinistryItems] = useState<MinistryItem[]>([]);
  const playersRef = useRef<Map<string, YouTubePlayer>>(new Map());

  // --- LIVESTREAM CONSTANTS ---
  const CHANNEL_ID = "UC5iA3dWaUBlP_PBlGSQvgNQ";
  const FALLBACK_HERO_ID = videoIdFromUrl(ministryInfo.liveSessionYoutubeUrl) || "ydTADwZRquA";
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

  const featuredVideo = videos[0] || null;
  const itemGroups = {
    cards: ministryItems.filter((item) => item.category === 'card'),
    learning: ministryItems.filter((item) => item.category === 'learning'),
    initiatives: ministryItems.filter((item) => item.category === 'initiative'),
    events: ministryItems.filter((item) => item.category === 'event'),
  };
  const icdCards = mergeItemsWithFallback(itemGroups.cards, defaultIcdCards);
  const learningItems = mergeItemsWithFallback(itemGroups.learning, defaultLearningItems);
  const galleryItems = learningItems.length > 0
    ? learningItems.map((item, index) => ({
        id: index + 1,
        src: toAssetUrl(item.imageUrl) || highlightGallery[index % highlightGallery.length]?.src || '/hero/hero-icd.jpg',
        caption: item.description || item.title,
      }))
    : highlightGallery;
  const initiativeItems = mergeItemsWithFallback(itemGroups.initiatives, defaultInitiativeItems);
  const projectItems = initiativeItems.length > 0
    ? initiativeItems.map((item, index) => ({
        id: index + 1,
        type: item.label || 'Initiative',
        title: item.title,
        status: item.description || 'Active',
        image: toAssetUrl(item.imageUrl) || ministryProjects[index % ministryProjects.length]?.image || '/images/icd/ICD-MAY-26.png',
      }))
    : ministryProjects;
  const mergedEventItems = mergeItemsWithFallback(itemGroups.events, defaultEventItems);
  const eventItems = mergedEventItems.length > 0
    ? mergedEventItems.map((item, index) => ({
        id: index + 1,
        title: item.title,
        date: item.label || 'Upcoming',
        description: item.description || '',
        image: toAssetUrl(item.imageUrl) || pastEvents[index % pastEvents.length]?.image || '/hero/hero-icd.jpg',
      }))
    : pastEvents;
  const aboutParagraphs = (ministryInfo.about || defaultInfo.about || '').split(/\n{2,}/).filter(Boolean);
  const partnershipParagraphs = (ministryInfo.partnershipBody || defaultInfo.partnershipBody || '').split(/\n{2,}/).filter(Boolean);
  const partnershipDetails = ministryInfo.partnershipDetails?.length ? ministryInfo.partnershipDetails : defaultInfo.partnershipDetails || [];

  const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Africa/Blantyre" });
  };

  // --- EFFECTS ---
  useEffect(() => {
    let isMounted = true;

    const loadMinistryContent = async () => {
      try {
        const response = await apiFetch('/api/ministries/icd/content');
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
        // Keep the built-in page content as the public fallback.
      }
    };

    void loadMinistryContent();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % eventItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [eventItems.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % eventItems.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? eventItems.length - 1 : prev - 1));

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

    const fetchVideos = async () => {
      try {
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
              title: "ICD Ministry Service",
              publishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              channelTitle: "ICD Ministry",
              description: "Raising leaders and disciples through intentional Christian development.",
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
  }, [YOUTUBE_API_KEY, FALLBACK_HERO_ID]);

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
    const youtube = window.YT;
    const players = playersRef.current;
    const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("[data-yt-id]"));

    iframes.forEach((iframe) => {
      const videoId = iframe.dataset.ytId;
      if (!videoId || players.has(videoId)) return;
      const player = new youtube.Player(iframe, {
        events: {
          onStateChange: (event: YouTubeStateChangeEvent) => {
            if (event.data === youtube.PlayerState.PLAYING) {
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
  }, [activeTool, isMobileViewport, featuredVideo?.videoId, FALLBACK_HERO_ID]);

  const mobileVideoId = featuredVideo?.videoId || FALLBACK_HERO_ID;
  const mobileVideoStart = mobileResumeAt && mobileResumeAt > 0 ? `&start=${mobileResumeAt}` : '';

  return (
    <>
      <Navigation />
      
      <main className="min-h-screen">
        
        {/* 1. HERO SECTION */}
        {!mobilePlayerActive && (
          <section
            className="relative z-10 overflow-hidden rounded-b-[36px] bg-[#033D7A] pt-28 pb-20 text-white shadow-lg sm:pt-36 sm:pb-28 md:rounded-b-[48px]"
            style={{
              backgroundImage: `linear-gradient(rgba(2,24,48,0.78), rgba(4,91,180,0.72)), url(${toAssetUrl(ministryInfo.heroImageUrl) || '/hero/hero-icd.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
                <Image 
                  src={toAssetUrl(ministryInfo.logoImageUrl) || '/logos/icd-logo.png'} 
                  alt="ICD Logo" 
                  fill 
                  className="object-contain p-2 rounded-full"
                  onError={swapImage('/logo.png')} 
                />
              </div>

              <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">PICC Ministry</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">{ministryInfo.name || 'ICD'}</h1>
              
              <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
                <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                  &quot;{ministryInfo.motto || defaultInfo.motto}&quot;
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
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Intercession, Counselling, and Deliverance (ICD)</h2>
                <div className="w-16 h-1 bg-[#045BB4] mx-auto mb-8 rounded-full" />
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={`about-${index}`} className={`text-lg text-black/70 leading-relaxed ${index < aboutParagraphs.length - 1 ? 'mb-6' : ''}`}>
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Informational Cards inside About Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {icdCards.map((card) => {
                  const Icon = card.title.toLowerCase().includes('counsel') ? Ear : card.title.toLowerCase().includes('deliver') ? HandHeart : Shield;
                  return (
                    <Card key={card.id} className="p-6 text-center shadow-md hover:shadow-xl transition-shadow border-t-4 border-t-[#045BB4]">
                      <Icon className="w-12 h-12 mx-auto text-[#045BB4] mb-4" />
                      <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                      {card.description ? <p className="text-black/60">{card.description}</p> : null}
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 3. MINISTRY HIGHLIGHTS (6-Grid Gallery with Interactive Captions) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-blue-50 border-y border-black/5 text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">The Learning Experience</h2>
                <p className="text-black/60 max-w-2xl mx-auto">Capturing the journey of growth, study, and transformation within our modules.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {galleryItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="relative h-48 md:h-64 bg-blue-200 rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => setActiveGalleryId(activeGalleryId === item.id ? null : item.id)}
                  >
                    <Image 
                      src={item.src} 
                      alt={`Gallery Highlight ${item.id}`} 
                      fill 
                      className={`object-cover transition-transform duration-700 ease-in-out ${activeGalleryId === item.id ? 'scale-110' : 'group-hover:scale-105'}`}
                      onError={swapImage('/hero/hero-store.jpg')} 
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
                    <div className={`absolute inset-0 bg-[#045BB4]/20 transition-opacity duration-300 ${activeGalleryId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                ))}
              </div>
              <p className="text-center text-black/50 text-sm mt-6 italic">Click or tap any image to view details.</p>
            </div>
          </section>
        )}

        {/* 4. THE LIVE ALTAR (Livestream Section) */}
        {!mobilePlayerActive && (
          <section className="py-16 md:py-24 bg-[#021830] text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">ICD Live Sessions</h2>
                <p className="text-white/70 max-w-2xl mx-auto">Join our developmental modules, prayer sessions, and intensive training live online.</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl">
                <div className="relative aspect-video bg-black">
                  <iframe
                    className="h-full w-full"
                    data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                    id="yt-hero"
                    src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                    title={featuredVideo?.title || "ICD Live"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                {/* Tool Selection Bar */}
                <div className="bg-white text-black px-6 py-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-semibold text-[#045BB4]">
                        {featuredVideo?.title || "ICD Broadcast"}
                      </h3>
                      {featuredVideo?.publishedAt && (
                        <p className="text-xs text-black/60 mt-1">
                          {formatDate(featuredVideo.publishedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setActiveTool(activeTool === "bible" ? null : "bible")} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-900 hover:bg-blue-100 transition-colors">
                        <BookOpenText size={12} /> Bible
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
                    {activeTool === "chat" && <div className="h-[400px] w-full bg-white"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'ICD Live'} /></div>}
                    {activeTool === "notepad" && <NotepadTool />}
                    {activeTool === "testimony" && <div className="px-5 py-6"><TestimonyTool /></div>}
                    {activeTool === "give" && <div className="px-5 py-6"><GiveTool isMobile={false} /></div>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 5. MINISTRY PROJECTS & INITIATIVES */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Initiatives</h2>
                  <p className="text-black/60 max-w-xl">Our structured modules ensure members are consistently growing in sound doctrine and effective leadership.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Large Featured Image (Current/Latest Project) */}
                <div className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group">
                  <Image 
                    src={projectItems[0]?.image || '/images/icd/ICD-MAY-26.png'} 
                    alt={projectItems[0]?.title || 'ICD initiative'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={swapImage('/hero/hero-store.jpg')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                    <span className="bg-[#045BB4] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3">
                      {projectItems[0]?.type || 'Initiative'}
                    </span>
                    <h3 className="text-white text-2xl md:text-3xl font-bold mb-1">{projectItems[0]?.title || 'ICD Ministry'}</h3>
                    <p className="text-white/80 text-sm font-medium">{projectItems[0]?.status || 'Active'}</p>
                  </div>
                </div>

                {/* Grid of Smaller Previous/Future Publications */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                  {projectItems.slice(1).map((material) => (
                    <div key={material.id} className="relative h-48 lg:h-[113px] rounded-xl overflow-hidden shadow-md border border-black/5 group">
                      <Image 
                        src={material.image} 
                        alt={material.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={swapImage('/images/icd/ICD-MAY-26.png')}
                      />
                      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                        <span className="text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1">
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
          <section className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-[#021830]">
            <div className="h-full flex flex-col">
              <div className="flex-[0_0_40%] bg-black">
                <iframe
                  className="h-full w-full"
                  data-yt-id={mobileVideoId}
                  id="yt-hero-mobile"
                  src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0&autoplay=1&playsinline=1${mobileVideoStart}`}
                  title={featuredVideo?.title || 'ICD Live'}
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
                {activeTool === "chat" && <div className="h-[300px] w-full bg-white mb-4 rounded-xl overflow-hidden border border-black/10"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'ICD Live'} /></div>}
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
                  <p className="text-black/60 max-w-xl">A record of our commitment to continuous spiritual and leadership development.</p>
                </div>
              </div>

              <div className="bg-[#045BB4] text-white rounded-2xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between shadow-xl">
                <div className="flex items-center gap-4 mb-6 md:mb-0">
                  <div className="p-4 bg-white/20 rounded-full">
                    <CalendarClock className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Upcoming: {eventItems[0]?.title || 'ICD Event'}</h3>
                    <p className="text-white/80 mt-1">{eventItems[0]?.date || 'Upcoming'}</p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-white/80 text-sm mt-1">{eventItems[0]?.description || 'Join us for the next ICD gathering.'}</p>
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
                        <div className="relative w-full sm:w-1/2 h-48 sm:h-full bg-blue-50 flex-shrink-0">
                          <Image 
                            src={eventItems[currentSlide]?.image || eventItems[0]?.image || '/hero/hero-icd.jpg'} 
                            alt={eventItems[currentSlide]?.title || 'Event Image'} 
                            fill 
                            className="object-cover"
                            onError={swapImage('/hero/hero-store.jpg')}
                          />
                        </div>
                        <div className="p-8 sm:p-10 flex flex-col justify-center w-full sm:w-1/2">
                          <div className="flex items-center gap-2 text-[#045BB4] font-semibold text-sm mb-4 bg-blue-50 w-fit px-3 py-1 rounded-full">
                            <BookOpen className="w-4 h-4" />
                            <span>{eventItems[currentSlide]?.date || eventItems[0]?.date}</span>
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                            {eventItems[currentSlide]?.title || eventItems[0]?.title}
                          </h3>
                          <p className="text-black/60 leading-relaxed">
                            {eventItems[currentSlide]?.description || eventItems[0]?.description}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex items-center justify-center gap-6 mt-8">
                  <button onClick={prevSlide} className="p-2 rounded-full bg-white shadow hover:bg-blue-50 border border-black/5">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextSlide} className="p-2 rounded-full bg-white shadow hover:bg-blue-50 border border-black/5">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 7. PARTNER WITH US SECTION (Updated with Banking Details) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">{ministryInfo.partnershipTitle || 'Partner With Us'}</h2>
                  <div className="w-16 h-1 bg-[#045BB4] mb-6 rounded-full" />
                  {partnershipParagraphs.map((paragraph, index) => (
                    <p key={`partnership-${index}`} className={`text-lg text-black/70 ${index < partnershipParagraphs.length - 1 ? 'mb-4' : 'mb-6'}`}>
                      {paragraph}
                    </p>
                  ))}
                  
                  <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-black/5">
                    <h3 className="font-bold text-xl mb-4 text-[#045BB4]">Partnership Details</h3>
                    <div className="space-y-2 text-sm text-black/70">
                      {partnershipDetails.map((detail) => (
                        <p key={`${detail.label}-${detail.value}`}><strong>{detail.label}:</strong> {detail.value}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                  <Image 
                    src={toAssetUrl(ministryInfo.partnershipImageUrl) || '/images/icd/ICD-MAY-26.png'} 
                    alt="Partner with ICD" 
                    fill 
                    className="object-cover"
                    onError={swapImage('/images/icd/ICD-MAY-26.png')} 
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
              <Globe className="w-12 h-12 mx-auto text-[#045BB4] mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Latest News</h2>
              <p className="text-lg text-black/70 max-w-2xl mx-auto mb-8">
                Preparations are in full swing for the upcoming Kamuzu Central Hospital Visits on May 3 and 17, 2026. All volunteers and partners are encouraged to register early. The newest Discipleship Intensive cohort materials are also now available for download.
              </p>
            </div>
          </section>
        )}

        {/* 9. CONTACTS SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-blue-900 text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Involved</h2>
                <p className="text-white/80 max-w-2xl mx-auto">
                  {ministryInfo.contactIntro || defaultInfo.contactIntro}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <MapPin className="w-10 h-10 mx-auto text-blue-300 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Location</h3>
                  {(ministryInfo.location || defaultInfo.location || '').split('\n').map((line) => (
                    <p key={line} className="text-white/70">{line}</p>
                  ))}
                </Card>

                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Phone className="w-10 h-10 mx-auto text-blue-300 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Phone</h3>
                  <p className="text-white/70">{ministryInfo.phone || defaultInfo.phone}</p>
                </Card>

                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Mail className="w-10 h-10 mx-auto text-blue-300 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Email</h3>
                  <p className="text-white/70 break-all">
                    {ministryInfo.email || defaultInfo.email}
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
