'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
  Layers2,
  MapPin,
  Megaphone,
  Menu,
  MessageSquareText,
  Moon,
  MoreHorizontal,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Quote,
  ScanLine,
  Ticket,
  School,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Users,
  Video,
  Wallet,
  Receipt,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ADMIN_ACCESS_RIGHT, ADMIN_PAGE, MINISTRY_ADMIN_OPTIONS, canAccessAdminPage, canAccessEventCheckIn, canAccessEventPaymentPath, canAccessMinistry, canAccessMinistryEvents, canAccessRight } from '@/lib/admin-pages';
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
  { label: 'Leadership', href: '/admin/hr/leadership', pageKey: ADMIN_PAGE.LEADERSHIP, icon: Users },
  { label: 'Qoutes', href: '/admin/quote-of-month', pageKey: ADMIN_PAGE.QUOTE_OF_MONTH, icon: Quote },
  { label: 'Homepage Images', href: '/admin/page-images', pageKey: ADMIN_PAGE.PAGE_IMAGES, icon: ImageIcon },
  { label: 'Ads Management', href: '/admin/ads-management', pageKey: ADMIN_PAGE.WEBSITE_ADS, icon: Megaphone },
  { label: 'Video Declarations', href: '/admin/video-declarations', pageKey: ADMIN_PAGE.VIDEO_DECLARATIONS, icon: Video },
  { label: 'FAQ (Footer)', href: '/admin/faqs', pageKey: ADMIN_PAGE.FAQS, icon: FileQuestion },
  { label: 'Hope School', href: '/admin/schools/hope-school', pageKey: ADMIN_PAGE.SCHOOLS_ENROLLMENT, icon: School },
  { label: 'Discipleship', href: '/admin/schools/discipleship', pageKey: ADMIN_PAGE.SCHOOLS_ENROLLMENT, icon: School },
  { label: 'PICC Secondary', href: '/admin/schools/picc-secondary', pageKey: ADMIN_PAGE.SCHOOLS_ENROLLMENT, icon: School },
  { label: 'Live Chat Archive', href: '/admin/livechat', pageKey: ADMIN_PAGE.LIVECHAT, icon: MessageSquareText },
];

const PAYMENTS_ITEMS: NavItem[] = [
  { label: 'Giving dashboard', href: '/admin/giving/dashboard', pageKey: ADMIN_PAGE.GIVE_PAGE, icon: Wallet },
  { label: 'Giving payments', href: '/admin/giving/payments', pageKey: ADMIN_PAGE.GIVE_PAGE, icon: Receipt },
  { label: 'Giving types', href: '/admin/giving/types', pageKey: ADMIN_PAGE.GIVE_PAGE, icon: FileText },
  { label: 'Events payment dashboard', href: '/admin/event-payments/dashboard', pageKey: ADMIN_PAGE.EVENT_PAYMENTS_DASHBOARD, icon: Wallet },
  { label: 'Events payment', href: '/admin/event-payments', pageKey: ADMIN_PAGE.EVENT_PAYMENTS, icon: Receipt },
  { label: 'Ticket KPIs', href: '/admin/event-payments/tickets', pageKey: ADMIN_PAGE.EVENT_TICKET_KPIS, icon: Ticket },
  { label: 'Store dashboard', href: '/admin/store/dashboard', pageKey: ADMIN_PAGE.STORE_PAGE, icon: LayoutDashboard },
  { label: 'Book store payments', href: '/admin/store/payments', pageKey: ADMIN_PAGE.STORE_PAGE, icon: ShoppingBag },
];

