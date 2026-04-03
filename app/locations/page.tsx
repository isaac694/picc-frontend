'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const regions = [
  { id: 'lilongwe', label: 'Lilongwe' },
  { id: 'central', label: 'Other Central' },
  { id: 'southern', label: 'Southern Region' },
  { id: 'northern', label: 'Northern Region' },
  { id: 'international', label: 'International' },
] as const;

const branches = [
  {
    region: 'lilongwe',
    name: 'PICC Headquarters',
    pastor: 'Apostle Grace Malenga',
    location: 'Area 49, New Gulliver',
    phone: '+265 992 433 333',
    email: 'apostle@picc.org.mw',
  },
  {
    region: 'lilongwe',
    name: 'Old Town Mega Church',
    pastor: 'Pastor John Mwale',
    location: 'Malangalanga, Lilongwe',
    phone: '+265 882 433 333',
    email: 'john@picc.org.mw',
  },
  {
    region: 'lilongwe',
    name: 'Hope Tabernacle Mega Church',
    pastor: 'Prophetess Doris Banda',
    location: 'Airwing 4ways, Lilongwe',
    phone: '+265 999 111 222',
    email: 'doris@picc.org.mw',
  },
  {
    region: 'lilongwe',
    name: 'Area 25 Mega Church',
    pastor: 'Elder Peter Chimala',
    location: 'Area 25B, Lilongwe',
    phone: '+265 888 222 333',
    email: 'peter@picc.org.mw',
  },
  {
    region: 'lilongwe',
    name: 'Area 23 Mega Church',
    pastor: 'Pastor Lucy Kadango',
    location: 'Area 23, Lilongwe',
    phone: '+265 997 333 444',
    email: 'luce@picc.org.mw',
  },
  {
    region: 'lilongwe',
    name: 'Njewa Mega Church',
    pastor: 'Pastor James Tembo',
    location: 'Njewa',
    phone: '+265 885 444 555',
    email: 'james@picc.org.mw',
  },
  {
    region: 'lilongwe',
    name: 'Area 18 Mega Church',
    pastor: 'Pastor Mary Banda',
    location: 'Area 18, Lilongwe',
    phone: '+265 996 555 666',
    email: 'mary@picc.org.mw',
  },
  {
    region: 'lilongwe',
    name: 'Area 51 Mega Church',
    pastor: 'Pastor David Mphande',
    location: 'Lilongwe',
    phone: '+265 886 666 777',
    email: 'david@picc.org.mw',
  },
  {
    region: 'lilongwe',
    name: 'Lumbadzi Mega Church',
    pastor: 'Pastor Grace Mwale',
    location: 'Lumbadzi',
    phone: '+265 995 777 888',
    email: 'grace.mwale@picc.org.mw',
  },
  {
    region: 'central',
    name: 'Mponela Mega Church',
    pastor: 'Pastor David Mwale',
    location: 'Mponela',
    phone: '+265 884 888 999',
    email: 'david.mponela@picc.org.mw',
  },
  {
    region: 'central',
    name: 'Madisi Mega Church',
    pastor: 'Pastor Paul Mwase',
    location: 'Madisi',
    phone: '+265 994 999 000',
    email: 'paul@picc.org.mw',
  },
  {
    region: 'central',
    name: 'Kasungu Mega Church',
    pastor: 'Pastor Esther Chawinga',
    location: 'Kasungu',
    phone: '+265 883 000 111',
    email: 'esther@picc.org.mw',
  },
  {
    region: 'central',
    name: 'Salima Mega Church',
    pastor: 'Pastor Joseph Mwenda',
    location: 'Salima',
    phone: '+265 993 111 222',
    email: 'joseph@picc.org.mw',
  },
  {
    region: 'central',
    name: 'Nkhotakota Mega Church',
    pastor: 'Pastor Anna Mwale',
    location: 'Nkhotakota',
    phone: '+265 887 222 333',
    email: 'anna@picc.org.mw',
  },
  {
    region: 'central',
    name: 'Dedza Mega Church',
    pastor: 'Pastor Samuel Mwale',
    location: 'Dedza',
    phone: '+265 998 333 444',
    email: 'samuel@picc.org.mw',
  },
  {
    region: 'southern',
    name: 'Ntchewu Mega Church',
    pastor: 'Pastor Elizabeth Mwale',
    location: 'Ntchewu',
    phone: '+265 889 444 555',
    email: 'elizabeth@picc.org.mw',
  },
  {
    region: 'southern',
    name: 'Balaka Mega Church',
    pastor: 'Pastor Joseph Mwale',
    location: 'Balaka',
    phone: '+265 999 555 666',
    email: 'joseph.balaka@picc.org.mw',
  },
  {
    region: 'southern',
    name: 'Zomba Mega Church',
    pastor: 'Pastor Mary Chawinga',
    location: 'Zomba',
    phone: '+265 881 666 777',
    email: 'mary.zomba@picc.org.mw',
  },
  {
    region: 'southern',
    name: 'Thyolo Mega Church',
    pastor: 'Pastor Grace Chawinga',
    location: 'Thyolo',
    phone: '+265 991 777 888',
    email: 'grace.thyolo@picc.org.mw',
  },
  {
    region: 'southern',
    name: 'Mulanje Mega Church',
    pastor: 'Pastor John Chawinga',
    location: 'Mulanje',
    phone: '+265 882 888 999',
    email: 'john.mulanje@picc.org.mw',
  },
  {
    region: 'southern',
    name: 'Blantyre Central Church (BCC)',
    pastor: 'Bishop Thomas Chikoti',
    location: 'Blantyre',
    phone: '+265 992 999 000',
    email: 'bishop@picc.org.mw',
  },
  {
    region: 'southern',
    name: 'Zingwangwa Mega Church',
    pastor: 'Pastor Lucy Mwale',
    location: 'Zingwangwa, Blantyre',
    phone: '+265 883 000 111',
    email: 'luce.zing@picc.org.mw',
  },
  {
    region: 'southern',
    name: 'Limbe Mega Church',
    pastor: 'Pastor Peter Mwale',
    location: 'Limbe',
    phone: '+265 993 111 222',
    email: 'peter.limbe@picc.org.mw',
  },
  {
    region: 'northern',
    name: 'Mzuzu Mega Church',
    pastor: 'Pastor David Chawinga',
    location: 'Mzuzu',
    phone: '+265 884 222 333',
    email: 'david.mzuzu@picc.org.mw',
  },
  {
    region: 'northern',
    name: 'Karonga Mega Church',
    pastor: 'Pastor Esther Mwale',
    location: 'Karonga',
    phone: '+265 994 333 444',
    email: 'esther.karonga@picc.org.mw',
  },
  {
    region: 'northern',
    name: 'Mzimba Mega Church',
    pastor: 'Pastor Paul Mwale',
    location: 'Mzimba',
    phone: '+265 885 444 555',
    email: 'paul.mzimba@picc.org.mw',
  },
  {
    region: 'northern',
    name: 'Rumphi Mega Church',
    pastor: 'Pastor Grace Mwale',
    location: 'Rumphi',
    phone: '+265 995 555 666',
    email: 'grace.rumphi@picc.org.mw',
  },
  {
    region: 'northern',
    name: 'Jenda Mega Church',
    pastor: 'Pastor Samuel Chawinga',
    location: 'Jenda',
    phone: '+265 886 666 777',
    email: 'samuel.jenda@picc.org.mw',
  },
  {
    region: 'northern',
    name: 'Nkhatabay Mega Church',
    pastor: 'Pastor Elizabeth Chawinga',
    location: 'Nkhatabay',
    phone: '+265 996 777 888',
    email: 'elizabeth.nkhata@picc.org.mw',
  },
  {
    region: 'international',
    name: 'PICC UK Mega Church',
    pastor: 'Tiwonge Kaluwa',
    location: 'Nottingham, UK',
    phone: '+44 790 408 381',
    email: 'piccuk2024@gmail.com',
  },
  {
    region: 'international',
    name: 'PICC Harare Mega Church',
    pastor: 'Joseph Chirwa',
    location: '147 Westwood, Harare',
    phone: '+263 788 803 790',
    email: 'picchararemegachurch@gmail.com',
  },
];

