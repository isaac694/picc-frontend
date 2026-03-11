const MOMENTS = [
  {
    href: "https://web.facebook.com/photo?fbid=1513295583485291&set=a.211134133701449",
    image: "/moments/1.jpg",
    title: "Moment 1",
  },
  {
    href: "https://web.facebook.com/photo?fbid=1512882233526626&set=a.211134133701449",
    image: "/moments/2.jpg",
    title: "Moment 2",
  },
  {
    href: "https://web.facebook.com/photo?fbid=1512502576897925&set=a.211134133701449",
    image: "/moments/3.jpg",
    title: "Moment 3",
  },
  {
    href: "https://web.facebook.com/photo/?fbid=1511974113617438&set=pcb.1511978686950314",
    image: "/moments/4.jpg",
    title: "Moment 4",
  },
  {
    href: "https://web.facebook.com/photo/?fbid=1511968180284698&set=pcb.1511970876951095",
    image: "/moments/5.jpg",
    title: "Moment 5",
  },
  {
    href: "https://web.facebook.com/photo/?fbid=1511906870290829&set=pcb.1511916916956491",
    image: "/moments/6.jpg",
    title: "Moment 6",
  },
  {
    href: "https://web.facebook.com/photo?fbid=1511748960306620&set=a.211134133701449",
    image: "/moments/7.jpg",
    title: "Moment 7",
  },
  {
    href: "https://web.facebook.com/photo/?fbid=1511067390374777&set=pcb.1511075417040641",
    image: "/moments/8.jpg",
    title: "Moment 8",
  },
  {
    href: "https://web.facebook.com/photo/?fbid=1511051377043045&set=a.211134133701449",
    image: "/moments/9.jpg",
    title: "Moment 9",
  },
];
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import VerseSection from '@/components/VerseSection';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MissionSection from '@/components/MissionSection';  
import EventsCarousel from '@/components/EventsCarousel';
import QuoteSection from '@/components/QuoteSection';

const HERO_IMAGES = [
  '/hero/hero-1.jpg',
  '/hero/hero-2.jpg',
  '/hero/hero-3.jpg',
  '/hero/hero-4.jpg',
  '/hero/hero-5.jpg',
  '/hero/hero-6.jpg',
];

