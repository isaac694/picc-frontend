'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { 
  MapPin, Phone, Mail, CalendarClock, Globe, 
  Baby, Smile, Palette, Music, BookOpen, XIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MOCK DATA FOR HERITAGE MINISTRY ---
const eventsList = [
  {
    id: 1,
    type: 'Weekly Service',
    title: 'Heritage Kids Sunday Service',
    date: 'Every Sunday | 8:30 AM & 10:30 AM',
    location: 'Children\'s Hall, Camp of God Cathedral',
    description: 'Join us every Sunday for a fun-filled time of worship, interactive Bible lessons, crafts, and games! We have dedicated activities tailored for all our Heritage Kids from ages 0 to 12.',
    image: '/hero/hero-store.jpg',
  },
  {
    id: 2,
    type: 'Upcoming Event',
    title: 'Vacation Bible School (VBS) 2026',
    date: 'August 10 - 14, 2026',
    location: 'PICC Main Campus',
    description: 'Our biggest event of the year! A five-day adventure where Heritage Kids explore the Bible through epic storytelling, team games, upbeat music, and creative arts. Open to ages 0-12.',
    image: '/images/youth-church/img-6.jpg',
  },
  {
    id: 3,
    type: 'Special Event',
    title: 'Children\'s Sunday Takeover',
    date: 'October 11, 2026',
    location: 'Main Auditorium',
    description: 'A special Sunday where the Heritage Kids lead the main church service! Prepare to be blessed by our Kids Choir, junior ushers, and young Bible readers.',
    image: '/hero/hero-3.jpg',
  },
  {
    id: 4,
    type: 'Past Event',
    title: 'Easter Stage Play',
    date: 'April 5, 2026',
    location: 'Children\'s Hall',
    description: 'Our amazing Heritage Kids put on a spectacular stage play demonstrating the true meaning of Easter. Thank you to all the parents who helped with costumes and rehearsals!',
    image: '/hero/hero-2.jpg',
  },
  {
    id: 5,
    type: 'Upcoming Activity',
    title: 'Family Fun Day & Picnic',
    date: 'December 5, 2026',
    location: 'Lilongwe Nature Sanctuary',
    description: 'A day for families to bond! We will have bouncy castles, face painting, sack races, and a massive picnic. A perfect time for parents and Heritage Kids to fellowship together.',
    image: '/hero/hero-1.jpg',
  },
];

const highlightGallery = [
  { id: 1, src: '/images/youth-church/img-6.jpg', caption: 'Interactive and fun Bible lessons.' },
  { id: 2, src: '/hero/hero-store.jpg', caption: 'Creative crafts and colorful art projects.' },
  { id: 3, src: '/hero/hero-3.jpg', caption: 'Joyful worship with the Heritage Kids Choir.' },
  { id: 4, src: '/images/youth-church/img-5.jpg', caption: 'Building friendships that last a lifetime.' },
  { id: 5, src: '/hero/hero-1.jpg', caption: 'Outdoor games and seasonal adventures.' },
  { id: 6, src: '/hero/hero-2.jpg', caption: 'Safe, loving, and nurturing environments.' },
];

