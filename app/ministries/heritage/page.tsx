'use client';

import { useState, useEffect, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { apiFetch, apiUrl } from '@/lib/api';
import { 
  MapPin, Phone, Mail, CalendarClock, Globe, 
  Baby, Smile, Palette, Music, BookOpen, XIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  type?: string | null;
  date?: string | null;
  location?: string | null;
  caption?: string | null;
};

type MinistryItemApiResponse = MinistryItem & {
  image?: string | null;
};

const toAssetUrl = (value: string | null | undefined) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const fallbackImageHandler = (fallbackSrc: string) => (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.src = fallbackSrc;
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

const defaultMinistryInfo: MinistryInfo = {
  name: 'Heritage Ministry',
  motto: 'Children are a heritage from the Lord...',
  about:
    'Welcome to the Heritage Ministry, the vibrant and energetic children\'s church of Pentecost International Christian Centre! We believe that no child is too young to experience the unconditional love and incredible power of God.\n\nOur mission is to partner with parents in raising a Godly seed for the next generation. We provide a safe, loving, and highly interactive environment where children learn biblical truths through creative storytelling, lively music, arts and crafts, and engaging games.',
  heroImageUrl: '/hero/hero-store.jpg',
  logoImageUrl: '/logo.png',
  liveSessionYoutubeUrl: null,
  partnershipTitle: 'Support Our Children',
  partnershipBody:
    'Our Heritage Ministry continues to grow, and we are always looking for ways to improve our learning environments and resources for our kids. Your support helps us provide better materials, safer facilities, and more engaging activities.',
  partnershipDetails: [],
  partnershipImageUrl: '/images/youth-church/img-6.jpg',
  phone: 'Contact the PICC Main Office',
  email: 'info@picc.org',
  location: 'Children\'s Hall\nCamp of God Cathedral',
  contactIntro:
    'Have questions about our child security check-in policies, weekly curriculum, or how to register your children? We\'re here to help!',
};

const defaultFocusAreas: MinistryItem[] = [
  {
    id: 'focus-1',
    category: 'focus',
    title: 'Safe & Loving Environment',
    description:
      'A nurturing, fully secure setup where our youngest children encounter God’s love through interactive care, attention, and playful songs of worship.',
    label: null,
    imageUrl: null,
    sortOrder: 0,
  },
  {
    id: 'focus-2',
    category: 'focus',
    title: 'Creative Scripture Discovery',
    description:
      'Bringing the scriptures to life! Our kids explore core Bible lessons using colorful crafts, vibrant visual illustrations, activities, and drama.',
    label: null,
    imageUrl: null,
    sortOrder: 1,
  },
  {
    id: 'focus-3',
    category: 'focus',
    title: 'Spiritual Foundation',
    description:
      'Equipping pre-teens to drop anchor into God\'s Word, understand practical prayer, and develop structural character as they prepare for the Youth & Teens Ministry.',
    label: null,
    imageUrl: null,
    sortOrder: 2,
  },
];

const defaultHighlightGallery: MinistryItem[] = [
  {
    id: 'highlight-1',
    category: 'highlight',
    title: 'Interactive and fun Bible lessons.',
    description: null,
    label: null,
    imageUrl: '/images/youth-church/img-6.jpg',
    sortOrder: 0,
  },
  {
    id: 'highlight-2',
    category: 'highlight',
    title: 'Creative crafts and colorful art projects.',
    description: null,
    label: null,
    imageUrl: '/hero/hero-store.jpg',
    sortOrder: 1,
  },
  {
    id: 'highlight-3',
    category: 'highlight',
    title: 'Joyful worship with the Heritage Kids Choir.',
    description: null,
    label: null,
    imageUrl: '/hero/hero-3.jpg',
    sortOrder: 2,
  },
  {
    id: 'highlight-4',
    category: 'highlight',
    title: 'Building friendships that last a lifetime.',
    description: null,
    label: null,
    imageUrl: '/images/youth-church/img-5.jpg',
    sortOrder: 3,
  },
  {
    id: 'highlight-5',
    category: 'highlight',
    title: 'Outdoor games and seasonal adventures.',
    description: null,
    label: null,
    imageUrl: '/hero/hero-1.jpg',
    sortOrder: 4,
  },
  {
    id: 'highlight-6',
    category: 'highlight',
    title: 'Safe, loving, and nurturing environments.',
    description: null,
    label: null,
    imageUrl: '/hero/hero-2.jpg',
    sortOrder: 5,
  },
];

const defaultEventItems: MinistryItem[] = [
  {
    id: 'event-1',
    category: 'event',
    title: 'Heritage Kids Sunday Service',
    description:
      'Join us every Sunday for a fun-filled time of worship, interactive Bible lessons, crafts, and games! We have dedicated activities tailored for all our Heritage Kids from ages 0 to 12.',
    label: 'Every Sunday | 8:30 AM & 10:30 AM',
    imageUrl: '/hero/hero-store.jpg',
    sortOrder: 0,
  },
  {
    id: 'event-2',
    category: 'event',
    title: 'Vacation Bible School (VBS) 2026',
    description:
      'Our biggest event of the year! A five-day adventure where Heritage Kids explore the Bible through epic storytelling, team games, upbeat music, and creative arts. Open to ages 0-12.',
    label: 'August 10 - 14, 2026',
    imageUrl: '/images/youth-church/img-6.jpg',
    sortOrder: 1,
  },
  {
    id: 'event-3',
    category: 'event',
    title: 'Children\'s Sunday Takeover',
    description:
      'A special Sunday where the Heritage Kids lead the main church service! Prepare to be blessed by our Kids Choir, junior ushers, and young Bible readers.',
    label: 'October 11, 2026',
    imageUrl: '/hero/hero-3.jpg',
    sortOrder: 2,
  },
  {
    id: 'event-4',
    category: 'event',
    title: 'Easter Stage Play',
    description:
      'Our amazing Heritage Kids put on a spectacular stage play demonstrating the true meaning of Easter. Thank you to all the parents who helped with costumes and rehearsals!',
    label: 'April 5, 2026',
    imageUrl: '/hero/hero-2.jpg',
    sortOrder: 3,
  },
  {
    id: 'event-5',
    category: 'event',
    title: 'Family Fun Day & Picnic',
    description:
      'A day for families to bond! We will have bouncy castles, face painting, sack races, and a massive picnic. A perfect time for parents and Heritage Kids to fellowship together.',
    label: 'December 5, 2026',
    imageUrl: '/hero/hero-1.jpg',
    sortOrder: 4,
  },
];

export default function HeritageMinistryPage() {
  // --- STATE ---
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MinistryItem | null>(null);
  const [featuredEventIndex, setFeaturedEventIndex] = useState(0);
  const [ministryInfo, setMinistryInfo] = useState<MinistryInfo>(defaultMinistryInfo);
  const [ministryItems, setMinistryItems] = useState<MinistryItem[]>([]);
  const [, setIsLoading] = useState(true);

  // --- CYCLING EVENTS EFFECT ---
  useEffect(() => {
    const timer = setInterval(() => {
      setFeaturedEventIndex((prev) => (prev + 1) % Math.max(1, ministryItems.filter((item) => item.category === 'event').length || defaultEventItems.length));
    }, 5000);
    return () => clearInterval(timer);
  }, [ministryItems]);

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await apiFetch('/api/ministries/heritage/content');
        const data = await response.json().catch(() => null);

        if (data?.info) {
          setMinistryInfo({
            ...defaultMinistryInfo,
            ...data.info,
          });
        }

        if (Array.isArray(data?.items)) {
          setMinistryItems(data.items.map((item: MinistryItemApiResponse) => ({
            ...item,
            imageUrl: item.imageUrl || item.image || null,
          })));
        }
      } catch (error) {
        console.error('Failed to load Heritage ministry content', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, []);

  const loadedEventItems = ministryItems.filter((item) => item.category === 'event');
  const loadedHighlightItems = ministryItems.filter((item) => item.category === 'highlight');
  const loadedFocusItems = ministryItems.filter((item) => item.category === 'focus');

  const focusAreas = mergeItemsWithFallback(loadedFocusItems, defaultFocusAreas);
  const highlightGalleryItems = mergeItemsWithFallback(loadedHighlightItems, defaultHighlightGallery);
  const eventList = mergeItemsWithFallback(loadedEventItems, defaultEventItems);
  const aboutParagraphs = (ministryInfo.about || defaultMinistryInfo.about || '').split(/\n{2,}/).filter(Boolean);
  const logoImageUrl = toAssetUrl(ministryInfo.logoImageUrl);

  const featuredGridEvent = eventList[featuredEventIndex % Math.max(1, eventList.length)];
  const remainingEvents = eventList.filter((_, idx) => idx !== featuredEventIndex % Math.max(1, eventList.length));

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

              <div className="relative w-full md:w-1/2 h-64 md:h-[500px] bg-sky-100">
                <Image 
                  src={toAssetUrl(selectedEvent.imageUrl) || toAssetUrl(selectedEvent.image) || '/hero/hero-store.jpg'} 
                  alt={selectedEvent.title}
                  fill
                  className="object-cover"
                  onError={fallbackImageHandler('/hero/hero-store.jpg')}
                />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-gray-50">
                <span className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-2">
                  {selectedEvent.type || selectedEvent.category || 'Event'}
                </span>
                <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                  {selectedEvent.title}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CalendarClock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 font-medium">{selectedEvent.label || selectedEvent.date || 'Date TBD'}</p>
                  </div>
                  {(selectedEvent.location || selectedEvent.description) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <p className="text-gray-700 font-medium">{selectedEvent.location || selectedEvent.description}</p>
                    </div>
                  )}
                </div>

                <div className="w-12 h-1 bg-sky-200 rounded-full mb-6" />

                <p className="text-gray-600 leading-relaxed mb-8">
                  {selectedEvent.description}
                </p>

                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">MORE INFO:</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="https://wa.me/265999000000" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Phone className="w-4 h-4" /> WhatsApp
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
        <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-sky-500 text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20 flex items-center justify-center overflow-hidden">
              {logoImageUrl ? (
                <Image
                  src={logoImageUrl}
                  alt={ministryInfo.name || 'Heritage Ministry Logo'}
                  fill
                  className="object-contain p-2"
                  onError={fallbackImageHandler('/logo.png')}
                />
              ) : null}
            </div>

            <p className="text-xs uppercase tracking-[0.35em] text-white/90 mb-3 font-bold drop-shadow-md">PICC Children&apos;s Church</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight drop-shadow-lg text-yellow-300">{ministryInfo.name || 'Heritage Ministry'}</h1>
            
            <div className="inline-block border-y border-white/30 py-3 px-8 mb-6 bg-black/10 rounded-3xl backdrop-blur-sm">
              <p className="text-lg sm:text-xl font-medium tracking-wide text-white italic">
                {ministryInfo.motto || '"Children are a heritage from the Lord..." — Psalm 127:3'}
              </p>
            </div>
          </div>
          
          {/* Background decorative elements */}
          <div className="absolute top-20 left-10 opacity-20"><Smile size={64} /></div>
          <div className="absolute bottom-20 right-10 opacity-20"><Palette size={64} /></div>
          <div className="absolute top-40 right-20 opacity-20"><Music size={48} /></div>
        </section>

        {/* 2. ABOUT THE MINISTRY */}
        <section className="py-20 md:py-28 bg-white text-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sky-800">Laying the Early Foundations of Faith</h2>
              <div className="w-20 h-2 bg-yellow-400 mx-auto mb-8 rounded-full" />
              <div className="space-y-6">
                {aboutParagraphs.map((paragraph) => (
                  <p key={paragraph} className="text-lg text-black/70 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. SUPPORT & PARTNERSHIP */}
        <section className="py-20 bg-sky-50 border-y border-sky-100 text-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-sm uppercase tracking-[0.35em] text-sky-600 font-bold">{ministryInfo.partnershipTitle || 'Support Our Children'}</span>
                <h2 className="text-4xl font-black text-sky-900 mt-4 mb-6">{ministryInfo.partnershipTitle || 'Partner with Heritage Ministry'}</h2>
                <p className="text-black/70 leading-relaxed text-lg">
                  {ministryInfo.partnershipBody || defaultMinistryInfo.partnershipBody}
                </p>
              </div>
              <div className="rounded-3xl overflow-hidden shadow-xl bg-white">
                <div className="relative h-72">
                  <Image
                    src={toAssetUrl(ministryInfo.partnershipImageUrl) || '/images/youth-church/img-6.jpg'}
                    alt={ministryInfo.partnershipTitle || 'Heritage Support'}
                    fill
                    className="object-cover"
                    onError={fallbackImageHandler('/images/youth-church/img-6.jpg')}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. CORE FOCUS (Heritage Kids) */}
        <section className="py-20 bg-sky-50 border-y border-sky-100 text-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-sky-900">Heritage Kids (Ages 0 - 12)</h2>
              <p className="text-black/60 max-w-2xl mx-auto">Providing tailored, age-appropriate guidance to help young hearts grow closer to Jesus.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {focusAreas.map((item, index) => {
                const icon = index === 0 ? (
                  <Baby className="w-8 h-8 text-yellow-600" />
                ) : index === 1 ? (
                  <Smile className="w-8 h-8 text-orange-500" />
                ) : (
                  <BookOpen className="w-8 h-8 text-sky-500" />
                );

                const borderClasses =
                  index === 0
                    ? 'border-t-4 border-t-yellow-400'
                    : index === 1
                    ? 'border-t-4 border-t-orange-500'
                    : 'border-t-4 border-t-sky-500';

                const accentClasses =
                  index === 0
                    ? 'text-yellow-600 bg-yellow-100'
                    : index === 1
                    ? 'text-orange-500 bg-orange-100'
                    : 'text-sky-500 bg-sky-100';

                const barClasses =
                  index === 0
                    ? 'bg-yellow-400/20'
                    : index === 1
                    ? 'bg-orange-500/20'
                    : 'bg-sky-500/20';

                return (
                  <Card key={item.id} className={`relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 ${borderClasses} bg-white`}>
                    <div className="p-8 text-center">
                      <div className={`w-16 h-16 ${accentClasses} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                        {icon}
                      </div>
                      <h3 className="text-xl font-black mb-3 text-slate-900">{item.title}</h3>
                      <p className="text-black/70 text-sm leading-relaxed">
                        {item.description || defaultMinistryInfo.partnershipBody}
                      </p>
                    </div>
                    <div className={`h-2 w-full ${barClasses} absolute bottom-0 left-0`} />
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. HERITAGE HIGHLIGHTS (6-Grid Gallery) */}
        <section className="py-20 bg-white text-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-sky-900">Kids in Action</h2>
              <p className="text-black/60 max-w-2xl mx-auto">Smiles, creativity, and worship from our amazing Heritage Kids.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {highlightGalleryItems.map((item) => (
                <div 
                  key={item.id} 
                  className="relative h-48 md:h-64 bg-sky-100 rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md"
                  onClick={() => setActiveGalleryId(activeGalleryId === item.id ? null : item.id)}
                >
                  <Image 
                    src={toAssetUrl(item.imageUrl) || '/hero/hero-store.jpg'} 
                    alt={item.title || `Gallery Highlight ${item.id}`} 
                    fill 
                    className={`object-cover transition-transform duration-700 ease-in-out ${activeGalleryId === item.id ? 'scale-110' : 'group-hover:scale-105'}`}
                    onError={fallbackImageHandler('/hero/hero-store.jpg')} 
                  />
                  
                  <AnimatePresence>
                    {activeGalleryId === item.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 bg-sky-900/80 flex items-center justify-center p-6 text-center backdrop-blur-sm"
                      >
                        <p className="text-white font-bold text-lg sm:text-xl drop-shadow-md">
                          {item.title}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={`absolute inset-0 bg-sky-500/20 transition-opacity duration-300 ${activeGalleryId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} />
                </div>
              ))}
            </div>
            <p className="text-center text-sky-600/70 font-medium text-sm mt-6">Click or tap any image to view details.</p>
          </div>
        </section>

        {/* 5. ALL EVENTS SECTION (Cycling Grid) */}
        <section className="py-20 bg-gray-50 text-black overflow-hidden border-y border-black/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-sky-900">Upcoming Fun & Events</h2>
                <p className="text-black/60 max-w-xl text-lg">Mark your calendars for these exciting activities designed just for kids!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <button 
                onClick={() => setSelectedEvent(featuredGridEvent)}
                className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-xl border border-sky-100 group text-left w-full focus:outline-none focus:ring-4 focus:ring-sky-400"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={featuredGridEvent.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <Image 
                      src={toAssetUrl(featuredGridEvent.imageUrl) || '/hero/hero-store.jpg'} 
                      alt={featuredGridEvent.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={fallbackImageHandler('/hero/hero-store.jpg')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sky-900/90 via-sky-900/30 to-transparent flex flex-col justify-end p-8">
                      <span className="bg-yellow-400 text-sky-900 text-xs font-black uppercase tracking-wider py-1.5 px-4 rounded-full w-fit mb-3 shadow-sm">
                        {featuredGridEvent.type || featuredGridEvent.category}
                      </span>
                      <h3 className="text-white text-3xl md:text-5xl font-black mb-3 group-hover:text-yellow-200 transition-colors drop-shadow-md">{featuredGridEvent.title}</h3>
                      <p className="text-white text-sm md:text-base font-medium flex items-center gap-2 mb-1">
                        <CalendarClock className="w-5 h-5 text-yellow-300" /> {featuredGridEvent.label || 'TBA'}
                      </p>
                      {featuredGridEvent.location && (
                        <p className="text-sky-100 text-sm flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-yellow-300" /> {featuredGridEvent.location}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="absolute top-6 right-6 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  Click for Info
                </div>
              </button>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                {remainingEvents.map((event) => (
                  <button 
                    key={event.id} 
                    onClick={() => setSelectedEvent(event)}
                    className="relative h-48 lg:h-[113px] rounded-2xl overflow-hidden shadow-md border border-sky-50 group text-left w-full focus:outline-none focus:ring-4 focus:ring-sky-300"
                  >
                    <Image 
                      src={toAssetUrl(event.imageUrl) || '/hero/hero-store.jpg'} 
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={fallbackImageHandler('/hero/hero-store.jpg')}
                    />
                    <div className="absolute inset-0 bg-sky-900/60 group-hover:bg-sky-900/40 transition-colors duration-300 flex flex-col justify-end p-4">
                      <span className="text-yellow-300 text-[10px] font-black uppercase tracking-wider mb-1">
                        {event.type || event.category}
                      </span>
                      <h4 className="text-white text-sm font-bold leading-tight mb-1 group-hover:text-yellow-200">{event.title}</h4>
                      <p className="text-sky-100 text-[11px] truncate font-medium">{event.label || 'TBA'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. NEWS SECTION */}
        <section className="py-20 bg-white text-black border-b border-black/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Globe className="w-12 h-12 mx-auto text-sky-500 mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sky-900">Parent&apos;s Noticeboard</h2>
            <p className="text-lg text-black/70 max-w-2xl mx-auto mb-8 font-medium">
              Parents, please remember that check-in for all classes begins 15 minutes before the main church service starts. The new curriculum workbooks for Heritage Kids are now available at the children&apos;s welcome desk!
            </p>
          </div>
        </section>

        {/* 7. CONTACTS SECTION */}
        <section className="py-20 bg-sky-600 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-yellow-300">Get In Touch</h2>
              <p className="text-sky-100 max-w-2xl mx-auto text-lg font-medium">
                {ministryInfo.contactIntro || defaultMinistryInfo.contactIntro}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-sky-700/50 border-0 text-white p-8 text-center backdrop-blur-sm rounded-3xl">
                <MapPin className="w-12 h-12 mx-auto text-yellow-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Location</h3>
                <p className="text-sky-100 font-medium whitespace-pre-line">{ministryInfo.location || defaultMinistryInfo.location}</p>
              </Card>

              <Card className="bg-sky-700/50 border-0 text-white p-8 text-center backdrop-blur-sm rounded-3xl">
                <Phone className="w-12 h-12 mx-auto text-yellow-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Phone</h3>
                <p className="text-sky-100 font-medium">{ministryInfo.phone || defaultMinistryInfo.phone}</p>
              </Card>

              <Card className="bg-sky-700/50 border-0 text-white p-8 text-center backdrop-blur-sm rounded-3xl">
                <Mail className="w-12 h-12 mx-auto text-yellow-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Email</h3>
                <p className="text-sky-100 break-all font-medium">{ministryInfo.email || defaultMinistryInfo.email}</p>
              </Card>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
