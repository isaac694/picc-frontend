'use client';

import Navigation from '@/components/Navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SessionWarningModal } from '@/components/admin/SessionWarningModal';
import { useSessionManagement } from '@/hooks/use-session-management';
import { AdminAuthProvider, useAdminAuth } from '@/hooks/use-admin-auth';
import { usePathname, useRouter } from 'next/navigation';
import {
  ADMIN_ACCESS_RIGHT,
  ADMIN_PAGE,
  canAccessAdminPage,
  canAccessMinistry,
  canAccessRight,
  ministryKeyFromAdminPath,
} from '@/lib/admin-pages';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { LogOut } from 'lucide-react';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/admin': { title: 'Admin Hub', subtitle: 'Manage church content and daily operations.' },
  '/admin/users': { title: 'User Management', subtitle: 'Manage admin users and page access.' },
  '/admin/roles': { title: 'Roles', subtitle: 'Create and manage admin role definitions.' },
  '/admin/devotions': { title: 'Devotions', subtitle: 'Write and publish daily devotions.' },
  '/admin/confessions': { title: 'Confessions', subtitle: 'Upload daily confession declarations.' },
  '/admin/see-you-in-church': { title: 'See You in Church', subtitle: 'Manage service invitation content.' },
  '/admin/services': { title: 'Services', subtitle: 'Manage service times and weekly schedules.' },
  '/admin/events': { title: 'Events', subtitle: 'Create and publish upcoming events.' },
  '/admin/hr/dashboard': { title: 'HR Dashboard', subtitle: 'Track vacancies, applicants, applications, and hiring progress.' },
  '/admin/hr': { title: 'HR Vacancies', subtitle: 'Manage vacancies and applicant reviews.' },
  '/admin/quote-of-month': { title: 'Qoutes', subtitle: 'Manage monthly quote content.' },
  '/admin/page-images': { title: 'Homepage Images', subtitle: 'Update site imagery and page visuals.' },
  '/admin/video-declarations': { title: 'Video Declarations', subtitle: 'Publish video and audio declarations.' },
  '/admin/faqs': { title: 'FAQ', subtitle: 'Manage footer frequently asked questions.' },
  '/admin/livechat': { title: 'Live Chat Archive', subtitle: 'Review livestream chat messages.' },
  '/admin/about-page': { title: 'About Page', subtitle: 'Update about page content.' },
  '/admin/contact': { title: 'Contact Page', subtitle: 'Manage contact page details.' },
  '/admin/media': { title: 'Media Page', subtitle: 'Manage media page content.' },
  '/admin/store': { title: 'Store Page', subtitle: 'Manage store content and products.' },
  '/admin/forms': { title: 'Forms Page', subtitle: 'Review submitted forms.' },
  '/admin/sermons': { title: 'Sermons Page', subtitle: 'Publish sermon content.' },
  '/admin/give': { title: 'Give Page', subtitle: 'Manage giving page content.' },
  '/admin/locations': { title: 'Church Locations', subtitle: 'Manage church location details.' },
};

