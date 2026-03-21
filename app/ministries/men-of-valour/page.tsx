'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function MenOfValourPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="py-24 md:py-32 bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)] text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3">Ministry</p>
            <h1 className="text-4xl md:text-6xl font-semibold mb-3">Men of Valour</h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              Equipping men to lead with faith, courage, and integrity.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
