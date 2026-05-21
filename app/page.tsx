import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import VerseSection from '@/components/VerseSection';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import MissionSection from '@/components/MissionSection';
import EventsCarousel from '@/components/EventsCarousel';
import QuoteSection from '@/components/QuoteSection';
import MomentsSection from '@/components/MomentsSection';
import SpotifyFollowDialog from '@/components/SpotifyFollowDialog';
import DevotionReadMore from '@/components/DevotionReadMore';
import { apiFetch, apiUrl } from '@/lib/api';

const HOME_HERO_SLOTS = [
  { key: 'home-hero-1', fallback: '/hero/hero-4.JPG', className: 'col-span-2 row-span-1' },
  { key: 'home-hero-2', fallback: '/hero/hero-10.JPG', className: 'col-span-2 row-span-2' },
  { key: 'home-hero-3', fallback: '/hero/hero-9.JPG', className: 'col-span-2 row-span-1' },
  { key: 'home-hero-4', fallback: '/hero/hero-8.JPG', className: 'col-span-2 row-span-2 hidden sm:block' },
  { key: 'home-hero-5', fallback: '/hero/hero-7.png', className: 'col-span-2 row-span-1 hidden sm:block' },
  { key: 'home-hero-6', fallback: '/hero/hero-2.jpg', className: 'col-span-2 row-span-2 hidden sm:block' },
  { key: 'home-hero-7', fallback: '/hero/hero-1.jpg', className: 'col-span-2 row-span-1 hidden sm:block' },
  { key: 'home-hero-8', fallback: '/hero/hero-5.png', className: 'col-span-2 row-span-1 hidden md:block' },
  { key: 'home-hero-9', fallback: '/hero/hero-3.JPG', className: 'col-span-2 row-span-1 hidden md:block' },
];

const GROW_CARD_SLOTS = [
  {
    key: 'home-grow-card-1',
    label: 'DISCOVER',
    title: 'Who We Are',
    href: '/about',
    fallback: '/cards/about-church.jpg',
  },
  {
    key: 'home-grow-card-2',
    label: 'ATTEND',
    title: 'Join a Service',
    href: '/#see-you-in-church',
    fallback: '/cards/service-times.jpg',
  },
  {
    key: 'home-grow-card-3',
    label: 'CONNECT',
    title: 'Get Involved',
    href: '/events',
    fallback: '/cards/upcoming-events.jpg',
  },
  {
    key: 'home-grow-card-4',
    label: 'GIVE',
    title: 'Support the Mission',
    href: '/give',
    fallback: '/cards/give-offerings.png',
  },
];

const MINISTRY_CARDS = [
  { title: 'Women of Hope', key: 'home-ministry-card-1', fallback: '/hero/hero-8-woh.jpg', href: '/ministries/women-of-hope' },
  { title: 'ICD', key: 'home-ministry-card-2', fallback: '/hero/hero-11-icd.jpg', href: '/ministries/icd' },
  { title: 'Men of Valour', key: 'home-ministry-card-3', fallback: '/hero/hero-7-mov.jpg', href: '/ministries/men-of-valour' },
  { title: 'Prison Ministry', key: 'home-ministry-card-4', fallback: '/hero/hero-14.jpg', href: '/ministries/prison-ministry' },
  { title: 'Youth Church Ministry', key: 'home-ministry-card-5', fallback: '/hero/hero-10-yc.jpg', href: '/ministries/youth-church-ministry' },
  { title: 'Hope and Beauty', key: 'home-ministry-card-6', fallback: '/hero/hero-13-hb.jpg', href: '/ministries/hope-and-beauty' },
  { title: 'Heritage Ministry', key: 'home-ministry-card-7', fallback: '/hero/hero-12-heritage.jpg', href: '/ministries/heritage-ministry' },
];