const pathToAdminPage = (pathname: string | null) => {
  const path = pathname || '';
  if (path.startsWith('/admin/devotions')) return ADMIN_PAGE.DEVOTIONS;
  if (path.startsWith('/admin/confessions')) return ADMIN_PAGE.CONFESSIONS;
  if (path.startsWith('/admin/see-you-in-church')) return ADMIN_PAGE.SEE_YOU_IN_CHURCH;
  if (path.startsWith('/admin/services')) return ADMIN_PAGE.SERVICES;
  if (path.startsWith('/admin/events')) return ADMIN_PAGE.EVENTS;
  if (path.startsWith('/admin/hr')) return ADMIN_PAGE.HR_PAGE;
  if (path.startsWith('/admin/quote-of-month')) return ADMIN_PAGE.QUOTE_OF_MONTH;
  if (path.startsWith('/admin/page-images')) return ADMIN_PAGE.PAGE_IMAGES;
  if (path.startsWith('/admin/video-declarations')) return ADMIN_PAGE.VIDEO_DECLARATIONS;
  if (path.startsWith('/admin/livechat')) return ADMIN_PAGE.LIVECHAT;
  if (path.startsWith('/admin/schools/')) return ADMIN_PAGE.SCHOOLS_ENROLLMENT;
  if (path.startsWith('/admin/ministries/')) return null;
  if (path.startsWith('/admin/about-page')) return ADMIN_PAGE.ABOUT_PAGE;
  if (path.startsWith('/admin/contact')) return ADMIN_PAGE.CONTACT_PAGE;
  if (path.startsWith('/admin/media')) return ADMIN_PAGE.MEDIA_PAGE;
  if (path.startsWith('/admin/store')) return ADMIN_PAGE.STORE_PAGE;
  if (path.startsWith('/admin/forms')) return ADMIN_PAGE.FORMS_PAGE;
  if (path.startsWith('/admin/sermons')) return ADMIN_PAGE.SERMONS_PAGE;
  if (path.startsWith('/admin/give')) return ADMIN_PAGE.GIVE_PAGE;
  if (path.startsWith('/admin/locations')) return ADMIN_PAGE.LOCATIONS_PAGE;
  return null;
};

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showWarning, timeLeft, formatTime, extendSession, logout } = useSessionManagement();
  const { token, user, handleLogout } = useAdminAuth();

  const isLoginPage = (pathname || '').startsWith('/admin/login');

  useEffect(() => {
    if (!token && !isLoginPage) {
      router.replace('/admin/login');
    }

    if (token && isLoginPage) {
      router.replace('/admin');
    }
  }, [token, isLoginPage, router]);

  if (!token && !isLoginPage) {
    return null;
  }

  if (isLoginPage) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </>
    );
  }

  const requiredPage = pathToAdminPage(pathname);
  const requiredMinistryKey = ministryKeyFromAdminPath(pathname);
  const isUsersPage = (pathname || '').startsWith('/admin/users');
  const isRolesPage = (pathname || '').startsWith('/admin/roles');
  const meta =
    Object.entries(PAGE_META).find(([path]) =>
      path === '/admin' ? pathname === path : pathname?.startsWith(path)
    )?.[1] || { title: 'Admin Portal', subtitle: 'Manage PICC website content.' };

  const isAuthorized = (() => {
    if (isUsersPage) return canAccessRight(user, ADMIN_ACCESS_RIGHT.USER_LIST);
    if (isRolesPage) return canAccessRight(user, ADMIN_ACCESS_RIGHT.ROLE_LIST);
    if (requiredMinistryKey) return canAccessMinistry(user, requiredMinistryKey);
    if (!requiredPage) return true;
    return canAccessAdminPage(user, requiredPage);
  })();

  return (
    <>
      <main className="h-screen overflow-hidden bg-muted/60 p-3">
        <div className="flex h-full gap-3">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <header className="mb-3 flex h-16 shrink-0 items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card px-5 shadow-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/70">PICC Admin</p>
                <h1 className="text-xl font-semibold text-foreground">{meta.title}</h1>
                {meta.subtitle ? (
                  <p className="hidden text-sm text-muted-foreground md:block">{meta.subtitle}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleLogout();
                    logout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
              {isAuthorized ? (
                children
              ) : (
                <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm space-y-4">
                  <h1 className="text-2xl font-semibold">Not authorized</h1>
                  <p className="text-foreground/70">
                    You do not have access to this admin page. Please contact a super admin.
                  </p>
                  <Link href="/admin">
                    <Button variant="outline">Back to Admin Hub</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SessionWarningModal
        isOpen={showWarning}
        timeLeft={timeLeft}
        formatTime={formatTime}
        onExtend={extendSession}
        onLogout={logout}
      />
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}
