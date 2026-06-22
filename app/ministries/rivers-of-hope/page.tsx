'use client';

import { useState, useEffect, useRef, type FormEvent, type SyntheticEvent } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { apiFetch, apiUrl } from '@/lib/api';
import { 
  MapPin, Phone, Mail, CalendarClock, Globe, 
  MessageSquareText, BookOpenText, StickyNote, 
  Flame, Users, GraduationCap, Tent, BookOpen, 
  XIcon, Facebook, Twitter, Instagram, HeartHandshake, Info, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- LIVESTREAM COMPONENTS ---
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import ROHGiveTool from '@/components/livestream/ROHGiveTool';
import BibleTool from '@/components/livestream/BibleTool';
import NewsSection from '@/components/NewsSection';
import { RIVERS_OF_HOPE_NEWS_ITEMS } from '@/components/riversOfHopeNews';

// --- TYPES & GLOBALS ---
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

type EventCard = {
  id: string | number;
  type: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
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
  const match = raw.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : '';
};

const swapImage = (fallback: string) => (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.src = fallback;
};

const normalizeSearchText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

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

// --- MOCK DATA ---
const defaultInfo: MinistryInfo = {
  name: 'Rivers of Hope',
  motto: 'Proclaiming the Gospel of Jesus Christ with power and clarity.',
  about:
    'The Rivers of Hope Crusades are flagship evangelistic outreach programs led by Pastor Esau Banda across Malawi and internationally. These large-scale crusades are designed to proclaim the Gospel of Jesus Christ with power and clarity, reaching diverse communities through open-air gatherings and mass evangelism.\n\nCharacterized by dynamic preaching, worship, healing, and deliverance sessions, we create an environment where individuals encounter genuine spiritual transformation. Beyond evangelism, the initiative also fosters unity among churches and serves as a catalyst for community revival and discipleship.',
  heroImageUrl: '/hero/hero-1.jpg',
  logoImageUrl: '/ministries/roh/logo.jpeg',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Partner With The Harvest',
  partnershipBody:
    'Taking the Gospel to the masses through open-air crusades and equipping international leaders requires significant resources and dedication.\n\nWhen you partner with Rivers of Hope Crusades, you are directly contributing to soul-winning, community transformation, and raising up the next generation of spiritual leaders on campuses and in high schools.',
  partnershipDetails: [
    { label: 'Email', value: 'roh@piccworldwide.org' },
    { label: 'Office', value: 'Pentecost International Christian Centre (PICC) Along Kaunda Road, Near Best Oil Filling Station, Area 49 Post Office Box 31841 Lilongwe 3 Malawi' },
  ],
  partnershipImageUrl: '/hero/hero-1.jpg',
  phone: 'Check with your local PICC branch for contact details.',
  email: 'roh@piccworldwide.org',
  location: 'Pentecost International Christian Centre (PICC) Along Kaunda Road, Near Best Oil Filling Station, Area 49 Post Office Box 31841 Lilongwe 3 Malawi',
  contactIntro:
    'For crusade invitations, conference details, or partnership inquiries, please contact our ministry desk.',
};

const eventsList = [
  {
    id: 1,
    type: 'Mega Crusade',
    title: 'Mzuzu Rivers of Hope Crusade',
    date: 'August 14 - 17, 2026',
    location: 'Mzuzu Stadium, Northern Region',
    description: 'Join Pastor Esau Banda for four days of dynamic preaching, worship, healing, and deliverance. Experience the power of the Gospel of Jesus Christ in an open-air gathering designed to bring spiritual transformation to the city.',
    image: '/hero/hero-1.jpg',
  },
  {
    id: 2,
    type: 'International Conference',
    title: 'Global Pastors & Leaders Summit',
    date: 'October 5 - 8, 2026',
    location: 'Camp of God Cathedral, Lilongwe',
    description: 'A global platform equipping church leaders across denominations. Receive spiritual impartation, leadership training, and strategic ministry insights to strengthen the Body of Christ in a rapidly changing world.',
    image: '/hero/hero-2.jpg',
  },
  {
    id: 3,
    type: 'Campus Outreach',
    title: 'UNIMA Campus Crusade',
    date: 'November 12 - 14, 2026',
    location: 'University of Malawi, Zomba',
    description: 'Raising a generation of spiritually grounded and purpose-driven young leaders. Three days of evangelism, mentorship, and empowerment for university students to integrate faith with academic excellence.',
    image: '/images/youth-church/img-4.jpg',
  },
  {
    id: 4,
    type: 'Regional Gathering',
    title: 'Southern Region Leaders Conference',
    date: 'Past Event - March 2026',
    location: 'Blantyre City',
    description: 'A contextualized platform for church leaders from different denominations to interact, grow, and receive practical tools and biblical teaching for effective ministry.',
    image: '/hero/hero-3.jpg',
  },
  {
    id: 5,
    type: 'Youth Mission',
    title: 'High School Invasion',
    date: 'Ongoing 2026',
    location: 'Various Secondary Schools',
    description: 'Dedicated to reaching secondary school students with the transformative message of the Gospel, inspiring and guiding them in their spiritual journey and academic development.',
    image: '/images/youth-church/img-3.jpg',
  },
];

const defaultEventItems: MinistryItem[] = eventsList.map((event, index) => ({
  id: `default-event-${event.id}`,
  category: 'event',
  title: event.title,
  description: event.description,
  label: event.date,
  imageUrl: event.image,
  sortOrder: index,
}));

const highlightGallery = [
  { id: 1, src: '/hero/hero-1.jpg', caption: 'Mass open-air evangelism and soul-winning.' },
  { id: 2, src: '/hero/hero-2.jpg', caption: 'Equipping global leaders for end-time harvest.' },
  { id: 3, src: '/hero/hero-3.jpg', caption: 'Powerful moments of healing and deliverance.' },
  { id: 4, src: '/images/youth-church/img-4.jpg', caption: 'Campus Crusade: Empowering university students.' },
  { id: 5, src: '/images/youth-church/img-3.jpg', caption: 'Reaching the youth with the message of hope.' },
  { id: 6, src: '/hero/hero-store.jpg', caption: 'Fostering unity among churches and ministries.' },
];

const defaultHighlightItems: MinistryItem[] = highlightGallery.map((item, index) => ({
  id: `default-highlight-${item.id}`,
  category: 'highlight',
  title: `Highlight ${item.id}`,
  description: item.caption,
  label: null,
  imageUrl: item.src,
  sortOrder: index,
}));

const ministryProjects = [
  { id: 1, type: 'Crusade Preparation', title: 'Mzuzu Outreach Mobilization', status: 'Active', image: '/hero/hero-1.jpg' },
  { id: 2, type: 'Leadership Training', title: 'Pastors Empowerment Manuals', status: 'Ongoing', image: '/hero/hero-2.jpg' },
  { id: 3, type: 'Campus Discipleship', title: 'University Fellowship Networks', status: 'Active', image: '/images/youth-church/img-4.jpg' },
  { id: 4, type: 'Youth Mentorship', title: 'Secondary School Scripture Union Support', status: 'Ongoing', image: '/images/youth-church/img-3.jpg' },
  { id: 5, type: 'Community Impact', title: 'Post-Crusade Discipleship Centers', status: 'Planning', image: '/hero/hero-store.jpg' },
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

const defaultProgramItems: MinistryItem[] = [
  {
    id: 'default-program-1',
    category: 'program',
    title: 'Rivers of Hope Crusades',
    description:
      'Our flagship open-air mass evangelism gatherings designed to reach diverse communities with dynamic preaching, worship, healing, and deliverance sessions.',
    label: null,
    imageUrl: null,
    sortOrder: 0,
  },
  {
    id: 'default-program-2',
    category: 'program',
    title: 'International Leaders Conference',
    description:
      'A global platform equipping pastors and church workers across denominations with spiritual impartation, leadership training, and strategic ministry insights.',
    label: null,
    imageUrl: null,
    sortOrder: 1,
  },
  {
    id: 'default-program-3',
    category: 'program',
    title: 'Local Leaders Conference',
    description:
      'Organized at regional and district levels, providing a contextualized platform to empower leaders with practical tools and promote unity within the Christian community.',
    label: null,
    imageUrl: null,
    sortOrder: 2,
  },
  {
    id: 'default-program-4',
    category: 'program',
    title: 'Campus Crusade',
    description:
      'Targeting university and college students to raise spiritually grounded young leaders through evangelism, discipleship, and integrating faith with academics.',
    label: null,
    imageUrl: null,
    sortOrder: 3,
  },
  {
    id: 'default-program-5',
    category: 'program',
    title: 'Ministry to Youth',
    description:
      'Dedicated to reaching secondary school students with the transformative message of the Gospel, guiding young people in both their spiritual journey and academic development.',
    label: null,
    imageUrl: null,
    sortOrder: 4,
  },
];

export default function RiversOfHopePage() {
  // --- STATE ---
  const [activeGalleryId, setActiveGalleryId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventCard | null>(null);
  const [selectedOutreach, setSelectedOutreach] = useState<EventCard | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [outreachSlide, setOutreachSlide] = useState(0);
  const [eventSearchInput, setEventSearchInput] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [outreachSearchInput, setOutreachSearchInput] = useState('');
  const [outreachSearchQuery, setOutreachSearchQuery] = useState('');
  const [ministryInfo, setMinistryInfo] = useState<MinistryInfo>(defaultInfo);
  const [ministryItems, setMinistryItems] = useState<MinistryItem[]>([]);
  const [isRohSubmitting, setIsRohSubmitting] = useState(false);
  const [rohFormData, setRohFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    amount: '',
    frequency: 'Monthly',
    volunteerArea: '',
    otherVolunteerArea: '',
    notes: '',
    programs: {
      prayer: false,
      financial: false,
      radioMedia: false,
      volunteer: false,
    },
  });

  const VOLUNTEER_AREAS = [
    "organizing events",
    "counselling services",
    "distribution of promotion materials",
    "traffic control",
    "security services",
    "protocol",
    "ushering services",
    "Other"
  ];

  const ROH_PROGRAM_OPTIONS = [
    { key: 'prayer', label: 'Prayer' },
    { key: 'financial', label: 'Financial' },
    { key: 'radioMedia', label: 'Radio & Media' },
    { key: 'volunteer', label: 'Volunteer' },
  ] as const;

  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileResumeAt, setMobileResumeAt] = useState<number | null>(null);
  const playersRef = useRef<Map<string, any>>(new Map());

  const selectedProgramLabels = Object.entries(rohFormData.programs)
    .filter(([, isSelected]) => isSelected)
    .map(([key]) => ROH_PROGRAM_OPTIONS.find((option) => option.key === key)?.label)
    .filter(Boolean)
    .join(', ');

  const handleRohFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;

    if (name.startsWith('programs.')) {
      const key = name.replace('programs.', '') as keyof typeof rohFormData.programs;
      setRohFormData((prev) => ({
        ...prev,
        programs: {
          ...prev.programs,
          [key]: checked,
        },
      }));
      return;
    }

    setRohFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRohFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRohSubmitting(true);

    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: rohFormData.fullName.trim(),
          email: rohFormData.email.trim(),
          phone: rohFormData.phone.trim(),
          location: rohFormData.location.trim(),
          programs: ROH_PROGRAM_OPTIONS.filter((option) => rohFormData.programs[option.key]).map((option) => option.label),
          amount: rohFormData.amount.trim(),
          frequency: rohFormData.frequency,
          volunteerArea: rohFormData.volunteerArea === 'Other' ? rohFormData.otherVolunteerArea.trim() : rohFormData.volunteerArea.trim(),
          notes: rohFormData.notes.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'There was an error sending your request. Please try again.';
        try {
          const data = await response.json();
          if (typeof data?.error === 'string' && data.error.trim()) {
            errorMessage = data.error;
          }
        } catch {
          // ignore
        }
        toast.error(errorMessage);
        return;
      }

      toast.success('Thank you! Your Rivers of Hope inquiry has been submitted.');
      setRohFormData({
        fullName: '',
        email: '',
        phone: '',
        location: '',
        amount: '',
        frequency: 'Monthly',
        volunteerArea: '',
        otherVolunteerArea: '',
        notes: '',
        programs: {
          prayer: false,
          financial: false,
          radioMedia: false,
          volunteer: false,
        },
      });
    } catch (error) {
      console.error('ROH form submit failed:', error);
      toast.error('There was an error sending your request. Please try again.');
    } finally {
      setIsRohSubmitting(false);
    }
  };

  // --- LIVESTREAM CONSTANTS ---
  const CHANNEL_ID = "UC5iA3dWaUBlP_PBlGSQvgNQ";
  const FALLBACK_HERO_ID = videoIdFromUrl(ministryInfo.liveSessionYoutubeUrl) || "ydTADwZRquA";
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

  const featuredVideo = videos[0] || null;
  const itemGroups = {
    programs: ministryItems.filter((item) => item.category === 'program'),
    highlights: ministryItems.filter((item) => item.category === 'highlight'),
    initiatives: ministryItems.filter((item) => item.category === 'initiative'),
    events: ministryItems.filter((item) => item.category === 'event'),
  };
  const programItems = mergeItemsWithFallback(itemGroups.programs, defaultProgramItems);
  const galleryItems = mergeItemsWithFallback(itemGroups.highlights, defaultHighlightItems).slice(0, 6).map((item, index) => ({
    id: index + 1,
    src: toAssetUrl(item.imageUrl) || highlightGallery[index % highlightGallery.length]?.src || '/hero/hero-store.jpg',
    caption: item.description || item.title,
  }));
  const projectItems = mergeItemsWithFallback(itemGroups.initiatives, defaultInitiativeItems).map((item, index) => ({
    id: index + 1,
    type: item.label || 'Initiative',
    title: item.title,
    status: item.description || 'Active',
    image: toAssetUrl(item.imageUrl) || ministryProjects[index % ministryProjects.length]?.image || '/hero/hero-store.jpg',
  }));
  const eventItems: EventCard[] = mergeItemsWithFallback(itemGroups.events, defaultEventItems).map((item, index) => ({
    id: item.id,
    type: eventsList[index % eventsList.length]?.type || 'Crusade & Conference',
    title: item.title,
    date: item.label || 'Upcoming',
    location: eventsList[index % eventsList.length]?.location || ministryInfo.location || 'PICC Worldwide',
    description: item.description || '',
    image: toAssetUrl(item.imageUrl) || eventsList[index % eventsList.length]?.image || '/hero/hero-store.jpg',
  }));

  const outreachItems: EventCard[] = RIVERS_OF_HOPE_NEWS_ITEMS.map((item, index) => ({
    id: `outreach-${index + 1}`,
    type: item.badge || 'Outreach',
    title: item.title,
    date: item.date || 'Past Outreach',
    location: 'PICC Worldwide',
    description: item.description,
    image: item.image,
  }));

  const aboutParagraphs = (ministryInfo.about || defaultInfo.about || '').split(/\n{2,}/).filter(Boolean);
  const partnershipParagraphs = (ministryInfo.partnershipBody || defaultInfo.partnershipBody || '').split(/\n{2,}/).filter(Boolean);
  const partnershipDetails = ministryInfo.partnershipDetails?.length ? ministryInfo.partnershipDetails : defaultInfo.partnershipDetails || [];

  const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Africa/Blantyre" });
  };

  const normalizedEventSearchQuery = normalizeSearchText(eventSearchQuery);
  const filteredEventItems = normalizedEventSearchQuery
    ? eventItems.filter((event) => {
        const searchableText = normalizeSearchText(
          [event.title, event.date, event.location, event.description].join(' '),
        );
        return searchableText.includes(normalizedEventSearchQuery);
      })
    : eventItems;

  const normalizedOutreachSearchQuery = normalizeSearchText(outreachSearchQuery);
  const filteredOutreachItems = normalizedOutreachSearchQuery
    ? outreachItems.filter((item) => {
        const searchableText = normalizeSearchText(
          [item.title, item.date, item.location, item.description].join(' '),
        );
        return searchableText.includes(normalizedOutreachSearchQuery);
      })
    : outreachItems;

  // --- CYCLING EVENTS EFFECT (based on filtered results) ---
  useEffect(() => {
    if (!filteredEventItems.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % filteredEventItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [filteredEventItems.length]);

  useEffect(() => {
    if (!filteredOutreachItems.length) return;
    const timer = setInterval(() => {
      setOutreachSlide((prev) => (prev + 1) % filteredOutreachItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [filteredOutreachItems.length]);

  const safeCurrentSlide = filteredEventItems.length
    ? currentSlide % filteredEventItems.length
    : 0;

  const featuredGridEvent = filteredEventItems[safeCurrentSlide] || eventItems[0];
  const remainingEvents = filteredEventItems.filter((_, idx) => idx !== safeCurrentSlide);

  const safeOutreachSlide = filteredOutreachItems.length
    ? outreachSlide % filteredOutreachItems.length
    : 0;

  const featuredGridOutreach = filteredOutreachItems[safeOutreachSlide] || outreachItems[0];
  const remainingOutreaches = filteredOutreachItems.filter((_, idx) => idx !== safeOutreachSlide);

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

  const handleOutreachSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOutreachSearchQuery(outreachSearchInput.trim());
    setOutreachSlide(0);
  };

  const clearOutreachSearch = () => {
    setOutreachSearchInput('');
    setOutreachSearchQuery('');
    setOutreachSlide(0);
  };

  // --- EFFECTS ---
  useEffect(() => {
    let isMounted = true;

    const loadMinistryContent = async () => {
      try {
        const response = await apiFetch('/api/ministries/rivers-of-hope/content');
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
        // Keep built-in Rivers of Hope content as the public fallback.
      }
    };

    void loadMinistryContent();
    return () => {
      isMounted = false;
    };
  }, []);

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
              title: "Rivers of Hope Crusades Live",
              publishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              channelTitle: "PICC Worldwide",
              description: "Proclaiming the Gospel of Jesus Christ with power and clarity.",
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
  const activeEmbedTool = TOOL_TABS.find(t => t.key === activeTool && t.kind === "embed") as any;

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
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <XIcon className="w-5 h-5" />
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
                <span className="text-sm font-bold text-[#b91c1c] uppercase tracking-wider mb-2">
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

                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">MORE INFO & CONNECT:</p>
                  <div className="flex flex-wrap gap-3">
                    <a href={`mailto:${ministryInfo.email || 'roh@piccworldwide.org'}`} className="flex items-center gap-2 bg-[#b91c1c] hover:bg-red-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Mail className="w-4 h-4" /> Email Us
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOutreach && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedOutreach(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white text-black w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
              onClick={(e) => e.stopPropagation()} 
            >
              <button 
                onClick={() => setSelectedOutreach(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>

              <div className="relative w-full md:w-1/2 h-64 md:h-[500px] bg-slate-100">
                <Image 
                  src={selectedOutreach.image} 
                  alt={selectedOutreach.title}
                  fill
                  className="object-cover"
                  onError={swapImage('/hero/hero-store.jpg')}
                />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-gray-50">
                <span className="text-sm font-bold text-[#b91c1c] uppercase tracking-wider mb-2">
                  {selectedOutreach.type}
                </span>
                <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                  {selectedOutreach.title}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CalendarClock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">{selectedOutreach.date}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">{selectedOutreach.location}</p>
                  </div>
                </div>

                <div className="w-12 h-1 bg-gray-200 rounded-full mb-6" />

                <p className="text-gray-600 leading-relaxed mb-8">
                  {selectedOutreach.description}
                </p>

                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">SHARE & CONNECT:</p>
                  <div className="flex flex-wrap gap-3">
                    <a href={`mailto:${ministryInfo.email || 'roh@piccworldwide.org'}`} className="flex items-center gap-2 bg-[#b91c1c] hover:bg-red-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Mail className="w-4 h-4" /> Reach Out
                    </a>
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
          <section
            className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 bg-red-800 text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10"
            style={{
              backgroundImage: `linear-gradient(rgba(153,27,27,0.82), rgba(69,10,10,0.78)), url(${toAssetUrl(ministryInfo.heroImageUrl) || '/hero/hero-1.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20 flex items-center justify-center overflow-hidden">
                <Image 
                  src={toAssetUrl(ministryInfo.logoImageUrl) || '/ministries/roh/logo.jpeg'} 
                  alt={`${ministryInfo.name || 'Rivers of Hope'} Logo`} 
                  fill 
                  className="object-contain p-2"
                  onError={swapImage('/ministries/roh/logo.jpeg')}
                />
              </div>

              <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">Pastor Esau Banda Ministries</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">{ministryInfo.name || 'Rivers of Hope Crusades'}</h1>
              
              <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
                <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                  &quot;{ministryInfo.motto || defaultInfo.motto}&quot;
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 2. ABOUT THE MINISTRY */}
        {!mobilePlayerActive && (
          <section className="py-20 md:py-28 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Spiritual Transformation & Revival</h2>
                <div className="w-16 h-1 bg-red-800 mx-auto mb-8 rounded-full" />
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={`about-${index}`} className={`text-lg text-black/70 leading-relaxed ${index < aboutParagraphs.length - 1 ? 'mb-6' : ''}`}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 3. PROGRAMS & OUTREACH INITIATIVES */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 border-y border-black/5 text-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Programs & Outreach Initiatives</h2>
                <p className="text-black/60 max-w-2xl mx-auto">Equipping leaders, reaching the youth, and spreading the Gospel to every corner.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {programItems.map((program, index) => {
                  const configs = [
                    { Icon: Flame, border: 'border-t-red-700', bg: 'bg-red-50', icon: 'text-red-700', title: 'text-red-900', bar: 'bg-red-700/10', span: 'md:col-span-2 lg:col-span-1' },
                    { Icon: Globe, border: 'border-t-blue-700', bg: 'bg-blue-50', icon: 'text-blue-700', title: 'text-blue-900', bar: 'bg-blue-700/10', span: '' },
                    { Icon: Users, border: 'border-t-emerald-600', bg: 'bg-emerald-50', icon: 'text-emerald-600', title: 'text-emerald-900', bar: 'bg-emerald-600/10', span: '' },
                    { Icon: GraduationCap, border: 'border-t-amber-500', bg: 'bg-amber-50', icon: 'text-amber-600', title: 'text-amber-800', bar: 'bg-amber-500/10', span: 'md:col-span-1 lg:col-span-1 lg:col-start-1' },
                    { Icon: BookOpen, border: 'border-t-purple-600', bg: 'bg-purple-50', icon: 'text-purple-600', title: 'text-purple-900', bar: 'bg-purple-600/10', span: 'md:col-span-1 lg:col-span-2' },
                  ];
                  const config = configs[index % configs.length];
                  const Icon = config.Icon;
                  return (
                    <Card key={program.id} className={`relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 ${config.border} bg-white ${config.span}`}>
                      <div className="p-8">
                        <div className={`w-14 h-14 ${config.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-7 h-7 ${config.icon}`} />
                        </div>
                        <h3 className={`text-xl font-bold ${config.title} mb-3`}>{program.title}</h3>
                        <p className="text-black/70 text-sm leading-relaxed">{program.description}</p>
                      </div>
                      <div className={`h-2 w-full ${config.bar} absolute bottom-0 left-0`} />
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 4. CRUSADE HIGHLIGHTS (6-Grid Gallery) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Outreach Highlights</h2>
                <p className="text-black/60 max-w-2xl mx-auto">Moments of power, deliverance, and mass salvation from our recent crusades and conferences.</p>
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

                    <div className={`absolute inset-0 bg-[#b91c1c]/20 transition-opacity duration-300 ${activeGalleryId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                ))}
              </div>
              <p className="text-center text-black/50 text-sm mt-6 italic">Click or tap any image to view details.</p>
              <div className="mt-10 text-center">
                <Link
                  href="/ministries/rivers-of-hope/archive"
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-red-700 transition hover:bg-slate-50 hover:border-black/20"
                >
                  View Archive <Search className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 5. THE LIVE ALTAR (Livestream Section) */}
        {!mobilePlayerActive && (
          <section className="py-16 md:py-24 bg-[#0a1424] text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Crusade Live Stream</h2>
                <p className="text-white/70 max-w-2xl mx-auto">Join the massive open-air gatherings and powerful ministration from wherever you are in the world.</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl">
                <div className="relative aspect-video bg-black">
                  <iframe
                    className="h-full w-full"
                    data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                    id="yt-hero"
                    src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                    title={featuredVideo?.title || "Rivers of Hope Live"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                <div className="bg-white text-black px-6 py-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">
                        {featuredVideo?.title || "Rivers of Hope Broadcast"}
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
                      <button onClick={() => setActiveTool(activeTool === "give" ? null : "give")} className="inline-flex items-center gap-2 rounded-full bg-red-800 px-4 py-1 text-xs font-semibold text-white hover:bg-red-900 transition-colors shadow-sm">
                        Support Outreach
                      </button>
                    </div>
                  </div>
                </div>

                {activeTool && (
                  <div className="border-t border-black/10 bg-gray-50 text-black">
                    <div className="flex flex-wrap items-center gap-2 border-b border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/50 bg-gray-100">
                      {TOOL_TABS.map((tool) => (
                        <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={`rounded-full px-3 py-1 transition-colors ${activeTool === tool.key ? "bg-red-800 text-white" : "bg-white text-black hover:bg-gray-200"}`}>
                          {tool.label}
                        </button>
                      ))}
                      <button onClick={() => setActiveTool(null)} className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200 transition-colors">
                        Close Tools
                      </button>
                    </div>

                    {activeTool === "bible" && <BibleTool />}
                    {activeTool === "chat" && <div className="h-[400px] w-full bg-white"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Crusade Live'} /></div>}
                    {activeTool === "notepad" && <NotepadTool />}
                    {activeTool === "testimony" && <div className="px-5 py-6"><TestimonyTool /></div>}
                    {activeTool === "give" && <div className="px-5 py-6"><ROHGiveTool isMobile={false} /></div>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 6. ALL EVENTS SECTION (Cycling Grid) */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 text-black overflow-hidden border-y border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 mb-10 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Crusades & Conferences</h2>
                  <p className="text-black/60 max-w-xl">See where Pastor Esau Banda and the team will be taking the Gospel next.</p>
                </div>
                <form onSubmit={handleEventSearch} className="flex w-full max-w-2xl items-center gap-3">
                  <label htmlFor="rivers-of-hope-event-search" className="sr-only">Search events</label>
                  <input
                    id="rivers-of-hope-event-search"
                    value={eventSearchInput}
                    onChange={(event) => setEventSearchInput(event.target.value)}
                    placeholder="Search crusades, dates, locations"
                    className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-black shadow-sm focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                  <button type="submit" className="rounded-full bg-red-800 px-5 py-3 text-sm font-semibold text-white hover:bg-red-900 transition">
                    Search
                  </button>
                  <button type="button" onClick={clearEventSearch} className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-black hover:bg-black/5 transition">
                    Clear
                  </button>
                </form>
              </div>

              {filteredEventItems.length === 0 ? (
                <div className="rounded-3xl border border-black/10 bg-white p-12 text-center">
                  <p className="text-xl font-semibold text-black">No crusades or conferences matched your search.</p>
                  <p className="mt-3 text-sm text-black/70">Try another keyword or clear the search to view all upcoming events.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <button 
                    onClick={() => setSelectedEvent(featuredGridEvent)}
                    className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group text-left w-full focus:outline-none focus:ring-4 focus:ring-red-800"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8">
                          <span className="bg-red-700 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3 flex items-center gap-2">
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

                  <div className="lg:col-span-1">
                    <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-red-200">
                      {remainingEvents.map((event) => (
                        <button 
                          key={event.id} 
                          onClick={() => setSelectedEvent(event)}
                          className="min-w-[280px] lg:min-w-full relative h-48 lg:h-[113px] rounded-xl overflow-hidden shadow-md border border-black/5 group text-left focus:outline-none focus:ring-2 focus:ring-red-800"
                        >
                          <Image 
                            src={event.image} 
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={swapImage('/hero/hero-store.jpg')}
                          />
                          <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                            <span className="text-red-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                              {event.type}
                            </span>
                            <h4 className="text-white text-sm font-semibold leading-tight mb-1 group-hover:underline underline-offset-2">{event.title}</h4>
                            <p className="text-white/60 text-[10px] truncate">{event.date}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 7. MINISTRY OUTREACHES */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black overflow-hidden border-b border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 mb-10 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Outreaches</h2>
                  <p className="text-black/60 max-w-xl">Highlights from our community-based outreaches and mission work.</p>
                </div>
                <form onSubmit={handleOutreachSearch} className="flex w-full max-w-2xl items-center gap-3">
                  <label htmlFor="rivers-of-hope-outreach-search" className="sr-only">Search outreaches</label>
                  <input
                    id="rivers-of-hope-outreach-search"
                    value={outreachSearchInput}
                    onChange={(event) => setOutreachSearchInput(event.target.value)}
                    placeholder="Search outreaches, titles, descriptions"
                    className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-black shadow-sm focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                  <button type="submit" className="rounded-full bg-red-800 px-5 py-3 text-sm font-semibold text-white hover:bg-red-900 transition">
                    Search
                  </button>
                  <button type="button" onClick={clearOutreachSearch} className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-black hover:bg-black/5 transition">
                    Clear
                  </button>
                </form>
              </div>

              {filteredOutreachItems.length === 0 ? (
                <div className="rounded-3xl border border-black/10 bg-gray-50 p-12 text-center">
                  <p className="text-xl font-semibold text-black">No outreaches matched your search.</p>
                  <p className="mt-3 text-sm text-black/70">Try another keyword or clear the search to view all outreaches.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  <button 
                    onClick={() => setSelectedOutreach(featuredGridOutreach)}
                    className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group text-left w-full focus:outline-none focus:ring-4 focus:ring-red-800"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={featuredGridOutreach.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        <Image 
                          src={featuredGridOutreach.image} 
                          alt={featuredGridOutreach.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8">
                          <span className="bg-[#b91c1c] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3 flex items-center gap-2">
                            <Flame className="w-4 h-4" />
                            {featuredGridOutreach.type}
                          </span>
                          <h3 className="text-white text-3xl md:text-4xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4">{featuredGridOutreach.title}</h3>
                          <p className="text-white/90 text-sm md:text-base font-medium flex items-center gap-2 mb-1">
                            <CalendarClock className="w-4 h-4" /> {featuredGridOutreach.date}
                          </p>
                          <p className="text-white/70 text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {featuredGridOutreach.location}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click for Details
                    </div>
                  </button>

                  <div className="lg:col-span-1">
                    <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-red-200">
                      {remainingOutreaches.map((outreach) => (
                        <button 
                          key={outreach.id} 
                          onClick={() => setSelectedOutreach(outreach)}
                          className="min-w-[280px] lg:min-w-full relative h-48 lg:h-[113px] rounded-xl overflow-hidden shadow-md border border-black/5 group text-left focus:outline-none focus:ring-2 focus:ring-red-800"
                        >
                          <Image 
                            src={outreach.image} 
                            alt={outreach.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={swapImage('/hero/hero-store.jpg')}
                          />
                          <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                            <span className="text-red-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                              {outreach.type}
                            </span>
                            <h4 className="text-white text-sm font-semibold leading-tight mb-1 group-hover:underline underline-offset-2">{outreach.title}</h4>
                            <p className="text-white/60 text-[10px] truncate">{outreach.date}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 8. PARTNERSHIP FORM */}
        <section className="relative py-24 bg-slate-50 overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-red-100/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-red-100/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr] items-start">
              <div className="space-y-8">
                <div>
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center rounded-full bg-red-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-800 mb-6 border border-red-200"
                  >
                    Rivers of Hope Partnership
                  </motion.span>
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6"
                  >
                    Request Support or Join the <span className="text-red-700">Movement</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-slate-600 leading-relaxed max-w-xl"
                  >
                    Complete the form to share your details with the Rivers of Hope desk. Your request will be securely processed and delivered to our dedicated team.
                  </motion.p>
                </div>

                <div className="grid gap-6">
                  {[
                    { icon: <Mail className="w-6 h-6" />, label: "Email Address", value: ministryInfo.email || "roh@piccworldwide.org" },
                    { icon: <MapPin className="w-6 h-6" />, label: "Location", value: ministryInfo.location?.replace('\n', ', ') || "Pentecost International Christian Centre (PICC) Along Kaunda Road, Near Best Oil Filling Station, Area 49 Post Office Box 31841 Lilongwe 3 Malawi" },
                    { icon: <HeartHandshake className="w-6 h-6" />, label: "What we receive", value: "Prayer support, financial partnership, media and volunteer requests, and crusade invitations." }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="group flex items-start gap-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-red-200"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center group-hover:bg-red-700 group-hover:text-white transition-colors">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 mb-1">{item.label}</p>
                        <p className="text-slate-600 leading-snug">{item.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-tr from-red-600/10 to-orange-600/10 rounded-[2.5rem] blur-2xl" />
                <form onSubmit={handleRohFormSubmit} className="relative bg-white rounded-[2rem] border border-slate-200 p-8 md:p-10 shadow-xl shadow-slate-200/50">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Partner with Us</h3>
                    <p className="text-slate-500 text-sm">Please fill in the information below to get started.</p>
                  </div>
                  
                  <div className="grid gap-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="space-y-2 text-sm font-semibold text-slate-900">
                        <span>Full Name</span>
                        <input
                          name="fullName"
                          value={rohFormData.fullName}
                          onChange={handleRohFormChange}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                          placeholder="Your full name"
                        />
                      </label>

                      <label className="space-y-2 text-sm font-semibold text-slate-900">
                        <span>Email Address</span>
                        <input
                          name="email"
                          type="email"
                          value={rohFormData.email}
                          onChange={handleRohFormChange}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                          placeholder="you@example.com"
                        />
                      </label>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="space-y-2 text-sm font-semibold text-slate-900">
                        <span>Phone Number</span>
                        <input
                          name="phone"
                          value={rohFormData.phone}
                          onChange={handleRohFormChange}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                          placeholder="+265 88 123 4567"
                        />
                      </label>

                      <label className="space-y-2 text-sm font-semibold text-slate-900">
                        <span>Location</span>
                        <input
                          name="location"
                          value={rohFormData.location}
                          onChange={handleRohFormChange}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                          placeholder="Your city or branch"
                        />
                      </label>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Info className="w-4 h-4 text-red-600" />
                        <span>Partnership Program</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {ROH_PROGRAM_OPTIONS.map((option) => (
                          <label key={option.key} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer transition-all ${rohFormData.programs[option.key] ? 'border-red-200 bg-red-50 text-red-900 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                            <input
                              type="checkbox"
                              name={`programs.${option.key}`}
                              checked={rohFormData.programs[option.key]}
                              onChange={handleRohFormChange}
                              className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="font-medium">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="space-y-2 text-sm font-semibold text-slate-900">
                        <span>Commitment Amount</span>
                        <input
                          name="amount"
                          value={rohFormData.amount}
                          onChange={handleRohFormChange}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                          placeholder="e.g. K 50,000"
                        />
                      </label>

                      <label className="space-y-2 text-sm font-semibold text-slate-900">
                        <span>Frequency</span>
                        <select
                          name="frequency"
                          value={rohFormData.frequency}
                          onChange={handleRohFormChange}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 appearance-none"
                        >
                          <option>Monthly</option>
                          <option>Quarterly</option>
                          <option>Biannually</option>
                          <option>Annually</option>
                        </select>
                      </label>
                    </div>

                    <label className="space-y-2 text-sm font-semibold text-slate-900">
                      <span>Volunteer Area</span>
                      <select
                        name="volunteerArea"
                        value={rohFormData.volunteerArea}
                        onChange={handleRohFormChange}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 appearance-none"
                      >
                        <option value="">Select an area of service</option>
                        {VOLUNTEER_AREAS.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                    </label>

                    {rohFormData.volunteerArea === 'Other' && (
                      <label className="space-y-2 text-sm font-semibold text-slate-900">
                        <span>Please specify what you have to offer</span>
                        <textarea
                          name="otherVolunteerArea"
                          value={rohFormData.otherVolunteerArea}
                          onChange={handleRohFormChange}
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 resize-none"
                          placeholder="How would you like to serve?"
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isRohSubmitting}
                    className="mt-8 flex w-full items-center justify-center rounded-xl bg-red-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-800 hover:shadow-red-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isRohSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : 'Submit Partnership Inquiry'}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

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
                  title={featuredVideo?.title || 'Rivers of Hope Live'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="flex-[1_1_60%] px-4 py-5 text-black overflow-y-auto bg-gray-50">
                <div className="mb-4 border-b border-black/10 pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-black/70">
                    {TOOL_TABS.map((tool) => (
                      <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={`rounded-full px-3 py-1 transition-colors ${activeTool === tool.key ? 'bg-red-800 text-white' : 'bg-white border border-black/10 text-black'}`}>
                        {tool.label}
                      </button>
                    ))}
                    <button onClick={() => setActiveTool(null)} className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">Close</button>
                  </div>
                </div>
                {activeEmbedTool && <div className="aspect-[4/3] w-full bg-white mb-4 rounded-xl overflow-hidden border border-black/10"><iframe className="h-full w-full" src={activeEmbedTool.url} title={activeEmbedTool.label} allow="clipboard-write; fullscreen" /></div>}
                {activeTool === "chat" && <div className="h-[300px] w-full bg-white mb-4 rounded-xl overflow-hidden border border-black/10"><LiveChat videoId={featuredVideo?.videoId || FALLBACK_HERO_ID} videoTitle={featuredVideo?.title || 'Live Broadcast'} /></div>}
                {activeTool === "bible" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><BibleTool /></div>}
                {activeTool === "notepad" && <div className="mb-4 bg-white rounded-xl overflow-hidden border border-black/10"><NotepadTool /></div>}
                {activeTool === "testimony" && <div className="px-4 py-5"><TestimonyTool /></div>}
                {activeTool === "give" && <div className="px-4 py-5"><ROHGiveTool isMobile={true} /></div>}
              </div>
            </div>
          </section>
        )}

        {/* 9. SUPPORT / PARTNER SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-gray-50 text-black">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">{ministryInfo.partnershipTitle || 'Partner With The Harvest'}</h2>
                  <div className="w-16 h-1 bg-red-800 mb-6 rounded-full" />
                  {partnershipParagraphs.map((paragraph, index) => (
                    <p key={`partnership-${index}`} className={`text-lg text-black/70 ${index < partnershipParagraphs.length - 1 ? 'mb-4' : 'mb-6'}`}>
                      {paragraph}
                    </p>
                  ))}
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
                    <h3 className="font-bold text-xl mb-4 text-red-900">Become a Crusade Partner</h3>
                    <div className="space-y-2 text-sm text-black/70">
                      {partnershipDetails.map((detail) => (
                        <p key={`${detail.label}-${detail.value}`}><strong>{detail.label}:</strong> {detail.value}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                  <Image 
                    src={toAssetUrl(ministryInfo.partnershipImageUrl) || '/hero/hero-1.jpg'} 
                    alt="Support the Crusade" 
                    fill 
                    className="object-cover"
                    onError={swapImage('/hero/hero-store.jpg')} 
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 10. NEWS SECTION */}
        {!mobilePlayerActive && (
          <NewsSection 
            title="Latest Crusade News"
            description="Stay updated with the latest happenings, testimonies, and reports from the Rivers of Hope team."
            items={RIVERS_OF_HOPE_NEWS_ITEMS}
            backgroundClassName="bg-white"
          />
        )}

        {/* 11. CONTACTS SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-slate-900 text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
                <p className="text-white/80 max-w-2xl mx-auto">
                  {ministryInfo.contactIntro || defaultInfo.contactIntro}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Mail className="w-10 h-10 mx-auto text-red-400 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Email Address</h3>
                  <a href={`mailto:${ministryInfo.email || 'roh@piccworldwide.org'}`} className="text-white/70 hover:text-white transition-colors break-all">
                    {ministryInfo.email || 'roh@piccworldwide.org'}
                  </a>
                </Card>

                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Globe className="w-10 h-10 mx-auto text-red-400 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Ministry Office</h3>
                  {(ministryInfo.location || 'Pentecost International Christian Centre (PICC) Along Kaunda Road, Near Best Oil Filling Station, Area 49 Post Office Box 31841 Lilongwe 3 Malawi').split('\n').map((line) => (
                    <p key={line} className="text-white/70">{line}</p>
                  ))}
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
