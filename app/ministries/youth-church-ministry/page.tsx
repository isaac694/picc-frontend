'use client';

import { useState, useEffect, useRef, type FormEvent, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import NewsSection, { type NewsSectionItem } from '@/components/NewsSection';
import { YOUTH_CHURCH_NEWS_ITEMS, YOUTH_CHURCH_NEWS_KEY } from '@/components/youthChurchNews';
import { apiFetch, apiUrl } from '@/lib/api';
import { 
  MapPin, Phone, Mail, CalendarClock, Globe, BookOpenText, MessageSquareText, 
  StickyNote, Rocket, Sparkles, Flame, Baby, XIcon, Instagram, Facebook, Twitter, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- LIVESTREAM COMPONENTS ---
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import YouthChurchGiveTool from '@/components/livestream/YouthChurchGiveTool';
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
  acceptsOnlinePayment?: boolean;
  paymentAmount?: number | null;
  paymentCurrency?: string | null;
  paymentAccount?: string | null;
};

type YouthEvent = {
  id: number;
  type: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
  acceptsOnlinePayment: boolean;
  paymentAmount: number | null;
  paymentCurrency: string;
  paymentAccount: string;
};

type BankTransferDetails = {
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  account_expiration_timestamp?: number;
};

type YouthInitiative = {
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
  { key: "give", label: "Give", kind: "form" },
];

const toAssetUrl = (value: string | null | undefined) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const normalizePaymentAmount = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]+/g, '').trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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

