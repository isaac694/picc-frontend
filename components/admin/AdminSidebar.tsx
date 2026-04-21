'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Admin Hub', href: '/admin' },
  { label: 'Devotions', href: '/admin/devotions' },
  { label: 'Confessions', href: '/admin/confessions' },
  { label: 'See You in Church', href: '/admin/see-you-in-church' },
  { label: 'Services', href: '/admin/services' },
  { label: 'Events', href: '/admin/events' },
  { label: 'Quote of the Month', href: '/admin/quote-of-month' },
  { label: 'Homepage Images', href: '/admin/page-images' },
  { label: 'Live Chat Archive', href: '/admin/livechat' },
];

const SITE_PAGE_ITEMS = [
  { label: 'About Page (Edit)', href: '/admin/about-page' },
  { label: 'Contact Page (Edit)', href: '/admin/contact' },
  { label: 'Media Page (Edit)', href: '/admin/media' },
  { label: 'Forms Page (Edit)', href: '/admin/forms' },
  { label: 'Sermons Page (Edit)', href: '/admin/sermons' },
  { label: 'Give Page (Edit)', href: '/admin/give' },
  { label: 'Church Locations (Edit)', href: '/admin/locations' },
];

const MINISTRIES_ITEMS = [
  { label: 'ICD', href: '/admin/ministries/icd' },
  { label: 'Men of Valour', href: '/admin/ministries/men-of-valour' },
  { label: 'Prison Ministry', href: '/admin/ministries/prison-ministry' },
  { label: 'Youth Church', href: '/admin/ministries/youth-church' },
  { label: 'Women of Hope', href: '/admin/ministries/women-of-hope' },
  { label: 'Wailing Woman', href: '/admin/ministries/wailing-woman' },
  { label: 'Hope and Beauty', href: '/admin/ministries/hope-and-beauty' },
  { label: 'Heritage', href: '/admin/ministries/heritage' },
];

const ARCHIVE_ITEMS = [
  { label: 'Devotions Archive', href: '/devotions' },
  { label: 'Confessions Archive', href: '/devotions#confessions' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/admin'
      ? pathname === href
      : pathname?.startsWith(href);

  return (
    <aside className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm h-fit">
      <p className="text-[11px] uppercase tracking-[0.35em] text-primary/70 mb-3">
        Admin
      </p>
      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-xl px-4 py-2 text-sm font-medium transition ${
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 pt-4 border-t border-border/60">
        <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/50 mb-3">
          Site Pages
        </p>
        <nav className="space-y-2">
          {SITE_PAGE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-6 pt-4 border-t border-border/60">
        <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/50 mb-3">
          Ministries
        </p>
        <nav className="space-y-2">
          {MINISTRIES_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-6 pt-4 border-t border-border/60">
        <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/50 mb-3">
          Archives
        </p>
        <nav className="space-y-2">
          {ARCHIVE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
