'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import {
  Archive,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  FileQuestion,
  FileText,
  ImageIcon,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  Moon,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Quote,
  School,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Users,
  Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ADMIN_ACCESS_RIGHT, ADMIN_PAGE, canAccessAdminPage, canAccessMinistry, canAccessRight } from '@/lib/admin-pages';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useAdminTheme } from '@/hooks/use-admin-theme';
import type { AdminPageKey } from '@/lib/admin-pages';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  pageKey?: AdminPageKey;
  icon?: ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  // { label: 'Admin Hub', href: '/admin', icon: LayoutDashboard },
  { label: 'Devotions', href: '/admin/devotions', pageKey: ADMIN_PAGE.DEVOTIONS, icon: BookOpen },
  { label: 'Confessions', href: '/admin/confessions', pageKey: ADMIN_PAGE.CONFESSIONS, icon: FileText },
  { label: 'See You in Church', href: '/admin/see-you-in-church', pageKey: ADMIN_PAGE.SEE_YOU_IN_CHURCH, icon: CalendarDays },
  { label: 'Services', href: '/admin/services', pageKey: ADMIN_PAGE.SERVICES, icon: CalendarDays },
  { label: 'Events', href: '/admin/events', pageKey: ADMIN_PAGE.EVENTS, icon: CalendarDays },
  { label: 'Dashboard', href: '/admin/hr/dashboard', pageKey: ADMIN_PAGE.HR_PAGE, icon: LayoutDashboard },
  { label: 'Vacancies', href: '/admin/hr', pageKey: ADMIN_PAGE.HR_PAGE, icon: BriefcaseBusiness },
  { label: 'Qoutes', href: '/admin/quote-of-month', pageKey: ADMIN_PAGE.QUOTE_OF_MONTH, icon: Quote },
  { label: 'Homepage Images', href: '/admin/page-images', pageKey: ADMIN_PAGE.PAGE_IMAGES, icon: ImageIcon },
  { label: 'Video Declarations', href: '/admin/video-declarations', pageKey: ADMIN_PAGE.VIDEO_DECLARATIONS, icon: Video },
  { label: 'FAQ (Footer)', href: '/admin/faqs', pageKey: ADMIN_PAGE.FAQS, icon: FileQuestion },
  { label: 'Hope School', href: '/admin/schools/hope-school', pageKey: ADMIN_PAGE.SCHOOLS_ENROLLMENT, icon: School },
  { label: 'Discipleship', href: '/admin/schools/discipleship', pageKey: ADMIN_PAGE.SCHOOLS_ENROLLMENT, icon: School },
  { label: 'PICC Secondary', href: '/admin/schools/picc-secondary', pageKey: ADMIN_PAGE.SCHOOLS_ENROLLMENT, icon: School },
  { label: 'Live Chat Archive', href: '/admin/livechat', pageKey: ADMIN_PAGE.LIVECHAT, icon: MessageSquareText },
];

const SITE_PAGE_ITEMS: NavItem[] = [
  { label: 'About Page', href: '/admin/about-page', pageKey: ADMIN_PAGE.ABOUT_PAGE, icon: Newspaper },
  { label: 'Contact Page', href: '/admin/contact', pageKey: ADMIN_PAGE.CONTACT_PAGE, icon: MessageSquareText },
  { label: 'Media Page', href: '/admin/media', pageKey: ADMIN_PAGE.MEDIA_PAGE, icon: ImageIcon },
  { label: 'Store Page', href: '/admin/store', pageKey: ADMIN_PAGE.STORE_PAGE, icon: ShoppingBag },
  { label: 'Forms Page', href: '/admin/forms', pageKey: ADMIN_PAGE.FORMS_PAGE, icon: FileText },
  { label: 'Sermons Page', href: '/admin/sermons', pageKey: ADMIN_PAGE.SERMONS_PAGE, icon: BookOpen },
  { label: 'Give Page', href: '/admin/give', pageKey: ADMIN_PAGE.GIVE_PAGE, icon: FileText },
  { label: 'Church Locations', href: '/admin/locations', pageKey: ADMIN_PAGE.LOCATIONS_PAGE, icon: MapPin },
];

const MINISTRIES_ITEMS: Array<NavItem & { ministryKey: string }> = [
  { label: 'ICD', href: '/admin/ministries/icd', ministryKey: 'icd', icon: Users },
  { label: 'Men of Valour', href: '/admin/ministries/men-of-valour', ministryKey: 'men-of-valour', icon: Users },
  { label: 'Prison Ministry', href: '/admin/ministries/prison-ministry', ministryKey: 'prison-ministry', icon: Users },
  { label: 'Youth Church', href: '/admin/ministries/youth-church', ministryKey: 'youth-church', icon: Users },
  { label: 'Women of Hope', href: '/admin/ministries/women-of-hope', ministryKey: 'women-of-hope', icon: Users },
  { label: 'Wailing Woman', href: '/admin/ministries/wailing-woman', ministryKey: 'wailing-woman', icon: Users },
  { label: 'Rivers of Hope', href: '/admin/ministries/rivers-of-hope', ministryKey: 'rivers-of-hope', icon: Users },
  { label: 'Heritage', href: '/admin/ministries/heritage', ministryKey: 'heritage', icon: Users },
];

