'use client';

import { useState, useEffect, useRef, type SyntheticEvent, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import NewsSection, { type NewsSectionItem } from '@/components/NewsSection';
import { Card } from '@/components/ui/card';
import { apiFetch, apiUrl } from '@/lib/api';
import { 
  ChevronLeft, ChevronRight, MapPin, 
  Phone, Mail, CalendarClock, BookOpen, Globe, 
  BookOpenText, MessageSquareText, StickyNote,
  Shield, HandHeart, Ear, Search, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- LIVESTREAM COMPONENTS ---
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import ICDGiveTool from '@/components/livestream/ICDGiveTool';
import BibleTool from '@/components/livestream/BibleTool';

// --- TYPES & GLOBALS ---
type YouTubePlayer = {
  pauseVideo: () => void;
  getCurrentTime?: () => number;
};

type YouTubeStateChangeEvent = {
  data: number;
  target?: YouTubePlayer;
};

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
  canEmbed?: boolean;
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

const TOOL_TABS: Array<{
  key: ToolKey;
  label: string;
  kind: "embed" | "component" | "form";
}> = [
  { key: "chat", label: "Live Chat", kind: "component" },
  { key: "notepad", label: "Notepad", kind: "component" },
  { key: "bible", label: "Bible", kind: "component" },
  { key: "testimony", label: "Send Testimony", kind: "form" },
  { key: "give", label: "Give", kind: "component" },
];

const toAssetUrl = (value: string | null | undefined) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
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
  heroImageUrl: '/ministries/icd/background.JPG',
  logoImageUrl: '/logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=Z_HD5WhhxOU',
  partnershipTitle: 'Partner With Us',
  partnershipBody: `The work of building disciples, ministering deliverance, and reaching out to our community through initiatives like our hospital visits is vast.

By partnering with the ICD Ministry financially, you ensure that we can continue bringing hope to the hopeless and life to the dying.`,
  partnershipDetails: [
    { label: 'Bank', value: 'National Bank' },
    { label: 'Account Name', value: 'PICC ICD MINISTRY' },
    { label: 'Account Number', value: '1010850537' },
    { label: 'Branch', value: 'Gateway Mall' },
  ],
  partnershipImageUrl: '/ministries/icd/icd7.jpg',
  phone: '0995652414 / 0992874401',
  email: 'icd@piccwordwide.org',
  location: 'Pentecost International Christian Centre (PICC) Along Kaunda Road, Near Best Oil Filling Station, Area 49 Post Office Box 31841 Lilongwe 3 Malawi',
  contactIntro:
    'Whether you need counselling, deliverance, or wish to grow as an active disciple, we are here to walk alongside you.',
};

const pastEvents = [
  {
    id: 1,
    title: 'Kamuzu Central Hospital Visit',
    date: 'May 3 & 17, 2026',
    description: 'Join us from 8:00 AM at Kamuzu Central Hospital as we visit the sick, pray for healing, and share the love and hope of Christ with Pastor Mrs Loyce Banda.',
    image: '/ministries/icd/background.JPG',
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
  { id: 1, src: '/ministries/icd/icd2.jpg', caption: 'Moving believers from spectators to active disciples.' },
  { id: 2, src: '/ministries/icd/icd3.jpg', caption: 'Structured modules covering biblical foundations.' },
  { id: 3, src: '/ministries/icd/icd4.jpg', caption: 'Leadership development and practical ministry skills.' },
  { id: 4, src: '/ministries/icd/icd5.jpg', caption: 'Intercession, Counselling, and Deliverance in action.' },
  { id: 5, src: '/ministries/icd/icd6.jpg', caption: 'Combining sound doctrine with practical application.' },
  { id: 6, src: '/ministries/icd/icd7.jpg', caption: 'Equipping every member for good works.' },
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
  { id: 3, type: 'Current Initiative', title: 'Counselling Programs', status: 'Active', image: '/moments/2.JPG' },
  { id: 4, type: 'Training Project', title: 'School of Ministry', status: 'Ongoing', image: '/moments/3.JPG' },
  { id: 5, type: 'Outreach', title: 'Deliverance Workshops', status: 'Upcoming', image: '/moments/4.JPG' },
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
  const [selectedEvent, setSelectedEvent] = useState<{ id: number; title: string; date: string; description: string; image: string; location?: string; } | null>(null);
  const [selectedInitiative, setSelectedInitiative] = useState<{ id: number; title: string; type: string; status: string; description: string; image: string; } | null>(null);
  const [eventSearchInput, setEventSearchInput] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [initiativeSearchInput, setInitiativeSearchInput] = useState('');
  const [initiativeSearchQuery, setInitiativeSearchQuery] = useState('');
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
  const CHANNEL_ID = "UC8JUC-G4wKhrrPr7xjxYWJw";
  const FALLBACK_HERO_ID = "Z_HD5WhhxOU";
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

  const featuredVideo = videos[0] || null;
  const itemGroups = {
    cards: ministryItems.filter((item) => item.category === 'card'),
    learning: ministryItems.filter((item) => item.category === 'learning'),
    initiatives: ministryItems.filter((item) => item.category === 'initiative'),
    events: ministryItems.filter((item) => item.category === 'event'),
  };
  const icdCards = mergeItemsWithFallback(itemGroups.cards, defaultIcdCards);
  const learningItems = mergeItemsWithFallback(itemGroups.learning, defaultLearningItems).slice(0, 6);
  const galleryItems = learningItems.length > 0
    ? learningItems.map((item, index) => ({
        id: index + 1,
        src: toAssetUrl(item.imageUrl) || highlightGallery[index % highlightGallery.length]?.src || '/ministries/icd/background.JPG',
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
        description: item.description || 'Active initiative for ICD ministry.',
        image: toAssetUrl(item.imageUrl) || ministryProjects[index % ministryProjects.length]?.image || '/images/icd/ICD-MAY-26.png',
      }))
    : ministryProjects.map((item) => ({
        ...item,
        description: item.status,
      }));
  const icdEventImages = [
    '/ministries/icd/event-1.JPG',
    '/ministries/icd/event-2.png',
    '/ministries/icd/event-3.JPG',
    '/ministries/icd/event-4.JPG',
  ];

  const icdEventDetails = [
    {
      title: 'ICD Connections Conference',
      date: 'Saturday, June 15, 2024',
      description: 'Join us for an inspiring day under the theme "Restoring Lives through Discipleship" with Pastor Esau Banda. Sessions run from 8:00 AM to 12:00 PM.',
    },
    {
      title: 'Leadership Summit 2024',
      date: 'July 12 - 13, 2024',
      description: 'A two-day intensive summit on "Equipping Leaders for Global Impact." Join us Friday at 5:00 PM and Saturday at 8:00 AM for strategic ministry training.',
    },
    {
      title: 'Prayer & Fasting Week',
      date: 'August 5 - 9, 2024',
      description: 'A dedicated week of "Seeking God\'s Direction." Join our daily sessions at 5:30 PM across all PICC branches as we focus on Matthew 6:33.',
    },
    {
      title: 'ICD Year-End Celebration',
      date: 'Saturday, December 7, 2024',
      description: 'Celebrating "A Journey of Faithfulness" from 2:00 PM to 5:00 PM. An afternoon of powerful testimonies, worship, and ministry milestones.',
    },
  ];

  const mergedEventItems = mergeItemsWithFallback(itemGroups.events, defaultEventItems);
  const eventItems = mergedEventItems.length > 0
    ? mergedEventItems.map((item, index) => ({
        id: index + 1,
        title: icdEventDetails[index]?.title || item.title,
        date: icdEventDetails[index]?.date || item.label || 'Upcoming',
        description: icdEventDetails[index]?.description || item.description || '',
        location: 'Camp of God Cathedral, Lilongwe',
        image: icdEventImages[index % icdEventImages.length],
      }))
    : pastEvents.map((event, index) => ({
        ...event,
        title: icdEventDetails[index]?.title || event.title,
        date: icdEventDetails[index]?.date || event.date,
        description: icdEventDetails[index]?.description || event.description,
        location: 'Camp of God Cathedral, Lilongwe',
        image: icdEventImages[index % icdEventImages.length],
      }));

  const icdNewsItems: NewsSectionItem[] = [
    {
      badge: 'Update',
      date: 'May 2026',
      title: 'ICD Connects Community for Healing',
      description: 'A powerful evening of worship and fellowship as ICD continues to deepen its outreach in Lilongwe.',
      image: '/ministries/icd/news-1.JPG',
    },
    {
      badge: 'Launch',
      date: 'May 2026',
      title: 'Hope Tabernacle ICD launch',
      description: 'Celebrating the official launch of Hope Tabernacle within the ICD network of ministries.',
      image: '/ministries/icd/news-2.JPG',
    },
    {
      badge: 'Weekly',
      date: 'May 2026',
      title: 'Join us every Wednesday',
      description: 'Come together midweek for teaching, prayer, and ministry growth in the ICD family.',
      image: '/ministries/icd/news-3.JPG',
    },
    {
      badge: 'Highlight',
      date: 'May 2026',
      title: 'ICD outreach makes an impact',
      description: 'Stories from the field as ICD teams serve communities with compassion and practical help.',
      image: '/ministries/icd/news-4.JPG',
    },
    {
      badge: 'Community',
      date: 'May 2026',
      title: 'New discipleship classes launched',
      description: 'Groups are forming across ICD to help members grow in word, prayer, and leadership.',
      image: '/ministries/icd/news-5.JPG',
    },
    {
      badge: 'Celebration',
      date: 'May 2026',
      title: 'ICD prayer night highlights',
      description: 'A recap of the powerful testimonies, worship, and prophetic moments from our latest prayer night.',
      image: '/ministries/icd/news-6.JPG',
    },
  ];

  const normalizeSearchText = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const normalizedEventSearchQuery = normalizeSearchText(eventSearchQuery);
  const displayedEventItems = normalizedEventSearchQuery
    ? eventItems.filter((event) => {
        const searchableText = normalizeSearchText([event.title, event.date, event.description].join(' '));
        return searchableText.includes(normalizedEventSearchQuery);
      })
    : eventItems;

  const safeCurrentSlide = displayedEventItems.length ? currentSlide % displayedEventItems.length : 0;
  const featuredEvent = displayedEventItems[safeCurrentSlide] || {
    id: 0,
    title: 'ICD Event',
    date: 'TBA',
    description: 'No event information is currently available.',
    image: '/ministries/icd/background.JPG',
  };
  const remainingEvents = displayedEventItems.filter((_, idx) => idx !== safeCurrentSlide);

  const normalizeInitiativeSearchQuery = normalizeSearchText(initiativeSearchQuery);
  const displayedProjectItems = normalizeInitiativeSearchQuery
    ? projectItems.filter((project) => {
        const searchableText = normalizeSearchText([project.title, project.type, project.status, project.description].join(' '));
        return searchableText.includes(normalizeInitiativeSearchQuery);
      })
    : projectItems;

  const featuredProject = displayedProjectItems[0] || null;
  const remainingProjects = displayedProjectItems.slice(1);

  const handleEventSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEventSearchQuery(eventSearchInput.trim());
  };

  const clearEventSearch = () => {
    setEventSearchInput('');
    setEventSearchQuery('');
  };

  const handleInitiativeSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInitiativeSearchQuery(initiativeSearchInput.trim());
  };

  const clearInitiativeSearch = () => {
    setInitiativeSearchInput('');
    setInitiativeSearchQuery('');
  };

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
          const info = { ...data.info };
          // Prevent broken image from overriding the new background
          if (info.heroImageUrl === '/hero/hero-icd.jpg') {
            info.heroImageUrl = '/ministries/icd/background.JPG';
          }
          // Prevent old location and email from overriding new ones
          const oldLocations = [
            'Camp of God Cathedral Area 49, Lilongwe Malawi',
            'PICC ICD Department\nCamp of God Cathedral',
            'Camp of God Cathedral Area 49, Lilongwe',
            'Area 49, Lilongwe'
          ];
          if (!info.location || oldLocations.some(loc => info.location?.includes(loc)) || info.location.length < 50) {
            info.location = 'Pentecost International Christian Centre (PICC) Along Kaunda Road, Near Best Oil Filling Station, Area 49 Post Office Box 31841 Lilongwe 3 Malawi';
          }
          if (info.email === 'icd@piccworldwide.org' || info.email === 'info@picc.org' || !info.email) {
            info.email = 'icd@piccwordwide.org';
          }
          setMinistryInfo({
            ...defaultInfo,
            ...info,
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
    if (!displayedEventItems.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayedEventItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayedEventItems.length]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [eventSearchQuery]);

  const nextSlide = () => {
    if (!displayedEventItems.length) return;
    setCurrentSlide((prev) => (prev + 1) % displayedEventItems.length);
  };
  const prevSlide = () => {
    if (!displayedEventItems.length) return;
    setCurrentSlide((prev) => (prev === 0 ? displayedEventItems.length - 1 : prev - 1));
  };

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
    const youtube = window.YT as YouTubeNamespace;
    const players = playersRef.current;
    const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("[data-yt-id]"));

    iframes.forEach((iframe) => {
      const videoId = iframe.dataset.ytId;
      if (!videoId || players.has(videoId)) return;
      const player = new youtube.Player(iframe, {
        events: {
          onStateChange: (event: YouTubeStateChangeEvent) => {
            if (event.data === youtube.PlayerState.PLAYING && event.target) {
              players.forEach((p) => {
                if (p !== event.target) p.pauseVideo();
              });
            }
          },
        },
      }) as YouTubePlayer;
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
                <span className="text-sm font-bold text-[#045BB4] uppercase tracking-wider mb-2">
                  Event
                </span>
                <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                  {selectedEvent.title}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CalendarClock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">{selectedEvent.date}</p>
                  </div>
                  {selectedEvent.location ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <p className="text-gray-700 font-medium">{selectedEvent.location}</p>
                    </div>
                  ) : null}
                </div>

                <div className="w-12 h-1 bg-gray-200 rounded-full mb-6" />

                <p className="text-gray-600 leading-relaxed mb-8">
                  {selectedEvent.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedInitiative && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedInitiative(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white text-black w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedInitiative(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative w-full md:w-1/2 h-64 md:h-[500px] bg-slate-100">
                <Image
                  src={selectedInitiative.image}
                  alt={selectedInitiative.title}
                  fill
                  className="object-cover"
                  onError={swapImage('/hero/hero-store.jpg')}
                />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-gray-50">
                <span className="text-sm font-bold text-[#045BB4] uppercase tracking-wider mb-2">
                  {selectedInitiative.type}
                </span>
                <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                  {selectedInitiative.title}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CalendarClock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">Status: {selectedInitiative.status}</p>
                  </div>
                </div>

                <div className="w-12 h-1 bg-gray-200 rounded-full mb-6" />

                <p className="text-gray-600 leading-relaxed mb-8">
                  {selectedInitiative.description}
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
            className="relative z-10 overflow-hidden rounded-b-[36px] bg-[#033D7A] pt-28 pb-20 text-white shadow-lg sm:pt-36 sm:pb-28 md:rounded-b-[48px]"
            style={{
              backgroundImage: `linear-gradient(rgba(2,24,48,0.78), rgba(4,91,180,0.72)), url(${toAssetUrl(ministryInfo.heroImageUrl) || '/ministries/icd/background.JPG'})`,
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
                    {activeTool === "give" && <div className="px-5 py-6"><ICDGiveTool isMobile={false} /></div>}
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
              <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Initiatives</h2>
                  <p className="text-black/60 max-w-xl">Our structured modules ensure members are consistently growing in sound doctrine and effective leadership.</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end w-full md:w-auto">
                  <form onSubmit={handleInitiativeSearch} className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="search"
                      value={initiativeSearchInput}
                      onChange={(event) => setInitiativeSearchInput(event.target.value)}
                      placeholder="Search ICD initiatives"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#045BB4] focus:ring-2 focus:ring-[#045BB4]/15 sm:w-64"
                      aria-label="Search ICD initiatives"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#045BB4] px-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#033D7A] focus:outline-none focus:ring-2 focus:ring-[#045BB4]/30"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Search
                    </button>
                  </form>
                  {initiativeSearchQuery && (
                    <button
                      type="button"
                      onClick={clearInitiativeSearch}
                      className="text-xs font-semibold text-[#045BB4] hover:text-[#033D7A]"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>

              {featuredProject ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  {/* Large Featured Image (Current/Latest Project) */}
                  <button
                    type="button"
                    onClick={() => setSelectedInitiative(featuredProject)}
                    className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group text-left w-full focus:outline-none focus:ring-4 focus:ring-[#045BB4]"
                  >
                    <Image 
                      src={featuredProject.image || '/images/icd/ICD-MAY-26.png'} 
                      alt={featuredProject.title || 'ICD initiative'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={swapImage('/hero/hero-store.jpg')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                      <span className="bg-[#045BB4] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3">
                        {featuredProject.type || 'Initiative'}
                      </span>
                      <h3 className="text-white text-2xl md:text-3xl font-bold mb-1">{featuredProject.title || 'ICD Ministry'}</h3>
                      <p className="text-white/80 text-sm font-medium">Status: {featuredProject.status || 'Active'}</p>
                    </div>
                  </button>

                  <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-[#045BB4]/30">
                    {remainingProjects.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => setSelectedInitiative(material)}
                        className="relative h-48 w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-black/5 group text-left focus:outline-none focus:ring-2 focus:ring-[#045BB4] sm:w-72 lg:h-[113px] lg:w-full"
                      >
                        <Image 
                          src={material.image} 
                          alt={material.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                          <span className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">{material.type}</span>
                          <h4 className="text-white text-sm font-semibold leading-tight mb-1 group-hover:underline underline-offset-2">{material.title}</h4>
                          <p className="text-white/60 text-[10px] truncate">Status: {material.status}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#045BB4]/25 bg-white p-8 text-center text-sm text-black/55">
                  No ICD initiatives found for this search.
                </div>
              )}

              <div className="mt-12 text-center">
                <Link
                  href="/ministries/icd/archive"
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#045BB4] transition hover:bg-slate-50 hover:border-black/20"
                >
                  View Archive <Search className="w-4 h-4" />
                </Link>
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
                {activeTool === "give" && <div className="px-4 py-5"><ICDGiveTool isMobile={true} /></div>}
              </div>
            </div>
          </section>
        )}

        {/* 6. EVENTS SECTION */}
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
                      aria-label="Search ICD events"
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
                    {remainingEvents.map((event, index) => (
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
                  No ICD events found for this search.
                </div>
              )}
            </div>
          </section>
        )}

        {!mobilePlayerActive && (
          <NewsSection
            kicker="ICD updates"
            title="Latest News"
            description="Recent highlights from ICD ministry life, outreach, and gatherings."
            items={icdNewsItems}
            backgroundClassName="bg-white text-black border-y border-black/5"
            maxItems={6}
          />
        )}

        {!mobilePlayerActive && (
          <div className="bg-white pb-16 text-center">
            <Link
              href="/ministries/icd/archive"
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#045BB4] transition hover:bg-slate-50 hover:border-black/20"
            >
              View News Archive <Search className="w-4 h-4" />
            </Link>
          </div>
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
