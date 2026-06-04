'use client';

import { useState, useEffect, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import NewsSection, { type NewsSectionItem } from '@/components/NewsSection';
import { 
  Mail, MapPin, Phone, Search, CalendarClock, XIcon, 
  Instagram, Facebook, Twitter 
} from 'lucide-react';

type PrisonEvent = {
  id: number;
  type: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
};
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, apiUrl } from '@/lib/api';

type MinistryInfo = {
  name: string | null;
  motto: string | null;
  about: string | null;
  heroImageUrl: string | null;
  logoImageUrl: string | null;
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

// --- MOCK DATA ---
const defaultInfo: MinistryInfo = {
  name: 'Prison Ministry',
  motto: 'From Prison to Purpose in Christ!',
  about: `To fulfill PICC’s mission of bringing hope to the hopeless, life to the dying, and helping them become true disciples of Jesus Christ through sharing the gospel of Jesus Christ with incarcerated people, restoring lives through discipleship, and supporting successful re-entry so they flourish as followers of Jesus Christ. Matthew 25:36`,
  heroImageUrl: '/ministries/prison/header.jpg',
  logoImageUrl: '/logo.png',
  phone: '+265 999 298 614',
  email: 'prison@piccworldwide.org',
  location: 'Camp of God Cathedral',
  contactIntro:
    'For prison outreach support, volunteer coordination, or ministry inquiries, please contact the Prison Ministry team.',
};

const pastEvents = [
  {
    id: 1,
    title: 'Christmas Hope Visit',
    date: 'December 24, 2025',
    description: 'A special outreach event providing holiday meals, hygiene kits, and a message of redemption to inmates.',
    image: '/hero/hero-1.jpg',
  },
  {
    id: 2,
    title: 'Restoration Workshop',
    date: 'March 15, 2026',
    description: 'A faith-based vocational training session designed to prepare individuals for successful reintegration into society.',
    image: '/hero/hero-2.jpg',
  },
  {
    id: 3,
    title: 'Families of the Incarcerated Support',
    date: 'May 20, 2025',
    description: 'A community gathering focused on providing emotional and spiritual support to the families of those currently serving time.',
    image: '/hero/hero-3.jpg',
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: 'Prison Ministry Conference 2026',
    date: 'July 12-14, 2026',
    description: 'A national gathering of prison ministry volunteers and leaders to share best practices and spiritual encouragement.',
    image: '/hero/hero-store.jpg',
  },
  {
    id: 2,
    title: 'Hope & Restoration Seminar',
    date: 'September 5, 2026',
    description: 'An intensive seminar focusing on the biblical principles of restoration and successful community reintegration.',
    image: '/hero/hero-2.jpg',
  },
  {
    id: 3,
    title: 'Families of Inmates Prayer Day',
    date: 'October 18, 2026',
    description: 'A day dedicated to praying for and supporting the families of those currently in correctional facilities.',
    image: '/hero/hero-1.jpg',
  },
];

const defaultOutreaches: MinistryItem[] = pastEvents.map((event, index) => ({
  id: `default-outreach-${event.id}`,
  category: 'outreach',
  title: event.title,
  description: event.description,
  label: event.date,
  imageUrl: event.image,
  sortOrder: index,
}));

const defaultEvents: MinistryItem[] = upcomingEvents.map((event, index) => ({
  id: `default-event-${event.id}`,
  category: 'event',
  title: event.title,
  description: event.description,
  label: event.date,
  imageUrl: event.image,
  sortOrder: index,
}));

export default function PrisonMinistryPage() {
  const [ministryInfo, setMinistryInfo] = useState<MinistryInfo>(defaultInfo);
  const [ministryItems, setMinistryItems] = useState<MinistryItem[]>([]);
  
  // State for Redesigned Outreaches section
  const [selectedOutreach, setSelectedOutreach] = useState<PrisonEvent | null>(null);
  const [featuredOutreachIndex, setFeaturedOutreachIndex] = useState(0);
  const [outreachSearchInput, setOutreachSearchInput] = useState('');
  const [outreachSearchQuery, setOutreachSearchQuery] = useState('');

  // State for new Events section
  const [selectedEvent, setSelectedEvent] = useState<PrisonEvent | null>(null);
  const [featuredEventIndex, setFeaturedEventIndex] = useState(0);
  const [eventSearchInput, setEventSearchInput] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  const outreachItems: PrisonEvent[] = mergeItemsWithFallback(
    ministryItems.filter((item) => item.category === 'outreach'),
    defaultOutreaches,
  ).map((item, index) => {
    const fallbackEvent = pastEvents[index % pastEvents.length];
    return {
      id: index + 1,
      type: 'Prison Outreach',
      title: item.title,
      date: item.label || 'Past Outreach',
      location: ministryInfo.location || defaultInfo.location || 'Correctional Facility',
      description: item.description || '',
      image: toAssetUrl(item.imageUrl) || fallbackEvent?.image || '/hero/hero-store.jpg',
    };
  });

  const eventItems: PrisonEvent[] = mergeItemsWithFallback(
    ministryItems.filter((item) => item.category === 'event'),
    defaultEvents,
  ).map((item, index) => {
    const fallbackEvent = upcomingEvents[index % upcomingEvents.length];
    return {
      id: index + 1,
      type: 'Ministry Event',
      title: item.title,
      date: item.label || 'Upcoming Event',
      location: 'Camp of God Cathedral',
      description: item.description || '',
      image: toAssetUrl(item.imageUrl) || fallbackEvent?.image || '/hero/hero-store.jpg',
    };
  });

  const normalizeSearchText = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  // Outreach Search Logic
  const normalizedOutreachSearchQuery = normalizeSearchText(outreachSearchQuery);
  const displayedOutreachItems = normalizedOutreachSearchQuery
    ? outreachItems.filter((event) => {
        const searchableText = normalizeSearchText([
          event.title, event.date, event.location, event.description
        ].join(' '));
        return searchableText.includes(normalizedOutreachSearchQuery);
      })
    : outreachItems;

  // Event Search Logic
  const normalizedEventSearchQuery = normalizeSearchText(eventSearchQuery);
  const displayedEventItems = normalizedEventSearchQuery
    ? eventItems.filter((event) => {
        const searchableText = normalizeSearchText([
          event.title, event.date, event.location, event.description
        ].join(' '));
        return searchableText.includes(normalizedEventSearchQuery);
      })
    : eventItems;

  const handleOutreachSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOutreachSearchQuery(outreachSearchInput.trim());
  };

  const clearOutreachSearch = () => {
    setOutreachSearchInput('');
    setOutreachSearchQuery('');
  };

  const handleEventSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEventSearchQuery(eventSearchInput.trim());
  };

  const clearEventSearch = () => {
    setEventSearchInput('');
    setEventSearchQuery('');
  };

  // Cycling effect for featured outreach
  useEffect(() => {
    if (!displayedOutreachItems.length) return;
    const timer = setInterval(() => {
      setFeaturedOutreachIndex((prev) => (prev + 1) % displayedOutreachItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayedOutreachItems.length]);

  useEffect(() => {
    setFeaturedOutreachIndex(0);
  }, [outreachSearchQuery]);

  // Cycling effect for featured event
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

  const fallbackGridEvent: PrisonEvent = {
    id: 0,
    type: 'Prison Ministry',
    title: 'Ministry Activity',
    date: 'Upcoming',
    location: 'Correctional Facility',
    description: 'Bringing hope and restoration to those in need.',
    image: '/ministries/prison/header.jpg',
  };

  const safeFeaturedOutreachIndex = displayedOutreachItems.length ? featuredOutreachIndex % displayedOutreachItems.length : 0;
  const featuredGridOutreach = displayedOutreachItems[safeFeaturedOutreachIndex] || fallbackGridEvent;
  const remainingOutreaches = displayedOutreachItems.filter((_, idx) => idx !== safeFeaturedOutreachIndex);

  const safeFeaturedEventIndex = displayedEventItems.length ? featuredEventIndex % displayedEventItems.length : 0;
  const featuredGridEvent = displayedEventItems[safeFeaturedEventIndex] || fallbackGridEvent;
  const remainingEvents = displayedEventItems.filter((_, idx) => idx !== safeFeaturedEventIndex);

  const mandateParagraphs = (ministryInfo.about || defaultInfo.about || '').split(/\n{2,}/).filter(Boolean);

  const PRISON_NEWS_ITEMS: NewsSectionItem[] = [
    {
      badge: "Ministry Update",
      date: "May 10, 2026",
      title: "Quarterly Outreach Impacts 500+ Inmates",
      description: "Our latest quarterly visit across regional facilities saw over 500 individuals reached with the Gospel and essential hygiene support.",
      image: "/hero/hero-1.jpg"
    },
    {
      badge: "Restoration",
      date: "April 22, 2026",
      title: "New Discipleship Program Launches",
      description: "We are excited to announce a new 12-week intensive discipleship curriculum specifically tailored for the incarcerated heart.",
      image: "/hero/hero-2.jpg"
    },
    {
      badge: "Success Story",
      date: "March 15, 2026",
      title: "Testimony of Transformation: A Life Reclaimed",
      description: "Read the powerful story of a former inmate who is now flourishing as a local community leader and follower of Christ.",
      image: "/hero/hero-store.jpg"
    }
  ];

  useEffect(() => {
    let isMounted = true;

    const loadMinistryContent = async () => {
      try {
        const response = await apiFetch('/api/ministries/prison-ministry/content');
        if (!response.ok) return;
        const data = await response.json().catch(() => ({}));
        if (!isMounted) return;

        if (data?.info) {
          // Omit 'about' from API data to prevent overwriting our new mandate
          const { about: _apiAbout, ...apiInfo } = data.info;
          setMinistryInfo({
            ...defaultInfo,
            ...apiInfo,
          });
        }

        if (Array.isArray(data?.items)) {
          setMinistryItems(data.items);
        }
      } catch {
        // Keep the built-in Prison Ministry content as the public fallback.
      }
    };

    void loadMinistryContent();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Navigation />

      {/* --- OUTREACH MODAL OVERLAY --- */}
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
                <span className="text-sm font-bold text-[#2D5A8C] uppercase tracking-wider mb-2">
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
                  <p className="text-sm font-bold text-gray-900 mb-3">MINISTRY CHANNELS:</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="https://facebook.com/piccworldwide" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#0c5bc6] text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                    <a href="https://instagram.com/piccworldwide" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                    <a href="https://twitter.com/piccworldwide" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Twitter className="w-4 h-4" /> X
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">MINISTRY CHANNELS:</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="https://facebook.com/piccworldwide" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#0c5bc6] text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                    <a href="https://instagram.com/piccworldwide" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen">
        
        {/* 1. HERO SECTION (Original Blue Radial Gradient) */}
        <section
          className="relative z-10 overflow-hidden rounded-b-[36px] bg-[#1E3A5F] pt-28 pb-20 text-white shadow-lg sm:pt-36 sm:pb-28 md:rounded-b-[48px]"
          style={{
            backgroundImage: `linear-gradient(rgba(30,58,95,0.8), rgba(45,90,140,0.74)), url(${toAssetUrl(ministryInfo.heroImageUrl) || '/ministries/prison/header.jpg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            
            {/* Logo */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
              <Image 
                src={toAssetUrl(ministryInfo.logoImageUrl) || '/logo.png'} 
                alt="Prison Ministry Logo" 
                fill 
                className="object-contain p-2 rounded-full"
                onError={swapImage('/logo.png')} 
              />
            </div>

            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">PICC Ministry</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">{ministryInfo.name || 'Prison Ministry'}</h1>
            
            {/* Mission Statement */}
            <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
              <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                &quot;{ministryInfo.motto || defaultInfo.motto}&quot;
              </p>
            </div>
          </div>
        </section>

        {/* 2. ABOUT SECTION (White) */}
        <section className="py-20 md:py-28 bg-white text-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mandate</h2>
            <div className="w-16 h-1 bg-[#2D5A8C] mx-auto mb-8 rounded-full" />
            {mandateParagraphs.map((paragraph, index) => (
              <p key={`mandate-${index}`} className={`text-lg text-black/70 leading-relaxed ${index < mandateParagraphs.length - 1 ? 'mb-6' : ''}`}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* 2.5 CORE VALUES SECTION (White) */}
        <section className="py-16 md:py-24 bg-white text-black border-t border-black/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Values</h2>
              <div className="w-16 h-1 bg-[#2D5A8C] mx-auto mb-6 rounded-full" />
              <p className="text-black/60 max-w-2xl mx-auto">
                Our ministry is built on these foundational principles that guide every interaction and outreach effort.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Christ-Centeredness",
                  desc: "We uphold Jesus Christ as the foundation of all we do.",
                  verse: "John 14:6"
                },
                {
                  title: "Compassion",
                  desc: "We serve inmates with love, dignity, and without judgement.",
                  verse: "Matthew 25:36"
                },
                {
                  title: "Transformation",
                  desc: "We believe in total life change through the power of the Gospel.",
                  verse: "2 Corinthians 5:17"
                },
                {
                  title: "Integrity",
                  desc: "We maintain honesty, accountability, and ethical conduct in ministry.",
                  verse: "Proverbs 10:9"
                },
                {
                  title: "Discipleship",
                  desc: "We are committed to nurturing spiritual growth and maturity.",
                  verse: "Matthew 28:19-20"
                },
                {
                  title: "Restoration",
                  desc: "We promote healing, forgiveness, and reintegration into society.",
                  verse: "Galatians 6:1"
                }
              ].map((value, idx) => (
                <div key={idx} className="group p-8 rounded-2xl bg-gray-50 border border-black/5 hover:border-[#2D5A8C]/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-8 bg-[#2D5A8C] rounded-full" />
                    <h3 className="text-xl font-bold text-[#1E3A5F]">{value.title}</h3>
                  </div>
                  <p className="text-black/70 mb-4 leading-relaxed">
                    {value.desc}
                  </p>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#2D5A8C]/60">
                    — {value.verse}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. PAST OUTREACHES SECTION (Light Gray) */}
        <section className="py-20 md:py-28 bg-gray-50 text-black overflow-hidden border-y border-black/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Past Outreaches</h2>
                <p className="text-black/60 max-w-xl">A look back at our efforts to bring light, hope, and the Gospel into dark places.</p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <form onSubmit={handleOutreachSearch} className="flex w-full items-center gap-2 sm:w-auto">
                  <input
                    type="search"
                    value={outreachSearchInput}
                    onChange={(event) => setOutreachSearchInput(event.target.value)}
                    placeholder="Search outreaches..."
                    className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#2D5A8C] focus:ring-2 focus:ring-[#2D5A8C]/15 sm:w-64"
                    aria-label="Search prison outreaches"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2D5A8C] px-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#2D5A8C]/30"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Search
                  </button>
                </form>
                {outreachSearchQuery && (
                  <button
                    type="button"
                    onClick={clearOutreachSearch}
                    className="text-xs font-semibold text-[#2D5A8C] hover:text-[#1E3A5F]"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>

            {displayedOutreachItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <button 
                  onClick={() => setSelectedOutreach(featuredGridOutreach)}
                  className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group text-left w-full focus:outline-none focus:ring-4 focus:ring-[#2D5A8C]"
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
                        <span className="bg-[#2D5A8C] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3 flex items-center gap-2">
                          <CalendarClock className="w-4 h-4" />
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

                <div className="flex gap-4 overflow-x-auto pb-4 lg:max-h-[500px] lg:flex-col lg:gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-thin scrollbar-thumb-[#2D5A8C]/30">
                  {remainingOutreaches.map((outreach) => (
                    <button 
                      key={outreach.id} 
                      onClick={() => setSelectedOutreach(outreach)}
                      className="relative h-48 w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-black/5 group text-left focus:outline-none focus:ring-2 focus:ring-[#2D5A8C] sm:w-72 lg:h-[113px] lg:w-full"
                    >
                      <Image 
                        src={outreach.image} 
                        alt={outreach.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={swapImage('/hero/hero-store.jpg')}
                      />
                      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                        <span className="text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                          {outreach.type}
                        </span>
                        <h4 className="text-white text-sm font-semibold leading-tight mb-1 group-hover:underline underline-offset-2">{outreach.title}</h4>
                        <p className="text-white/60 text-[10px] truncate">{outreach.date}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#2D5A8C]/25 bg-white p-8 text-center text-sm text-black/55">
                No prison outreaches found for this search.
              </div>
            )}
          </div>
        </section>

        {/* 3.5 UPCOMING EVENTS SECTION (White) */}
        <section className="py-20 md:py-28 bg-white text-black overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Events</h2>
                <p className="text-black/60 max-w-xl">Join us for conferences, seminars, and prayer days dedicated to prison ministry.</p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <form onSubmit={handleEventSearch} className="flex w-full items-center gap-2 sm:w-auto">
                  <input
                    type="search"
                    value={eventSearchInput}
                    onChange={(event) => setEventSearchInput(event.target.value)}
                    placeholder="Search events..."
                    className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none transition placeholder:text-black/35 focus:border-[#2D5A8C] focus:ring-2 focus:ring-[#2D5A8C]/15 sm:w-64"
                    aria-label="Search prison events"
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8">
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
                No prison events found for this search.
              </div>
            )}
          </div>
        </section>

        {/* 3.8 NEWS SECTION */}
        <NewsSection
          kicker="Prison Ministry updates"
          title="Latest News"
          description="Stay updated with the stories of restoration and transformation happening through our prison outreach efforts."
          items={PRISON_NEWS_ITEMS}
          backgroundClassName="bg-white text-black border-t border-black/5"
          maxItems={3}
        />

        {/* 4. CONTACTS SECTION */}
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
                <p className="text-white/70 whitespace-pre-line">
                  {ministryInfo.location || defaultInfo.location}
                </p>
              </Card>

              <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                <Phone className="w-10 h-10 mx-auto text-blue-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Phone</h3>
                <p className="text-white/70">
                  {ministryInfo.phone || defaultInfo.phone}
                </p>
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

      </main>
      <Footer />
    </>
  );
}
