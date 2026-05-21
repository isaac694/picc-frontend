'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { 
  MapPin, Phone, Mail, CalendarClock, Globe, 
  MessageSquareText, BookOpenText, StickyNote, 
  Flame, Users, GraduationCap, Tent, BookOpen, 
  XIcon, Facebook, Twitter, Instagram
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

// --- MOCK DATA ---
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

const highlightGallery = [
  { id: 1, src: '/hero/hero-1.jpg', caption: 'Mass open-air evangelism and soul-winning.' },
  { id: 2, src: '/hero/hero-2.jpg', caption: 'Equipping global leaders for end-time harvest.' },
  { id: 3, src: '/hero/hero-3.jpg', caption: 'Powerful moments of healing and deliverance.' },
  { id: 4, src: '/images/youth-church/img-4.jpg', caption: 'Campus Crusade: Empowering university students.' },
  { id: 5, src: '/images/youth-church/img-3.jpg', caption: 'Reaching the youth with the message of hope.' },
  { id: 6, src: '/hero/hero-store.jpg', caption: 'Fostering unity among churches and ministries.' },
];

const ministryProjects = [
  { id: 1, type: 'Crusade Preparation', title: 'Mzuzu Outreach Mobilization', status: 'Active', image: '/hero/hero-1.jpg' },
  { id: 2, type: 'Leadership Training', title: 'Pastors Empowerment Manuals', status: 'Ongoing', image: '/hero/hero-2.jpg' },
  { id: 3, type: 'Campus Discipleship', title: 'University Fellowship Networks', status: 'Active', image: '/images/youth-church/img-4.jpg' },
  { id: 4, type: 'Youth Mentorship', title: 'Secondary School Scripture Union Support', status: 'Ongoing', image: '/images/youth-church/img-3.jpg' },
  { id: 5, type: 'Community Impact', title: 'Post-Crusade Discipleship Centers', status: 'Planning', image: '/hero/hero-store.jpg' },
];

