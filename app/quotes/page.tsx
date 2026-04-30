import { apiFetch, apiUrl } from '@/lib/api';
import QuotesArchiveClient from './QuotesArchiveClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quotes Archive | PICC',
  description: 'A collection of monthly quotes and spiritual wisdom from Pentecost International Christian Centre.',
};

async function getQuotes() {
  try {
    // Attempt to fetch all quotes (if the endpoint exists/is updated later)
    const response = await apiFetch('/api/quotes', {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error('Failed to fetch quotes archive:', error);
  }

  // Fallback: Try to get the current Quote of the Month at least
  try {
    const response = await apiFetch('/api/quote-of-month');
    if (response.ok) {
      const data = await response.json();
      if (data && data.quote) {
        return [{
          id: data.id || 'current',
          quote: data.quote,
          author: data.author || 'Pastor Esau Banda',
          imageUrl: data.imageUrl ? (data.imageUrl.startsWith('http') ? data.imageUrl : apiUrl(data.imageUrl)) : undefined,
          createdAt: data.createdAt || new Date().toISOString(),
        }];
      }
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
