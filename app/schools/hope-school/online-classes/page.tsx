import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import HopeSchoolOnlineClassAuth from '@/components/schools/HopeSchoolOnlineClassAuth';
import { BookOpenCheck, MonitorPlay } from 'lucide-react';

export const metadata = {
  title: 'Hope School Online Classes',
  description: 'Register or log in for Hope School of Ministry online classes.',
};

type OnlineClassesPageProps = {
  searchParams?: Promise<{
    mode?: string | string[];
  }>;
};

export default async function HopeSchoolOnlineClassesPage({
  searchParams,
}: OnlineClassesPageProps) {
  const params = searchParams ? await searchParams : {};
  const modeParam = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const selectedMode = modeParam === 'login' ? 'login' : 'register';

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Navigation />

      <main>
        <section className="bg-[#0d1f3c] px-4 py-20 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="inline-flex items-center gap-2 border border-[#c9a84c]/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a84c]">
              <MonitorPlay size={14} />
              Online Classes
            </div>
            <h1 className="mt-6 max-w-3xl font-serif text-4xl font-bold tracking-tight sm:text-5xl">
              Hope School Online Class Portal
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
              Register for online class access or log in when your class dashboard is ready.
            </p>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <HopeSchoolOnlineClassAuth selectedMode={selectedMode} />
          </div>

          <div className="mx-auto mt-8 max-w-6xl border border-dashed border-[#c9a84c]/60 bg-[#fffaf0] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[#c9a84c] text-[#c9a84c]">
                <BookOpenCheck size={18} />
              </span>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0d1f3c]">
                  Class setup area
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Use this page as the front door for the Hope School online class experience. Registration and login are connected; class dashboard content can be added next.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
