'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Users } from 'lucide-react';
import { useMemo } from 'react';
import { ADMIN_PAGE, canAccessAdminPage } from '@/lib/admin-pages';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useAdminTheme } from '@/hooks/use-admin-theme';
import type { AdminPageKey } from '@/lib/admin-pages';

type NavItem = {
  label: string;
  href: string;
  pageKey?: AdminPageKey;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Admin Hub', href: '/admin' },
  { label: 'Devotions', href: '/admin/devotions', pageKey: ADMIN_PAGE.DEVOTIONS },
  { label: 'Confessions', href: '/admin/confessions', pageKey: ADMIN_PAGE.CONFESSIONS },
  { label: 'See You in Church', href: '/admin/see-you-in-church', pageKey: ADMIN_PAGE.SEE_YOU_IN_CHURCH },
  { label: 'Services', href: '/admin/services', pageKey: ADMIN_PAGE.SERVICES },
  { label: 'Events', href: '/admin/events', pageKey: ADMIN_PAGE.EVENTS },
  { label: 'Qoutes', href: '/admin/quote-of-month', pageKey: ADMIN_PAGE.QUOTE_OF_MONTH },
  { label: 'Homepage Images', href: '/admin/page-images', pageKey: ADMIN_PAGE.PAGE_IMAGES },
  { label: 'FAQ (Footer)', href: '/admin/faqs', pageKey: ADMIN_PAGE.FAQS },
  { label: 'Hope School', href: '/admin/schools/hope-school', pageKey: ADMIN_PAGE.SCHOOLS_ENROLLMENT },
  { label: 'Discipleship', href: '/admin/schools/discipleship', pageKey: ADMIN_PAGE.SCHOOLS_ENROLLMENT },
  { label: 'PICC Secondary', href: '/admin/schools/picc-secondary', pageKey: ADMIN_PAGE.SCHOOLS_ENROLLMENT },
  { label: 'Live Chat Archive', href: '/admin/livechat', pageKey: ADMIN_PAGE.LIVECHAT },
];

const SITE_PAGE_ITEMS: NavItem[] = [
  { label: 'About Page (Edit)', href: '/admin/about-page', pageKey: ADMIN_PAGE.ABOUT_PAGE },
  { label: 'Contact Page (Edit)', href: '/admin/contact', pageKey: ADMIN_PAGE.CONTACT_PAGE },
  { label: 'Media Page (Edit)', href: '/admin/media', pageKey: ADMIN_PAGE.MEDIA_PAGE },
  { label: 'Forms Page (Edit)', href: '/admin/forms', pageKey: ADMIN_PAGE.FORMS_PAGE },
  { label: 'Sermons Page (Edit)', href: '/admin/sermons', pageKey: ADMIN_PAGE.SERMONS_PAGE },
  { label: 'Give Page (Edit)', href: '/admin/give', pageKey: ADMIN_PAGE.GIVE_PAGE },
  { label: 'Church Locations (Edit)', href: '/admin/locations', pageKey: ADMIN_PAGE.LOCATIONS_PAGE },
];

const MINISTRIES_ITEMS: NavItem[] = [
  { label: 'ICD', href: '/admin/ministries/icd' },
  { label: 'Men of Valour', href: '/admin/ministries/men-of-valour' },
  { label: 'Prison Ministry', href: '/admin/ministries/prison-ministry' },
  { label: 'Youth Church', href: '/admin/ministries/youth-church' },
  { label: 'Women of Hope', href: '/admin/ministries/women-of-hope' },
  { label: 'Wailing Woman', href: '/admin/ministries/wailing-woman' },
  { label: 'Rivers of Hope', href: '/admin/ministries/rivers-of-hope' },
  { label: 'Hope and Beauty', href: '/admin/ministries/hope-and-beauty' },
  { label: 'Heritage', href: '/admin/ministries/heritage' },
];

const ARCHIVE_ITEMS: NavItem[] = [
  { label: 'Devotions Archive', href: '/devotions' },
  { label: 'Confessions Archive', href: '/devotions#confessions' },
  { label: 'Quotes Archive', href: '/quotes' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { mounted, isDark, setTheme } = useAdminTheme();
  const { user } = useAdminAuth();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname?.startsWith(href);

  const showThemeToggle = mounted;

  const filtered = useMemo(() => {
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    // If profile isn't loaded yet, show the bare minimum (prevents a flash of extra links).
    if (!user) {
      return {
        nav: [{ label: 'Admin Hub', href: '/admin' }],
        site: [] as NavItem[],
        usersItem: null as NavItem | null,
        showMinistries: false,
        showArchives: false,
      };
    }

    const canSee = (item: NavItem) => {
      if (!item.pageKey) return true;
      return canAccessAdminPage(user, item.pageKey);
    };

    const nav = NAV_ITEMS.filter(canSee);
    const site = SITE_PAGE_ITEMS.filter(canSee);

    const usersItem: NavItem | null =
      isSuperAdmin ? { label: 'User Management', href: '/admin/users' } : null;

    return {
      nav,
      site,
      usersItem,
      showMinistries: isSuperAdmin,
      showArchives: isSuperAdmin,
    };
  }, [user]);

  return (
    <aside className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm h-fit">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary/70">Admin</p>
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          disabled={!showThemeToggle}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {filtered.usersItem && (
        <div className="mb-4">
          <Link
            href={filtered.usersItem.href}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              isActive(filtered.usersItem.href)
                ? 'bg-primary/10 text-primary'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted'
            }`}
          >
            <Users className="h-4 w-4" />
            {filtered.usersItem.label}
          </Link>
        </div>
      )}

      <nav className="space-y-2">
        {filtered.nav.map((item) => (
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

      {filtered.site.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border/60">
          <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/50 mb-3">Site Pages</p>
          <nav className="space-y-2">
            {filtered.site.map((item) => (
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
        </div>
      )}

      {filtered.showMinistries && (
        <div className="mt-6 pt-4 border-t border-border/60">
          <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/50 mb-3">Ministries</p>
          <nav className="space-y-2">
            {MINISTRIES_ITEMS.map((item) => (
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
        </div>
      )}

      {filtered.showArchives && (
        <div className="mt-6 pt-4 border-t border-border/60">
          <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/50 mb-3">Archives</p>
          <nav className="space-y-2">
            {ARCHIVE_ITEMS.map((item) => (
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
        </div>
      )}
    </aside>
  );
}
