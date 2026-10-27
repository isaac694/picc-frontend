'use client';



import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

import { Phone, Search } from 'lucide-react';

import Navigation from '@/components/Navigation';

import Footer from '@/components/Footer';

import { Card } from '@/components/ui/card';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { apiFetch, apiUrl } from '@/lib/api';

import {

  fetchPublicHomeChurchesPage,

  fetchPublicZonesList,

  HOME_CHURCHES_ALL_ZONES_PAGE_SIZE,

  HOME_CHURCHES_PAGE_SIZE,

  isPlaceholderContact,

  searchPublicHomeChurchesPage,

  type PublicHomeChurchWithZone,

  type PublicZoneSummary,

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



const paginationBtnClass =
  'inline-flex min-h-9 min-w-[2.85rem] items-center justify-center rounded-md border px-3 py-1.5 font-serif text-sm text-black transition disabled:cursor-not-allowed disabled:opacity-50';

function getVisiblePageNumbers(current: number, total: number, maxVisible = 5) {
  if (total <= 0) return [];
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function HomeChurchesPagination({
  page,
  totalPages,
  totalResults,
  loading,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalResults: number;
  loading: boolean;
  onPageChange: (nextPage: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pageNumbers = getVisiblePageNumbers(page, totalPages);

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <p className="text-center text-sm text-black/60">
        Showing page {page} of {totalPages}
        {totalResults > 0 ? ` · ${totalResults} home church${totalResults === 1 ? '' : 'es'}` : ''}
      </p>
      <nav
        className="flex flex-wrap items-center justify-center gap-1.5"
        aria-label="Home churches pagination"
      >
        <button
          type="button"
          className={`${paginationBtnClass} border-transparent bg-[#e5e5e5] hover:bg-[#d9d9d9]`}
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(1)}
        >
          First
        </button>
        <button
          type="button"
          className={`${paginationBtnClass} border-transparent bg-[#e5e5e5] hover:bg-[#d9d9d9]`}
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          «Previous
        </button>
        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            aria-current={pageNumber === page ? 'page' : undefined}
            disabled={loading}
            className={
              pageNumber === page
                ? `${paginationBtnClass} border-transparent bg-[#d4af37] hover:bg-[#d4af37]/90`
                : `${paginationBtnClass} border-black/20 bg-white hover:bg-black/[0.04]`
            }
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          className={`${paginationBtnClass} border-black/20 bg-white hover:bg-black/[0.04]`}
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next»
        </button>
        <button
          type="button"
          className={`${paginationBtnClass} border-black/20 bg-white hover:bg-black/[0.04]`}
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(totalPages)}
        >
          Last
        </button>
      </nav>
    </div>
  );
}

function ChurchCard({ church, showZone }: { church: PublicHomeChurchWithZone; showZone?: boolean }) {

  const initial = church.name.trim().charAt(0).toUpperCase() || 'H';

  const zoneName = church.zone?.name;

  return (

    <Card className="bg-white text-black border-black/10 p-6">

      <div className="flex items-center gap-3 mb-4">

        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">

          {initial}

        </div>

        <div className="min-w-0">

          <h4 className="text-lg font-semibold">{church.name}</h4>

          {showZone && zoneName ? (

            <p className="text-xs text-black/55 mt-0.5">{zoneName}</p>

          ) : null}

        </div>

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

}



export default function HomeChurchesPage() {

  const [search, setSearch] = useState('');

  const [zoneFilter, setZoneFilter] = useState<string>('all');

  const [zones, setZones] = useState<PublicZoneSummary[]>([]);

  const [churches, setChurches] = useState<PublicHomeChurchWithZone[]>([]);

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [totalResults, setTotalResults] = useState(0);

  const [loadingZones, setLoadingZones] = useState(true);

  const [loadingChurches, setLoadingChurches] = useState(false);

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



    const loadZones = async () => {

      setLoadingZones(true);

      setLoadError('');

      try {

        const data = await fetchPublicZonesList();

        if (cancelled) return;

        setZones(data);

        setZoneFilter((prev) => {

          if (prev === 'all' || data.some((zone) => zone.id === prev)) return prev;

          return 'all';

        });

      } catch {

        if (!cancelled) {

          setLoadError('Unable to load home churches right now. Please try again later.');

          setZones([]);

        }

      } finally {

        if (!cancelled) setLoadingZones(false);

      }

    };



    void loadZones();

    return () => {

      cancelled = true;

    };

  }, []);



  useEffect(() => {

    const trimmedSearch = search.trim();

    const apiZoneId = zoneFilter === 'all' ? null : zoneFilter;

    const pageLimit = apiZoneId ? HOME_CHURCHES_PAGE_SIZE : HOME_CHURCHES_ALL_ZONES_PAGE_SIZE;



    let cancelled = false;



    const loadChurches = async () => {

      setLoadingChurches(true);

      setLoadError('');

      try {

        const result = trimmedSearch

          ? await searchPublicHomeChurchesPage({

              zoneId: apiZoneId,

              q: trimmedSearch,

              page,

              limit: pageLimit,

            })

          : await fetchPublicHomeChurchesPage({

              zoneId: apiZoneId,

              page,

              limit: pageLimit,

            });



        if (cancelled) return;



        const safePage = Math.min(result.page, Math.max(result.totalPages, 1));

        if (safePage !== result.page && result.totalPages > 0) {

          setPage(safePage);

          return;

        }



        setChurches(result.churches);

        setTotalPages(result.totalPages);

        setTotalResults(result.total);

      } catch {

        if (!cancelled) {

          setLoadError('Unable to load home churches right now. Please try again later.');

          setChurches([]);

          setTotalPages(1);

          setTotalResults(0);

        }

      } finally {

        if (!cancelled) setLoadingChurches(false);

      }

    };



    const timer = window.setTimeout(() => {

      void loadChurches();

    }, trimmedSearch ? 300 : 0);



    return () => {

      cancelled = true;

      window.clearTimeout(timer);

    };

  }, [zoneFilter, search, page]);



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

    () => (zoneFilter === 'all' ? null : zones.find((zone) => zone.id === zoneFilter) ?? null),

    [zones, zoneFilter],

  );



  const handleSearchChange = (value: string) => {

    setSearch(value);

    setPage(1);

  };



  const handleZoneFilterChange = (value: string) => {

    setZoneFilter(value);

    setPage(1);

  };



  const loading = loadingZones || loadingChurches;



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

                Choose a zone from the list or view all, then search by church name, pastor, or phone.

              </p>

            </div>

            <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end">

              <div className="w-full sm:w-[min(100%,14rem)]">

                <Label htmlFor="home-church-zone" className="mb-1.5 block text-sm text-black/70">

                  Zone

                </Label>

                <Select value={zoneFilter} onValueChange={handleZoneFilterChange} disabled={loadingZones}>

                  <SelectTrigger

                    id="home-church-zone"

                    className="w-full rounded-full border-black/10 bg-white shadow-sm"

                  >

                    <SelectValue placeholder="Select zone" />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="all">All zones</SelectItem>

                    {zones.map((zone) => (

                      <SelectItem key={zone.id} value={zone.id}>

                        {zone.name}

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div className="relative min-w-0 flex-1">

                <Label htmlFor="home-church-search" className="mb-1.5 block text-sm text-black/70">

                  Search

                </Label>

                <div className="relative">

                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />

                  <Input

                    id="home-church-search"

                    placeholder="Church name, pastor, or phone..."

                    value={search}

                    onChange={(event) => handleSearchChange(event.target.value)}

                    className="w-full rounded-full border-black/10 bg-white pl-11 shadow-sm"

                    disabled={loadingZones}

                  />

                </div>

              </div>

            </div>



            {loadingZones ? (

              <p className="mt-10 text-center text-sm text-black/60">Loading zones...</p>

            ) : loadError && zones.length === 0 ? (

              <p className="mt-10 text-center text-sm text-red-600">{loadError}</p>

            ) : zones.length === 0 ? (

              <p className="mt-10 text-center text-sm text-black/60">No zones are available yet.</p>

            ) : (

              <>

                {search.trim() ? (

                  <h3 className="mt-10 text-xl font-semibold text-center text-black">Search results</h3>

                ) : activeZone ? (

                  <>

                    <h3 className="mt-10 text-xl font-semibold text-center text-black">{activeZone.name}</h3>

                    {!isPlaceholderContact(activeZone.zonalPastorName) ? (

                      <p className="mt-2 text-center text-sm text-black/70">

                        <span className="font-semibold text-primary">Zonal Pastor:</span>{' '}

                        {activeZone.zonalPastorName}

                      </p>

                    ) : null}

                  </>

                ) : (

                  <h3 className="mt-10 text-xl font-semibold text-center text-black">All zones</h3>

                )}



                    {loadingChurches ? (

                      <p className="mt-10 text-center text-sm text-black/60">Loading home churches...</p>

                    ) : loadError ? (

                      <p className="mt-10 text-center text-sm text-red-600">{loadError}</p>

                    ) : (

                      <>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">

                          {churches.map((church) => (

                            <ChurchCard

                              key={church.id}

                              church={church}

                              showZone={zoneFilter === 'all'}

                            />

                          ))}

                        </div>



                        {churches.length === 0 ? (

                          <p className="mt-8 text-center text-sm text-black/60">

                            {search.trim()

                              ? zoneFilter === 'all'

                                ? 'No home churches match your search.'

                                : 'No home churches match your search in this zone.'

                              : zoneFilter === 'all'

                                ? 'No home churches are listed yet.'

                                : 'No home churches listed in this zone yet.'}

                          </p>

                        ) : null}



                        <HomeChurchesPagination

                          page={page}

                          totalPages={totalPages}

                          totalResults={totalResults}

                          loading={loading}

                          onPageChange={setPage}

                        />

                      </>

                    )}

              </>

            )}

          </div>

        </section>



        

      </main>

      <Footer />

    </>

  );

}

