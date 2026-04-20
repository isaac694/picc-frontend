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
    const response = await apiFetch('/api/devotions?take=500', {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return { devotions: [], debugMessage: 'Devotions list endpoint returned a non-OK response.' };
    }

    const data = await response.json();
    const devotions = data.devotions || [];

    if (devotions.length > 0) {
      return { devotions };
    }

    const latestResponse = await apiFetch('/api/devotions/latest', {
      next: { revalidate: 300 },
    });
    if (!latestResponse.ok) {
      return { devotions: [], debugMessage: 'Latest devotion endpoint returned a non-OK response.' };
    }
    const latestData = await latestResponse.json();
    return {
      devotions: latestData.devotion ? [latestData.devotion] : [],
      debugMessage: latestData.devotion ? undefined : 'Latest devotion endpoint returned no devotion.',
    };
  } catch (error) {
    return { devotions: [], debugMessage: 'Unable to reach devotion endpoints.' };
  }
}

async function getConfessions(): Promise<ConfessionsResult> {
  try {
    const response = await apiFetch('/api/confessions?take=500', {
      next: { revalidate: 300 },
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

  const fallbackConfessions = [
    {
      id: 'confession-my-confession',
      title: 'My Confession',
      imageUrl: '/home/declaration.jpeg',
      publishAt: null,
    },
  ];
  const fallbackDevotion = {
    id: 'fallback-2026-04-03',
    title: 'Be Prayerful',
    publishAt: '2026-04-03T00:00:00.000Z',
    content: [
      'Please Find Your Daily Rivers of Hope Devotional',
      'Friday, 3 April 2026',
      '',
      'Be Prayerful',
      '',
      'Friends, prayer is indispensable in our lives. It is a vital channel for divine assistance. God said, “Call to Me, and I will answer you, and show you great and mighty things, which you do not know” (Jeremiah 33:3). When we call to Him, He will come down to assist us. He will answer our prayers and grant us the desires of our hearts.',
      '',
      'In 1 Chronicles 4:9-10, we read about Jabez whose life was battered, shattered and tattered. It was quite a painful experience for him. It did not look like he would get through. However, when he decided to pray, God came down with explosive assistance. The hand of God rested upon him and he became more honourable than his brothers.',
      '',
      'Prayer is our instrument for empowerment. When we pray, we generate power for success and exploits in life. When our Lord Jesus Christ came back from a prayer and fasting retreat, He returned in the power of the Spirit by which He did mighty exploits during His earthly ministry. The Bible says, “Then Jesus returned in the power of the Spirit to Galilee, and news of Him went out through all the surrounding region. And He taught in their synagogues, being glorified by all” (Luke 4:14-15).',
      '',
      'To be prayerful is to be powerful. The early Church also operated in great power for exploits. When they prayed, the place where they had gathered shook and they were all filled with the Holy Spirit and spoke the word of God with boldness. They gave witness to the resurrection of Jesus Christ with great power (Acts 4:31, 33).',
      '',
      'Your Prayer Today',
      '',
      'Father, endue me with the spirit of prayer and supplication in Jesus mighty name!',
    ],
  };
  const visibleDevotions = devotions.length > 0 ? devotions : [fallbackDevotion];
  const visibleConfessions =
    confessionsFromApi.length > 0 ? confessionsFromApi : fallbackConfessions;

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



