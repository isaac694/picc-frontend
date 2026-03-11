import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import VerseSection from '@/components/VerseSection';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MissionSection from '@/components/MissionSection';  // ← Add this line
import EventsCarousel from '@/components/EventsCarousel';

const HERO_IMAGES = [
  '/hero/hero-1.jpg',
  '/hero/hero-2.jpg',
  '/hero/hero-3.jpg',
  '/hero/hero-4.jpg',
  '/hero/hero-5.jpg',
  '/hero/hero-6.jpg',
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
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Your Faith Walk</h2>
            <p className="text-foreground/70">No matter where you are in your faith journey, there is always a next step.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                href: '/about',
                label: 'LEARN',
                title: 'About The Church',
                img: '/cards/about-church.jpg',
              },
              {
                href: '/service-times',
                label: 'WORSHIP',
                title: 'View Service Times',
                img: '/cards/service-times.jpg',
              },
              {
                href: '/events',
                label: 'GET INVOLVED',
                title: 'Upcoming Programs',
                img: '/cards/upcoming-events.jpg',
              },
              {
                href: '/give',
                label: 'GIVE',
                title: 'Give Offerings',
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



        {/* Latest Sermons Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-primary mb-2">Latest Sermons</h2>
              <p className="text-foreground/70">Listen to inspiring messages from our pastors</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <Image
                      src="/placeholder-event.jpg"
                      alt="Sermon"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 text-primary">
                      {i === 1 && 'Faith in Hard Times'}
                      {i === 2 && 'The Power of Prayer'}
                      {i === 3 && 'Living with Purpose'}
                    </h3>
                    <p className="text-sm text-foreground/70 mb-4">
                      {i === 1 && 'A powerful message about trusting God through challenges'}
                      {i === 2 && 'Understanding effective prayer and its impact on our lives'}
                      {i === 3 && 'Discovering God\'s purpose for your life'}
                    </p>
                    <p className="text-xs text-foreground/50 mb-4">
                      {i === 1 && 'Pastor James • 45 minutes'}
                      {i === 2 && 'Pastor Sarah • 50 minutes'}
                      {i === 3 && 'Pastor Michael • 48 minutes'}
                    </p>
                    <Link href="/sermons">
                      <Button variant="outline" className="w-full">
                        Listen Now
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/sermons">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  View All Sermons
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Upcoming Events Section */}
          <EventsCarousel />

        {/* Service Times Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-primary mb-2">See You In Church!</h2>
              <p className="text-foreground/70">Join us for worship and fellowship</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Sunday Service', time: '10:00 AM', description: 'Main worship service with teaching and worship' },
                { title: 'Wednesday Prayer', time: '7:00 PM', description: 'Mid-week prayer and intercession' },
                { title: 'Youth Service', time: '6:00 PM', description: 'Service for young adults' },
              ].map((service, i) => (
                <Card key={i} className="p-8 text-center hover:shadow-lg transition-shadow border-2 border-muted">
                  <h3 className="font-bold text-xl text-primary mb-2">{service.title}</h3>
                  <p className="text-3xl font-bold text-secondary mb-4">{service.time}</p>
                  <p className="text-foreground/70">{service.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Support Our Ministry</h2>
            <p className="text-lg text-primary-foreground/90 mb-8">
              Your generous giving helps us continue our mission of worship, fellowship, and community service
            </p>
            <Link href="/give">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 py-6">
                Give Today
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

