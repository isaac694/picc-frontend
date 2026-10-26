import { apiFetch } from '@/lib/api';
import { mapQuoteForArchive, normalizeQuoteRecord } from '@/lib/quotes';
import QuotesArchiveClient from './QuotesArchiveClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quotes Archive | PICC',
  description: 'Past quotes and spiritual wisdom from Pentecost International Christian Centre.',
};

async function getQuotes() {
  try {
    const response = await apiFetch('/api/quotes?archive=1', {
      next: { revalidate: 60 },
    });

    if (response.ok) {
      const data = await response.json();
      const rawList = Array.isArray(data) ? data : [];
      return rawList
        .map(normalizeQuoteRecord)
        .filter((item): item is NonNullable<ReturnType<typeof normalizeQuoteRecord>> => Boolean(item))
        .map(mapQuoteForArchive);
    }
  } catch (error) {
    console.error('Failed to fetch quotes archive:', error);
  }

  return [];
}

export default async function QuotesArchivePage() {
  const initialQuotes = await getQuotes();

  return <QuotesArchiveClient initialQuotes={initialQuotes} />;
}