const ARCHIVE_ITEMS: NavItem[] = [
  { label: 'Devotions Archive', href: '/devotions', icon: Archive },
  { label: 'Confessions Archive', href: '/devotions#confessions', icon: Archive },
  { label: 'Quotes Archive', href: '/quotes', icon: Archive },
];

function SidebarSection({
  title,
  items,
  isActive,
  collapsed,
}: {
  title: string;
  items: NavItem[];
  isActive: (href: string) => boolean;
  collapsed: boolean;
}) {
  if (!items.length) return null;

  return (
    <div className="mt-5 border-t border-border/60 pt-4 first:mt-0 first:border-t-0 first:pt-0">
      {collapsed ? (
        <div className="mx-auto mb-3 h-px w-8 bg-border/80" aria-hidden="true" />
      ) : (
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group relative flex items-center rounded-xl text-sm font-medium transition-all',
                collapsed ? 'h-11 justify-center px-0' : 'gap-3 px-3 py-2',
                active
                  ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-500/15 dark:text-blue-400'
                  : 'text-foreground/70 hover:bg-accent/60 hover:text-foreground'
              )}
            >
              {Icon ? <Icon className="h-[18px] w-[18px] shrink-0" /> : null}
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
              {collapsed ? (
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-lg group-hover:block">
                  {item.label}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { mounted, isDark, setTheme } = useAdminTheme();
  const { user } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/admin/hr') return pathname === href;
    return pathname?.startsWith(href);
  };

  const showThemeToggle = mounted;

  const filtered = useMemo(() => {
    // If profile isn't loaded yet, show the bare minimum (prevents a flash of extra links).
    if (!user) {
      return {
        nav: [{ label: 'Admin Hub', href: '/admin', icon: LayoutDashboard }],
        site: [] as NavItem[],
        settings: [] as NavItem[],
        ministries: [] as NavItem[],
        showArchives: false,
      };
    }

    const canSee = (item: NavItem) => {
      if (!item.pageKey) return true;
      return canAccessAdminPage(user, item.pageKey);
    };

    const nav = NAV_ITEMS.filter(canSee);
    const site = SITE_PAGE_ITEMS.filter(canSee);

    const settings: NavItem[] = [];

    if (canAccessRight(user, ADMIN_ACCESS_RIGHT.ROLE_LIST)) {
      settings.push({ label: 'Roles', href: '/admin/roles', icon: ShieldCheck });
    }

    if (canAccessRight(user, ADMIN_ACCESS_RIGHT.USER_LIST)) {
      settings.push({ label: 'User Management', href: '/admin/users', icon: Users });
    }

    return {
      nav,
      site,
      settings,
      ministries: MINISTRIES_ITEMS.filter((item) => canAccessMinistry(user, item.ministryKey)),
      showArchives: user.role === 'SUPER_ADMIN' || Boolean(user.isSystem),
    };
  }, [user]);

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 ease-in-out',
        collapsed ? 'w-[76px]' : 'w-72'
      )}
    >
      <div className={cn('flex h-16 shrink-0 items-center border-b border-border/60 px-3', collapsed ? 'justify-center' : 'justify-between')}>
        <Link href="/admin" className={cn('flex min-w-0 items-center gap-3', collapsed && 'justify-center')}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-white">
            <Image
              src="/logo.png"
              alt="PICC logo"
              fill
              sizes="40px"
              className="object-contain p-1"
              priority
            />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">PICC Portal</p>
              <p className="truncate text-xs text-muted-foreground"></p>
            </div>
          ) : null}
        </Link>
        {!collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mb-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : null}
        <SidebarSection title="Main" items={filtered.nav} isActive={isActive} collapsed={collapsed} />
        <SidebarSection title="Settings" items={filtered.settings} isActive={isActive} collapsed={collapsed} />
        <SidebarSection title="Site Pages" items={filtered.site} isActive={isActive} collapsed={collapsed} />
        <SidebarSection title="Ministries" items={filtered.ministries} isActive={isActive} collapsed={collapsed} />
        <SidebarSection title="Archives" items={filtered.showArchives ? ARCHIVE_ITEMS : []} isActive={isActive} collapsed={collapsed} />
      </div>

      <div className="border-t border-border/60 p-3">
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={cn(
            'inline-flex h-11 w-full items-center rounded-xl border border-border/60 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'
          )}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          disabled={!showThemeToggle}
          title={collapsed ? (isDark ? 'Light mode' : 'Dark mode') : undefined}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed ? <span>{isDark ? 'Light mode' : 'Dark mode'}</span> : null}
        </button>
      </div>
    </aside>
  );
}
