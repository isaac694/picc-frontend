import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ServicesPage() {
  const services = [
    {
      title: 'Sunday Worship Service',
      day: 'Sunday',
      time: '10:00 AM - 11:30 AM',
      location: 'Main Sanctuary',
      description: 'Our main worship service featuring contemporary music, prayer, and biblical teaching.',
      highlights: ['Live worship band', 'Expository preaching', 'Prayer time', 'Fellowship']
    },
    {
      title: 'Wednesday Prayer Service',
      day: 'Wednesday',
      time: '7:00 PM - 8:30 PM',
      location: 'Prayer Chapel',
      description: 'A focused prayer service dedicated to intercession and seeking God\'s guidance.',
      highlights: ['Prayer focus', 'Scripture meditation', 'Testimonies', 'Community prayer']
    },
    {
      title: 'Youth Service',
      day: 'Friday',
      time: '6:00 PM - 7:30 PM',
      location: 'Fellowship Hall',
      description: 'A dynamic service designed for young adults with contemporary worship and relevant messages.',
      highlights: ['Contemporary worship', 'Youth-focused teaching', 'Fellowship', 'Games and activities']
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Service Times</h1>
            <p className="text-lg text-foreground/70">Join us for worship and fellowship</p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {services.map((service, i) => (
                <Card key={i} className="p-8 hover:shadow-lg transition-shadow">
                  <h2 className="text-2xl font-bold text-primary mb-4">{service.title}</h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-foreground/80">
                      <span className="font-semibold">📅 {service.day}:</span>
                      <span>{service.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/80">
                      <span className="font-semibold">📍</span>
                      <span>{service.location}</span>
                    </div>
                  </div>
                  <p className="text-foreground/70 mb-6">{service.description}</p>
                  <div className="mb-6">
                    <h3 className="font-semibold text-primary mb-3">What to Expect:</h3>
                    <ul className="space-y-2">
                      {service.highlights.map((highlight, j) => (
                        <li key={j} className="flex items-center gap-2 text-foreground/70">
                          <span className="w-2 h-2 bg-secondary rounded-full"></span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/contact">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Get Directions
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>

            {/* Additional Info */}
            <Card className="p-8 bg-muted/30 border-2 border-secondary/20">
              <h2 className="text-2xl font-bold text-primary mb-4">First Time Visitor?</h2>
              <p className="text-foreground/70 mb-6">
                Welcome! We&apos;re excited to meet you. Here&apos;s what you can expect when you visit:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-primary mb-2">Arrival & Parking</h3>
                  <p className="text-foreground/70">Plenty of free parking available. Come early to find a good spot and have time to settle in.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">Welcoming Environment</h3>
                  <p className="text-foreground/70">Our greeters will welcome you at the entrance and help you find your way around.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">Kids & Families</h3>
                  <p className="text-foreground/70">We have age-appropriate programs and a nursery available during services.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">No Pressure</h3>
                  <p className="text-foreground/70">Come as you are. There&apos;s no expectation to participate in anything you&apos;re not comfortable with.</p>
                </div>
              </div>
              <div className="mt-8">
                <Link href="/contact">
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    Connect With Us
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Questions About Our Services?</h2>
            <p className="mb-6 text-primary-foreground/90">Get in touch with us - we&apos;d love to answer any questions you might have</p>
            <Link href="/contact">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Contact Us
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

