'use client';

import { useState, useEffect, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, apiUrl } from '@/lib/api';

type MinistryInfo = {
  name: string | null;
  motto: string | null;
  about: string | null;
  heroImageUrl: string | null;
  logoImageUrl: string | null;
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
  motto: 'Sharing hope and restoration with those behind bars.',
  about: `The Prison Ministry is driven by the compassion of Christ for the forgotten and the marginalized. We believe that no life is beyond the reach of God's grace and that true restoration is possible for everyone.

Our volunteers visit correctional facilities to provide spiritual guidance, counseling, and practical support. We are committed to walking with individuals during their incarceration and assisting them as they transition back into their families and communities.`,
  heroImageUrl: '/hero/prison-ministry-1.jpg',
  logoImageUrl: '/logo.png',
};

const galleryImages = [
  '/hero/prison-ministry-1.jpg',
  '/moments/pm-1.jpg',
  '/moments/pm-2.jpg',
  '/moments/pm-3.jpg',
  '/moments/pm-4.jpg',
  '/moments/pm-5.jpg',
];

const defaultFieldPictures: MinistryItem[] = galleryImages.map((image, index) => ({
  id: `default-field-picture-${index + 1}`,
  category: 'field-picture',
  title: `Field Picture ${index + 1}`,
  description: 'Ministry in the field',
  label: null,
  imageUrl: image,
  sortOrder: index,
}));

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

const defaultOutreaches: MinistryItem[] = pastEvents.map((event, index) => ({
  id: `default-outreach-${event.id}`,
  category: 'outreach',
  title: event.title,
  description: event.description,
  label: event.date,
  imageUrl: event.image,
  sortOrder: index,
}));

export default function PrisonMinistryPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [ministryInfo, setMinistryInfo] = useState<MinistryInfo>(defaultInfo);
  const [ministryItems, setMinistryItems] = useState<MinistryItem[]>([]);

  const itemGroups = {
    fieldPictures: ministryItems.filter((item) => item.category === 'field-picture'),
    outreaches: ministryItems.filter((item) => item.category === 'outreach'),
  };
  const fieldPictures = mergeItemsWithFallback(itemGroups.fieldPictures, defaultFieldPictures);
  const galleryItems = fieldPictures.map((item, index) => ({
    id: index + 1,
    src: toAssetUrl(item.imageUrl) || galleryImages[index % galleryImages.length] || '/hero/hero-store.jpg',
    caption: item.description || item.title,
  }));
  const outreachItems = mergeItemsWithFallback(itemGroups.outreaches, defaultOutreaches).map((item, index) => ({
    id: index + 1,
    title: item.title,
    date: item.label || 'Past Outreach',
    description: item.description || '',
    image: toAssetUrl(item.imageUrl) || pastEvents[index % pastEvents.length]?.image || '/hero/hero-store.jpg',
  }));
  const mandateParagraphs = (ministryInfo.about || defaultInfo.about || '').split(/\n{2,}/).filter(Boolean);

  useEffect(() => {
    let isMounted = true;

    const loadMinistryContent = async () => {
      try {
        const response = await apiFetch('/api/ministries/prison-ministry/content');
        if (!response.ok) return;
        const data = await response.json().catch(() => ({}));
        if (!isMounted) return;

        if (data?.info) {
          setMinistryInfo({
            ...defaultInfo,
            ...data.info,
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

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % outreachItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [outreachItems.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % outreachItems.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? outreachItems.length - 1 : prev - 1));

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        
        {/* 1. HERO SECTION (Original Blue Radial Gradient) */}
        <section
          className="relative z-10 overflow-hidden rounded-b-[36px] bg-[#1E3A5F] pt-28 pb-20 text-white shadow-lg sm:pt-36 sm:pb-28 md:rounded-b-[48px]"
          style={{
            backgroundImage: `linear-gradient(rgba(30,58,95,0.8), rgba(45,90,140,0.74)), url(${toAssetUrl(ministryInfo.heroImageUrl) || '/hero/prison-ministry-1.jpg'})`,
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

        {/* 3. GALLERY SECTION (Soft Blue/Slate) */}
        <section className="py-20 md:py-28 bg-slate-50 border-y border-black/5 text-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ministry in the Field</h2>
              <p className="text-black/60 max-w-2xl mx-auto">Moments of impact, service, and connection within the correctional system.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {galleryItems.map((item) => (
                <div key={item.id} className="relative h-48 md:h-72 bg-slate-200 rounded-xl overflow-hidden group">
                  <Image 
                    src={item.src} 
                    alt={item.caption || `Prison Ministry Gallery Image ${item.id}`} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    onError={swapImage('/hero/hero-store.jpg')} 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-[#2D5A8C]/10 transition-colors duration-300" />
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
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Past Outreaches</h2>
                <p className="text-black/60 max-w-xl">A look back at our efforts to bring light into dark places.</p>
              </div>
              
              <div className="hidden md:flex gap-3 mt-6 md:mt-0">
                <button onClick={prevSlide} className="p-3 rounded-full bg-white shadow-sm border border-black/5 hover:bg-[#2D5A8C] hover:text-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextSlide} className="p-3 rounded-full bg-white shadow-sm border border-black/5 hover:bg-[#2D5A8C] hover:text-white transition-colors">
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
                      <div className="relative w-full sm:w-1/2 h-48 sm:h-full bg-slate-100 flex-shrink-0">
                        <Image 
                          src={outreachItems[currentSlide]?.image || outreachItems[0]?.image || '/hero/hero-store.jpg'} 
                          alt={outreachItems[currentSlide]?.title || 'Prison Ministry Outreach'} 
                          fill 
                          className="object-cover"
                          onError={swapImage('/hero/hero-store.jpg')}
                        />
                      </div>
                      
                      <div className="p-8 sm:p-10 flex flex-col justify-center w-full sm:w-1/2">
                        <div className="flex items-center gap-2 text-[#2D5A8C] font-semibold text-sm mb-4 bg-slate-50 w-fit px-3 py-1 rounded-full">
                          <CalendarDays className="w-4 h-4" />
                          <span>{outreachItems[currentSlide]?.date || outreachItems[0]?.date}</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                          {outreachItems[currentSlide]?.title || outreachItems[0]?.title}
                        </h3>
                        <p className="text-black/60 leading-relaxed">
                          {outreachItems[currentSlide]?.description || outreachItems[0]?.description}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex md:hidden items-center justify-center gap-6 mt-8">
                <button onClick={prevSlide} className="p-2 rounded-full bg-white shadow hover:bg-slate-50">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {outreachItems.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-[#2D5A8C]' : 'w-2 bg-black/20'}`}
                    />
                  ))}
                </div>
                <button onClick={nextSlide} className="p-2 rounded-full bg-white shadow hover:bg-slate-50">
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
