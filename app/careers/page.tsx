import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CareersOpenPositions from '@/components/careers/CareersOpenPositions';

export const metadata = {
  title: 'Careers - PICC',
  description: 'Explore current vacancies and service opportunities at PICC.',
};

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <Navigation />

      <section className="relative overflow-hidden bg-[#0d1f3c] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,175,55,0.22),transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="relative text-secondary font-semibold uppercase tracking-[0.3em] mb-4">
            Home / Careers
          </p>
          <h1 className="relative text-4xl md:text-6xl font-bold mb-6">
            Join Our Team
          </h1>
          <p className="relative text-lg md:text-xl text-white/85 max-w-3xl mx-auto">
            Build your career with PICC. We are looking for talented people who want to serve with excellence and help shape lives through faith-based education.
          </p>
        </div>
      </section>

      <section className="relative z-10 pb-20 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CareersOpenPositions />
        </div>
      </section>

      <Footer />
    </main>
  );
}
