'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const locations = [
  {
    name: 'PICC Headquarters',
    address: 'Area 49, Lilongwe, Malawi',
    district: 'Lilongwe',
    details: 'Main campus and administrative offices.',
    image: '/hero/hero-4.jpg',
    directionsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3086.6576842444136!2d33.7453956!3d-13.9240918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1921d5bac6745c93%3A0x8c408a3504600518!2sPICC%20Headquarters!5e0!3m2!1sen!2sus!4v1730985600000!5m2!1sen!2sus',
  },
  {
    name: 'PICC Blantyre',
    address: 'Blantyre, Malawi',
    district: 'Blantyre',
    details: 'Weekend services and community outreach.',
    image: '/hero/hero-3.jpg',
    directionsUrl: 'https://www.google.com/maps/dir/-15.911896,34.9530116/PICC+Blantyre+Central+Church,+Chirimba+Industrial+Area,+Chileka+Road,+Blantyre/@-15.8279659,34.9080129,12z/data=!3m1!4b1!4m9!4m8!1m1!4e1!1m5!1m1!1s0x18d8450025b58813:0x153845a2c8758ee3!2m2!1d35.0036706!2d-15.7538942?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
  },
  {
    name: 'PICC Mzuzu',
    address: 'Mzuzu, Malawi',
    district: 'Mzuzu',
    details: 'Sunday worship and weekly Bible study.',
    image: '/hero/hero-5.jpg',
    directionsUrl: '',
  },
];

export default function LocationsPage() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const familySlides = [
    ['/moments/1.jpg', '/moments/2.jpg', '/moments/3.jpg'],
    ['/moments/4.jpg', '/moments/5.jpg', '/moments/6.jpg'],
    ['/moments/7.jpg', '/moments/8.jpg', '/moments/9.jpg'],
  ];
  const extendedSlides = [
    familySlides[familySlides.length - 1],
    ...familySlides,
    familySlides[0],
  ];
  const [currentSlide, setCurrentSlide] = useState(1);
  const [slideTransition, setSlideTransition] = useState(true);

  const filteredLocations = useMemo(() => {
    const query = appliedSearch.trim().toLowerCase();
    if (!query) return locations;
    return locations.filter((location) =>
      location.district.toLowerCase().includes(query)
    );
  }, [appliedSearch]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white text-black">
        <section className="relative overflow-hidden py-36 md:py-48 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/hero/hero-2.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/35" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mt-32 md:mt-40">
              <div className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4 flex items-center gap-3">
                <a href="/" className="hover:text-white transition-colors">Home</a>
                <span className="text-white/50">/</span>
                <a href="/locations" className="hover:text-white transition-colors">Church Locations</a>
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold mb-4">Worship With Us</h1>
            </div>
          </div>
        </section>

        <section className="pt-16 md:pt-24 pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-semibold">All Locations</h2>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Search by district (e.g., Lilongwe)"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-full border-black/10 bg-white shadow-sm"
                />
                <Button
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setAppliedSearch(search)}
                >
                  Search
                </Button>
              </div>
              <p className="mt-3 text-xs text-black/60 text-center sm:text-left">
                Search by district name (e.g., Lilongwe, Blantyre, Mzuzu).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {filteredLocations.map((location) => (
                <Card key={location.name} className="bg-white text-black border-black/10 overflow-hidden">
                  <div className="relative h-56">
                    <Image src={location.image} alt={location.name} fill className="object-cover" />
                  </div>
                  <div className="px-6 pb-6">
                    <h3 className="text-lg font-semibold">{location.name}</h3>
                    <p className="text-sm text-black/70 mt-1">{location.address}</p>
                    <p className="text-sm text-black/60 mt-3">{location.details}</p>
                    {location.directionsUrl ? (
                      <Button asChild className="mt-5 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        <a href={location.directionsUrl} target="_blank" rel="noreferrer">
                          Get directions
                        </a>
                      </Button>
                    ) : (
                      <button
                        type="button"
                        className="mt-5 inline-flex items-center justify-center rounded-md bg-secondary/40 px-4 py-2 text-sm font-medium text-secondary-foreground/70 cursor-not-allowed"
                        disabled
                      >
                        Get directions
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* We Are Family Section */}
        <section className="py-20 md:py-28 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-black">We Are Family</h2>
              <p className="text-black/70 mt-2">Snapshots of life together.</p>
            </div>

            <div className="relative overflow-hidden w-full">
              <div
                className={slideTransition ? 'flex transition-transform duration-600' : 'flex'}
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                onTransitionEnd={() => {
                  if (currentSlide === 0) {
                    setSlideTransition(false);
                    setCurrentSlide(familySlides.length);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setSlideTransition(true));
                    });
                  } else if (currentSlide === extendedSlides.length - 1) {
                    setSlideTransition(false);
                    setCurrentSlide(1);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setSlideTransition(true));
                    });
                  }
                }}
              >
                {extendedSlides.map((slide, slideIndex) => (
                  <div key={slideIndex} className="min-w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {slide.map((src, idx) => (
                        <div key={`${src}-${idx}`} className="relative h-[22rem] md:h-[28rem]">
                          <Image
                            src={src}
                            alt="We are family moment"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => setCurrentSlide((s) => s - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => setCurrentSlide((s) => s + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
