import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiUrl } from '@/lib/api';

async function getDevotions() {
  try {
    const response = await fetch(apiUrl('/api/devotions/all?take=500'), {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.devotions || [];
  } catch (error) {
    return [];
  }
}

export default async function DevotionsPage() {
  const devotions = await getDevotions();

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
              {devotions.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-white p-6">
                  <p className="text-foreground/70">
                    No devotions have been published yet. Check back soon.
                  </p>
                  <div className="mt-4">
                    <Link href="/">
                      <span className="text-primary hover:underline">Return home</span>
                    </Link>
                  </div>
                </div>
              ) : (
                devotions.map((devotion: any) => {
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

