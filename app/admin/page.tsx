import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

export default function AdminHomePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
              Admin
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold text-foreground">
              Admin Hub
            </h1>
            <p className="text-foreground/70 mt-3 max-w-2xl">
              Manage daily devotions, service schedules, events, and the quote of the month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Content Dashboard
              </h2>
              <p className="text-foreground/70 mb-6">
                Edit devotions, See You in Church, events, and the monthly quote.
              </p>
              <Link href="/admin/devotions">
                <Button className="rounded-full px-6 py-3">Open Dashboard</Button>
              </Link>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Devotions Archive
              </h2>
              <p className="text-foreground/70 mb-6">
                View the public devotions archive as users see it.
              </p>
              <Link href="/devotions">
                <Button variant="outline" className="rounded-full px-6 py-3">
                  View Archive
                </Button>
              </Link>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Live Chat Archive
              </h2>
              <p className="text-foreground/70 mb-6">
                Review chat messages for every streamed video.
              </p>
              <Link href="/admin/livechat">
                <Button className="rounded-full px-6 py-3">Open Archive</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
