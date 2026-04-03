import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiUrl } from '@/lib/api';

type DevotionsResult = {
  devotions: any[];
  debugMessage?: string;
};

async function getDevotions(): Promise<DevotionsResult> {
  try {
    const response = await fetch(apiUrl('/api/devotions?take=500'), {
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

    const latestResponse = await fetch(apiUrl('/api/devotions/latest'), {
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

export default async function DevotionsPage() {
  const { devotions, debugMessage } = await getDevotions();
  const showDebug = process.env.NODE_ENV !== 'production' && debugMessage;
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

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <section className="py-16 sm:py-20 md:py-24 bg-[linear-gradient(180deg,#fffaf0_0%,#fff6ec_100%)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                Daily Devotions
              </p>
              <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
                All Devotions
              </h1>
              <p className="text-foreground/70 max-w-2xl">
                A growing archive of daily reflections shared with the PICC family.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleDevotions.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-white p-6">
                  <p className="text-foreground/70">
                    No devotions have been published yet. Check back soon.
                  </p>
                  {showDebug ? (
                    <p className="mt-3 text-xs text-foreground/50">
                      Debug: {debugMessage}
                    </p>
                  ) : null}
                  <div className="mt-4">
                    <Link href="/">
                      <span className="text-primary hover:underline">Return home</span>
                    </Link>
                  </div>
                </div>
              ) : (
                visibleDevotions.map((devotion: any) => {
                  const formattedDate = devotion.publishAt
                    ? new Intl.DateTimeFormat('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(new Date(devotion.publishAt))
                    : '';

                  return (
                    <article
                      key={devotion.id}
                      className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-2">
                        {formattedDate}
                      </p>
                      <h2 className="text-xl font-semibold text-foreground mb-3">
                        {devotion.title || 'Daily Devotion'}
                      </h2>
                      <p className="text-foreground/70 leading-relaxed whitespace-pre-line">
                        {devotion.content}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