export default function RiversOfHopePage() {
  // --- STATE ---
  const [activeGalleryId, setActiveGalleryId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [featuredEventIndex, setFeaturedEventIndex] = useState(0);

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

  const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Africa/Blantyre" });
  };

  // --- CYCLING EVENTS EFFECT ---
  useEffect(() => {
    const timer = setInterval(() => {
      setFeaturedEventIndex((prev) => (prev + 1) % eventsList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const featuredGridEvent = eventsList[featuredEventIndex];
  const remainingEvents = eventsList.filter((_, idx) => idx !== featuredEventIndex);

  // --- EFFECTS ---
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
                  onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
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
                    <a href="mailto:roh@piccworldwide.org" className="flex items-center gap-2 bg-[#b91c1c] hover:bg-red-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                      <Mail className="w-4 h-4" /> Email Us
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
          <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-red-800 text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20 flex items-center justify-center overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="Rivers of Hope Logo" 
                  fill 
                  className="object-contain p-2"
                  onError={(e: any) => e.target.src = '/logo.png'}
                />
              </div>

              <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">Pastor Esau Banda Ministries</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">Rivers of Hope Crusades</h1>
              
              <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
                <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                  "Proclaiming the Gospel of Jesus Christ with power and clarity."
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
                <p className="text-lg text-black/70 leading-relaxed mb-6">
                  The Rivers of Hope Crusades are flagship evangelistic outreach programs led by Pastor Esau Banda across Malawi and internationally. These large-scale crusades are designed to proclaim the Gospel of Jesus Christ with power and clarity, reaching diverse communities through open-air gatherings and mass evangelism.
                </p>
                <p className="text-lg text-black/70 leading-relaxed">
                  Characterized by dynamic preaching, worship, healing, and deliverance sessions, we create an environment where individuals encounter genuine spiritual transformation. Beyond evangelism, the initiative also fosters unity among churches and serves as a catalyst for community revival and discipleship.
                </p>
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
                
                {/* Rivers of Hope Crusades */}
                <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-red-700 bg-white md:col-span-2 lg:col-span-1">
                  <div className="p-8">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Flame className="w-7 h-7 text-red-700" />
                    </div>
                    <h3 className="text-xl font-bold text-red-900 mb-3">Rivers of Hope Crusades</h3>
                    <p className="text-black/70 text-sm leading-relaxed">
                      Our flagship open-air mass evangelism gatherings designed to reach diverse communities with dynamic preaching, worship, healing, and deliverance sessions.
                    </p>
                  </div>
                  <div className="h-2 w-full bg-red-700/10 absolute bottom-0 left-0" />
                </Card>

                {/* International Interdenominational Conference */}
                <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-700 bg-white">
                  <div className="p-8">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Globe className="w-7 h-7 text-blue-700" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-900 mb-3">International Leaders Conference</h3>
                    <p className="text-black/70 text-sm leading-relaxed">
                      A global platform equipping pastors and church workers across denominations with spiritual impartation, leadership training, and strategic ministry insights.
                    </p>
                  </div>
                  <div className="h-2 w-full bg-blue-700/10 absolute bottom-0 left-0" />
                </Card>

                {/* Interdenominational Pastors Conference */}
                <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-emerald-600 bg-white">
                  <div className="p-8">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-900 mb-3">Local Leaders Conference</h3>
                    <p className="text-black/70 text-sm leading-relaxed">
                      Organized at regional and district levels, providing a contextualized platform to empower leaders with practical tools and promote unity within the Christian community.
                    </p>
                  </div>
                  <div className="h-2 w-full bg-emerald-600/10 absolute bottom-0 left-0" />
                </Card>

                {/* Campus Crusade */}
                <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-amber-500 bg-white md:col-span-1 lg:col-span-1 lg:col-start-1">
                  <div className="p-8">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-7 h-7 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-amber-800 mb-3">Campus Crusade</h3>
                    <p className="text-black/70 text-sm leading-relaxed">
                      Targeting university and college students to raise spiritually grounded young leaders through evangelism, discipleship, and integrating faith with academics.
                    </p>
                  </div>
                  <div className="h-2 w-full bg-amber-500/10 absolute bottom-0 left-0" />
                </Card>

                {/* Ministry to Youth */}
                <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-purple-600 bg-white md:col-span-1 lg:col-span-2">
                  <div className="p-8">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-7 h-7 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-purple-900 mb-3">Ministry to Youth</h3>
                    <p className="text-black/70 text-sm leading-relaxed">
                      Dedicated to reaching secondary school students with the transformative message of the Gospel, guiding young people in both their spiritual journey and academic development.
                    </p>
                  </div>
                  <div className="h-2 w-full bg-purple-600/10 absolute bottom-0 left-0" />
                </Card>

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
                {highlightGallery.map((item) => (
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
                      onError={(e: any) => e.target.src = '/hero/hero-store.jpg'} 
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
                    {activeTool === "give" && <div className="px-5 py-6"><GiveTool isMobile={false} /></div>}
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
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Crusades & Conferences</h2>
                  <p className="text-black/60 max-w-xl">See where Pastor Esau Banda and the team will be taking the Gospel next.</p>
                </div>
              </div>

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
                        onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
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

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                  {remainingEvents.map((event) => (
                    <button 
                      key={event.id} 
                      onClick={() => setSelectedEvent(event)}
                      className="relative h-48 lg:h-[113px] rounded-xl overflow-hidden shadow-md border border-black/5 group text-left w-full focus:outline-none focus:ring-2 focus:ring-red-800"
                    >
                      <Image 
                        src={event.image} 
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
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
          </section>
        )}

        {/* 7. MINISTRY PROJECTS */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-white text-black border-b border-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Strategic Discipleship</h2>
                  <p className="text-black/60 max-w-xl">How we ensure the harvest is preserved and leaders are continuously equipped.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-black/5 group">
                  <Image 
                    src={ministryProjects[0].image} 
                    alt={ministryProjects[0].title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                    <span className="bg-red-800 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full w-fit mb-3">
                      {ministryProjects[0].type}
                    </span>
                    <h3 className="text-white text-2xl md:text-3xl font-bold mb-1">{ministryProjects[0].title}</h3>
                    <p className="text-white/80 text-sm font-medium">Status: {ministryProjects[0].status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                  {ministryProjects.slice(1).map((material) => (
                    <div key={material.id} className="relative h-48 lg:h-[113px] rounded-xl overflow-hidden shadow-md border border-black/5 group">
                      <Image 
                        src={material.image} 
                        alt={material.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                      />
                      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-4">
                        <span className="text-red-300 text-[10px] font-bold uppercase tracking-wider mb-1">
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
                {activeTool === "give" && <div className="px-4 py-5"><GiveTool isMobile={true} /></div>}
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
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Partner With The Harvest</h2>
                  <div className="w-16 h-1 bg-red-800 mb-6 rounded-full" />
                  <p className="text-lg text-black/70 mb-4">
                    Taking the Gospel to the masses through open-air crusades and equipping international leaders requires significant resources and dedication.
                  </p>
                  <p className="text-lg text-black/70 mb-6">
                    When you partner with Rivers of Hope Crusades, you are directly contributing to soul-winning, community transformation, and raising up the next generation of spiritual leaders on campuses and in high schools.
                  </p>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
                    <h3 className="font-bold text-xl mb-4 text-red-900">Become a Crusade Partner</h3>
                    <div className="space-y-2 text-sm text-black/70">
                      <p>To support an upcoming crusade or sponsor a pastors' conference, please contact our international office for partnership details.</p>
                    </div>
                  </div>
                </div>
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                  <Image 
                    src="/hero/hero-1.jpg" 
                    alt="Support the Crusade" 
                    fill 
                    className="object-cover"
                    onError={(e: any) => e.target.src = '/hero/hero-store.jpg'} 
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 9. CONTACTS SECTION */}
        {!mobilePlayerActive && (
          <section className="py-20 bg-slate-900 text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
                <p className="text-white/80 max-w-2xl mx-auto">
                  For crusade invitations, conference details, or partnership inquiries, please contact our ministry desk.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Mail className="w-10 h-10 mx-auto text-red-400 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Email Address</h3>
                  <a href="mailto:roh@piccworldwide.org" className="text-white/70 hover:text-white transition-colors break-all">
                    roh@piccworldwide.org
                  </a>
                </Card>

                <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                  <Globe className="w-10 h-10 mx-auto text-red-400 mb-4" />
                  <h3 className="font-bold text-xl mb-2">Ministry Office</h3>
                  <p className="text-white/70">PICC Worldwide</p>
                  <p className="text-white/70">Rivers of Hope Desk</p>
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
