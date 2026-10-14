'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Phone, Search } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch, apiUrl } from '@/lib/api';
import {
  churchMatchesSearch,
  fetchPublicZonesWithChurches,
  isPlaceholderContact,
  type PublicZoneWithChurches,
} from '@/lib/public-home-churches';

function whatsappHref(phone: string) {
  const digits = phone.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.11 17.22c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.16-.43-2.22-1.37-.82-.73-1.37-1.64-1.53-1.91-.16-.27-.02-.42.12-.56.13-.13.27-.34.41-.5.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.02-.34-.02-.52-.02-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.26 0 1.33.98 2.61 1.12 2.79.14.18 1.93 2.95 4.69 4.13.66.28 1.17.45 1.57.58.66.21 1.27.18 1.74.11.53-.08 1.6-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z" />
      <path d="M27.2 4.8A15.48 15.48 0 0 0 16.07 0C7.2 0 0 7.2 0 16.07c0 2.83.74 5.58 2.14 8.01L0 32l8.23-2.09A15.99 15.99 0 0 0 16.07 32C24.94 32 32 24.8 32 15.93c0-4.27-1.66-8.28-4.8-11.13zM16.07 29.2c-2.49 0-4.93-.66-7.05-1.92l-.5-.3-4.87 1.23 1.3-4.74-.33-.5a13.09 13.09 0 0 1-2.06-7c0-7.25 5.89-13.14 13.14-13.14 3.5 0 6.79 1.36 9.27 3.84a13.02 13.02 0 0 1 3.87 9.26c0 7.25-5.92 13.27-13.77 13.27z" />
    </svg>
  );
}

const iconButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

function ContactActions({ phone }: { phone: string }) {
  if (isPlaceholderContact(phone)) return null;
  const tel = phone.replace(/\s+/g, '');
  const wa = whatsappHref(phone);
  if (!tel && !wa) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {tel ? (
        <a
          href={`tel:${tel}`}
          title="Call pastor"
          aria-label="Call pastor"
          className={`${iconButtonClass} text-green-600 hover:bg-green-50`}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
        </a>
      ) : null}
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          title="WhatsApp pastor"
          aria-label="WhatsApp pastor"
          className={`${iconButtonClass} text-[#25D366] hover:bg-[#25D366]/10`}
        >
          <WhatsAppIcon className="h-5 w-5" />
        </a>
      ) : null}
    </div>
  );
}

export default function HomeChurchesPage() {
  const [search, setSearch] = useState('');
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [zones, setZones] = useState<PublicZoneWithChurches[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [headerImage, setHeaderImage] = useState('/images/locations-header.png');

  const familySlides = [
    ['/moments/1.jpg', '/moments/2.jpg', '/moments/3.jpg'],
    ['/moments/4.jpg', '/moments/5.jpg', '/moments/6.jpg'],
    ['/moments/7.jpg', '/moments/8.jpg', '/moments/9.jpg'],
  ];
  const extendedSlides = [familySlides[familySlides.length - 1], ...familySlides, familySlides[0]];
  const [currentSlide, setCurrentSlide] = useState(1);
  const [slideTransition, setSlideTransition] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const data = await fetchPublicZonesWithChurches(search);
        if (cancelled) return;
        setZones(data);
        setActiveZoneId((prev) => {
          if (prev && data.some((zone) => zone.id === prev)) return prev;
          return data[0]?.id ?? null;
        });
      } catch {
        if (!cancelled) {
          setLoadError('Unable to load home churches right now. Please try again later.');
          setZones([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = window.setTimeout(load, search.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    const fetchHeader = async () => {
      try {
        const imageResponse = await apiFetch('/api/site-content/locations-header-bg');
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData.imageUrl) {
            setHeaderImage(apiUrl(imageData.imageUrl));
          }
        }
      } catch {
        // keep default hero image
      }
    };
    fetchHeader();
  }, []);

  const activeZone = useMemo(
    () => zones.find((zone) => zone.id === activeZoneId) ?? null,
    [zones, activeZoneId],
  );

  const filteredChurches = useMemo(() => {
    if (!activeZone) return [];
    return activeZone.churches.filter((church) => churchMatchesSearch(church, search));
  }, [activeZone, search]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white text-black">
        <section className="relative overflow-hidden py-24 sm:py-32 md:py-48 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${headerImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/35" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mt-32 md:mt-40">
              <div className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4 flex items-center gap-3 flex-wrap">
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
                <span className="text-white/50">/</span>
                <a href="/home-churches" className="hover:text-white transition-colors">
                  Camp of God Cathedral Home Churches
                </a>
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold mb-4">Worship With Us</h1>
            </div>
          </div>
        </section>

        <section className="pt-16 md:pt-24 pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-semibold">Camp of God Cathedral Home Churches</h2>
              <p className="mt-3 text-sm text-black/60 max-w-2xl mx-auto">
                Browse by zone to find a home church near you. Search by church name, pastor, or phone number.
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
                <Input
                  placeholder="Search by church name, pastor, or phone..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-full border-black/10 bg-white pl-11 shadow-sm"
                />
              </div>
            </div>

            {loading ? (
              <p className="mt-10 text-center text-sm text-black/60">Loading home churches...</p>
            ) : loadError ? (
              <p className="mt-10 text-center text-sm text-red-600">{loadError}</p>
            ) : zones.length === 0 ? (
              <p className="mt-10 text-center text-sm text-black/60">No zones are available yet.</p>
            ) : (
              <>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {zones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setActiveZoneId(zone.id)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        activeZoneId === zone.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-black border-black/10 hover:bg-black/5'
                      }`}
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>

                {activeZone ? (
                  <>
                    <h3 className="mt-10 text-xl font-semibold text-center text-black">{activeZone.name}</h3>
                    {!isPlaceholderContact(activeZone.zonalPastorName) ? (
                      <p className="mt-2 text-center text-sm text-black/70">
                        <span className="font-semibold text-primary">Zonal Pastor:</span>{' '}
                        {activeZone.zonalPastorName}
                      </p>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                      {filteredChurches.map((church) => {
                        const initial = church.name.trim().charAt(0).toUpperCase() || 'H';
                        return (
                          <Card key={church.id} className="bg-white text-black border-black/10 p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                {initial}
                              </div>
                              <h4 className="text-lg font-semibold">{church.name}</h4>
                            </div>
                            <p className="text-sm text-black/70">
                              <span className="font-semibold text-primary">Pastor:</span>{' '}
                              {isPlaceholderContact(church.pastorName) ? 'To be added' : church.pastorName}
                            </p>
                            {!isPlaceholderContact(church.phone) ? (
                              <p className="text-sm text-black/70 mt-2">
                                <span className="font-semibold text-primary">Phone:</span> {church.phone}
                              </p>
                            ) : null}
                            <ContactActions phone={church.phone} />
                          </Card>
                        );
                      })}
                    </div>
                    {filteredChurches.length === 0 && (
                      <p className="mt-8 text-center text-sm text-black/60">
                        No home churches match your search in this zone.
                      </p>
                    )}
                  </>
                ) : null}
              </>
            )}
          </div>
        </section>

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
                        <div key={`${src}-${idx}`} className="relative h-[16rem] sm:h-[20rem] md:h-[28rem]">
                          <Image
                            src={src}
                            alt="We are family moment"
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
