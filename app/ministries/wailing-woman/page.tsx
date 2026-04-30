'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { 
  ChevronLeft, ChevronRight, Waves, MapPin, 
  Phone, Mail, CalendarClock, BookOpen, Globe, 
  Target, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MOCK DATA FOR CAROUSEL ---
const pastEvents = [
  {
    id: 1,
    title: 'Midnight for Children Prayer Conference',
    date: 'Consecutive Days',
    description: 'Online midnight prayers running for several consecutive days, standing in the gap for the destinies of our children.',
    image: '/hero/hero-9-ww.jpg',
  },
  {
    id: 2,
    title: 'Ministry Launch',
    date: 'January 17, 2025',
    description: 'The official launch of our midnight prayers, which has now grown to over 2,500 members globally.',
    image: '/hero/hero-9-ww.jpg',
  },
];

export default function WailingWomenPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % pastEvents.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % pastEvents.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? pastEvents.length - 1 : prev - 1));

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        
        {/* 1. HERO SECTION */}
        <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-[radial-gradient(circle_at_top,#9333EA_0%,#6B21A8_45%,#4C1D95_100%)] text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
              <Image 
                src="/logos/wailing-woman-logo.png" 
                alt="Wailing Women Logo" 
                fill 
                className="object-contain p-2 rounded-full"
                onError={(e: any) => e.target.src = '/logos/wailing-woman-logo.png'} 
              />
            </div>

            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">My Seed Must Prosper</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">Wailing Woman</h1>
            
            <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
              <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                "Contending for the lives and destinies of our children through intensive warfare midnight prayers."
              </p>
            </div>
          </div>
        </section>

        {/* 2. ABOUT SECTION */}
        <section className="py-20 md:py-28 bg-white text-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About the Ministry</h2>
            <div className="w-16 h-1 bg-[#6B21A8] mx-auto mb-8 rounded-full" />
            <p className="text-lg text-black/70 leading-relaxed mb-6">
              The "Wailing Woman - My Seed Must Prosper!" is an interdenominational online warfare prayer ministry. It was founded by Pastor (Mrs.) Loyce Banda, the wife of Pastor Esau Banda, Senior Pastor of the Pentecost International Christian Centre (PICC). 
            </p>
            <p className="text-lg text-black/70 leading-relaxed">
              Inspired by God, the ministry awakens mothers globally to take up the responsibility of shaping and securing the glorious destinies of their children through corporate intensive midnight prayers. We seek to resist Satan's schemes against children and enforce victories over them through word-based warfare prayers and prophetic declarations.
            </p>
            <br/>
            <br/>
            <br/>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-t-4 border-t-[#6B21A8]">
                <Target className="w-12 h-12 mx-auto text-[#6B21A8] mb-4" />
                <h3 className="text-xl font-bold mb-2">Prosperity Arrows</h3>
                <p className="text-black/60">Weekly confessions for our children shared every Monday via WhatsApp, Telegram, and Facebook based on Job 22:28.</p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-t-4 border-t-[#6B21A8]">
                <BookOpen className="w-12 h-12 mx-auto text-[#6B21A8] mb-4" />
                <h3 className="text-xl font-bold mb-2">Weekly Devotional</h3>
                <p className="text-black/60">"My Seed Must Prosper" devotional is shared every second and fourth Thursday to empower mothers.</p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-t-4 border-t-[#6B21A8]">
                <MessageCircle className="w-12 h-12 mx-auto text-[#6B21A8] mb-4" />
                <h3 className="text-xl font-bold mb-2">Preparatory Prayers</h3>
                <p className="text-black/60">Prayers of salvation and repentance are shared mornings before midnight prayers to ensure right standing with God.</p>
              </Card>
            </div>
          </div>
          
        </section>

        {/* 3. HIGHLIGHTS SECTION */}
        <section className="py-20 bg-purple-50 border-y border-black/5 text-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry Highlights & Activities</h2>
              <p className="text-black/60 max-w-2xl mx-auto">Empowering women through sound teachings, preparatory prayers, and prophetic tools.</p>
            </div>
            

          </div>
        </section>

        {/* 4. EVENTS SECTION */}
        <section className="py-20 bg-white text-black overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Events & Meetings</h2>
                <p className="text-black/60 max-w-xl">Join us at the altar of prayer to contend for the next generation.</p>
              </div>
            </div>

            {/* Recurring Schedule Banner */}
            <div className="bg-[#6B21A8] text-white rounded-2xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between shadow-xl">
              <div className="flex items-center gap-4 mb-6 md:mb-0">
                <div className="p-4 bg-white/20 rounded-full">
                  <CalendarClock className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Midnight Warfare Prayers</h3>
                  <p className="text-white/80 mt-1">Every First and Third Thursdays of each month.</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-3xl font-black">11:30 PM - 01:00 AM</p>
                <p className="text-white/80 text-sm mt-1">Via Telegram, Facebook, and YouTube</p>
              </div>
            </div>

            {/* Events Carousel */}
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
                      <div className="relative w-full sm:w-1/2 h-48 sm:h-full bg-purple-50 flex-shrink-0">
                        <Image 
                          src={pastEvents[currentSlide]?.image || pastEvents[0].image} 
                          alt={pastEvents[currentSlide]?.title || 'Event Image'} 
                          fill 
                          className="object-cover"
                          onError={(e: any) => e.target.src = '/hero/hero-9-ww.jpg'}
                        />
                      </div>
                      <div className="p-8 sm:p-10 flex flex-col justify-center w-full sm:w-1/2">
                        <div className="flex items-center gap-2 text-[#6B21A8] font-semibold text-sm mb-4 bg-purple-50 w-fit px-3 py-1 rounded-full">
                          <Waves className="w-4 h-4" />
                          <span>{pastEvents[currentSlide]?.date || pastEvents[0].date}</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                          {pastEvents[currentSlide]?.title || pastEvents[0].title}
                        </h3>
                        <p className="text-black/60 leading-relaxed">
                          {pastEvents[currentSlide]?.description || pastEvents[0].description}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8">
                <button onClick={prevSlide} className="p-2 rounded-full bg-white shadow hover:bg-purple-50 border border-black/5">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextSlide} className="p-2 rounded-full bg-white shadow hover:bg-purple-50 border border-black/5">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. OUTREACH / PROJECT SECTION */}
        <section className="py-20 bg-gray-50 text-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Global Outreach Project</h2>
                <div className="w-16 h-1 bg-[#6B21A8] mb-6 rounded-full" />
                <p className="text-lg text-black/70 mb-4">
                  Launched on the 17th of January, 2025, our outreach has expanded rapidly. We now have over 2,500 members spanning across different countries. 
                </p>
                <p className="text-lg text-black/70 mb-6">
                  Our goal is to ensure that through this ministry, children accept Jesus Christ, walk in the fear of God, and enjoy success in their education, careers, and marriages. 
                </p>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
                  <h3 className="font-bold text-xl mb-4 text-[#6B21A8]">Support the Vision</h3>
                  <div className="space-y-2 text-sm text-black/70">
                    <p><strong>National Bank (Gateway Mall):</strong> 1012674801 <br/>(SWIFT: NBMAMWMW007)</p>
                    
                    <p><strong>Airtel Money:</strong> 0986337644 (Catherine Kulemeka)</p>
                    <p><strong>TNM Mpamba:</strong> 0882550238 (Catherine Kulemeka)</p>
                  </div>
                </div>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                <Image 
                  src="/hero/hero-9-ww.jpg" 
                  alt="Global Outreach" 
                  fill 
                  className="object-cover"
                  onError={(e: any) => e.target.src = '/hero/hero-9-ww.jpg'} 
                />
              </div>
            </div>
          </div>
        </section>

        {/* 6. NEWS SECTION */}
        <section className="py-20 bg-white text-black border-y border-black/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Globe className="w-12 h-12 mx-auto text-[#6B21A8] mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Latest News</h2>
            <p className="text-lg text-black/70 max-w-2xl mx-auto mb-8">
              The Wailing Woman WhatsApp Forum is now active! All ministry communications, including daily devotionals and prayer points, take place here. Secretariat now begins studio prayers at 22:00 hours prior to midnight sessions.
            </p>
          </div>
        </section>

        {/* 7. CONTACTS SECTION */}
        <section className="py-20 bg-purple-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Contact & Join Us</h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                If you are a mother or guardian ready to contend for your children, contact us to join our WhatsApp forum.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                <MapPin className="w-10 h-10 mx-auto text-purple-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Postal Address</h3>
                <p className="text-white/70"><strong>Wailing Woman</strong> <br/>My Seed Must Prosper!</p>
                <p className="text-white/70">P.O Box 31841, Lilongwe</p>
                <p className="text-white/70">Malawi, Central Africa</p>
              </Card>

              <Card className="bg-white/10 border-0 text-white p-8 text-center backdrop-blur-sm">
                <Phone className="w-10 h-10 mx-auto text-purple-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Phone</h3>
                <p className="text-white/70">+265 995 46 55 40</p>
                <p className="text-white/70">+265 999 31 77 81</p>
                <p className="text-white/70">+265 888 38 07 32</p>
              </Card>

              <Card className="bg-white/10 border-0 text-white p-7 text-center backdrop-blur-sm">
                <Mail className="w-10 h-10 mx-auto text-purple-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Email</h3>
                <p className="text-white/70 ">
                wailingwomanprayers@gmail.com
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