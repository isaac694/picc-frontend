import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
          Admin
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold text-foreground">
          Admin Hub
        </h1>
        <p className="text-foreground/70 mt-3 max-w-2xl">
          Manage daily devotions, content sections, service schedules, events, and the quote of the month.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Devotions
          </h2>
          <p className="text-foreground/70 mb-6">
            Write and publish daily devotions.
          </p>
          <Link href="/admin/devotions">
            <Button className="rounded-full px-6 py-3">Open Devotions</Button>
          </Link>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            See You in Church
          </h2>
          <p className="text-foreground/70 mb-6">
            Update the featured title, subtitle, and hero image.
          </p>
          <Link href="/admin/see-you-in-church">
            <Button className="rounded-full px-6 py-3">Open Section</Button>
          </Link>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Services
          </h2>
          <p className="text-foreground/70 mb-6">
            Maintain service times and descriptions.
          </p>
          <Link href="/admin/services">
            <Button className="rounded-full px-6 py-3">Open Services</Button>
          </Link>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Events
          </h2>
          <p className="text-foreground/70 mb-6">
            Manage upcoming events and graphics.
          </p>
          <Link href="/admin/events">
            <Button className="rounded-full px-6 py-3">Open Events</Button>
          </Link>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Quote of the Month
          </h2>
          <p className="text-foreground/70 mb-6">
            Edit the monthly quote and image.
          </p>
          <Link href="/admin/quote-of-month">
            <Button className="rounded-full px-6 py-3">Open Quote</Button>
          </Link>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Page Images
          </h2>
          <p className="text-foreground/70 mb-6">
            Update hero, about, and contact page imagery.
          </p>
          <Link href="/admin/page-images">
            <Button className="rounded-full px-6 py-3">Open Images</Button>
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
  );
}