const DEFAULT_SEE_YOU_SERVICES = [
  {
    day: 'Tuesday',
    time: '5:30 PM - 7:30 PM',
    title: 'Home Church Service',
  },
  {
    day: 'Wednesday',
    time: '9:00 AM - 12:00 PM',
    title: 'Intercession, Counselling & Deliverance',
  },
  {
    day: 'Thursday',
    time: '6:00 PM - 8:00 PM',
    title: 'Special Word Encounter Service',
  },
  {
    day: 'Sunday',
    time: '7:00 AM - 12:00 PM',
    title: 'Miracles & Celebration Service',
  },
  {
    day: 'Everyday',
    time: '5:00 AM - 6:00 AM',
    title: 'Morning Glory Prayer',
  },
  {
    day: 'Saturday',
    time: '8:30 AM - 11:00 AM',
    title: 'Corporate Soul Winning',
  },
  {
    day: 'Sunday',
    time: 'After the last service',
    title: 'One on One Prayers and Counseling',
  },
];

type ServiceLike = {
  id?: number | string | null;
  day?: string | null;
  dayOfWeek?: string | null;
  title?: string | null;
  time?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
};

type SeeYouContent = {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
};

function parseSeeYouServices(body?: string | null): ServiceLike[] {
  if (!body) return DEFAULT_SEE_YOU_SERVICES;

  try {
    const parsed = JSON.parse(body);
    const services = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.services)
        ? parsed.services
        : [];

    const normalized = services
      .map((service: unknown, index: number) => {
        if (!service || typeof service !== 'object') return null;
        const item = service as Record<string, unknown>;
        const day = typeof item.day === 'string' ? item.day : typeof item.dayOfWeek === 'string' ? item.dayOfWeek : '';
        const title = typeof item.title === 'string' ? item.title : '';
        const time = typeof item.time === 'string' ? item.time : '';

        if (!day && !title && !time) return null;

        return {
          id: typeof item.id === 'string' || typeof item.id === 'number' ? item.id : `see-you-service-${index}`,
          day,
          title,
          time,
        };
      })
      .filter((service: ServiceLike | null): service is ServiceLike => Boolean(service));

    return normalized.length ? normalized : DEFAULT_SEE_YOU_SERVICES;
  } catch {
    return DEFAULT_SEE_YOU_SERVICES;
  }
}

