import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, apiUrl } from '@/lib/api';
import DevotionsArchiveClient from './DevotionsArchiveClient';

type DevotionsResult = {
  devotions: any[];
  debugMessage?: string;
};

type ConfessionsResult = {
  confessions: any[];
  debugMessage?: string;
};

async function getDevotions(): Promise<DevotionsResult> {
  try {
    const response = await apiFetch('/api/devotions?archive=1&take=500', {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { devotions: [], debugMessage: 'Devotions list endpoint returned a non-OK response.' };
    }

    const data = await response.json();
    const devotions = data.devotions || [];

    return { devotions };
  } catch (error) {
    return { devotions: [], debugMessage: 'Unable to reach devotion endpoints.' };
  }
}

async function getConfessions(): Promise<ConfessionsResult> {
  try {
    const response = await apiFetch('/api/confessions?archive=1&take=500', {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { confessions: [], debugMessage: 'Confessions list endpoint returned a non-OK response.' };
    }

    const data = await response.json();
    const confessions = (data.confessions || []).map((confession: any) => ({
      ...confession,
      imageUrl: confession.imageUrl
        ? confession.imageUrl.startsWith('http')
          ? confession.imageUrl
          : apiUrl(confession.imageUrl)
        : '',
    }));

    return { confessions };
  } catch (error) {
    return { confessions: [], debugMessage: 'Unable to reach confessions endpoints.' };
  }
}

export default async function DevotionsPage() {
  const { devotions, debugMessage } = await getDevotions();
  const {
    confessions: confessionsFromApi,
    debugMessage: confessionsDebugMessage,
  } = await getConfessions();
  const combinedDebug = debugMessage || confessionsDebugMessage;
  const showDebug = process.env.NODE_ENV !== 'production' && Boolean(combinedDebug);

  const visibleDevotions = devotions;
  const visibleConfessions = confessionsFromApi;

  return (
    <>
      <Navigation />
      <DevotionsArchiveClient
        devotions={visibleDevotions}
        confessions={visibleConfessions}
        showDebug={showDebug}
        debugMessage={combinedDebug}
      />
      <Footer />
    </>
  );
}