const SITE_PAGE_ITEMS: NavItem[] = [
  { label: 'About Page', href: '/admin/about-page', pageKey: ADMIN_PAGE.ABOUT_PAGE, icon: Newspaper },
  { label: 'Contact Page', href: '/admin/contact', pageKey: ADMIN_PAGE.CONTACT_PAGE, icon: MessageSquareText },
  { label: 'Media Page', href: '/admin/media', pageKey: ADMIN_PAGE.MEDIA_PAGE, icon: ImageIcon },
  { label: 'Store Page', href: '/admin/store', pageKey: ADMIN_PAGE.STORE_PAGE, icon: ShoppingBag },
  { label: 'Branded items', href: '/admin/store/merchandise', pageKey: ADMIN_PAGE.STORE_PAGE, icon: ShoppingBag },
  { label: 'Book launch sales', href: '/admin/store/book-launch', pageKey: ADMIN_PAGE.STORE_PAGE, icon: Receipt },
  { label: 'Forms Page', href: '/admin/forms', pageKey: ADMIN_PAGE.FORMS_PAGE, icon: FileText },
  { label: 'Sermons Page', href: '/admin/sermons', pageKey: ADMIN_PAGE.SERMONS_PAGE, icon: BookOpen },
  { label: 'Give Page', href: '/admin/giving/types', pageKey: ADMIN_PAGE.GIVE_PAGE, icon: FileText },
  { label: 'Church Locations', href: '/admin/locations', pageKey: ADMIN_PAGE.LOCATIONS_PAGE, icon: MapPin },
  { label: 'Zones & Home Churches', href: '/admin/zones', pageKey: ADMIN_PAGE.HOME_CHURCHES_PAGE, icon: Layers2 },
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

const MINISTRY_EVENT_ITEMS: Array<NavItem & { ministryKey: string }> = MINISTRY_ADMIN_OPTIONS.map((ministry) => ({
  label: ministry.label,
  href: `/admin/ministry-events/${ministry.key}`,
  ministryKey: ministry.key,
  icon: CalendarDays,
}));

const ARCHIVE_ITEMS: NavItem[] = [
  { label: 'Devotions Archive', href: '/devotions', icon: Archive },
  { label: 'Confessions Archive', href: '/devotions#confessions', icon: Archive },
  { label: 'Quotes Archive', href: '/quotes', icon: Archive },
];

function MobileLinkList({
  sections,
  isActive,
  onNavigate,
}: {
  sections: Array<{ title: string; items: NavItem[] }>;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-3">
      {sections.filter((section) => section.items.length > 0).map((section) => (
        <div key={section.title}>
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{section.title}</p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium',
                    active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                      : 'text-foreground active:bg-accent',
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

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
    <div className="mt-3 border-t border-border/60 pt-2.5 first:mt-0 first:border-t-0 first:pt-0">
      {collapsed ? (
        <div className="mx-auto mb-2 h-px w-6 bg-border/80" aria-hidden="true" />
      ) : (
        <p className="mb-1 px-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      )}
      <nav className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group relative flex items-center rounded-md text-[12px] font-medium transition-all',
                collapsed ? 'h-8 justify-center px-0' : 'gap-2 px-2 py-1.5',
                active
                  ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-500/15 dark:text-blue-400'
                  : 'text-foreground/70 hover:bg-accent/60 hover:text-foreground'
              )}
            >
              {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
              {collapsed ? (
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-lg group-hover:block">
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
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [sheet, setSheet] = useState<'main' | 'pay' | 'more' | null>(null);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    if (href === '/admin/hr') return pathname === href || Boolean(pathname?.startsWith('/admin/hr/applications'));
    if (href === '/admin/store') return pathname === href;
    if (href === '/admin/give') return pathname === href;
    if (href === '/admin/event-payments') return pathname === href;
    return pathname?.startsWith(href);
  };

  const showThemeToggle = mounted;

  useEffect(() => {
    setSheet(null);
  }, [pathname]);

  const filtered = useMemo(() => {
    // If profile isn't loaded yet, show the bare minimum (prevents a flash of extra links).
    if (!user) {
      return {
        nav: [{ label: 'Admin Hub', href: '/admin', icon: LayoutDashboard }],
        site: [] as NavItem[],
        payments: [] as NavItem[],
        settings: [] as NavItem[],
        ministries: [] as NavItem[],
        ministryEvents: [] as NavItem[],
        showArchives: false,
      };
    }

    const canSee = (item: NavItem) => {
      if (!item.pageKey) return true;
      return canAccessAdminPage(user, item.pageKey);
    };
    const nav = NAV_ITEMS.filter(canSee);
    const site = SITE_PAGE_ITEMS.filter(canSee);
    const payments = PAYMENTS_ITEMS.filter((item) => {
      if (item.href.startsWith('/admin/event-payments')) return canAccessEventPaymentPath(user, item.href);
      return canSee(item);
    });

    const settings: NavItem[] = [];

    if (canAccessRight(user, ADMIN_ACCESS_RIGHT.ROLE_LIST)) {
      settings.push({ label: 'Roles', href: '/admin/roles', icon: ShieldCheck });
    }

    if (canAccessRight(user, ADMIN_ACCESS_RIGHT.USER_LIST)) {
      settings.push({ label: 'User Management', href: '/admin/users', icon: Users });
    }

    const ministryEvents = [
      ...(canAccessEventCheckIn(user)
        ? [{ label: 'Ticket check-in', href: '/admin/event-check-in', icon: ScanLine }]
        : []),
      ...MINISTRY_EVENT_ITEMS.filter((item) => canAccessMinistryEvents(user, item.ministryKey)),
    ];

    return {
      nav,
      site,
      payments,
      settings,
      ministries: MINISTRIES_ITEMS.filter((item) => canAccessMinistry(user, item.ministryKey)),
      ministryEvents,
      showArchives: user.role === 'SUPER_ADMIN' || Boolean(user.isSystem),
    };
  }, [user]);

  const closeSheet = () => setSheet(null);
  const paymentsActive = filtered.payments.some((item) => isActive(item.href));
  const mainActive = filtered.nav.some((item) => isActive(item.href));
  const moreItems = [
    ...filtered.settings,
    ...filtered.site,
    ...filtered.ministries,
    ...filtered.ministryEvents,
    ...(filtered.showArchives ? ARCHIVE_ITEMS : []),
  ];
  const moreActive = moreItems.some((item) => isActive(item.href));
  const mobileTabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'main' as const, label: 'Menu', icon: Menu },
    ...(filtered.payments.length ? [{ id: 'pay' as const, label: 'Payments', icon: Wallet }] : []),
    { id: 'more' as const, label: 'More', icon: MoreHorizontal },
  ];
  const selectedTab = sheet
    || (pathname === '/admin' ? 'dashboard' : paymentsActive ? 'pay' : mainActive ? 'main' : moreActive ? 'more' : 'dashboard');

  const sheetSections = sheet === 'main'
    ? [{ title: 'Main', items: filtered.nav }]
    : sheet === 'pay'
      ? [{ title: 'Payments', items: filtered.payments }]
      : [
          { title: 'Settings', items: filtered.settings },
          { title: 'Site Pages', items: filtered.site },
          { title: 'Ministries', items: filtered.ministries },
          { title: 'Ministry Events', items: filtered.ministryEvents },
          { title: 'Archives', items: filtered.showArchives ? ARCHIVE_ITEMS : [] },
        ];

  return (
    <>
    <aside
      className={cn(
        'hidden h-full shrink-0 flex-col rounded-lg border border-border/60 bg-card shadow-sm transition-all duration-300 ease-in-out md:flex',
        collapsed ? 'w-12' : 'w-52'
      )}
    >
      <div className={cn('flex h-11 shrink-0 items-center border-b border-border/60 px-2', collapsed ? 'justify-center' : 'justify-between')}>
        <Link href="/admin" className={cn('flex min-w-0 items-center gap-2', collapsed && 'justify-center')}>
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-white">
            <Image
              src="/logo.png"
              alt="PICC logo"
              fill
              sizes="28px"
              className="object-contain p-0.5"
              priority
            />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">PICC Portal</p>
            </div>
          ) : null}
        </Link>
        {!collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mb-2 inline-flex h-8 w-full items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <SidebarSection title="Main" items={filtered.nav} isActive={isActive} collapsed={collapsed} />
        <SidebarSection title="Payments" items={filtered.payments} isActive={isActive} collapsed={collapsed} />
        <SidebarSection title="Settings" items={filtered.settings} isActive={isActive} collapsed={collapsed} />
        <SidebarSection title="Site Pages" items={filtered.site} isActive={isActive} collapsed={collapsed} />
        <SidebarSection title="Ministries" items={filtered.ministries} isActive={isActive} collapsed={collapsed} />
        <SidebarSection title="Ministry Events" items={filtered.ministryEvents} isActive={isActive} collapsed={collapsed} />
        <SidebarSection title="Archives" items={filtered.showArchives ? ARCHIVE_ITEMS : []} isActive={isActive} collapsed={collapsed} />
      </div>

      <div className="border-t border-border/60 p-1.5">
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={cn(
            'inline-flex h-8 w-full items-center rounded-md border border-border/60 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed ? 'justify-center px-0' : 'justify-start gap-2 px-2'
          )}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          disabled={!showThemeToggle}
          title={collapsed ? (isDark ? 'Light mode' : 'Dark mode') : undefined}
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {!collapsed ? <span>{isDark ? 'Light mode' : 'Dark mode'}</span> : null}
        </button>
      </div>
    </aside>

    {sheet ? (
      <button
        type="button"
        aria-label="Close admin menu"
        className="fixed inset-0 bottom-16 z-30 bg-black/40 md:hidden"
        onClick={closeSheet}
      />
    ) : null}
    {sheet ? (
      <div className="fixed inset-x-0 bottom-16 z-40 flex max-h-[min(72vh,32rem)] flex-col overflow-hidden rounded-t-3xl border border-border/70 bg-card shadow-2xl md:hidden">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" />
        <div className="flex items-center justify-between px-4 py-2">
          <p className="text-sm font-semibold text-foreground">
            {sheet === 'main' ? 'Menu' : sheet === 'pay' ? 'Payments' : 'More'}
          </p>
          <button type="button" onClick={closeSheet} className="text-xs font-medium text-muted-foreground">
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-2 pb-3">
          <MobileLinkList sections={sheetSections} isActive={isActive} onNavigate={closeSheet} />
          {sheet === 'more' ? (
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              disabled={!showThemeToggle}
              className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          ) : null}
        </div>
      </div>
    ) : null}
    <nav
      aria-label="Admin"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${mobileTabs.length}, minmax(0, 1fr))` }}>
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const selected = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'dashboard') {
                  closeSheet();
                  if (pathname !== '/admin') router.push('/admin');
                  return;
                }
                const next = tab.id;
                setSheet((current) => (current === next ? null : next));
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5',
                selected ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground',
              )}
              aria-current={selected ? 'page' : undefined}
            >
              <span className={cn('flex h-8 w-14 items-center justify-center rounded-full', selected && 'bg-blue-50 dark:bg-blue-500/15')}>
                <Icon className="h-5 w-5" strokeWidth={selected ? 2.5 : 2} />
              </span>
              <span className="text-[11px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
    </>
  );
}
