import { Suspense } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import NewsIndexClient from './NewsIndexClient';

export const metadata = {
  title: 'News - PICC',
  description: 'Church and ministry news from Pentecost International Christian Centre.',
};

export default function NewsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#f7f5f0]">
        <Suspense fallback={null}>
          <NewsIndexClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
