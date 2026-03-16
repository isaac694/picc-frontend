import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EventsPage() {
  const events = [
    {
      id: 1,
      title: 'Easter Celebration',
      description: 'Join us for our special Easter service and celebration with worship, testimony, and fellowship',
      date: 'Next Sunday',
      time: '9:00 AM - 12:00 PM',
      location: 'Main Sanctuary',
      image: '/events/event-1.jpg'
    },
    {
      id: 2,
      title: 'Community Outreach',
      description: 'Help us serve the community through outreach programs. All volunteers welcome!',
      date: 'March 20th',
      time: '10:00 AM - 2:00 PM',
      location: 'Community Center',
      image: '/events/event-2.jpg'
    },
    {
      id: 3,
      title: 'Youth Night Games',
      description: 'Fun evening of games, fellowship, and spiritual discussion for young adults',
      date: 'March 15th',
      time: '6:00 PM - 8:00 PM',
      location: 'Fellowship Hall',
      image: '/events/event-3.jpg'
    },
    {
      id: 4,
      title: 'Prayer Vigil',
      description: '24-hour prayer vigil for the community and church needs. Join for any length of time.',
      date: 'March 22-23',
      time: 'All Day',
      location: 'Prayer Chapel',
      image: '/events/event-4.jpg'
    },
    {
      id: 5,
      title: 'Bible Study Series',
      description: 'Join our new book of the Bible study series. Explore scripture together.',
      date: 'Wednesdays',
      time: '6:30 PM - 7:30 PM',
      location: 'Chapel Room B',
      image: '/events/event-5.jpg'
    },
    {
      id: 6,
      title: 'Ladies Brunch',
      description: 'Monthly gathering for the women of our church with fellowship and encouragement',
      date: 'March 16th',
      time: '10:00 AM - 12:00 PM',
      location: 'Fellowship Hall',
      image: '/events/event-1.jpg'
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Events & Activities</h1>
            <p className="text-lg text-foreground/70">Stay connected with our church community</p>
          </div>
        </section>

        {/* Events Grid */}
        <section className="py-20 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-xl text-primary mb-2">{event.title}</h3>
                    <p className="text-foreground/70 mb-4 flex-1">{event.description}</p>
                    <div className="space-y-2 text-sm text-foreground/70 mb-4">
                      <p className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{event.date}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>⏱️</span>
                        <span>{event.time}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{event.location}</span>
                      </p>
                    </div>
                    <Link href="/contact">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated on Events</h2>
            <p className="mb-6 text-primary-foreground/90">Subscribe to our newsletter for the latest events and announcements</p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg text-foreground"
              />
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Subscribe
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