const normalizeMinistryItem = (item: unknown): MinistryItem | null => {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : typeof record.id === 'number' ? String(record.id) : '';
  const category = typeof record.category === 'string' ? record.category : '';
  const title = typeof record.title === 'string' ? record.title : '';
  if (!id || !category || !title) return null;

  const imageUrl = typeof record.imageUrl === 'string'
    ? record.imageUrl
    : typeof record.image === 'string'
      ? record.image
      : null;

  return {
    id,
    category,
    title,
    description: typeof record.description === 'string' ? record.description : null,
    label: typeof record.label === 'string' ? record.label : null,
    imageUrl,
    sortOrder:
      typeof record.sortOrder === 'number'
        ? record.sortOrder
        : typeof record.sortOrder === 'string'
          ? Number(record.sortOrder) || 0
          : 0,
    acceptsOnlinePayment:
      record.acceptsOnlinePayment === true || record.acceptsOnlinePayment === 'true',
    paymentAmount: normalizePaymentAmount(record.paymentAmount),
    paymentCurrency: typeof record.paymentCurrency === 'string' ? record.paymentCurrency : null,
    paymentAccount: typeof record.paymentAccount === 'string' ? record.paymentAccount : null,
  };
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

// --- MOCK DATA ---
const defaultInfo: MinistryInfo = {
  name: 'Youth Church',
  motto: 'Helping young people grow in Christ and community.',
  about: `The Youth Church at PICC is a vibrant community where children, teenagers, and young adults can experience God in a way that is relevant to their lives. We believe that young people are not just the leaders of tomorrow, but the influencers of today.

Our services are packed with high-energy worship, creative expressions, and transparent conversations about the issues young people face-from mental health and career choices to identity and spiritual growth. To properly minister to every age group, the Youth Church is comprised of four specialized sub-ministries.`,
  heroImageUrl: '/hero/hero-2.jpg',
  logoImageUrl: '/logos/youth-church-logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Partner With Us',
  partnershipBody: `Equipping the next generation requires resources, dedicated mentors, and community support. You can partner with the Youth Church to fund our outreach programs, retreats, and mentorship camps.

Whether you are investing in the Heritage Kids, Teens, Hope & Beauty, or CTG, your support helps us build strong foundations for tomorrow's leaders.`,
  partnershipDetails: [
    { label: 'National Bank', value: 'PICC Youth Church - 1009799539' },
    { label: 'Airtel Money', value: '0999291616' },
  ],
  partnershipImageUrl: '/ministries/youth-church/partner.jpg',
  phone: 'Check with your local PICC branch for youth pastor contacts.',
  email: 'info@picc.org',
  location: 'PICC Youth Church\nCamp of God Cathedral',
  contactIntro:
    "Whether you're a teen looking for a community or an adult looking to mentor, we'd love to hear from you.",
};

const eventsList = [
  {
    id: 1,
    type: 'Weekly Gathering',
    title: 'Youth Church Sunday Service',
    date: 'Every Sunday | 1:30 PM - 3:30 PM',
    location: 'The Camp of God Cathedral, Area 49 Lilongwe',
    description: 'Join us every Sunday for high-energy worship, creative expressions, and transparent conversations about the issues young people face. Bring a friend!',
    image: '/ministries/youth-church/img-1.jpg',
  },
  {
    id: 2,
    type: 'Upcoming Retreat',
    title: '2026 Lake Retreat (Youth Church)',
    date: 'August 28 - 30, 2026',
    location: 'Lake Malawi',
    description: 'Our annual Youth Church Lake Retreat is back! Three days of disconnecting from the noise, encountering God, and building lifelong friendships on the shores of Lake Malawi. Registration details are available on our WhatsApp channels.',
    image: '/ministries/youth-church/img-7.jpg',
  },
  {
    id: 3,
    type: 'Past Event',
    title: 'Inter-Church Sports Gala',
    date: 'March 28, 2026',
    location: 'Regional Stadium',
    description: 'We built community through competition and took home the trophy in the regional football tournament. Thanks to all who came out to play and support!',
    image: '/hero/hero-2.jpg',
  },
  {
    id: 4,
    type: 'Upcoming Camp',
    title: 'Heritage Kids Summer Camp',
    date: 'August 5-10, 2026',
    location: 'Camp Grounds',
    description: 'Five days of fun, character building, and teaching our youngest members the ways of the Lord through interactive lessons, songs, and age-appropriate play.',
    image: '/hero/hero-3.jpg',
  },
  {
    id: 5,
    type: 'Upcoming Event',
    title: 'Hope & Beauty Mentorship Tea',
    date: 'September 12, 2026',
    location: 'Cathedral Hall',
    description: 'An elegant afternoon dedicated to mentoring young women. We will be discussing grace, purity, and purpose over tea and pastries.',
    image: '/ministries/youth-church/img-2.jpg',
  },
];

const defaultEventItems: MinistryItem[] = eventsList.map((event, index) => ({
  id: `default-event-${event.id}`,
  category: 'event',
  title: event.title,
  description: `${event.location}\n\n${event.description}`,
  label: event.date,
  imageUrl: event.image,
  sortOrder: index,
  acceptsOnlinePayment: false,
  paymentAmount: null,
  paymentCurrency: 'MWK',
  paymentAccount: 'youth',
}));

const highlightGallery = [
  { id: 1, src: '/ministries/youth-church/img-1.jpg', caption: 'High-energy worship and sincere devotion.' },
  { id: 2, src: '/ministries/youth-church/img-2.jpg', caption: 'Hope and Beauty: Sisterhood in action.' },
  { id: 3, src: '/ministries/youth-church/img-3.jpg', caption: 'Called to Greatness: Building future leaders.' },
  { id: 4, src: '/ministries/youth-church/img-4.jpg', caption: 'Teens Ministry: Navigating life with faith.' },
  { id: 5, src: '/ministries/youth-church/img-5.jpg', caption: 'Heritage Ministry: Laying the early foundations.' },
  { id: 6, src: '/ministries/youth-church/img-6.jpg', caption: 'Growing in Christ and community together.' },
];

const defaultYouthLifeItems: MinistryItem[] = highlightGallery.map((item, index) => ({
  id: `default-youth-life-${item.id}`,
  category: 'youth-life',
  title: `Youth Life ${item.id}`,
  description: item.caption,
  label: null,
  imageUrl: item.src,
  sortOrder: index,
}));

const ministryProjects = [
  { id: 1, type: 'Campus Outreach', title: 'University Mentorship Program', status: 'Ongoing', image: '/ministries/youth-church/img-4.jpg' },
  { id: 2, type: 'Teens Initiative', title: 'High School Faith Clubs', status: 'Active', image: '/ministries/youth-church/img-3.jpg' },
  { id: 3, type: 'CTG Project', title: 'Young Men’s Leadership Workshop', status: 'Active', image: '/ministries/youth-church/img-1.jpg' },
  { id: 4, type: 'Hope & Beauty', title: 'Purity & Purpose Seminar', status: 'Upcoming', image: '/ministries/youth-church/img-2.jpg' },
  { id: 5, type: 'Heritage', title: 'Vacation Bible School', status: 'August 2026', image: '/ministries/youth-church/img-6.jpg' },
];

const defaultInitiativeItems: MinistryItem[] = ministryProjects.map((project, index) => ({
  id: `default-initiative-${project.id}`,
  category: 'initiative',
  title: project.title,
  description: project.type,
  label: project.status,
  imageUrl: project.image,
  sortOrder: index,
}));

const defaultArmItems: MinistryItem[] = [
  {
    id: 'default-arm-1',
    category: 'arm',
    title: 'Called to Greatness (CTG)',
    description:
      'A dedicated ministry empowering young men and young adults to discover their God-given potential, achieve excellence in their careers, and lead with integrity in the modern world.',
    label: 'Young Men',
    imageUrl: null,
    sortOrder: 0,
  },
  {
    id: 'default-arm-2',
    category: 'arm',
    title: 'Hope and Beauty',
    description:
      'A sisterhood focusing on mentoring and building up young women. We tackle real-life issues with biblical truth, encouraging grace, purity, and unwavering purpose in Christ.',
    label: 'Young Women',
    imageUrl: null,
    sortOrder: 1,
  },
  {
    id: 'default-arm-3',
    category: 'arm',
    title: 'Teens Ministry',
    description:
      'Designed specifically for high schoolers, this vibrant arm helps teenagers navigate the pivotal years of youth with faith, fun, deep friendships, and solid biblical foundations.',
    label: 'Teenagers',
    imageUrl: null,
    sortOrder: 2,
  },
  {
    id: 'default-arm-4',
    category: 'arm',
    title: 'Heritage Ministry',
    description:
      "Our children's church where we lay the early foundations of faith. We teach our youngest members the ways of the Lord through interactive lessons, songs, and age-appropriate play.",
    label: 'Children',
    imageUrl: null,
    sortOrder: 3,
  },
];

export default function YouthChurchMinistryPage() {
  // --- STATE ---
  const [activeGalleryId, setActiveGalleryId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<YouthEvent | null>(null); // State for the Event Pop-up
  const [selectedInitiative, setSelectedInitiative] = useState<YouthInitiative | null>(null);
  const [featuredEventIndex, setFeaturedEventIndex] = useState(0); // State for cycling events grid
  const [eventSearchInput, setEventSearchInput] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [initiativeSearchInput, setInitiativeSearchInput] = useState('');
  const [initiativeSearchQuery, setInitiativeSearchQuery] = useState('');
  const [paymentEvent, setPaymentEvent] = useState<YouthEvent | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    fullName: '',
    phone: '',
    phoneCountry: '+265',
    email: '',
    paymentMethod: 'airtel',
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [bankTransferDetails, setBankTransferDetails] = useState<BankTransferDetails | null>(null);
  const [newsItems, setNewsItems] = useState<NewsSectionItem[]>(YOUTH_CHURCH_NEWS_ITEMS);

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
    arms: ministryItems.filter((item) => item.category === 'arm'),
    youthLife: ministryItems.filter((item) => item.category === 'youth-life'),
    initiatives: ministryItems.filter((item) => item.category === 'initiative'),
    events: ministryItems.filter((item) => item.category === 'event'),
  };
  const armItems = mergeItemsWithFallback(itemGroups.arms, defaultArmItems);
  const youthLifeItems = mergeItemsWithFallback(itemGroups.youthLife, defaultYouthLifeItems).slice(0, 6);
  const galleryItems = youthLifeItems.map((item, index) => ({
    id: index + 1,
    src: toAssetUrl(item.imageUrl) || highlightGallery[index % highlightGallery.length]?.src || '/hero/hero-store.jpg',
    caption: item.description || item.title,
  }));
  const initiativeItems = mergeItemsWithFallback(itemGroups.initiatives, defaultInitiativeItems);
  const projectItems = initiativeItems.map((item, index) => ({
    id: index + 1,
    type: item.description || 'Initiative',
    title: item.title,
    status: item.label || 'Active',
    image: toAssetUrl(item.imageUrl) || ministryProjects[index % ministryProjects.length]?.image || '/hero/hero-store.jpg',
  }));
  const eventItems = mergeItemsWithFallback(itemGroups.events, defaultEventItems).map((item, index) => {
    const [maybeLocation, ...bodyParts] = (item.description || '').split(/\n{2,}/);
    const fallbackEvent = eventsList[index % eventsList.length];
    const hasLocationAndBody = bodyParts.length > 0;

    return {
      id: index + 1,
      type: fallbackEvent?.type || 'Youth Church Event',
      title: item.title,
      date: item.label || 'Upcoming',
      location: hasLocationAndBody ? maybeLocation : fallbackEvent?.location || 'PICC Youth Church',
      description: hasLocationAndBody ? bodyParts.join('\n\n') : item.description || '',
      image: toAssetUrl(item.imageUrl) || fallbackEvent?.image || '/hero/hero-store.jpg',
      acceptsOnlinePayment: Boolean(item.acceptsOnlinePayment) || (normalizePaymentAmount(item.paymentAmount) != null && normalizePaymentAmount(item.paymentAmount)! > 0),
      paymentAmount: normalizePaymentAmount(item.paymentAmount),
      paymentCurrency: item.paymentCurrency || 'MWK',
      paymentAccount: item.paymentAccount || 'youth',
    };
  });
  const aboutParagraphs = (ministryInfo.about || defaultInfo.about || '').split(/\n{2,}/).filter(Boolean);
  const partnershipParagraphs = (ministryInfo.partnershipBody || defaultInfo.partnershipBody || '').split(/\n{2,}/).filter(Boolean);
  const partnershipDetails = ministryInfo.partnershipDetails?.length ? ministryInfo.partnershipDetails : defaultInfo.partnershipDetails || [];
  const contactLocationLines = (ministryInfo.location || defaultInfo.location || '').split(/\n+/).filter(Boolean);

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

  // --- CYCLING EVENTS EFFECT ---
  useEffect(() => {
    if (!displayedEventItems.length) return;
    const timer = setInterval(() => {
      setFeaturedEventIndex((prev) => (prev + 1) % displayedEventItems.length);
    }, 5000); // Cycles every 5 seconds
    return () => clearInterval(timer);
  }, [displayedEventItems.length]);

  useEffect(() => {
    setFeaturedEventIndex(0);
  }, [eventSearchQuery]);

  const fallbackGridEvent: YouthEvent = {
    id: 0,
    type: 'Youth Church Event',
    title: 'Youth Church Sunday Service',
    date: 'Every Sunday | 1:30 PM - 3:30 PM',
    location: 'The Camp of God Cathedral, Area 49 Lilongwe',
    description: 'Join us every Sunday for worship, word, and community.',
    image: '/ministries/youth-church/img-1.jpg',
    acceptsOnlinePayment: false,
    paymentAmount: null,
    paymentCurrency: 'MWK',
    paymentAccount: 'youth',
  };
  const safeFeaturedEventIndex = displayedEventItems.length ? featuredEventIndex % displayedEventItems.length : 0;
  const featuredGridEvent = displayedEventItems[safeFeaturedEventIndex] || fallbackGridEvent;
  const remainingEvents = displayedEventItems.filter((_, idx) => idx !== safeFeaturedEventIndex);

  const handleEventSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEventSearchQuery(eventSearchInput.trim());
  };

  const clearEventSearch = () => {
    setEventSearchInput('');
    setEventSearchQuery('');
  };

  const featuredProject = displayedProjectItems[0] || null;
  const remainingProjects = displayedProjectItems.slice(1);

  const handleInitiativeSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInitiativeSearchQuery(initiativeSearchInput.trim());
  };

  const clearInitiativeSearch = () => {
    setInitiativeSearchInput('');
    setInitiativeSearchQuery('');
  };

  const normalizePaychanguPhone = (countryCode: string, rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    if (countryCode === '+265') return digits.replace(/^0+/, '');
    return `${countryCode}${digits}`;
  };

  const formatPaymentAmount = (event: YouthEvent) =>
    `${event.paymentCurrency || 'MWK'} ${Number(event.paymentAmount || 0).toLocaleString('en-US')}`;

  const openPayment = (event: YouthEvent) => {
    if (!event.acceptsOnlinePayment || event.paymentAmount == null || event.paymentAmount <= 0) return;
    setPaymentEvent(event);
    setPaymentError(null);
    setPaymentSuccess(null);
    setBankTransferDetails(null);
  };

  const submitPayment = async () => {
    if (!paymentEvent) return;
    setPaymentError(null);
    setPaymentSuccess(null);
    setBankTransferDetails(null);

    if (!paymentForm.fullName || !paymentForm.phone || !paymentForm.email) {
      setPaymentError('Please enter your name, phone number, and email.');
      return;
    }

    const nameParts = paymentForm.fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      setPaymentError('Please enter your full name (first and last).');
      return;
    }

    const normalizedPhone = normalizePaychanguPhone(paymentForm.phoneCountry, paymentForm.phone);
    if (paymentForm.phoneCountry === '+265' && normalizedPhone.length !== 9) {
      setPaymentError('Please enter a valid Malawi mobile number with 9 digits.');
      return;
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    const amount = Number(paymentEvent.paymentAmount || 0);
    const currency = paymentEvent.paymentCurrency || 'MWK';
    const reason = `Youth Event: ${paymentEvent.title}`;
    const paymentAccount = paymentEvent.paymentAccount || 'youth';

    setPaymentSubmitting(true);
    try {
      const givingResponse = await apiFetch('/api/giving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          fullName: paymentForm.fullName,
          email: paymentForm.email,
          phone: normalizedPhone,
          phoneCountry: paymentForm.phoneCountry,
          paymentMethod: paymentForm.paymentMethod,
          givingType: 'Youth Event Payment',
          reason,
          paymentAccount,
        }),
      });
      const givingData = await givingResponse.json().catch(() => null);
      if (!givingResponse.ok) {
        throw new Error(givingData?.error || 'Failed to save payment record.');
      }

      const paymentResponse = await fetch('/api/paychangu/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          email: paymentForm.email,
          firstName,
          lastName,
          phone: normalizedPhone,
          paymentMethod: paymentForm.paymentMethod,
          reason,
          givingId: givingData.id,
          account: paymentAccount,
        }),
      });
      const paymentData = await paymentResponse.json().catch(() => null);
      if (!paymentResponse.ok) {
        throw new Error(paymentData?.error || paymentData?.message || 'Payment initialization failed.');
      }

      if (paymentForm.paymentMethod === 'card' && paymentData?.checkoutUrl) {
        window.location.href = paymentData.checkoutUrl;
        return;
      }

      if (paymentForm.paymentMethod === 'bank') {
        setBankTransferDetails(paymentData?.bankTransfer || null);
        setPaymentSuccess('Your bank transfer account has been generated. Use the details below to complete payment.');
      } else {
        setPaymentSuccess('Payment request sent. Please follow the mobile prompt to complete payment.');
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Failed to initialize payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

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
    let isMounted = true;

    const loadMinistryContent = async () => {
      try {
        const response = await apiFetch('/api/ministries/youth-church/content');
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
          setMinistryItems(
            (data.items as unknown[])
              .map((item: unknown) => normalizeMinistryItem(item))
              .filter((item): item is MinistryItem => item !== null),
          );
        }
      } catch {
        // Keep the built-in Youth Church content as the public fallback.
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
        const response = await apiFetch(`/api/site-content/${YOUTH_CHURCH_NEWS_KEY}`);
        if (!response.ok) return;
        const record = await response.json().catch(() => null);
        const items = parseSiteContentItems(record?.body)
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => ({
            badge: typeof item.badge === 'string' ? item.badge : 'Update',
            date: typeof item.date === 'string' ? item.date : '',
            title: typeof item.title === 'string' ? item.title : '',
            description: typeof item.description === 'string' ? item.description : '',
            image: toAssetUrl(typeof item.imageUrl === 'string' ? item.imageUrl : typeof item.image === 'string' ? item.image : '') || '/ministries/youth-church/news-1.JPG',
          }))
          .filter((item) => item.title);

        if (isMounted && items.length > 0) {
          setNewsItems(items.slice(0, YOUTH_CHURCH_NEWS_ITEMS.length));
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
              title: "Youth Church Service",
              publishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              channelTitle: "Youth Church",
              description: "Helping young people grow in Christ and community.",
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
      
      {/* --- EVENT MODAL OVERLAY --- */}
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
              {/* Close Button */}
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>

              {/* Event Poster / Image */}
              <div className="relative w-full md:w-1/2 h-64 md:h-[500px] bg-slate-100">
                <Image 
                  src={selectedEvent.image} 
                  alt={selectedEvent.title}
                  fill
                  className="object-cover"
                  onError={swapImage('/hero/hero-store.jpg')}
                />
              </div>

              {/* Event Details Area */}
              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-gray-50">
                <span className="text-sm font-bold text-[#2D5A8C] uppercase tracking-wider mb-2">
                  {selectedEvent.type}
                </span>
                <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                  {selectedEvent.title}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CalendarClock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">{selectedEvent.date}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">{selectedEvent.location}</p>
                  </div>
                </div>

                <div className="w-12 h-1 bg-gray-200 rounded-full mb-6" />

                <p className="text-gray-600 leading-relaxed mb-8">
                  {selectedEvent.description}
                </p>

                {selectedEvent.acceptsOnlinePayment && selectedEvent.paymentAmount != null && selectedEvent.paymentAmount > 0 ? (
                  <button
                    type="button"
                    onClick={() => openPayment(selectedEvent)}
                    className="mb-6 w-fit rounded-full bg-[#2D5A8C] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1E3A5F]"
                  >
                    Pay {formatPaymentAmount(selectedEvent)}
                  </button>
                ) : null}

                {/* Social & Contact Links */}
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">MORE INFO & RSVP:</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="https://wa.me/265999000000" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Phone className="w-4 h-4" /> WhatsApp
                    </a>
                    <a href="https://facebook.com/piccyouthchurch" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#0c5bc6] text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                    <a href="https://instagram.com/piccyouthchurch" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                    <a href="https://twitter.com/piccyouthchurch" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Twitter className="w-4 h-4" /> X
                    </a>
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
                <XIcon className="w-5 h-5" />
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
                <span className="text-sm font-bold text-[#2D5A8C] uppercase tracking-wider mb-2">
                  {selectedInitiative.type}
                </span>
                <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                  {selectedInitiative.title}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">Status: {selectedInitiative.status}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">Youth Church Initiative</p>
                  </div>
                </div>

                <div className="w-12 h-1 bg-gray-200 rounded-full mb-6" />

                <p className="text-gray-600 leading-relaxed mb-8">
                  This initiative is part of Youth Church&apos;s work to mentor, equip, and gather young people across PICC&apos;s youth ministries.
                </p>

                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">MORE INFO:</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="https://wa.me/265999000000" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Phone className="w-4 h-4" /> WhatsApp
                    </a>
                    <a href="https://facebook.com/piccyouthchurch" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#0c5bc6] text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                    <a href="https://instagram.com/piccyouthchurch" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paymentEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setPaymentEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 16 }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-black shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#2D5A8C]">Youth Event Payment</p>
                  <h2 className="mt-2 text-2xl font-black">{paymentEvent.title}</h2>
                  <p className="mt-1 text-sm text-black/60">{formatPaymentAmount(paymentEvent)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentEvent(null)}
                  className="rounded-full bg-black/5 p-2 text-black transition hover:bg-black/10"
                  aria-label="Close payment form"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              {paymentError && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
                  {paymentError}
                </div>
              )}
              {paymentSuccess && (
                <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                  {paymentSuccess}
                </div>
              )}

              <div className="grid gap-3 text-sm">
                <label className="grid gap-1">
                  <span className="font-medium text-black/75">Full name</span>
                  <input
                    className="rounded-lg border border-black/10 px-3 py-2"
                    value={paymentForm.fullName}
                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    type="text"
                    placeholder="First and last name"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="font-medium text-black/75">Email address</span>
                  <input
                    className="rounded-lg border border-black/10 px-3 py-2"
                    value={paymentForm.email}
                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, email: event.target.value }))}
                    type="email"
                    placeholder="Email address"
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[116px_minmax(0,1fr)]">
                  <label className="grid gap-1">
                    <span className="font-medium text-black/75">Country</span>
                    <select
                      className="rounded-lg border border-black/10 px-3 py-2"
                      value={paymentForm.phoneCountry}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, phoneCountry: event.target.value }))}
                    >
                      <option value="+265">MW (+265)</option>
                      <option value="+233">GH (+233)</option>
                      <option value="+234">NG (+234)</option>
                      <option value="+254">KE (+254)</option>
                      <option value="+255">TZ (+255)</option>
                      <option value="+260">ZM (+260)</option>
                      <option value="+27">ZA (+27)</option>
                      <option value="+44">UK (+44)</option>
                      <option value="+1">US (+1)</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="font-medium text-black/75">Phone number</span>
                    <input
                      className="rounded-lg border border-black/10 px-3 py-2"
                      value={paymentForm.phone}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, phone: event.target.value }))}
                      type="tel"
                      placeholder="Phone number"
                    />
                  </label>
                </div>
                <div className="grid gap-2">
                  <span className="font-medium text-black/75">Payment method</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      ['airtel', 'Airtel Money'],
                      ['mpamba', 'Mpamba'],
                      ['bank', 'Bank Transfer'],
                      ['card', 'Card Payment'],
                    ].map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2">
                        <input
                          type="radio"
                          name="youthEventPaymentMethod"
                          value={value}
                          checked={paymentForm.paymentMethod === value}
                          onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {bankTransferDetails && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p className="font-semibold">Bank transfer details</p>
                  <p className="mt-2">Bank: {bankTransferDetails.bank_name || 'N/A'}</p>
                  <p>Account Name: {bankTransferDetails.account_name || 'N/A'}</p>
                  <p>Account Number: {bankTransferDetails.account_number || 'N/A'}</p>
                </div>
              )}

              <button
                type="button"
                onClick={submitPayment}
                disabled={paymentSubmitting}
                className="mt-5 w-full rounded-full bg-[#2D5A8C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1E3A5F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paymentSubmitting ? 'Processing...' : 'Pay Now'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen">
        
        {/* 1. HERO SECTION (Youth Church Core) */}
        {!mobilePlayerActive && (
          <section
            className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)] text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10 overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(rgba(30,58,95,0.82), rgba(45,90,140,0.76)), url(${toAssetUrl(ministryInfo.heroImageUrl) || '/hero/hero-2.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
                <Image 
                  src={toAssetUrl(ministryInfo.logoImageUrl) || '/logos/youth-church-logo.png'} 
                  alt={`${ministryInfo.name || 'Youth Church'} Logo`} 
                  fill 
                  className="object-contain p-2 rounded-full"
                  onError={swapImage('/logo.png')}
                />
              </div>

              <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">PICC Ministry</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">{ministryInfo.name || 'Youth Church'}</h1>
              
              <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
                <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                  &quot;{ministryInfo.motto || defaultInfo.motto}&quot;
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 2. ABOUT YOUTH CHURCH */}
        {!mobilePlayerActive && (
          <section className="py-20 md:py-28 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">The Next Generation</h2>
                <div className="w-16 h-1 bg-[#2D5A8C] mx-auto mb-8 rounded-full" />
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={`about-${index}`} className={`text-lg text-black/70 leading-relaxed ${index < aboutParagraphs.length - 1 ? 'mb-6' : ''}`}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 3. THE SUB-MINISTRIES (Color Coded Sections) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 border-y border-black/5 text-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Ministry Arms</h2>
                <p className="text-black/60 max-w-2xl mx-auto">Discover the tailored ministries that make up the Youth Church family.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                
                {/* Called to Greatness (CTG) - Forest Green */}
                <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-green-600 bg-white">
                  <div className="p-8">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Rocket className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-700 mb-3">{armItems[0]?.title || 'Called to Greatness (CTG)'}</h3>
                    <p className="text-black/70 text-sm leading-relaxed">
                      {armItems[0]?.description || defaultArmItems[0].description}
                    </p>
                  </div>
                  <div className="h-2 w-full bg-green-600/10 absolute bottom-0 left-0" />
                </Card>

                {/* Hope and Beauty - Rose Pink */}
                <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-rose-500 bg-white">
                  <div className="p-8">
                    <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-7 h-7 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold text-rose-600 mb-3">{armItems[1]?.title || 'Hope and Beauty'}</h3>
                    <p className="text-black/70 text-sm leading-relaxed">
                      {armItems[1]?.description || defaultArmItems[1].description}
                    </p>
                  </div>
                  <div className="h-2 w-full bg-rose-500/10 absolute bottom-0 left-0" />
                </Card>

                {/* Teens Ministry - Vibrant Orange */}
                <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-orange-500 bg-white">
                  <div className="p-8">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Flame className="w-7 h-7 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-orange-600 mb-3">{armItems[2]?.title || 'Teens Ministry'}</h3>
                    <p className="text-black/70 text-sm leading-relaxed">
                      {armItems[2]?.description || defaultArmItems[2].description}
                    </p>
                  </div>
                  <div className="h-2 w-full bg-orange-500/10 absolute bottom-0 left-0" />
                </Card>

                {/* Heritage Ministry - Sky Blue / Teal */}
                <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-sky-500 bg-white">
                  <div className="p-8">
                    <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Baby className="w-7 h-7 text-sky-500" />
                    </div>
                    <h3 className="text-xl font-bold text-sky-600 mb-3">{armItems[3]?.title || 'Heritage Ministry'}</h3>
                    <p className="text-black/70 text-sm leading-relaxed">
                      {armItems[3]?.description || defaultArmItems[3].description}
                    </p>
                  </div>
                  <div className="h-2 w-full bg-sky-500/10 absolute bottom-0 left-0" />
                </Card>

              </div>
            </div>
          </section>
        )}

        {/* 4. MINISTRY HIGHLIGHTS (6-Grid Gallery with Interactive Captions) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Youth Life</h2>
                <p className="text-black/60 max-w-2xl mx-auto">Vibrant moments of energy, fun, and sincere devotion from across all our ministries.</p>
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
                    {activeTool === "chat" && <div className="h-100 w-full bg-white"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Youth Church Live'} /></div>}
                    {activeTool === "notepad" && <NotepadTool />}
                    {activeTool === "testimony" && <div className="px-5 py-6"><TestimonyTool /></div>}
                    {activeTool === "give" && <div className="px-5 py-6"><YouthChurchGiveTool isMobile={false} /></div>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 6. ALL EVENTS SECTION (Cycling Grid triggering Modal) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 text-black overflow-hidden border-y border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming & Past Events</h2>
                  <p className="text-black/60 max-w-xl">Encompassing gatherings from the Youth Church, CTG, Hope & Beauty, Teens, and Heritage.</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <form onSubmit={handleEventSearch} className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="search"
                      value={eventSearchInput}
                      onChange={(event) => setEventSearchInput(event.target.value)}
                      placeholder="March 28, 2026"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#2D5A8C] focus:ring-2 focus:ring-[#2D5A8C]/15 sm:w-48"
                      aria-label="Search youth church events by date"
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  {/* Large Featured Image (Cycling) - BUTTON */}
                  <button 
                    onClick={() => setSelectedEvent(featuredGridEvent)}
                    className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group text-left w-full focus:outline-none focus:ring-4 focus:ring-[#2D5A8C]"
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
                          <span className="bg-[#2D5A8C] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3 flex items-center gap-2">
                            <CalendarClock className="w-4 h-4" />
                            {featuredGridEvent.type}
                          </span>
                          <h3 className="text-white text-3xl md:text-4xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4">{featuredGridEvent.title}</h3>
                          <p className="text-white/90 text-sm md:text-base font-medium flex items-center gap-2 mb-1">
                            <CalendarClock className="w-4 h-4" /> {featuredGridEvent.date}
                          </p>
                          <p className="text-white/70 text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {featuredGridEvent.location}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click for Details
                    </div>
                  </button>

                  {/* Scrollable Smaller Previous/Future Events - BUTTONS */}
                  <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-[#2D5A8C]/30">
                    {remainingEvents.map((event) => (
                      <button 
                        key={event.id} 
                        onClick={() => setSelectedEvent(event)}
                        className="relative h-48 w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-black/5 group text-left focus:outline-none focus:ring-2 focus:ring-[#2D5A8C] sm:w-72 lg:h-[113px] lg:w-full"
                      >
                        <Image 
                          src={event.image} 
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                          <span className="text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                            {event.type}
                          </span>
                          <h4 className="text-white text-sm font-semibold leading-tight mb-1 group-hover:underline underline-offset-2">{event.title}</h4>
                          <p className="text-white/60 text-[10px] truncate">{event.date}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#2D5A8C]/25 bg-white p-8 text-center text-sm text-black/55">
                  No Youth Church events found for this date search.
                </div>
              )}
            </div>
          </section>
        )}

        {/* 7. MINISTRY PROJECTS (Initiatives Feed) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black border-b border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Initiatives</h2>
                  <p className="text-black/60 max-w-xl">See what our youth and sub-ministries are building and championing.</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <form onSubmit={handleInitiativeSearch} className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                      type="search"
                      value={initiativeSearchInput}
                      onChange={(event) => setInitiativeSearchInput(event.target.value)}
                      placeholder="August 2026"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#2D5A8C] focus:ring-2 focus:ring-[#2D5A8C]/15 sm:w-48"
                      aria-label="Search youth church initiatives"
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  {/* Large Featured Image (Current/Latest Project) */}
                  <button
                    onClick={() => setSelectedInitiative(featuredProject)}
                    className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group text-left w-full focus:outline-none focus:ring-4 focus:ring-[#2D5A8C]"
                  >
                    <Image 
                      src={featuredProject.image || '/hero/hero-store.jpg'} 
                      alt={featuredProject.title || 'Youth Church Initiative'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={swapImage('/hero/hero-store.jpg')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                      <span className="bg-[#2D5A8C] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3">
                        {featuredProject.type || 'Initiative'}
                      </span>
                      <h3 className="text-white text-2xl md:text-3xl font-bold mb-1 group-hover:underline decoration-2 underline-offset-4">{featuredProject.title || 'Youth Church Initiative'}</h3>
                      <p className="text-white/80 text-sm font-medium">Status: {featuredProject.status || 'Active'}</p>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click for Details
                    </div>
                  </button>

                  {/* Scrollable Previous/Future Initiatives */}
                  <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-[#2D5A8C]/30">
                    {remainingProjects.map((material) => (
                      <button
                        key={material.id}
                        onClick={() => setSelectedInitiative(material)}
                        className="relative h-48 w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-black/5 group text-left focus:outline-none focus:ring-2 focus:ring-[#2D5A8C] sm:w-72 lg:h-[113px] lg:w-full"
                      >
                        <Image 
                          src={material.image} 
                          alt={material.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                          <span className="text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1">
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
                <div className="rounded-2xl border border-dashed border-[#2D5A8C]/25 bg-gray-50 p-8 text-center text-sm text-black/55">
                  No Youth Church initiatives found for this search.
                </div>
              )}

              <div className="mt-12 text-center">
                <Link 
                  href="/ministries/youth-church-ministry/archive"
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#2D5A8C] transition hover:bg-slate-50 hover:border-black/20 shadow-sm"
                >
                  View Archive <Search className="w-4 h-4" />
                </Link>
              </div>
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
                  title={featuredVideo?.title || 'Youth Church Live'}
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
                {activeTool === "chat" && <div className="h-[300px] w-full bg-white mb-4 rounded-xl overflow-hidden border border-black/10"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Youth Church Live'} /></div>}
                {activeTool === "bible" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><BibleTool /></div>}
                {activeTool === "notepad" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><NotepadTool /></div>}
                {activeTool === "testimony" && <div className="px-4 py-5"><TestimonyTool /></div>}
                {activeTool === "give" && <div className="px-4 py-5"><YouthChurchGiveTool isMobile={true} /></div>}
              </div>
            </div>
          </section>
        )}

        {/* 8. SUPPORT / PARTNER SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">{ministryInfo.partnershipTitle || 'Partner With Us'}</h2>
                  <div className="w-16 h-1 bg-[#2D5A8C] mb-6 rounded-full" />
                  {partnershipParagraphs.map((paragraph, index) => (
                    <p key={`partnership-${index}`} className={`text-lg text-black/70 ${index < partnershipParagraphs.length - 1 ? 'mb-4' : 'mb-6'}`}>
                      {paragraph}
                    </p>
                  ))}
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
                    <h3 className="font-bold text-xl mb-4 text-[#2D5A8C]">Sponsorship & Giving</h3>
                    <div className="space-y-2 text-sm text-black/70">
                      {partnershipDetails.length > 0 ? (
                        partnershipDetails.map((detail) => (
                          <p key={`${detail.label}-${detail.value}`}><strong>{detail.label}:</strong> {detail.value}</p>
                        ))
                      ) : (
                        <p>If you would like to sponsor a youth retreat or fund our campus outreach programs, please contact the main church office for designated giving details.</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                  <Image 
                    src={toAssetUrl(ministryInfo.partnershipImageUrl) || '/hero/hero-store.jpg'} 
                    alt="Support Youth Ministry" 
                    fill 
                    className="object-cover"
                    onError={swapImage('/hero/hero-store.jpg')} 
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 9. NEWS SECTION */}
        {!mobilePlayerActive && (
          <NewsSection
            kicker="Youth Church updates"
            title="Latest News"
            description="Stories, highlights, and ministry updates from Youth Church, Teens, Heritage, Hope & Beauty, and Called to Greatness."
            items={newsItems}
            backgroundClassName="bg-white text-black border-y border-black/5"
            maxItems={9}
          />
        )}

        <div className="bg-white pb-16 text-center">
          <Link 
            href="/ministries/youth-church-ministry/archive"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#2D5A8C] transition hover:bg-slate-50 hover:border-black/20 shadow-sm"
          >
            View News Archive <Search className="w-4 h-4" />
          </Link>
        </div>

        {/* 10. CONTACTS SECTION */}
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
                  {contactLocationLines.map((line) => (
                    <p key={line} className="text-white/70">{line}</p>
                  ))}
                </Card>

                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Phone className="w-10 h-10 mx-auto text-blue-300 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Phone</h3>
                  <p className="text-white/70 whitespace-pre-line">{ministryInfo.phone || defaultInfo.phone}</p>
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