export default function HeritageMinistryPage() {
  // --- STATE ---
  const [activeGalleryId, setActiveGalleryId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [featuredEventIndex, setFeaturedEventIndex] = useState(0);

  // --- CYCLING EVENTS EFFECT ---
  useEffect(() => {
    const timer = setInterval(() => {
      setFeaturedEventIndex((prev) => (prev + 1) % eventsList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const featuredGridEvent = eventsList[featuredEventIndex];
  const remainingEvents = eventsList.filter((_, idx) => idx !== featuredEventIndex);

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
                  src={selectedEvent.image} 
                  alt={selectedEvent.title}
                  fill
                  className="object-cover"
                  onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-gray-50">
                <span className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-2">
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
              <Image 
                src="/logo.png" 
                alt="Heritage Ministry Logo" 
                fill 
                className="object-contain p-2"
                onError={(e: any) => e.target.src = '/logo.png'}
              />
            </div>

            <p className="text-xs uppercase tracking-[0.35em] text-white/90 mb-3 font-bold drop-shadow-md">PICC Children's Church</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight drop-shadow-lg text-yellow-300">Heritage Ministry</h1>
            
            <div className="inline-block border-y border-white/30 py-3 px-8 mb-6 bg-black/10 rounded-3xl backdrop-blur-sm">
              <p className="text-lg sm:text-xl font-medium tracking-wide text-white italic">
                "Children are a heritage from the Lord..." — Psalm 127:3
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
              <p className="text-lg text-black/70 leading-relaxed mb-6">
                Welcome to the Heritage Ministry, the vibrant and energetic children's church of Pentecost International Christian Centre! We believe that no child is too young to experience the unconditional love and incredible power of God.
              </p>
              <p className="text-lg text-black/70 leading-relaxed">
                Our mission is to partner with parents in raising a Godly seed for the next generation. We provide a safe, loving, and highly interactive environment where children learn biblical truths through creative storytelling, lively music, arts and crafts, and engaging games.
              </p>
            </div>
          </div>
        </section>

        {/* 3. CORE FOCUS (Heritage Kids) */}
        <section className="py-20 bg-sky-50 border-y border-sky-100 text-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-sky-900">Heritage Kids (Ages 0 - 12)</h2>
              <p className="text-black/60 max-w-2xl mx-auto">Providing tailored, age-appropriate guidance to help young hearts grow closer to Jesus.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Nurture */}
              <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-yellow-400 bg-white">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Baby className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-black text-yellow-600 mb-3">Safe & Loving Environment</h3>
                  <p className="text-black/70 text-sm leading-relaxed">
                    A nurturing, fully secure setup where our youngest children encounter God’s love through interactive care, attention, and playful songs of worship.
                  </p>
                </div>
                <div className="h-2 w-full bg-yellow-400/20 absolute bottom-0 left-0" />
              </Card>

              {/* Discovery */}
              <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-orange-500 bg-white">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Smile className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-black text-orange-600 mb-3">Creative Scripture Discovery</h3>
                  <p className="text-black/70 text-sm leading-relaxed">
                    Bringing the scriptures to life! Our kids explore core Bible lessons using colorful crafts, vibrant visual illustrations, activities, and drama.
                  </p>
                </div>
                <div className="h-2 w-full bg-orange-500/20 absolute bottom-0 left-0" />
              </Card>

              {/* Growth */}
              <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-t-sky-500 bg-white">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-8 h-8 text-sky-500" />
                  </div>
                  <h3 className="text-xl font-black text-sky-600 mb-3">Spiritual Foundation</h3>
                  <p className="text-black/70 text-sm leading-relaxed">
                    Equipping pre-teens to drop anchor into God\'s Word, understand practical prayer, and develop structural character as they prepare for the Youth & Teens Ministry.
                  </p>
                </div>
                <div className="h-2 w-full bg-sky-500/20 absolute bottom-0 left-0" />
              </Card>

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
              {highlightGallery.map((item) => (
                <div 
                  key={item.id} 
                  className="relative h-48 md:h-64 bg-sky-100 rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md"
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
                        className="absolute inset-0 bg-sky-900/80 flex items-center justify-center p-6 text-center backdrop-blur-sm"
                      >
                        <p className="text-white font-bold text-lg sm:text-xl drop-shadow-md">
                          {item.caption}
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
                      src={featuredGridEvent.image} 
                      alt={featuredGridEvent.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sky-900/90 via-sky-900/30 to-transparent flex flex-col justify-end p-8">
                      <span className="bg-yellow-400 text-sky-900 text-xs font-black uppercase tracking-wider py-1.5 px-4 rounded-full w-fit mb-3 shadow-sm">
                        {featuredGridEvent.type}
                      </span>
                      <h3 className="text-white text-3xl md:text-5xl font-black mb-3 group-hover:text-yellow-200 transition-colors drop-shadow-md">{featuredGridEvent.title}</h3>
                      <p className="text-white text-sm md:text-base font-medium flex items-center gap-2 mb-1">
                        <CalendarClock className="w-5 h-5 text-yellow-300" /> {featuredGridEvent.date}
                      </p>
                      <p className="text-sky-100 text-sm flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-yellow-300" /> {featuredGridEvent.location}
                      </p>
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
                      src={event.image} 
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                    />
                    <div className="absolute inset-0 bg-sky-900/60 group-hover:bg-sky-900/40 transition-colors duration-300 flex flex-col justify-end p-4">
                      <span className="text-yellow-300 text-[10px] font-black uppercase tracking-wider mb-1">
                        {event.type}
                      </span>
                      <h4 className="text-white text-sm font-bold leading-tight mb-1 group-hover:text-yellow-200">{event.title}</h4>
                      <p className="text-sky-100 text-[11px] truncate font-medium">{event.date}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sky-900">Parent's Noticeboard</h2>
            <p className="text-lg text-black/70 max-w-2xl mx-auto mb-8 font-medium">
              Parents, please remember that check-in for all classes begins 15 minutes before the main church service starts. The new curriculum workbooks for Heritage Kids are now available at the children's welcome desk!
            </p>
          </div>
        </section>

        {/* 7. CONTACTS SECTION */}
        <section className="py-20 bg-sky-600 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-yellow-300">Get In Touch</h2>
              <p className="text-sky-100 max-w-2xl mx-auto text-lg font-medium">
                Have questions about our child security check-in policies, weekly curriculum, or how to register your children? We're here to help!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-sky-700/50 border-0 text-white p-8 text-center backdrop-blur-sm rounded-3xl">
                <MapPin className="w-12 h-12 mx-auto text-yellow-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Location</h3>
                <p className="text-sky-100 font-medium">Camp of God Cathedral</p>
                <p className="text-sky-100 font-medium">Area 49, Lilongwe</p>
              </Card>

              <Card className="bg-sky-700/50 border-0 text-white p-8 text-center backdrop-blur-sm rounded-3xl">
                <Phone className="w-12 h-12 mx-auto text-yellow-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Phone</h3>
                <p className="text-sky-100 font-medium">Contact the PICC Main Office</p>
              </Card>

              <Card className="bg-sky-700/50 border-0 text-white p-8 text-center backdrop-blur-sm rounded-3xl">
                <Mail className="w-12 h-12 mx-auto text-yellow-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Email</h3>
                <p className="text-sky-100 break-all font-medium">
                  heritage@piccworldwide.org
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