'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CalendarDays, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MOCK DATA ---
const galleryImages = [
  '/hero/hero-icd.jpg',
  '/moments/icd-1.jpg',
  '/moments/icd-2.jpg',
  '/moments/icd-3.jpg',
  '/moments/icd-4.jpg',
  '/moments/icd-5.jpg',
];

const pastEvents = [
  {
    id: 1,
    title: 'Discipleship Intensive 2025',
    date: 'January 15 - February 20, 2025',
    description: 'A 6-week foundational course designed to root believers in the core doctrines of faith and effective Christian living.',
    image: '/hero/hero-1.jpg',
  },
  {
    id: 2,
    title: 'Marketplace Apostles Summit',
    date: 'April 22, 2025',
    description: 'Equipping professionals to take the principles of the Kingdom into their various spheres of influence and industry.',
    image: '/hero/hero-2.jpg',
  },
  {
    id: 3,
    title: 'School of Ministry Graduation',
    date: 'June 30, 2025',
    description: 'Celebrating the latest cohort of leaders who have successfully completed their intentional development modules.',
    image: '/hero/hero-3.jpg',
  },
];

export default function IcdMinistryPage() {
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
        
        {/* 1. HERO SECTION (#045BB4 Radial) */}
        <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-[radial-gradient(circle_at_top,#1A75D1_0%,#045BB4_45%,#033D7A_100%)] text-white rounded-b-[36px] md:rounded-b-[48px] shadow-lg z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            
            {/* Logo Placeholder */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-white rounded-full p-2 shadow-xl border-4 border-white/20">
              <Image 
                src="/logos/icd-logo.png" 
                alt="ICD Logo" 
                fill 
                className="object-contain p-2 rounded-full"
                onError={(e: any) => e.target.src = '/logos/picc-logo.png'} 
              />
            </div>

            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3 font-semibold">PICC Ministry</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">ICD</h1>
            
            {/* Motto / Slogan */}
            <div className="inline-block border-y border-white/20 py-3 px-8 mb-6">
              <p className="text-lg sm:text-xl font-medium tracking-wide text-white/90 italic">
                "Raising leaders and disciples through intentional Christian development.""
              </p>
            </div>
          </div>
        </section>

        {/* 2. ABOUT SECTION (White) */}
        <section className="py-20 md:py-28 bg-white text-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Intercession, Counselling, and Deliverance (ICD) </h2>
            <div className="w-16 h-1 bg-[#045BB4] mx-auto mb-8 rounded-full" />
            <p className="text-lg text-black/70 leading-relaxed mb-6">
              ICD is an intecessory ministry arm of PICC aimed at women. Our goal is to move believers from being mere spectators to becoming active, effective disciples of Jesus Christ who are capable of leading others.
            </p>
            <p className="text-lg text-black/70 leading-relaxed">
              We provide structured modules covering biblical foundations, leadership development, and practical ministry skills. By combining sound doctrine with practical application, ICD ensures that every member is thoroughly equipped for every good work.
            </p>
          </div>
        </section>

        {/* 3. GALLERY SECTION (Soft Blue/Azure) */}
        <section className="py-20 md:py-28 bg-blue-50 border-y border-black/5 text-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">The Learning Experience</h2>
              <p className="text-black/60 max-w-2xl mx-auto">Capturing the journey of growth, study, and transformation within our modules.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {galleryImages.map((src, index) => (
                <div key={index} className="relative h-48 md:h-72 bg-blue-100 rounded-xl overflow-hidden group">
                  <Image 
                    src={src} 
                    alt={`ICD Gallery Image ${index + 1}`} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    onError={(e: any) => e.target.src = '/hero/hero-store.jpg'} 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-[#045BB4]/10 transition-colors duration-300" />
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
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Past Seminars & Courses</h2>
                <p className="text-black/60 max-w-xl">A record of our commitment to continuous spiritual and leadership development.</p>
              </div>
              
              <div className="hidden md:flex gap-3 mt-6 md:mt-0">
                <button onClick={prevSlide} className="p-3 rounded-full bg-white shadow-sm border border-black/5 hover:bg-[#045BB4] hover:text-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextSlide} className="p-3 rounded-full bg-white shadow-sm border border-black/5 hover:bg-[#045BB4] hover:text-white transition-colors">
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
                      <div className="relative w-full sm:w-1/2 h-48 sm:h-full bg-blue-50 flex-shrink-0">
                        <Image 
                          src={pastEvents[currentSlide].image} 
                          alt={pastEvents[currentSlide].title} 
                          fill 
                          className="object-cover"
                          onError={(e: any) => e.target.src = '/hero/hero-store.jpg'}
                        />
                      </div>
                      
                      <div className="p-8 sm:p-10 flex flex-col justify-center w-full sm:w-1/2">
                        <div className="flex items-center gap-2 text-[#045BB4] font-semibold text-sm mb-4 bg-blue-50 w-fit px-3 py-1 rounded-full">
                          <BookOpen className="w-4 h-4" />
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
                <button onClick={prevSlide} className="p-2 rounded-full bg-white shadow hover:bg-blue-50">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {pastEvents.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-[#045BB4]' : 'w-2 bg-black/20'}`}
                    />
                  ))}
                </div>
                <button onClick={nextSlide} className="p-2 rounded-full bg-white shadow hover:bg-blue-50">
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