export default function LocationsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof regions)[number]['id']>('lilongwe');
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
    const query = search.trim().toLowerCase();
    return branches.filter((branch) => {
      if (branch.region !== activeTab) return false;
      if (!query) return true;
      const haystack = [
        branch.name,
        branch.pastor,
        branch.location,
        branch.phone,
        branch.email,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [search, activeTab]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white text-black">
        <section className="relative overflow-hidden py-24 sm:py-32 md:py-48 text-white rounded-b-[36px] md:rounded-b-[48px]">
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
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
                <Input
                  placeholder="Search by church name, location, or pastor..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-full border-black/10 bg-white pl-11 shadow-sm"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {regions.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white text-black border-black/10 hover:bg-black/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <h3 className="mt-10 text-xl font-semibold text-center text-black">
              {regions.find((tab) => tab.id === activeTab)?.label}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {filteredLocations.map((branch) => {
                const phoneHref = branch.phone.replace(/\s+/g, '');
                const phoneDigits = branch.phone.replace(/[^\d]/g, '');
                const whatsappHref = `https://wa.me/${phoneDigits}`;
                const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                  branch.email,
                )}`;
                return (
                  <Card key={branch.name} className="bg-white text-black border-black/10 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        P
                      </div>
                      <h4 className="text-lg font-semibold">{branch.name}</h4>
                    </div>
                    <p className="text-sm text-black/70">
                      <span className="font-semibold text-primary">Pastor:</span> {branch.pastor}
                    </p>
                    <p className="text-sm text-black/70 mt-2">
                      <span className="font-semibold text-primary">Location:</span> {branch.location}
                    </p>
                    <p className="text-sm text-black/70 mt-2">
                      <span className="font-semibold text-primary">Phone:</span> {branch.phone}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={`tel:${phoneHref}`}
                        className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-green-600 hover:bg-black/5"
                      >
                        Call
                      </a>
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-black/5"
                      >
                        Text
                      </a>
                      <a
                        href={gmailHref}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-black/5"
                      >
                        Email
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
            {filteredLocations.length === 0 && (
              <p className="mt-8 text-center text-sm text-black/60">
                No locations match your search in this region.
              </p>
            )}
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
                        <div key={`${src}-${idx}`} className="relative h-[16rem] sm:h-[20rem] md:h-[28rem]">
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

