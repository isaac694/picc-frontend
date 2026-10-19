import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import EventDetailView from '@/components/events/EventDetailView';

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <EventDetailView eventId={id} />
      </main>
      <Footer />
    </>
  );
}
