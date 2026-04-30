import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import EventsListSection from '@/components/EventsListSection';

export const metadata = {
  title: 'Hope School Events',
  description: 'Upcoming events for Hope School',
};

export default function HopeSchoolEventsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-16 md:py-20 bg-[#0d1f3c] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4">
              Hope School
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
              Events
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              Browse upcoming Hope School events and register to attend.
            </p>
          </div>
        </section>

        <EventsListSection apiPath="/api/events?scope=hope-school" />
      </main>
      <Footer />
    </>
  );
}
