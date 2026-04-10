'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CalendarDays, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MOCK DATA ---
const galleryImages = [
  '/images/youth-church/img-1.jpg',
  '/images/youth-church/img-2.jpg',
  '/images/youth-church/img-3.jpg',
  '/images/youth-church/img-4.jpg',
  '/images/youth-church/img-5.jpg',
  '/images/youth-church/img-6.jpg',
];

const pastEvents = [
  {
    id: 1,
    title: '2025 Lake Retrea',
    date: '28 - 30, August, 2026',
    description: 'A trip to the lake to reset have fun and encounter the word',
    image: '/images/youth-church/img-7.jpg',
  },
  {
    id: 2,
    title: 'Inter-Church Sports Gala',
    date: 'March 28, 2026',
    description: 'Building community through competition. Our youth took home the trophy in the regional football tournament.',
    image: '/hero/hero-2.jpg',
  },
  {
    id: 3,
    title: 'Summer Youth Camp',
    date: 'August 5-10, 2025',
    description: 'Five days in the wilderness focusing on character building, deep prayer, and lasting friendships.',
    image: '/hero/hero-3.jpg',
  },
];

export default function YouthChurchMinistryPage() {
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
        
        {/* 1. HERO SECTION (Consistent Blue Radial) */}
        <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)] text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            
            {/* Logo */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
              <Image 
                src="/logos/youth-church-logo.png" 
                alt="Youth Church Logo" 
                fill 
                className="object-contain p-2 rounded-full"
                onError={(e: any) => e.target.src = 'public/logos/youth-church-logo.png'} 
              />
            </div>

            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">PICC Ministry</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">Youth Church Ministry</h1>
            
            {/* Motto / Slogan */}
            <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
              <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                "Helping young people grow in Christ and community."
              </p>
            </div>
          </div>
        </section>

        {/* 2. ABOUT SECTION (White) */}
        <section className="py-20 md:py-28 bg-white text-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">The Next Generation</h2>
            <div className="w-16 h-1 bg-[#FFD700] mx-auto mb-8 rounded-full" />
            <p className="text-lg text-black/70 leading-relaxed mb-6">
              The Youth Church at PICC is a vibrant community where teenagers and young adults can experience God in a way that is relevant to their lives. We believe that young people are not just the leaders of tomorrow, but the influencers of today.
            </p>
            <p className="text-lg text-black/70 leading-relaxed">
              Our services are packed with high-energy worship, creative expressions, and transparent conversations about the issues young people face—from mental health and career choices to identity and spiritual growth.
            </p>
          </div>
        </section>

        {/* 3. GALLERY SECTION (Soft Yellow/Cream) */}
        <section className="py-20 md:py-28 bg-amber-50 border-y border-black/5 text-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Youth Life</h2>
              <p className="text-black/60 max-w-2xl mx-auto">Vibrant moments of energy, fun, and sincere devotion.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {galleryImages.map((src, index) => (
                <div key={index} className="relative h-48 md:h-72 bg-amber-100 rounded-xl overflow-hidden group">
                  <Image 
                    src={src} 
                    alt={`Youth Gallery Image ${index + 1}`} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    onError={(e: any) => e.target.src = '/hero/hero-store.jpg'} 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-[#FFD700]/10 transition-colors duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. PAST EVENTS CAROUSEL (Light Gray) */}
        <section className="py-20 md:py-28 bg-gray-50 text-black overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Highlights</h2>
                <p className="text-black/60 max-w-xl">Check out some of the epic things we've done recently.</p>
              </div>
              
              <div className="hidden md:flex gap-3 mt-6 md:mt-0">
                <button onClick={prevSlide} className="p-3 rounded-full bg-white shadow-sm border border-black/5 hover:bg-black hover:text-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextSlide} className="p-3 rounded-full bg-white shadow-sm border border-black/5 hover:bg-black hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

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
                    <Card className="flex flex-col sm:flex-row h-full overflow-hidden border-0 shadow-xl bg-white">
                      <div className="relative w-full sm:w-1/2 h-48 sm:h-full bg-amber-50 flex-shrink-0">
                        <Image 
                          src={pastEvents[currentSlide].image} 
                          alt={pastEvents[currentSlide].title} 
                          fill 
                          className="object-cover"
                          onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                        />
                      </div>
                      
                      <div className="p-8 sm:p-10 flex flex-col justify-center w-full sm:w-1/2">
                        <div className="flex items-center gap-2 text-[#C6A300] font-semibold text-sm mb-4 bg-amber-50 w-fit px-3 py-1 rounded-full">
                          <Rocket className="w-4 h-4" />
                          <span>{pastEvents[currentSlide].date}</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                          {pastEvents[currentSlide].title}
                        </h3>
                        <p className="text-black/60 leading-relaxed">
                          {pastEvents[currentSlide].description}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex md:hidden items-center justify-center gap-6 mt-8">
                <button onClick={prevSlide} className="p-2 rounded-full bg-white shadow hover:bg-amber-50">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {pastEvents.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-black' : 'w-2 bg-black/20'}`}
                    />
                  ))}
                </div>
                <button onClick={nextSlide} className="p-2 rounded-full bg-white shadow hover:bg-amber-50">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}