'use client';

import { useState, useEffect, useRef, type FormEvent, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import NewsSection, { type NewsSectionItem } from '@/components/NewsSection';
import { MEN_OF_VALOUR_NEWS_ITEMS, MEN_OF_VALOUR_NEWS_KEY } from '@/components/menOfValourNews';
import { apiFetch, apiUrl } from '@/lib/api';
import { 
  MapPin, Phone, Mail, CalendarClock, Search, XIcon,
  BookOpenText, MessageSquareText, StickyNote,
  Briefcase, Users, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- LIVESTREAM COMPONENTS ---
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import BibleTool from '@/components/livestream/BibleTool';
import MenOfValourGiveTool from '@/components/livestream/MenOfValourGiveTool';

type ToolKey = "bible" | "notepad" | "chat" | "testimony" | "give" | null;

type YouTubePlayer = {
  pauseVideo: () => void;
  getCurrentTime?: () => number;
};

type YouTubeStateChangeEvent = {
  data: number;
  target: YouTubePlayer;
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

type YouTubePlaylistItem = {
  contentDetails?: {
    videoId?: string;
  };
  snippet?: YouTubeSearchItem['snippet'];
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

type MenEvent = {
  id: number;
  type: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
};

type MenInitiative = {
  id: number;
  type: string;
  title: string;
  status: string;
  image: string;
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
  name: 'Men of Valour',
  motto: 'Leading with Faith, Courage, and Integrity.',
  about: `PICC Men of Valour Ministry was birthed on the premise that every man has potential to make maximum impact in life and ministry. This is inspired by Gideon in Judges 6 to 8, who emerged as a powerful leader after being called a Mighty Man of Valour by God.

The overarching objective of the ministry is to create a platform where men can be supported to break forth as mighty Men of Valour. Every man who is a member of PICC automatically becomes a member of this ministry.`,
  heroImageUrl: '/hero/hero-7-mov.jpg',
  logoImageUrl: '/logos/men-of-valour-logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Ministry Membership & Support',
  partnershipBody: `Every man who is a member of PICC automatically becomes a member of PICC Men of Valour. This membership comes with a monthly subscription fee.

All members are expected to be involved in all activities initiated by the ministry, including purchasing at least one MoV branded t-shirt to be worn during related events.`,
  partnershipDetails: [
    { label: 'First Capital Bank', value: 'Account Name: PICC Men of Valour, Account Number: 0004502003491' },
    { label: 'Airtel Money', value: 'Agent Code: 776628' },
  ],
  partnershipImageUrl: '/hero/hero-store.jpg',
  phone: '0999 36 36 77 (Head of Dept)\n0999 35 43 71 (Finance Lead)',
  email: 'mov@piccworldwide.org',
  location: 'PICC Men of Valour\nCamp of God Cathedral',
  contactIntro:
    'Whether you are a young professional starting your career or a seasoned elder passing down wisdom, there is a place for you.',
};

const pastEvents = [
  {
    id: 1,
    type: 'Annual Event',
    title: 'Annual Men\'s Retreat',
    date: 'August 12-14, 2025',
    location: 'PICC Men of Valour',
    description: 'A weekend of spiritual renewal, brotherhood, and strategic planning for the year ahead at the lake.',
    image: '/ministries/mov/event-1.JPG',
  },
  {
    id: 2,
    type: 'Leadership',
    title: 'Leadership Breakfast Seminar',
    date: 'November 5, 2025',
    location: 'Camp of God Cathedral',
    description: 'Equipping men with the tools to lead effectively in the marketplace and within their homes.',
    image: '/ministries/mov/event-2.JPG',
  },
  {
    id: 3,
    type: 'Outreach',
    title: 'Community Outreach Drive',
    date: 'December 18, 2025',
    location: 'PICC Men of Valour',
    description: 'Men of Valour taking to the streets of Blantyre to distribute resources and pray with the local community.',
    image: '/ministries/mov/event-1.JPG',
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

const highlightGallery = [
  { id: 1, src: '/hero/hero-7-mov.jpg', caption: 'Breaking forth as mighty Men of Valour in life and ministry.' },
  { id: 2, src: '/moments/1.jpg', caption: 'Total dedication through the Prayer Squad.' },
  { id: 3, src: '/moments/2.jpg', caption: 'Empowerment Summits and Business Workshops.' },
  { id: 4, src: '/moments/3.jpg', caption: 'Fellowship through social groups and networking.' },
  { id: 5, src: '/moments/4.jpg', caption: 'Charity works and community mobilization.' },
  { id: 6, src: '/moments/5.jpg', caption: 'Annual Conferences for vision and alignment.' },
];

const defaultBrotherhoodItems: MinistryItem[] = highlightGallery.map((item, index) => ({
  id: `default-brotherhood-${item.id}`,
  category: 'brotherhood-picture',
  title: `Brotherhood Picture ${item.id}`,
  description: item.caption,
  label: null,
  imageUrl: item.src,
  sortOrder: index,
}));

const ministryProjects = [
  { id: 1, type: 'Current Initiative', title: 'Monthly Empowerment Summits', status: 'Ongoing', image: '/moments/1.jpg' },
  { id: 2, type: 'Current Initiative', title: 'Quarterly Business Workshops', status: 'Ongoing', image: '/moments/2.jpg' },
  { id: 3, type: 'Current Initiative', title: 'MoV Social Groups', status: 'Active', image: '/moments/3.jpg' },
  { id: 4, type: 'Welfare Project', title: 'Charity Works & Outreach', status: 'Ongoing', image: '/moments/4.jpg' },
  { id: 5, type: 'Annual Event', title: 'Men of Valour Conference', status: 'November 2026', image: '/hero/hero-2.jpg' },
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

const defaultCards: MinistryItem[] = [
  {
    id: 'default-card-1',
    category: 'card',
    title: 'Spiritual Discipline',
    description:
      'Members are totally dedicated to prayer, participating in mountain prayers, fasting programs, and remaining exemplary in conduct.',
    label: null,
    imageUrl: null,
    sortOrder: 0,
  },
  {
    id: 'default-card-2',
    category: 'card',
    title: 'Business & Empowerment',
    description:
      'We organize quarterly business seminars and empowerment summits to assist men in having clean, multiple streams of income.',
    label: null,
    imageUrl: null,
    sortOrder: 1,
  },
  {
    id: 'default-card-3',
    category: 'card',
    title: 'Social & Welfare',
    description:
      'We actively participate in social groups, charity works, and support members through welfare programs during sickness, weddings, and funerals.',
    label: null,
    imageUrl: null,
    sortOrder: 2,
  },
];

export default function MenOfValourPage() {
  // --- STATE ---
  const [activeGalleryId, setActiveGalleryId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MenEvent | null>(null);
  const [selectedInitiative, setSelectedInitiative] = useState<MenInitiative | null>(null);
  const [featuredEventIndex, setFeaturedEventIndex] = useState(0);
  const [eventSearchInput, setEventSearchInput] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [initiativeSearchInput, setInitiativeSearchInput] = useState('');
  const [initiativeSearchQuery, setInitiativeSearchQuery] = useState('');

  // --- LIVESTREAM STATE ---
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileResumeAt, setMobileResumeAt] = useState<number | null>(null);
  const [ministryInfo, setMinistryInfo] = useState<MinistryInfo>(defaultInfo);
  const [ministryItems, setMinistryItems] = useState<MinistryItem[]>([]);
  const [newsItems, setNewsItems] = useState<NewsSectionItem[]>(MEN_OF_VALOUR_NEWS_ITEMS);
  const playersRef = useRef<Map<string, YouTubePlayer>>(new Map());

  // --- LIVESTREAM CONSTANTS ---
  const PASTOR_ESAU_BANDA_CHANNEL_ID = "UC5iA3dWaUBlP_PBlGSQvgNQ";
  const FALLBACK_HERO_ID = videoIdFromUrl(ministryInfo.liveSessionYoutubeUrl) || "ydTADwZRquA";
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

  const featuredVideo = videos[0] || null;
  const itemGroups = {
    cards: ministryItems.filter((item) => item.category === 'card'),
    brotherhood: ministryItems.filter((item) => item.category === 'brotherhood-picture'),
    initiatives: ministryItems.filter((item) => item.category === 'initiative'),
    events: ministryItems.filter((item) => item.category === 'event'),
  };
  const aboutCards = mergeItemsWithFallback(itemGroups.cards, defaultCards);
  const brotherhoodItems = mergeItemsWithFallback(itemGroups.brotherhood, defaultBrotherhoodItems).slice(0, 6);
  const galleryItems = brotherhoodItems.map((item, index) => ({
    id: index + 1,
    src: toAssetUrl(item.imageUrl) || highlightGallery[index % highlightGallery.length]?.src || '/hero/hero-store.jpg',
    caption: item.description || item.title,
  }));
  const initiativeItems = mergeItemsWithFallback(itemGroups.initiatives, defaultInitiativeItems);
  const projectItems = initiativeItems.map((item, index) => ({
    id: index + 1,
    type: item.label || 'Initiative',
    title: item.title,
    status: item.description || 'Active',
    image: toAssetUrl(item.imageUrl) || ministryProjects[index % ministryProjects.length]?.image || '/hero/hero-store.jpg',
  }));
  const eventItems = mergeItemsWithFallback(itemGroups.events, defaultEventItems).map((item, index) => ({
    id: index + 1,
    type: pastEvents[index % pastEvents.length]?.type || 'Men of Valour Event',
    title: item.title,
    date: item.label || 'Upcoming',
    location: pastEvents[index % pastEvents.length]?.location || 'PICC Men of Valour',
    description: item.description || '',
    image: toAssetUrl(item.imageUrl) || pastEvents[index % pastEvents.length]?.image || '/hero/hero-store.jpg',
  }));
  const aboutParagraphs = (ministryInfo.about || defaultInfo.about || '').split(/\n{2,}/).filter(Boolean);
  const membershipParagraphs = (ministryInfo.partnershipBody || defaultInfo.partnershipBody || '').split(/\n{2,}/).filter(Boolean);
  const paymentDetails = ministryInfo.partnershipDetails?.length ? ministryInfo.partnershipDetails : defaultInfo.partnershipDetails || [];

  const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Africa/Blantyre" });
  };

  const formatSearchDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const normalizeSearchText = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const normalizedEventSearchQuery = normalizeSearchText(eventSearchQuery);
  const normalizedFormattedSearchDate = normalizeSearchText(formatSearchDate(eventSearchQuery));
  const displayedEventItems = normalizedEventSearchQuery
    ? eventItems.filter((event) => {
        const searchableDate = normalizeSearchText([event.date, formatSearchDate(event.date)].join(' '));
        return (
          searchableDate.includes(normalizedEventSearchQuery) ||
          Boolean(normalizedFormattedSearchDate && searchableDate.includes(normalizedFormattedSearchDate))
        );
      })
    : eventItems;
  const safeFeaturedEventIndex = displayedEventItems.length ? featuredEventIndex % displayedEventItems.length : 0;
  const featuredGridEvent = displayedEventItems[safeFeaturedEventIndex] || {
    id: 0,
    type: 'Men of Valour Event',
    title: 'Men of Valour Gathering',
    date: 'Upcoming',
    location: 'PICC Men of Valour',
    description: 'Check official Men of Valour channels for upcoming event details.',
    image: '/ministries/mov/event-1.JPG',
  };
  const remainingEvents = displayedEventItems.filter((_, idx) => idx !== safeFeaturedEventIndex);
  const normalizedInitiativeSearchQuery = normalizeSearchText(initiativeSearchQuery);
  const normalizedFormattedInitiativeSearchDate = normalizeSearchText(formatSearchDate(initiativeSearchQuery));
  const displayedProjectItems = normalizedInitiativeSearchQuery
    ? projectItems.filter((project) => {
        const searchableText = normalizeSearchText([
          project.title,
          project.type,
          project.status,
          formatSearchDate(project.status),
        ].join(' '));

        return (
          searchableText.includes(normalizedInitiativeSearchQuery) ||
          Boolean(normalizedFormattedInitiativeSearchDate && searchableText.includes(normalizedFormattedInitiativeSearchDate))
        );
      })
    : projectItems;
  const featuredProject = displayedProjectItems[0] || null;
  const remainingProjects = displayedProjectItems.slice(1);

  const parseSiteContentItems = (body: unknown): unknown[] => {
    if (typeof body !== 'string' || !body) return [];
    try {
      const parsed = JSON.parse(body) as unknown;
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown[] }).items)) {
        return (parsed as { items: unknown[] }).items;
      }
    } catch {
      return [];
    }
    return [];
  };

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

  useEffect(() => {
    let isMounted = true;

    const loadMinistryContent = async () => {
      try {
        const response = await apiFetch('/api/ministries/men-of-valour/content');
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
        // Keep the built-in Men of Valour content as the public fallback.
      }
    };

    void loadMinistryContent();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadNews = async () => {
      try {
        const response = await apiFetch(`/api/site-content/${MEN_OF_VALOUR_NEWS_KEY}`);
        if (!response.ok) return;
        const record = await response.json().catch(() => null);
        const items = parseSiteContentItems(record?.body)
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => ({
            badge: typeof item.badge === 'string' ? item.badge : 'Update',
            date: typeof item.date === 'string' ? item.date : '',
            title: typeof item.title === 'string' ? item.title : '',
            description: typeof item.description === 'string' ? item.description : '',
            image: toAssetUrl(typeof item.imageUrl === 'string' ? item.imageUrl : typeof item.image === 'string' ? item.image : '') || '/ministries/mov/news-1.JPG',
          }))
          .filter((item) => item.title);

        if (isMounted && items.length > 0) {
          setNewsItems(items.slice(0, MEN_OF_VALOUR_NEWS_ITEMS.length));
        }
      } catch {
        // Keep fallback news.
      }
    };

    void loadNews();
    return () => {
      isMounted = false;
    };
  }, []);

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

    const toVideoFromPlaylist = (item: YouTubePlaylistItem | undefined): YouTubeVideo | null => {
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
      };
    };

    const fetchJson = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load videos");
      return response.json();
    };

    const fetchLatestUpload = async () => {
      const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      channelUrl.searchParams.set("part", "contentDetails");
      channelUrl.searchParams.set("id", PASTOR_ESAU_BANDA_CHANNEL_ID);
      channelUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const channelData = await fetchJson(channelUrl.toString());
      const uploadsPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) return null;

      const uploadsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      uploadsUrl.searchParams.set("part", "snippet,contentDetails");
      uploadsUrl.searchParams.set("playlistId", uploadsPlaylistId);
      uploadsUrl.searchParams.set("maxResults", "1");
      uploadsUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const uploadsData = await fetchJson(uploadsUrl.toString());
      return Array.isArray(uploadsData?.items) ? toVideoFromPlaylist(uploadsData.items[0]) : null;
    };

    const fetchLatestEmbeddableVideo = async () => {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("channelId", PASTOR_ESAU_BANDA_CHANNEL_ID);
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("order", "date");
      searchUrl.searchParams.set("videoEmbeddable", "true");
      searchUrl.searchParams.set("maxResults", "1");
      searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const searchData = await fetchJson(searchUrl.toString());
      return Array.isArray(searchData?.items) ? toVideoFromSearch(searchData.items[0]) : null;
    };

    const fetchVideos = async () => {
      try {
        if (!YOUTUBE_API_KEY) throw new Error("Missing API key");

        const liveUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        liveUrl.searchParams.set("part", "snippet");
        liveUrl.searchParams.set("channelId", PASTOR_ESAU_BANDA_CHANNEL_ID);
        liveUrl.searchParams.set("eventType", "live");
        liveUrl.searchParams.set("type", "video");
        liveUrl.searchParams.set("maxResults", "1");
        liveUrl.searchParams.set("key", YOUTUBE_API_KEY);

        const [liveData, embeddableVideo, latestUpload] = await Promise.all([
          fetchJson(liveUrl.toString()),
          fetchLatestEmbeddableVideo(),
          fetchLatestUpload(),
        ]);
        const liveVideo = Array.isArray(liveData?.items) ? toVideoFromSearch(liveData.items[0]) : null;

        if (isMounted) {
          const pastorVideo = liveVideo || embeddableVideo || latestUpload;
          if (pastorVideo) {
            setVideos([pastorVideo]);
          } else {
            setVideos([{
              videoId: FALLBACK_HERO_ID,
              title: "Pastor Esau Banda",
              publishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              channelTitle: "Pastor Esau Banda",
              description: "Latest ministry broadcast from Pastor Esau Banda.",
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

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white text-black shadow-2xl md:flex-row"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/70"
                aria-label="Close event details"
              >
                <XIcon className="h-5 w-5" />
              </button>

              <div className="relative h-64 w-full bg-slate-100 md:h-[500px] md:w-1/2">
                <Image
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  fill
                  className="object-cover"
                  onError={swapImage('/hero/hero-store.jpg')}
                />
              </div>

              <div className="flex w-full flex-col justify-center bg-gray-50 p-8 md:w-1/2 md:p-10">
                <span className="mb-2 text-sm font-bold uppercase tracking-wider text-[#2D5A8C]">
                  {selectedEvent.type}
                </span>
                <h3 className="mb-4 text-3xl font-black leading-tight text-gray-900">
                  {selectedEvent.title}
                </h3>

                <div className="mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <CalendarClock className="mt-0.5 h-5 w-5 text-gray-400" />
                    <p className="font-medium text-gray-700">{selectedEvent.date}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                    <p className="font-medium text-gray-700">{selectedEvent.location}</p>
                  </div>
                </div>

                <div className="mb-6 h-1 w-12 rounded-full bg-gray-200" />

                <p className="mb-8 leading-relaxed text-gray-600">
                  {selectedEvent.description}
                </p>

                <div>
                  <p className="mb-3 text-sm font-bold text-gray-900">MORE INFO:</p>
                  <div className="flex flex-wrap gap-3">
                    {(ministryInfo.phone || defaultInfo.phone || '').split('\n').filter(Boolean).slice(0, 2).map((line) => {
                      const phone = line.replace(/\D/g, '');
                      return (
                        <a
                          key={line}
                          href={phone ? `https://wa.me/265${phone.slice(-9)}` : '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                        >
                          <Phone className="h-4 w-4" /> WhatsApp
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedInitiative && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setSelectedInitiative(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white text-black shadow-2xl md:flex-row"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedInitiative(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/70"
                aria-label="Close initiative details"
              >
                <XIcon className="h-5 w-5" />
              </button>

              <div className="relative h-64 w-full bg-slate-100 md:h-[500px] md:w-1/2">
                <Image
                  src={selectedInitiative.image}
                  alt={selectedInitiative.title}
                  fill
                  className="object-cover"
                  onError={swapImage('/hero/hero-store.jpg')}
                />
              </div>

              <div className="flex w-full flex-col justify-center bg-gray-50 p-8 md:w-1/2 md:p-10">
                <span className="mb-2 text-sm font-bold uppercase tracking-wider text-[#2D5A8C]">
                  {selectedInitiative.type}
                </span>
                <h3 className="mb-4 text-3xl font-black leading-tight text-gray-900">
                  {selectedInitiative.title}
                </h3>

                <div className="mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 h-5 w-5 text-gray-400" />
                    <p className="font-medium text-gray-700">Status: {selectedInitiative.status}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="mt-0.5 h-5 w-5 text-gray-400" />
                    <p className="font-medium text-gray-700">Men of Valour Initiative</p>
                  </div>
                </div>

                <div className="mb-6 h-1 w-12 rounded-full bg-gray-200" />

                <p className="mb-8 leading-relaxed text-gray-600">
                  This initiative supports men in spiritual discipline, business growth, welfare, service, and faithful leadership.
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
            className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-[#1E3A5F] text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10 overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(rgba(30,58,95,0.82), rgba(45,90,140,0.74)), url(${toAssetUrl(ministryInfo.heroImageUrl) || '/hero/hero-7-mov.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
                <Image 
                  src={toAssetUrl(ministryInfo.logoImageUrl) || '/logos/men-of-valour-logo.png'} 
                  alt="Men of Valour Logo" 
                  fill 
                  className="object-contain p-2 rounded-full"
                  onError={swapImage('/logo.png')} 
                />
              </div>

              <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">PICC Ministry</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">{ministryInfo.name || defaultInfo.name}</h1>
              
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
                <h2 className="text-3xl md:text-4xl font-bold mb-6">About the Ministry</h2>
                <div className="w-16 h-1 bg-[#2D5A8C] mx-auto mb-8 rounded-full" />
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={`about-${index}`} className={`text-lg text-black/70 leading-relaxed ${index < aboutParagraphs.length - 1 ? 'mb-6' : ''}`}>
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Informational Cards inside About Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {aboutCards.map((card, index) => {
                  const Icon = [Shield, Briefcase, Users][index % 3];
                  return (
                    <Card key={card.id} className="p-6 text-center shadow-md hover:shadow-xl transition-shadow border-t-4 border-t-[#2D5A8C]">
                      <Icon className="w-12 h-12 mx-auto text-[#2D5A8C] mb-4" />
                      <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                      <p className="text-black/60">{card.description}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 3. MINISTRY HIGHLIGHTS (6-Grid Gallery with Interactive Captions) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-slate-50 border-y border-black/5 text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Brotherhood in Action</h2>
                <p className="text-black/60 max-w-2xl mx-auto">Glimpses of our fellowship, worship, and community impact.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {galleryItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="relative h-48 md:h-64 bg-slate-200 rounded-xl overflow-hidden cursor-pointer group"
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
                    <div className={`absolute inset-0 bg-[#2D5A8C]/20 transition-opacity duration-300 ${activeGalleryId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                ))}
              </div>
              <p className="text-center text-black/50 text-sm mt-6 italic">Click or tap any image to view details.</p>
            </div>
          </section>
        )}

        {/* 4. THE LIVE ALTAR (Livestream Section) */}
        {!mobilePlayerActive && (
          <section className="py-16 md:py-24 bg-[#0a1424] text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Men of Valour Live</h2>
                <p className="text-white/70 max-w-2xl mx-auto">Join our empowerment summits and business workshops live, from anywhere in the world.</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl">
                <div className="relative aspect-video bg-black">
                  <iframe
                    className="h-full w-full"
                    data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                    id="yt-hero"
                    src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                    title={featuredVideo?.title || "Men of Valour Live"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                {/* Tool Selection Bar */}
                <div className="bg-white text-black px-6 py-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2D5A8C]">
                        {featuredVideo?.title || "Men of Valour Broadcast"}
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
                    {activeTool === "chat" && <div className="h-[400px] w-full bg-white"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Men of Valour Live'} /></div>}
                    {activeTool === "notepad" && <NotepadTool />}
                    {activeTool === "testimony" && <div className="px-5 py-6"><TestimonyTool /></div>}
                    {activeTool === "give" && <div className="px-5 py-6"><MenOfValourGiveTool isMobile={false} /></div>}
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
              <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Initiatives</h2>
                  <p className="text-black/60 max-w-xl">Our structured approach ensures men are consistently growing and making an impact.</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <form onSubmit={handleInitiativeSearch} className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="search"
                      value={initiativeSearchInput}
                      onChange={(event) => setInitiativeSearchInput(event.target.value)}
                      placeholder="November 2026"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#2D5A8C] focus:ring-2 focus:ring-[#2D5A8C]/15 sm:w-48"
                      aria-label="Search Men of Valour initiatives"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2D5A8C] px-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#2D5A8C]/30"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Search
                    </button>
                  </form>
                  {initiativeSearchQuery && (
                    <button
                      type="button"
                      onClick={clearInitiativeSearch}
                      className="text-xs font-semibold text-[#2D5A8C] hover:text-[#1E3A5F]"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>

              {featuredProject ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                  <button
                    type="button"
                    onClick={() => setSelectedInitiative(featuredProject)}
                    className="group relative h-[400px] w-full overflow-hidden rounded-2xl border border-black/5 text-left shadow-xl focus:outline-none focus:ring-4 focus:ring-[#2D5A8C] md:h-[500px] lg:col-span-2"
                  >
                    <Image
                      src={featuredProject.image || '/hero/hero-store.jpg'}
                      alt={featuredProject.title || 'Men of Valour initiative'}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={swapImage('/hero/hero-store.jpg')}
                    />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8">
                      <span className="mb-3 w-fit rounded-full bg-[#2D5A8C] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                        {featuredProject.type || 'Initiative'}
                      </span>
                      <h3 className="mb-1 text-2xl font-bold text-white group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 md:text-3xl">{featuredProject.title || 'Men of Valour Ministry'}</h3>
                      <p className="text-sm font-medium text-white/80">Status: {featuredProject.status || 'Active'}</p>
                    </div>
                    <div className="absolute right-4 top-4 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                      Click for Details
                    </div>
                  </button>

                  <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-[#2D5A8C]/30">
                    {remainingProjects.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => setSelectedInitiative(material)}
                        className="group relative h-48 w-64 flex-shrink-0 overflow-hidden rounded-xl border border-black/5 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-[#2D5A8C] sm:w-72 lg:h-[113px] lg:w-full"
                      >
                        <Image
                          src={material.image}
                          alt={material.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 transition-colors duration-300 group-hover:bg-black/40">
                          <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                            {material.type}
                          </span>
                          <h4 className="mb-1 text-sm font-semibold leading-tight text-white group-hover:underline group-hover:underline-offset-2">{material.title}</h4>
                          <p className="text-[10px] text-white/60">Status: {material.status}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#2D5A8C]/25 bg-gray-50 p-8 text-center text-sm text-black/55">
                  No Men of Valour initiatives found for this search.
                </div>
              )}
            </div>
          </section>
        )}

        {/* MOBILE FULLSCREEN PLAYER OVERRIDE */}
        {mobilePlayerActive && (
          <section className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-[#0a1424]">
            <div className="h-full flex flex-col">
              <div className="flex-[0_0_40%] bg-black">
                <iframe
                  className="h-full w-full"
                  data-yt-id={mobileVideoId}
                  id="yt-hero-mobile"
                  src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0&autoplay=1&playsinline=1${mobileVideoStart}`}
                  title={featuredVideo?.title || 'Men of Valour Live'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="flex-[1_1_60%] px-4 py-5 text-black overflow-y-auto bg-gray-50">
                <div className="mb-4 border-b border-black/10 pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-black/70">
                    {TOOL_TABS.map((tool) => (
                      <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={`rounded-full px-3 py-1 transition-colors ${activeTool === tool.key ? 'bg-[#2D5A8C] text-white' : 'bg-white border border-black/10 text-black'}`}>
                        {tool.label}
                      </button>
                    ))}
                    <button onClick={() => setActiveTool(null)} className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">Close</button>
                  </div>
                </div>
                {activeTool === "chat" && <div className="h-[300px] w-full bg-white mb-4 rounded-xl overflow-hidden border border-black/10"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Men of Valour Live'} /></div>}
                {activeTool === "bible" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><BibleTool /></div>}
                {activeTool === "notepad" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><NotepadTool /></div>}
                {activeTool === "testimony" && <div className="px-4 py-5"><TestimonyTool /></div>}
                {activeTool === "give" && <div className="px-4 py-5"><MenOfValourGiveTool isMobile={true} /></div>}
              </div>
            </div>
          </section>
        )}

        {/* 6. EVENTS SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 text-black overflow-hidden border-y border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
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
                      placeholder="November 2026"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#2D5A8C] focus:ring-2 focus:ring-[#2D5A8C]/15 sm:w-48"
                      aria-label="Search Men of Valour events by date"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2D5A8C] px-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#2D5A8C]/30"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Search
                    </button>
                  </form>
                  {eventSearchQuery && (
                    <button
                      type="button"
                      onClick={clearEventSearch}
                      className="text-xs font-semibold text-[#2D5A8C] hover:text-[#1E3A5F]"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>

              {displayedEventItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(featuredGridEvent)}
                    className="group relative h-[400px] w-full overflow-hidden rounded-2xl border border-black/5 text-left shadow-xl focus:outline-none focus:ring-4 focus:ring-[#2D5A8C] md:h-[500px] lg:col-span-2"
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
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/90 via-black/40 to-transparent p-8">
                          <span className="mb-3 flex w-fit items-center gap-2 rounded-full bg-[#2D5A8C] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                            <CalendarClock className="h-4 w-4" />
                            {featuredGridEvent.type}
                          </span>
                          <h3 className="mb-2 text-3xl font-bold text-white group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 md:text-4xl">{featuredGridEvent.title}</h3>
                          <p className="mb-1 flex items-center gap-2 text-sm font-medium text-white/90 md:text-base">
                            <CalendarClock className="h-4 w-4" /> {featuredGridEvent.date}
                          </p>
                          <p className="flex items-center gap-2 text-sm text-white/70">
                            <MapPin className="h-4 w-4" /> {featuredGridEvent.location}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    <div className="absolute right-4 top-4 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                      Click for Details
                    </div>
                  </button>

                  <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-[#2D5A8C]/30">
                    {remainingEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="group relative h-48 w-64 flex-shrink-0 overflow-hidden rounded-xl border border-black/5 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-[#2D5A8C] sm:w-72 lg:h-[113px] lg:w-full"
                      >
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 transition-colors duration-300 group-hover:bg-black/40">
                          <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                            {event.type}
                          </span>
                          <h4 className="mb-1 text-sm font-semibold leading-tight text-white group-hover:underline group-hover:underline-offset-2">{event.title}</h4>
                          <p className="truncate text-[10px] text-white/60">{event.date}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#2D5A8C]/25 bg-white p-8 text-center text-sm text-black/55">
                  No Men of Valour events found for this date search.
                </div>
              )}
            </div>
          </section>
        )}

        {/* 7. SUPPORT SECTION (Replaces Global Vision) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">{ministryInfo.partnershipTitle || defaultInfo.partnershipTitle}</h2>
                  <div className="w-16 h-1 bg-[#2D5A8C] mb-6 rounded-full" />
                  {membershipParagraphs.map((paragraph, index) => (
                    <p key={`membership-${index}`} className={`text-lg text-black/70 ${index < membershipParagraphs.length - 1 ? 'mb-4' : 'mb-6'}`}>
                      {paragraph}
                    </p>
                  ))}
                  
                  <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-black/5">
                    <h3 className="font-bold text-xl mb-4 text-[#2D5A8C]">Payment Channels</h3>
                    <div className="space-y-2 text-sm text-black/70">
                      {paymentDetails.map((detail) => (
                        <p key={`${detail.label}-${detail.value}`}><strong>{detail.label}:</strong> {detail.value}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                  <Image 
                    src={toAssetUrl(ministryInfo.partnershipImageUrl) || '/hero/hero-store.jpg'} 
                    alt="Support MoV" 
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
            kicker="Men of Valour updates"
            title="Latest News"
            description="Newsletters, empowerment summit highlights, ministry updates, and stories from Men of Valour."
            items={newsItems}
            backgroundClassName="bg-slate-50 text-black border-y border-black/5"
            maxItems={6}
          />
        )}

        {/* 9. CONTACTS SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-slate-900 text-white">
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
                  {(ministryInfo.phone || defaultInfo.phone || '').split('\n').map((line) => (
                    <p key={line} className="text-white/70">{line}</p>
                  ))}
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
