import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const MAGAZINES = [
  { title: 'PICC Magazine Vol. 1', date: 'January 2026', description: 'Placeholder description for the magazine archive.' },
  { title: 'PICC Magazine Vol. 2', date: 'March 2026', description: 'Placeholder description for the magazine archive.' },
  { title: 'PICC Magazine Vol. 3', date: 'June 2026', description: 'Placeholder description for the magazine archive.' },
];

const BOOKS = [
  { title: 'Faith Foundations', author: 'PICC Publishing', description: 'Placeholder description for book downloads.' },
  { title: 'Walking in Purpose', author: 'PICC Publishing', description: 'Placeholder description for book downloads.' },
  { title: 'Grace and Growth', author: 'PICC Publishing', description: 'Placeholder description for book downloads.' },
];

export default function MediaPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden py-24 sm:py-32 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)]" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4">
              Media Archive
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
              Church Media Library
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              Browse our magazine issues and book downloads. New releases will be added here.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start mb-12">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                  Magazines
                </p>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                  Church Magazine Archive
                </h2>
                <p className="text-foreground/70 mt-4 max-w-xl">
                  This section will house PDF downloads of each magazine issue.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 sm:p-8 shadow-lg">
                <p className="text-sm uppercase tracking-[0.3em] text-foreground/60 mb-3">
                  Coming Soon
                </p>
                <p className="text-foreground/70">
                  Once new issues are uploaded, you will see download links and cover previews here.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {MAGAZINES.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-3">
                    {item.date}
                  </p>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-foreground/70 mb-6">
                    {item.description}
                  </p>
                  <Button variant="outline" className="rounded-full px-5">
                    Download (Coming Soon)
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 md:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start mb-12">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-3">
                  Books
                </p>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                  Fire on the altar
                </h2>
                <p className="text-foreground/70 mt-4 max-w-xl">
                  When books are uploaded, members can download them from this library.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-white/80 p-6 sm:p-8 shadow-lg">
                <p className="text-sm uppercase tracking-[0.3em] text-foreground/60 mb-3">
                  Upload Later
                </p>
                <p className="text-foreground/70">
                  We can connect this to your admin dashboard once uploads are ready.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {BOOKS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-3">
                    {item.author}
                  </p>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-foreground/70 mb-6">
                    {item.description}
                  </p>
                  <Button variant="outline" className="rounded-full px-5">
                    Download (Coming Soon)
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 md:py-24 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Ready to Explore More?
            </h2>
            <p className="text-foreground/70 mb-8">
              Check back as we grow this library with devotionals, magazines, and teaching series.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/devotions">
                <Button className="rounded-full px-6 py-3">
                  Daily Devotions
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" className="rounded-full px-6 py-3">
                  Upcoming Events
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
