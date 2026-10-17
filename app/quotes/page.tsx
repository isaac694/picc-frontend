import { apiFetch } from '@/lib/api';
import { mapQuoteForArchive, normalizeQuoteRecord } from '@/lib/quotes';
import QuotesArchiveClient from './QuotesArchiveClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quotes Archive | PICC',
  description: 'A collection of monthly quotes and spiritual wisdom from Pentecost International Christian Centre.',
};

async function getQuotes() {
  try {
    const response = await apiFetch('/api/quotes', {
      next: { revalidate: 3600 },
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

  try {
    const response = await apiFetch('/api/quote-of-month', { next: { revalidate: 3600 } });
    if (response.ok) {
      const record = normalizeQuoteRecord(await response.json());
      if (record) return [mapQuoteForArchive(record)];
    }
  } catch (error) {
    console.error('Failed to fetch fallback quote:', error);
  }

  return [];
}

export default async function QuotesArchivePage() {
  const initialQuotes = await getQuotes();

  return <QuotesArchiveClient initialQuotes={initialQuotes} />;
}
