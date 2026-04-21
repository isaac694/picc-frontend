'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { apiFetch, apiUrl } from '@/lib/api';

const regions = [
  { id: 'lilongwe', label: 'Lilongwe' },
  { id: 'central', label: 'Other Central' },
  { id: 'southern', label: 'Southern Region' },
  { id: 'northern', label: 'Northern Region' },
  { id: 'international', label: 'International' },
] as const;

type Branch = {
  id: string;
  region: string;
  name: string;
  pastor: string;
  location: string;
  phone: string;
  email: string;
};

const defaultBranches: Branch[] = [
  {
    id: '1',
    region: 'lilongwe',
    name: 'PICC Headquarters',
    pastor: 'Apostle Grace Malenga',
    location: 'Area 49, New Gulliver',
    phone: '+265 992 433 333',
    email: 'apostle@picc.org.mw',
  },
  {
    id: '2',
    region: 'lilongwe',
    name: 'Old Town Mega Church',
    pastor: 'Pastor John Mwale',
    location: 'Malangalanga, Lilongwe',
    phone: '+265 882 433 333',
    email: 'john@picc.org.mw',
  },
  {
    id: '3',
    region: 'lilongwe',
    name: 'Hope Tabernacle Mega Church',
    pastor: 'Prophetess Doris Banda',
    location: 'Airwing 4ways, Lilongwe',
    phone: '+265 999 111 222',
    email: 'doris@picc.org.mw',
  },
];

export default function LocationsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof regions)[number]['id']>('lilongwe');
  const [branches, setBranches] = useState<Branch[]>(defaultBranches);
  const [headerImage, setHeaderImage] = useState('/images/locations-header.png');
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

  useEffect(() => {
    const fetchLocationsData = async () => {
      try {
        // Fetch branches data
        const branchesResponse = await apiFetch('/api/site-content/locations-data');
        if (branchesResponse.ok) {
          const branchesData = await branchesResponse.json();
          if (branchesData.body) {
            setBranches(JSON.parse(branchesData.body));
          }
        }

        // Fetch header image
        const imageResponse = await apiFetch('/api/site-content/locations-header-bg');
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData.imageUrl) {
            setHeaderImage(apiUrl(imageData.imageUrl));
          }
        }
      } catch (error) {
        console.error('Failed to fetch locations data:', error);
        // Keep default data on error
      }
    };

    fetchLocationsData();
  }, []);

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
  }, [search, activeTab, branches]);

  return (
    <>
      <Navigation />
      <main className='min-h-screen bg-white text-black'>
        <section className='relative overflow-hidden py-24 sm:py-32 md:py-48 text-white rounded-b-[36px] md:rounded-b-[48px]'>
          <div className='absolute inset-0'>
            <div
              className='absolute inset-0 bg-cover bg-center'
              style={{ backgroundImage: `url(${headerImage})` }}
            />
            <div className='absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/35' />
          </div>
          <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='max-w-3xl mt-32 md:mt-40'>
              <div className='text-xs uppercase tracking-[0.35em] text-white/70 mb-4 flex items-center gap-3'>
                <a href='/' className='hover:text-white transition-colors'>Home</a>
                <span className='text-white/50'>/</span>
                <a href='/locations' className='hover:text-white transition-colors'>Church Locations</a>
              </div>
              <h1 className='text-4xl md:text-6xl font-semibold mb-4'>Worship With Us</h1>
            </div>
          </div>
        </section>

        <section className='pt-16 md:pt-24 pb-24'>
          <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-10'>
              <h2 className='text-3xl md:text-4xl font-semibold'>All Locations</h2>
            </div>
            <div className='max-w-2xl mx-auto'>
              <div className='relative'>
                <Search className='absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50' />
                <Input
                  placeholder='Search by church name, location, or pastor...'
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className='w-full rounded-full border-black/10 bg-white pl-11 shadow-sm'
                />
              </div>
            </div>

            <div className='mt-8 flex flex-wrap justify-center gap-3'>
              {regions.map((tab) => (
                <button
                  key={tab.id}
                  type='button'
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

            <h3 className='mt-10 text-xl font-semibold text-center text-black'>
              {regions.find((tab) => tab.id === activeTab)?.label}
            </h3>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8'>
              {filteredLocations.map((branch) => {
                const phoneHref = branch.phone.replace(/\s+/g, '');
                const phoneDigits = branch.phone.replace(/[^\d]/g, '');
                const whatsappHref = `https://wa.me/${phoneDigits}`;
                const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${branch.email}`;
                return (
                  <Card key={branch.id} className='bg-white text-black border-black/10 p-6'>
                    <div className='flex items-center gap-3 mb-4'>
                      <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold'>
                        P
                      </div>
                      <h4 className='text-lg font-semibold'>{branch.name}</h4>
                    </div>
                    <p className='text-sm text-black/70'>
                      <span className='font-semibold text-primary'>Pastor:</span> {branch.pastor}
                    </p>
                    <p className='text-sm text-black/70 mt-2'>
                      <span className='font-semibold text-primary'>Location:</span> {branch.location}
                    </p>
                    <p className='text-sm text-black/70 mt-2'>
                      <span className='font-semibold text-primary'>Phone:</span> {branch.phone}
                    </p>
                    <div className='mt-4 flex flex-wrap gap-2'>
                      <a
                        href={phoneHref}
                        className='rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-green-600 hover:bg-black/5'
                      >
                        Call
                      </a>
                      <a
                        href={whatsappHref}
                        target='_blank'
                        rel='noreferrer'
                        className='rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-black/5'
                      >
                        Text
                      </a>
                      <a
                        href={gmailHref}
                        target='_blank'
                        rel='noreferrer'
                        className='rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-black/5'
                      >
                        Email
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
            {filteredLocations.length === 0 && (
              <p className='mt-8 text-center text-sm text-black/60'>
                No locations match your search in this region.
              </p>
            )}
          </div>
        </section>

        {/* We Are Family Section */}
        <section className='py-20 md:py-28 bg-white'>
          <div className='w-full px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-10'>
              <h2 className='text-3xl md:text-4xl font-bold text-black'>We Are Family</h2>
              <p className='text-black/70 mt-2'>Snapshots of life together.</p>
            </div>

            <div className='relative overflow-hidden w-full'>
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
                  <div key={slideIndex} className='min-w-full'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
                      {slide.map((src, idx) => (
                        <div key={`${src}-${idx}`} className='relative h-[16rem] sm:h-[20rem] md:h-[28rem]'>
                          <Image
                            src={src}
                            alt='We are family moment'
                            fill
                            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                            className='object-cover'
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type='button'
                aria-label='Previous slide'
                onClick={() => setCurrentSlide((s) => s - 1)}
                className='absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
              >
                ‹
              </button>
              <button
                type='button'
                aria-label='Next slide'
                onClick={() => setCurrentSlide((s) => s + 1)}
                className='absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
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