async function getDailyDevotion() {
  try {
    const response = await apiFetch('/api/devotions/latest', {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

async function getDailyConfession() {
  try {
    const response = await apiFetch('/api/confessions/latest', {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

async function getSeeYouInChurch(): Promise<SeeYouContent | null> {
  try {
    const response = await apiFetch('/api/site-content/see-you-in-church', {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getQuoteOfMonth() {
  try {
    const response = await apiFetch('/api/quote-of-month', {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getSiteImages(keys: string[]) {
  const entries = await Promise.all(
    keys.map(async (key) => {
      try {
        const response = await apiFetch(`/api/site-content/${key}`, {
          next: { revalidate: 300 },
        });
        if (!response.ok) return [key, null] as const;
        const data = await response.json();
        return [key, data.imageUrl ?? null] as const;
      } catch {
        return [key, null] as const;
      }
    })
  );
  return Object.fromEntries(entries);
}

async function getHomeVerse() {
  try {
    const response = await apiFetch('/api/site-content/home-verse', {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const data = (await response.json().catch(() => null)) as unknown;
    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null;

    const body = isRecord(data) && typeof data.body === 'string' ? data.body : '';
    if (!body) return null;

    try {
      const parsed = JSON.parse(body) as unknown;
      if (isRecord(parsed)) {
        return {
          text: typeof parsed.text === 'string' ? parsed.text : null,
          reference: typeof parsed.reference === 'string' ? parsed.reference : null,
        };
      }
    } catch {
      // ignore JSON parsing
    }

    return { text: body, reference: null };
  } catch {
    return null;
  }
}

function normalizeImageUrl(url?: string | null) {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  if (trimmed === '/home/see-you-in-church.jpg') return '/home/see-you-in-church.JPG';
  return trimmed;
}

function isLocalUpstreamImage(url?: string | null) {
  if (!url) return false;
  return url.includes('://localhost') || url.includes('://127.0.0.1') || url.includes('://[::1]');
}

export default async function HomePage() {
  const imageKeys = [
    ...HOME_HERO_SLOTS.map((slot) => slot.key),
    'home-mission-image',
    ...GROW_CARD_SLOTS.map((slot) => slot.key),
    'home-pastors-image',
    'home-listen-now-bg',
    ...MINISTRY_CARDS.map((slot) => slot.key),
    'home-livestream-bg',
  ];

  const [devotion, confession, seeYouInChurch, quoteOfMonth, siteImages, homeVerse] = await Promise.all([
    getDailyDevotion(),
    getDailyConfession(),
    getSeeYouInChurch(),
    getQuoteOfMonth(),
    getSiteImages(imageKeys),
    getHomeVerse(),
  ]);

  const seeYouBg =
    normalizeImageUrl(seeYouInChurch?.imageUrl) ?? '/home/see-you-in-church.JPG';
  const seeYouServices = parseSeeYouServices(seeYouInChurch?.body);
  const devotionDate = devotion?.publishAt
    ? new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(devotion.publishAt))
    : null;

  const confessionDate = confession?.publishAt
    ? new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(confession.publishAt))
    : null;

  const confessionImageSrc = normalizeImageUrl(confession?.imageUrl) || '/home/declaration.jpeg';
  const confessionImageUnoptimized = isLocalUpstreamImage(confessionImageSrc);

  const quoteImageUrl = normalizeImageUrl(quoteOfMonth?.imageUrl);
  const heroImages = HOME_HERO_SLOTS.map((slot) => ({
    ...slot,
    src: normalizeImageUrl(siteImages[slot.key]) || slot.fallback,
  }));
  const missionImage = normalizeImageUrl(siteImages['home-mission-image']) || '/images/pastor-preaching-bw.jpeg';
  const growCards = GROW_CARD_SLOTS.map((slot) => ({
    ...slot,
    image: normalizeImageUrl(siteImages[slot.key]) || slot.fallback,
  }));
  const pastorsImage = normalizeImageUrl(siteImages['home-pastors-image']) || '/images/pastor-preaching-bw.jpeg';
  const listenNowImage = normalizeImageUrl(siteImages['home-listen-now-bg']) || '/pastor/pastor-photo.jpg';
  const ministryCards = MINISTRY_CARDS.map((slot) => ({
    ...slot,
    image: normalizeImageUrl(siteImages[slot.key]) || slot.fallback,
  }));
  const livestreamImage = normalizeImageUrl(siteImages['home-livestream-bg']) || '/hero/hero-15.png';
  const fallbackDevotion = {
    title: 'God Is Good',
    content: [
      'PENTECOST INTERNATIONAL CHRISTIAN CENTRE',
      '2026 - Year of THE HAND OF GOD (Ezekiel 37:1-10)',
      'Please Find Your Daily Rivers of Hope Devotional',
      'Monday, 30 March 2026',
      'Yes, it is true. No matter what you may be going through, God is good. Whether or not there is money in your pocket, God is good. Whether your marriage is working or not, God is good. Whether or not your prayers have been answered, He remains good.',
      'Truly God is good to Israel, To such as are pure in heart. Psalms 73:1 NKJV',
      'He was good before you were born, He is good now, and He will remain good even after you are long gone. His goodness can and must not be questioned at all. There is nothing happening to you or around you that can change His goodness. In other words, regardless of what He does or does not do, He is good!',
      'In Exodus 34:6, we see that He is abundant in goodness. His goodness is always available in abundant supply. There is no day when God will not be good to His children. Never. You can rest assured that His goodness shall be manifested in all aspects of life.',
      "We also learn from Psalms 33:5 that the whole earth is full of God's goodness, which means that there is no place on earth where His goodness cannot reach you. No matter your geographical location, be assured that you are a candidate of His goodness.",
      "Beloved, God's will is that we should all enjoy His goodness while we are still alive (Psalms 27:13). Yes, we must see and enjoy His goodness in the land of the living, not in the land of the dead. Therefore, the devil’s agenda of premature death against us is destroyed in Jesus' mighty name. No evil shall befall you and no plague shall come near your dwelling (Psalms 91:10).",
      'Your Prayer Today',
      'Father, help me walk and abide in Your goodness all the days of my life, in Jesus mighty name.',
      'For Prayer, Counselling and More Spiritual Resources',
      'Email: pastoresaubanda@gmail.com',
      'Facebook: https://www.faceboohk.com/pastoresaubanda/ https://www.facebook.com/PICCWorldwide',
      'Website: www.esaubanda.com',
      'Get free audio messages at: esaubanda.podbean.com',
      'If you want to be receiving these devotions, whatsapp the word "Subscribe" to +265886464774',
      'FOR BOOK ORDERS ONLY, CONTACT GIFT KANDIDZIWA OR GIFT BANDA ON:',
      'WhatsApp on +265995500800 / 0992849555',
    ],
  };
  const devotionData = devotion ?? fallbackDevotion;
  const fallbackDevotionDate = Array.isArray(devotionData?.content)
    ? devotionData.content.find((line: string) =>
      /\b(?:[A-Za-z]+,?\s+)?\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/.test(line),
    )
    : null;
  const displayDevotionDate = devotionDate || fallbackDevotionDate;

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <div id="top" className="sr-only" aria-hidden="true" />
        {/* Hero Section */}
        <section className="relative h-[420px] sm:h-[520px] md:h-[700px] overflow-hidden flex items-center rounded-b-[28px] sm:rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0 hero-collage p-2 sm:p-3 md:p-4" aria-hidden="true">
            <div className="grid h-full w-full grid-cols-2 md:grid-cols-6 grid-rows-3 md:grid-rows-3 gap-2 sm:gap-3 md:gap-4">
              {heroImages.map((item, index) => (
                <div key={item.src} className={`${item.className} relative overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]`}>
                  <Image
                    src={item.src}
                    alt={`PICC hero background ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    priority={index < 2}
                    className="object-cover"
                    unoptimized={isLocalUpstreamImage(item.src)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/40 to-black/45" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.015)_0%,rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.45)_100%)]" />
          <div className="absolute inset-0 bg-primary/12" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary-foreground mb-3 md:mb-4 leading-tight">
                Welcome to Pentecost International Christian Centre
              </h1>
              <p className="text-base sm:text-lg text-primary-foreground/90 mb-6 md:mb-8">
                A place of worship, fellowship, and spiritual growth for all
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/livestream">
                  <Button className="w-full sm:w-auto bg-primary text-primary-foreground border border-primary-foreground/60 hover:bg-primary/90 text-base px-8 py-6">
                    Livestream
                  </Button>
                </Link>
                <Link href="/give">
                  <Button className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-8 py-6">
                    Give Online
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <VerseSection text={homeVerse?.text} reference={homeVerse?.reference} />

        <MissionSection imageUrl={missionImage} />

        {/* Daily Devotions Section */}
        <section className="py-20 sm:py-24 md:py-28 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
              <div className="relative rounded-[24px] sm:rounded-[28px] border border-primary/10 bg-white p-6 sm:p-8 md:p-10 shadow-xl min-h-[360px]">
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                  Declarations
                </p>
                <h2 className="text-3xl md:text-5xl font-semibold text-foreground mb-6">
                  My Confession
                </h2>
                {confessionDate && (
                  <p className="mb-4 text-xs uppercase tracking-[0.25em] text-foreground/50">
                    {confessionDate}
                  </p>
                )}
                <div className="mb-6">
                  <Link href="/devotions#confessions">
                    <Button className="rounded-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90">
                      View Confession Archive
                    </Button>
                  </Link>
                </div>
                <div className="relative h-[400px] sm:h-[480px] md:h-[550px] overflow-hidden bg-white">
                  <Image
                    src={confessionImageSrc}
                    alt="Daily declarations"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    unoptimized={confessionImageUnoptimized}
                  />
                </div>
              </div>
              <div className="relative rounded-[24px] sm:rounded-[28px] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 sm:p-8 md:p-10 shadow-xl min-h-[360px]">
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                  Daily Devotions
                </p>
                <h2 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
                  Rivers of Hope Devotion
                </h2>
                <p className="text-foreground/70 text-lg leading-relaxed">
                  {devotionData.title}
                </p>
                {displayDevotionDate && (
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-foreground/50">
                    {displayDevotionDate}
                  </p>
                )}
                <div className="mt-6">
                  <Link href="/devotions">
                    <Button className="rounded-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90">
                      View All Devotions
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 border-t border-primary/10 pt-6">
                  <DevotionReadMore content={devotionData.content} />
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Quick Links / "Your Faith Walk" Section */}
        <section className="py-16 sm:py-16 sm:py-20 md:py-24 bg-[linear-gradient(180deg,#fffaf0_0%,#fff6ec_100%)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Grow in Every Season</h2>
              <p className="text-foreground/70">Whether you&apos;re new or have been with us for years, there&apos;s always more.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8">
              {growCards.map((card) => (
                <Link key={card.href} href={card.href}>
                  <div className="group block rounded-2xl overflow-hidden relative h-56 sm:h-64 md:h-72 lg:h-80 cursor-pointer">
                    <div className="absolute inset-0">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-105"
                        unoptimized={isLocalUpstreamImage(card.image)}
                      />
                    </div>

                    {/* dim overlay */}
                    <div className="absolute inset-0 bg-black/30 transition-colors duration-300 group-hover:bg-black/40" />

                    {/* small label top-left */}
                    <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1 rounded text-xs uppercase tracking-wider">
                      {card.label}
                    </div>

                    {/* main title bottom-left */}
                    <div className="absolute bottom-6 left-6 text-white">
                      <h3 className="text-xl md:text-2xl font-bold leading-tight">{card.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <QuoteSection
          quote={quoteOfMonth?.quote}
          author={quoteOfMonth?.author}
          imageUrl={quoteImageUrl || undefined}
        />

        {/* Upcoming Events Section */}
        <EventsCarousel />

        {/* Pastors Section */}
        <section className="py-16 sm:py-16 sm:py-20 md:py-24 bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">Our Pastors</p>
                <h2 className="text-3xl md:text-5xl font-semibold leading-tight">
                  Pastor Esau Banda &amp; Pastor Loyce Banda
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  Pastor Esau Banda and Pastor Loyce Banda serve with passion, vision, and a deep love for God&apos;s people.
                  Together, they lead PICC with a heart for discipleship, prayer, and transforming lives through the Gospel.
                </p>
                <p className="text-white/70">
                  Their ministry continues to inspire faith, unity, and growth across every generation of the church.
                </p>
              </div>
              <div className="relative aspect-[4/3] rounded-[28px] overflow-hidden shadow-2xl bg-white/5">
                <Image
                  src={pastorsImage}
                  alt="Pastor Esau Banda and Pastor Loyce Banda"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-top"
                  unoptimized={isLocalUpstreamImage(pastorsImage)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Listen Now Section */}
        <section id="listen-now" className="py-16 sm:py-16 sm:py-20 md:py-24 bg-background scroll-mt-24">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[28px] group">
              <div className="absolute inset-0">
                <Image
                  src={listenNowImage}
                  alt="Listen now background"
                  fill
                  sizes="100vw"
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  unoptimized={isLocalUpstreamImage(listenNowImage)}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

              <div className="relative p-6 sm:p-8 md:p-12 lg:p-16 text-white">
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4">Listen Now</p>
                    <h2 className="text-3xl md:text-5xl font-semibold leading-tight mb-4">Listen Now</h2>
                    <p className="text-white/80 max-w-xl">
                      Fill your heart with life-transforming messages right here on the page.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href="https://open.spotify.com/show/4pY3cP8R60wHhzhUciLKK6"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
                      >
                        Open on Spotify
                      </Link>
                      <SpotifyFollowDialog
                        showId="4pY3cP8R60wHhzhUciLKK6"
                        buttonClassName="rounded-full border border-white/50 bg-transparent text-white px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
                    <iframe
                      title="Pastor Esau Banda on Spotify"
                      className="w-full h-[200px] sm:h-[232px] md:h-[260px] rounded-xl"
                      src="https://open.spotify.com/embed/show/4pY3cP8R60wHhzhUciLKK6"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ministries Section */}
        <section id="ministries" className="py-16 sm:py-16 sm:py-20 md:py-24 bg-background scroll-mt-24">
          <style>{`
            @keyframes marqueeScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .ministry-marquee {
              mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
            }
            .ministry-track {
              animation: marqueeScroll 30s linear infinite;
            }
            .ministry-track:hover {
              animation-play-state: paused;
            }
          `}</style>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 items-start mb-10">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-primary leading-tight">
                  You Were Made For This.
                </h2>
                <p className="text-foreground/70 mt-4 max-w-xl">
                  Find your family, your calling, and your community right here.
                </p>
              </div>
            </div>
          </div>

          <div className="ministry-marquee overflow-hidden">
            <div className="ministry-track flex gap-4 sm:gap-6 w-[200%] px-4 sm:px-6">
              {[...ministryCards, ...ministryCards].map((item, index) => (
                <Link
                  key={`${item.title}-${index}`}
                  href={item.href}
                  className="block relative min-w-[70vw] w-[70vw] sm:min-w-[44vw] sm:w-[44vw] md:min-w-[320px] md:w-[320px] lg:min-w-[340px] lg:w-[340px] h-[200px] sm:h-[240px] md:h-[300px] rounded-2xl overflow-hidden shadow-xl"
                  aria-label={item.title}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 70vw, (max-width: 1024px) 44vw, 340px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <p className="text-white text-base sm:text-lg md:text-xl font-semibold">{item.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Livestreams Section */}
        <section className="py-16 sm:py-16 sm:py-24 md:py-32 bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[28px] shadow-2xl max-w-5xl mx-auto min-h-[360px] sm:min-h-[440px] md:min-h-[560px] flex items-center">
              <div className="absolute inset-0">
                <Image
                  src={livestreamImage}
                  alt="Latest livestream"
                  fill
                  sizes="(max-width: 1024px) 100vw, 80vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />

              <div className="relative p-8 md:p-12 lg:p-14 text-white">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4">Livestream</p>
                <h2 className="text-3xl md:text-5xl font-semibold leading-tight mb-6 max-w-2xl">
                  Listen to God&apos;s Word for You.
                </h2>

                <div className="flex flex-wrap gap-4">
                  <Link href="/livestream">
                    <Button className="bg-red-600 text-white hover:bg-red-700 rounded-full px-6 py-3">
                      View Livestream
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Moments Section */}
        <MomentsSection />

        {/* Service Times Section */}
        <section id="see-you-in-church" className="py-16 sm:py-16 sm:py-20 md:py-24 bg-background scroll-mt-24">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[28px] shadow-2xl">
              <div className="absolute inset-0">
                <Image
  src={seeYouBg}
  alt="See you in church"
  fill
  sizes="100vw"
  className="object-cover"
  unoptimized={isLocalUpstreamImage(seeYouBg)}
/>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" />

              <div className="relative p-6 sm:p-10 md:p-14 text-white scroll-mt-24">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-5xl font-semibold mb-3">
                    {seeYouInChurch?.title || 'Announcements & Events For The Week.'}
                  </h2>
                  <p className="text-white/80">
                    {seeYouInChurch?.subtitle || 'Grow deeper in your walk with God this week.'}
                  </p>
                  <div className="mt-6">
                    <Link href="/locations">
                      <Button className="rounded-full px-6 py-3 border border-white/40 bg-transparent text-white hover:bg-white/10">
                        Get Directions
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 text-left">
                  {seeYouServices.map((program: ServiceLike) => {
                    const time = program.startTime
                      ? program.endTime
                        ? `${program.startTime} - ${program.endTime}`
                        : program.startTime
                      : program.time;

                    return (
                      <div
                        key={program.id || `${program.dayOfWeek || program.day}-${program.title}-${time}`}
                        className="rounded-2xl bg-white/10 border border-white/10 p-4 sm:p-6"
                      >
                        <p className="text-sm uppercase tracking-[0.2em] text-white/70">
                          {program.dayOfWeek || program.day}
                        </p>
                        <p className="mt-2 text-lg font-semibold">{time}</p>
                        <p className="text-white/70 text-sm">{program.title}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="py-16 md:py-20 -mt-6 bg-background">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 md:p-12 w-full">
              <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />

              <div className="relative grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-foreground/60 mb-4">Support</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Support Our Ministry</h2>
                  <p className="text-foreground/70 text-lg">
                    Your generous giving helps us continue our mission of worship, fellowship, and community service.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
                  <Link href="/give">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-full">
                      Give Today
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
