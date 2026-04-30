import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import EventsListSection from '@/components/EventsListSection';

export default function EventsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <EventsListSection apiPath="/api/events?scope=general" />
      </main>
      <Footer />
    </>
  );
}
