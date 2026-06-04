'use client';

import { useState, useEffect, useRef, type SyntheticEvent, type FormEvent } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import NewsSection, { type NewsSectionItem } from '@/components/NewsSection';
import { apiFetch, apiUrl } from '@/lib/api';
import { 
  MapPin, Phone, Mail, CalendarClock, Globe, Target,
  BookOpenText, MessageSquareText, StickyNote, Heart, Search, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- LIVESTREAM COMPONENTS ---
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import BibleTool from '@/components/livestream/BibleTool';
import WomenOfHopeGiveTool from '@/components/livestream/WomenOfHopeGiveTool';

// --- TYPES & GLOBALS ---
type ToolKey = "bible" | "notepad" | "chat" | "testimony" | "prayer" | "give" | null;

type YouTubePlayer = {
  pauseVideo: () => void;
  getCurrentTime?: () => number;
};

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
  { key: "prayer", label: "Prayer", kind: "form" },
  { key: "give", label: "Give", kind: "component" },
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

type EventCard = {
  id: string;
  title: string;
  date: string;
  description: string;
  image: string;
};

type ProjectCard = {
  id: string;
  type: string;
  title: string;
  status: string;
  image: string;
};

const toAssetUrl = (value: string | null | undefined) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const swapImage = (fallback: string) => (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.src = fallback;
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
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=Z_HD5WhhxOU',
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
    imageUrl: '/ministries/woh/woh-1.JPG',
    sortOrder: 0,
  },
  {
    id: 'highlight-2',
    category: 'highlight',
    title: 'Taking on family and societal leadership.',
    description: null,
    label: null,
    imageUrl: '/ministries/woh/woh-2.JPG',
    sortOrder: 1,
  },
  {
    id: 'highlight-3',
    category: 'highlight',
    title: 'Hospital visitations and community service.',
    description: null,
    label: null,
    imageUrl: '/ministries/woh/woh-3.JPG',
    sortOrder: 2,
  },
  {
    id: 'highlight-4',
    category: 'highlight',
    title: 'Preaching the gospel to communities around us.',
    description: null,
    label: null,
    imageUrl: '/ministries/woh/woh-4.JPG',
    sortOrder: 3,
  },
  {
    id: 'highlight-5',
    category: 'highlight',
    title: 'Summits, workshops, and panel discussions.',
    description: null,
    label: null,
    imageUrl: '/ministries/woh/woh-5.JPG',
    sortOrder: 4,
  },
  {
    id: 'highlight-6',
    category: 'highlight',
    title: 'Supporting the ministry of the church.',
    description: null,
    label: null,
    imageUrl: '/ministries/woh/woh-6.JPG',
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

const WOMEN_OF_HOPE_NEWS_ITEMS: NewsSectionItem[] = [
  {
    badge: 'Projects',
    date: 'June 2026',
    title: 'Women of Hope Projects Continue to Serve Communities',
    description:
      'The ministry continues to champion practical projects that strengthen families and respond to community needs.',
    image: '/ministries/woh/news-1.JPG',
  },
  {
    badge: 'Training',
    date: 'May 2026',
    title: 'Skills Training Initiative Builds Capacity',
    description:
      'Women are being equipped through hands-on learning, mentorship, and practical skills development.',
    image: '/ministries/woh/news-2.JPG',
  },
  {
    badge: 'Outreach',
    date: 'May 2026',
    title: 'Community Outreach Brings Hope and Care',
    description:
      'Women of Hope continues to support outreach moments that bring encouragement, prayer, and practical help.',
    image: '/ministries/woh/news-3.JPG',
  },
  {
    badge: 'Milestone',
    date: 'April 2026',
    title: '500+ Mattress Procurement Reaches More Families',
    description:
      'The ongoing mattress procurement project is helping improve dignity and care for families connected to the ministry.',
    image: '/ministries/woh/news-4.JPG',
  },
  {
    badge: 'Fellowship',
    date: 'April 2026',
    title: 'Women Gather for Prayer and Encouragement',
    description:
      'Gatherings continue to create space for worship, sisterhood, encouragement, and shared spiritual growth.',
    image: '/ministries/woh/news-5.JPG',
  },
  {
    badge: 'Updates',
    date: 'March 2026',
    title: 'International Structure Strengthens the Vision',
    description:
      'Women of Hope is building stronger structures for global coordination, regional support, and ministry growth.',
    image: '/ministries/woh/news-6.JPG',
  },
];

export default function WomenOfHopePage() {
  // --- STATE ---
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventCard | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectCard | null>(null);
  const [featuredEventIndex, setFeaturedEventIndex] = useState(0);
  const [eventSearchInput, setEventSearchInput] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [projectSearchInput, setProjectSearchInput] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  // --- LIVESTREAM STATE ---
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileResumeAt, setMobileResumeAt] = useState<number | null>(null);
  const playersRef = useRef<Map<string, YouTubePlayer>>(new Map());

  // --- LIVESTREAM CONSTANTS ---
  const CHANNEL_ID = "UC8JUC-G4wKhrrPr7xjxYWJw";
  const FALLBACK_HERO_ID = "Z_HD5WhhxOU";
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
  const highlightGalleryItems = mergeItemsWithFallback(ministryItemGroups.highlights, defaultHighlights).slice(0, 6).map((item) => ({
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

  const normalizeSearchText = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const formatSearchDate = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const normalizedEventSearchQuery = normalizeSearchText(eventSearchQuery);
  const normalizedFormattedSearchDate = normalizeSearchText(formatSearchDate(eventSearchQuery));
  const normalizedProjectSearchQuery = normalizeSearchText(projectSearchQuery);
  const normalizedFormattedProjectSearchDate = normalizeSearchText(formatSearchDate(projectSearchQuery));

  const displayedEventItems = normalizedEventSearchQuery
    ? eventCards.filter((event) => {
        const searchableText = normalizeSearchText(`${event.title} ${event.date} ${event.description}`);
        return (
          searchableText.includes(normalizedEventSearchQuery) ||
          (normalizedFormattedSearchDate && searchableText.includes(normalizedFormattedSearchDate))
        );
      })
    : eventCards;

  const displayedProjectItems = normalizedProjectSearchQuery
    ? projectCards.filter((project) => {
        const searchableTitle = normalizeSearchText(project.title);

        return (
          searchableTitle.includes(normalizedProjectSearchQuery) ||
          Boolean(normalizedFormattedProjectSearchDate && searchableTitle.includes(normalizedFormattedProjectSearchDate))
        );
      })
    : projectCards;

  const featuredProject = displayedProjectItems[0] || null;
  const remainingProjects = displayedProjectItems.slice(1);
  const safeFeaturedEventIndex = displayedEventItems.length ? featuredEventIndex % displayedEventItems.length : 0;
  const featuredGridEvent = displayedEventItems[safeFeaturedEventIndex] || eventCards[0];
  const remainingEvents = displayedEventItems.filter((_, idx) => idx !== safeFeaturedEventIndex);

  useEffect(() => {
    if (!displayedEventItems.length) return;
    const timer = setInterval(() => {
      setFeaturedEventIndex((prev) => (prev + 1) % displayedEventItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayedEventItems.length]);

  useEffect(() => {
    setFeaturedEventIndex(0);
  }, [eventSearchQuery]);

  const handleEventSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEventSearchQuery(eventSearchInput.trim());
  };

  const clearEventSearch = () => {
    setEventSearchInput('');
    setEventSearchQuery('');
  };

  const handleProjectSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProjectSearchQuery(projectSearchInput.trim());
  };

  const clearProjectSearch = () => {
    setProjectSearchInput('');
    setProjectSearchQuery('');
  };

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
    if (!displayedEventItems.length) return;
    const timer = setInterval(() => {
      setFeaturedEventIndex((prev) => (prev + 1) % displayedEventItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayedEventItems.length]);

  useEffect(() => {
    setFeaturedEventIndex(0);
  }, [eventSearchQuery]);

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

    const fetchVideos = async () => {
      try {
        if (!YOUTUBE_API_KEY) throw new Error("Missing API key");

        const liveUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        liveUrl.searchParams.set("part", "snippet");
        liveUrl.searchParams.set("channelId", CHANNEL_ID);
        liveUrl.searchParams.set("eventType", "live");
        liveUrl.searchParams.set("type", "video");
        liveUrl.searchParams.set("videoEmbeddable", "true");
        liveUrl.searchParams.set("maxResults", "1");
        liveUrl.searchParams.set("key", YOUTUBE_API_KEY);

        const [liveData, latestEmbeddableVideo] = await Promise.all([
          fetchJson(liveUrl.toString()),
          fetchLatestEmbeddableVideo(CHANNEL_ID),
        ]);

        const liveVideo = Array.isArray(liveData?.items) ? toVideoFromSearch(liveData.items[0]) : null;
        const finalVideo = liveVideo || latestEmbeddableVideo;

        if (isMounted) {
          if (finalVideo) {
            setVideos([finalVideo]);
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
    const players = playersRef.current;
    const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("[data-yt-id]"));
    const YT = window.YT;

    iframes.forEach((iframe) => {
      const videoId = iframe.dataset.ytId;
      if (!videoId || players.has(videoId)) return;
      const player = new YT.Player(iframe, {
        videoId,
        events: {
          onStateChange: (event: YouTubeStateChangeEvent) => {
            if (event.data === YT.PlayerState.PLAYING) {
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

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white text-black w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative w-full md:w-1/2 h-64 md:h-[500px] bg-slate-100">
                <Image
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  fill
                  className="object-cover"
                  onError={swapImage('/hero/hero-store.jpg')}
                />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-gray-50">
                <span className="text-sm font-bold text-[#029EFB] uppercase tracking-wider mb-2">
                  Women of Hope Event
                </span>
                <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                  {selectedEvent.title}
                </h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CalendarClock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">{selectedEvent.date}</p>
                  </div>
                </div>
                <div className="w-12 h-1 bg-gray-200 rounded-full mb-6" />
                <p className="text-gray-600 leading-relaxed mb-8">
                  {selectedEvent.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white text-black w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                aria-label="Close project details"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative w-full md:w-1/2 h-64 md:h-[500px] bg-slate-100">
                <Image
                  src={selectedProject.image}
                  alt={selectedProject.title}
                  fill
                  className="object-cover"
                  onError={swapImage('/hero/hero-store.jpg')}
                />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-gray-50">
                <span className="text-sm font-bold text-[#029EFB] uppercase tracking-wider mb-2">
                  {selectedProject.type}
                </span>
                <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                  {selectedProject.title}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">Status: {selectedProject.status}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">Women of Hope Project</p>
                  </div>
                </div>

                <div className="w-12 h-1 bg-gray-200 rounded-full mb-6" />

                <p className="text-gray-600 leading-relaxed">
                  This project is part of Women of Hope&apos;s work to equip women, strengthen families, and serve communities with practical care.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen">
        
        {/* 1. HERO SECTION */}
        {!mobilePlayerActive && (
          <section
            className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 bg-[#029EFB] text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10"
            style={{
              backgroundImage: `linear-gradient(rgba(2,158,251,0.82), rgba(1,120,192,0.78)), url(${toAssetUrl(ministryInfo.heroImageUrl) || '/hero/hero-8-woh.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
                <Image 
                  src={toAssetUrl(ministryInfo.logoImageUrl) || '/logo.png'} 
                  alt={`${ministryInfo.name || 'Women of Hope'} Logo`} 
                  fill 
                  className="object-contain p-2 rounded-full"
                  onError={swapImage('/logo.png')} 
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
                    {activeTool === "give" && <div className="px-5 py-6"><WomenOfHopeGiveTool isMobile={false} /></div>}
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
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Projects & Milestones</h2>
                  <p className="text-black/60 max-w-xl">The ministry has taken a project-focused form of implementation of activities with timelines, embracing learning, measuring, and reporting impact over time.</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <form onSubmit={handleProjectSearch} className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="search"
                      value={projectSearchInput}
                      onChange={(event) => setProjectSearchInput(event.target.value)}
                      placeholder="Borehole Planting"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#029EFB] focus:ring-2 focus:ring-[#029EFB]/15 sm:w-48"
                      aria-label="Search Women of Hope projects"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#029EFB] px-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#0178C0] focus:outline-none focus:ring-2 focus:ring-[#029EFB]/30"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Search
                    </button>
                  </form>
                  {projectSearchQuery && (
                    <button
                      type="button"
                      onClick={clearProjectSearch}
                      className="text-xs font-semibold text-[#029EFB] hover:text-[#0178C0]"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>

              {featuredProject ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(featuredProject)}
                    className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group text-left w-full focus:outline-none focus:ring-4 focus:ring-[#029EFB]"
                  >
                    <Image
                      src={featuredProject.image || '/hero/hero-store.jpg'}
                      alt={featuredProject.title || 'Women of Hope Project'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={swapImage('/hero/hero-store.jpg')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                      <span className="bg-[#029EFB] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3">
                        {featuredProject.type || 'Project'}
                      </span>
                      <h3 className="text-white text-2xl md:text-3xl font-bold mb-1 group-hover:underline decoration-2 underline-offset-4">
                        {featuredProject.title || 'Women of Hope Project'}
                      </h3>
                      <p className="text-white/80 text-sm font-medium">Status: {featuredProject.status || 'Ongoing'}</p>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click for Details
                    </div>
                  </button>

                  <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-[#029EFB]/30">
                    {remainingProjects.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => setSelectedProject(material)}
                        className="relative h-48 w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-black/5 group text-left focus:outline-none focus:ring-2 focus:ring-[#029EFB] sm:w-72 lg:h-[113px] lg:w-full"
                      >
                        <Image
                          src={material.image}
                          alt={material.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                          <span className="text-sky-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                            {material.type}
                          </span>
                          <h4 className="text-white text-sm font-semibold leading-tight mb-1 group-hover:underline underline-offset-2">{material.title}</h4>
                          <p className="text-white/60 text-[10px]">Status: {material.status}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#029EFB]/25 bg-gray-50 p-8 text-center text-sm text-black/55">
                  No Women of Hope projects found for this search.
                </div>
              )}
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
                {activeTool === "give" && <div className="px-4 py-5"><WomenOfHopeGiveTool isMobile={true} /></div>}
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
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <form onSubmit={handleEventSearch} className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="search"
                      value={eventSearchInput}
                      onChange={(event) => setEventSearchInput(event.target.value)}
                      placeholder="March 28, 2026"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#029EFB] focus:ring-2 focus:ring-[#029EFB]/15 sm:w-48"
                      aria-label="Search women of hope events by date"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#029EFB] px-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#029EFB]/30"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Search
                    </button>
                  </form>
                  {eventSearchQuery && (
                    <button
                      type="button"
                      onClick={clearEventSearch}
                      className="text-xs font-semibold text-[#029EFB] hover:text-[#1E3A5F]"
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
                    onClick={() => setSelectedEvent(featuredGridEvent)}
                    className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group text-left w-full focus:outline-none focus:ring-4 focus:ring-[#029EFB]"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={featuredGridEvent.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={featuredGridEvent.image}
                          alt={featuredGridEvent.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8">
                          <span className="bg-[#029EFB] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3">
                            Women of Hope Event
                          </span>
                          <h3 className="text-white text-3xl md:text-4xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4">
                            {featuredGridEvent.title}
                          </h3>
                          <p className="text-white/90 text-sm md:text-base font-medium flex items-center gap-2 mb-1">
                            <CalendarClock className="w-4 h-4" /> {featuredGridEvent.date}
                          </p>
                          <p className="text-white/70 text-sm">
                            {featuredGridEvent.description}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click for Details
                    </div>
                  </button>

                  <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-[#029EFB]/30">
                    {remainingEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="relative h-48 w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-black/5 group text-left focus:outline-none focus:ring-2 focus:ring-[#029EFB] sm:w-72 lg:h-[113px] lg:w-full"
                      >
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                          <span className="text-sky-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                            Women of Hope Event
                          </span>
                          <h4 className="text-white text-sm font-semibold leading-tight mb-1 group-hover:underline underline-offset-2">
                            {event.title}
                          </h4>
                          <p className="text-white/60 text-[10px] truncate">
                            {event.date}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#029EFB]/25 bg-white p-8 text-center text-sm text-black/55">
                  No Women of Hope events found for this date search.
                </div>
              )}
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
                    src={toAssetUrl(ministryInfo.partnershipImageUrl) || '/ministries/woh/global-vision.JPG'}
                    alt={ministryInfo.partnershipTitle || 'Global Vision'}
                    fill
                    className="object-cover"
                    onError={swapImage('/hero/hero-store.jpg')}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 8. NEWS SECTION */}
        {!mobilePlayerActive && (
          <NewsSection
            kicker="Women of Hope updates"
            title="Latest News"
            description="Recent developments, project milestones, outreach moments, and ministry updates from Women of Hope."
            items={WOMEN_OF_HOPE_NEWS_ITEMS}
            backgroundClassName="bg-gray-50 text-black border-y border-black/5"
            maxItems={6}
          />
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