const MINISTRY_CARDS = [
  { title: 'Women of Hope', image: '/hero/hero-2.jpg' },
  { title: 'ICD', image: '/hero/hero-5.jpg' },
  { title: 'Men of Valour', image: '/hero/hero-1.jpg' },
  { title: 'Prison Ministry', image: '/hero/hero-6.jpg' },
  { title: 'Youth Church Ministry', image: '/hero/hero-3.jpg' },
  { title: 'Hope and Beauty', image: '/hero/hero-4.jpg' },
  { title: 'Heritage Ministry', image: '/cards/about-church.jpg' },
];

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative h-[440px] md:h-[600px] overflow-hidden flex items-center">
          <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 gap-1 p-1 hero-collage">
            {HERO_IMAGES.map((src, index) => (
              <div key={src} className="relative h-full min-h-0">
                <Image
                  src={src}
                  alt={`PICC hero background ${index + 1}`}
                  fill
                  priority={index < 2}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/66 to-black/72" />
          <div className="absolute inset-0 bg-primary/45" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
                Welcome to Pentecost International Christian Center
              </h1>
              <p className="text-lg text-primary-foreground/90 mb-8">
                A place of worship, fellowship, and spiritual growth for all
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="https://www.youtube.com/results?search_query=esau+banda" target="_blank" rel="noreferrer">
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

        <VerseSection />
        
        <MissionSection />


      {/* Quick Links / "Your Faith Walk" Section */}
      <section className="py-16 bg-[linear-gradient(180deg,#fffaf0_0%,#fff6ec_100%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Grow in Every Season</h2>
            <p className="text-foreground/70">Whether you're new or have been with us for years — there's always more.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                href: '/about',
                label: 'DISCOVER',
                title: 'Who We Are',
                img: '/cards/about-church.jpg',
              },
              {
                href: '/service-times',
                label: 'ATTEND',
                title: 'Join a Service',
                img: '/cards/service-times.jpg',
              },
              {
                href: '/events',
                label: 'CONNECT',
                title: 'Get Involved',
                img: '/cards/upcoming-events.jpg',
              },
              {
                href: '/give',
                label: 'GIVE',
                title: 'Support the Mission',
                img: '/cards/give-offerings.jpg',
              },
            ].map((card) => (
              <Link key={card.href} href={card.href}>
                <div className="group block rounded-2xl overflow-hidden relative h-80 md:h-96 cursor-pointer">
                  <div className="absolute inset-0">
                    <Image
                      src={card.img}
                      alt={card.title}
                      fill
                      className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-105"
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

        <QuoteSection />

        {/* Upcoming Events Section */}
          <EventsCarousel />

        {/* Listen Now Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <Link
              href="https://open.spotify.com/episode/6bAF7YTQklMP6rDGKBUpdM?go=1&sp_cid=b98eb388c81efa9af07fa4c8a176720c&utm_source=embed_player_p&utm_medium=desktop&nd=1&dlsi=ce4fdd6b2e8e4c84"
              target="_blank"
              rel="noreferrer"
              className="relative block overflow-hidden rounded-[28px] group"
            >
              <div className="absolute inset-0">
                <Image
                  src="/pastor/pastor-photo.jpg"
                  alt="Listen now background"
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

              <div className="relative p-8 md:p-12 lg:p-16 text-white">
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4">Listen Now</p>
                    <h2 className="text-3xl md:text-5xl font-semibold leading-tight mb-4">Listen Now</h2>
                    <p className="text-white/80 max-w-xl">
                      Fill your heart with life-transforming messages. Available on Spotify.
                    </p>
                    <div className="mt-6">
                      <Link
                        href="https://open.spotify.com/show/4pY3cP8R60wHhzhUciLKK6?go=1&sp_cid=b98eb388c81efa9af07fa4c8a176720c&utm_source=embed_player_p&utm_medium=desktop&nd=1&dlsi=91eb8fcea8f14a34"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
                      >
                        Pastor Esau Banda
                      </Link>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                        <Image
                          src="/pastor/pastor-photo.jpg"
                          alt="Podcast cover"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Flee Sexual Immorality Part 3</p>
                        <p className="text-xs text-white/70">Latest message • 1:05:59</p>
                        <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
                          <div className="h-full w-1/3 bg-white" />
                        </div>
                      </div>
                      <button
                        className="w-12 h-12 rounded-full bg-white text-black grid place-items-center font-bold"
                        aria-label="Play"
                      >
                        ▶
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
                      <span className="px-3 py-1 rounded-full bg-white/10">Spotify</span>
                      <Link
                        href="https://open.spotify.com/show/4pY3cP8R60wHhzhUciLKK6?go=1&sp_cid=b98eb388c81efa9af07fa4c8a176720c&utm_source=embed_player_p&utm_medium=desktop&nd=1&dlsi=91eb8fcea8f14a34"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                      >
                        Pastor Esau Banda
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Ministries Section */}
        <section className="py-16 md:py-20 bg-background">
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
                  Find your family, your calling, and your community — right here.
                </p>
              </div>
            </div>
          </div>

          <div className="ministry-marquee overflow-hidden">
            <div className="ministry-track flex gap-6 w-[200%] px-6">
              {[...MINISTRY_CARDS, ...MINISTRY_CARDS].map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="relative w-[260px] sm:w-[300px] md:w-[340px] h-[220px] md:h-[240px] rounded-2xl overflow-hidden shadow-xl"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <p className="text-white text-lg md:text-xl font-semibold">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

                {/* Latest Sermons Section */}
        <section className="py-20 md:py-28 bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[28px] shadow-2xl max-w-5xl mx-auto min-h-[420px] md:min-h-[480px] flex items-center">
              <div className="absolute inset-0">
                <Image
                  src="/hero/hero-6.jpg"
                  alt="Latest sermon"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />

              <div className="relative p-8 md:p-12 lg:p-14 text-white">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4">Sermons</p>
                <h2 className="text-3xl md:text-5xl font-semibold leading-tight mb-6 max-w-2xl">
                  Listen to God&apos;s Word for You.
                </h2>

                <div className="flex flex-wrap gap-4">
                  <Link href="/sermons">
                    <Button className="bg-red-600 text-white hover:bg-red-700 rounded-full px-6 py-3">
                      View All Sermons
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
                {/* Moments Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="w-full px-0">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">We Are Family</h2>
              <p className="text-foreground/70 mt-2">Snapshots of life together. Click any image to relive it on Facebook</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {MOMENTS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block overflow-hidden shadow-lg"
                >
                  <div className="relative h-[30rem] md:h-[30rem]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </section>
{/* Service Times Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[28px] shadow-2xl">
              <div className="absolute inset-0">
                <Image
                  src="/hero/hero-3.jpg"
                  alt="See you in church"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" />

              <div className="relative p-10 md:p-14 text-white">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-5xl font-semibold mb-3">See You In Church</h2>
                  <p className="text-white/80">Grow deeper in your walk with God this week.</p>
                  <div className="mt-6">
                    <Link href="/contact">
                      <Button className="rounded-full px-6 py-3 border border-white/40 bg-transparent text-white hover:bg-white/10">
                        Get Directions
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/70">Sunday</p>
                    <p className="mt-2 text-lg font-semibold">10:00 AM</p>
                    <p className="text-white/70 text-sm">Main worship service</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/70">Wednesday</p>
                    <p className="mt-2 text-lg font-semibold">7:00 PM</p>
                    <p className="text-white/70 text-sm">Prayer & intercession</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
{/* CTA Section */}
        <section className="py-12 md:py-14 -mt-6 bg-background">
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
                  <Link href="/give">
                    <Button variant="outline" className="text-lg px-8 py-6 rounded-full border-primary/40">
                      Learn More
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
