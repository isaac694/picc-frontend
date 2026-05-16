import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import HopeSchoolOnlineClassDashboard from '@/components/schools/HopeSchoolOnlineClassDashboard';

export const metadata = {
  title: 'Hope School Online Class Dashboard',
  description: 'Student dashboard for Hope School of Ministry online classes.',
};

export default function HopeSchoolOnlineClassDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Navigation />
      <main className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <HopeSchoolOnlineClassDashboard />
        </div>
      </main>
      <Footer />
    </div>
  );
}
