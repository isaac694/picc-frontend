'use client';

import Navigation from '@/components/Navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SessionWarningModal } from '@/components/admin/SessionWarningModal';
import { useSessionManagement } from '@/hooks/use-session-management';
import { AdminAuthProvider, useAdminAuth } from '@/hooks/use-admin-auth';
import { usePathname, useRouter } from 'next/navigation';
import { ADMIN_PAGE, canAccessAdminPage } from '@/lib/admin-pages';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const pathToAdminPage = (pathname: string | null) => {
  const path = pathname || '';
  if (path.startsWith('/admin/devotions')) return ADMIN_PAGE.DEVOTIONS;
  if (path.startsWith('/admin/confessions')) return ADMIN_PAGE.CONFESSIONS;
  if (path.startsWith('/admin/see-you-in-church')) return ADMIN_PAGE.SEE_YOU_IN_CHURCH;
  if (path.startsWith('/admin/services')) return ADMIN_PAGE.SERVICES;
  if (path.startsWith('/admin/events')) return ADMIN_PAGE.EVENTS;
  if (path.startsWith('/admin/quote-of-month')) return ADMIN_PAGE.QUOTE_OF_MONTH;
  if (path.startsWith('/admin/page-images')) return ADMIN_PAGE.PAGE_IMAGES;
  if (path.startsWith('/admin/livechat')) return ADMIN_PAGE.LIVECHAT;
  if (path.startsWith('/admin/schools/')) return ADMIN_PAGE.SCHOOLS_ENROLLMENT;
  if (path.startsWith('/admin/ministries/')) return ADMIN_PAGE.MINISTRIES;
  if (path.startsWith('/admin/about-page')) return ADMIN_PAGE.ABOUT_PAGE;
  if (path.startsWith('/admin/contact')) return ADMIN_PAGE.CONTACT_PAGE;
  if (path.startsWith('/admin/media')) return ADMIN_PAGE.MEDIA_PAGE;
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
  const { token, user } = useAdminAuth();

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
  const isUsersPage = (pathname || '').startsWith('/admin/users');

  const isAuthorized = (() => {
    if (isUsersPage) return user?.role === 'SUPER_ADMIN';
    if (!requiredPage) return true;
    return canAccessAdminPage(user, requiredPage);
  })();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
            <AdminSidebar />
            <div>
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
