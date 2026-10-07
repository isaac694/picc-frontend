'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { ADMIN_ACCESS_RIGHT, ADMIN_PAGE, canAccessAdminPage, canAccessRight, type AdminPageKey } from '@/lib/admin-pages';

type AdminCard = {
  key: string;
  title: string;
  description: string;
  href: string;
  button: string;
  variant: 'default';
  pageKey?: AdminPageKey;
  right?: string;
};

export default function AdminHomePage() {
  const { user } = useAdminAuth();

  const cards: AdminCard[] = [
    {
      key: 'roles',
      right: ADMIN_ACCESS_RIGHT.ROLE_LIST,
      title: 'Role Management',
      description: 'Create and maintain reusable admin role definitions.',
      href: '/admin/roles',
      button: 'Manage Roles',
      variant: 'default',
    },
    {
      key: 'users',
      right: ADMIN_ACCESS_RIGHT.USER_LIST,
      title: 'User Management',
      description: 'Create admins and control which admin pages they can access.',
      href: '/admin/users',
      button: 'Manage Users',
      variant: 'default',
    },
    {
      key: 'devotions',
      pageKey: ADMIN_PAGE.DEVOTIONS,
      title: 'Devotions',
      description: 'Write and publish daily devotions.',
      href: '/admin/devotions',
      button: 'Open Devotions',
      variant: 'default',
    },
    {
      key: 'hr',
      pageKey: ADMIN_PAGE.HR_PAGE,
      title: 'HR Vacancies',
      description: 'Manage vacancies and review applicants.',
      href: '/admin/hr',
      button: 'Open HR',
      variant: 'default',
    },
    {
      key: 'confessions',
      pageKey: ADMIN_PAGE.CONFESSIONS,
      title: 'Confessions',
      description: 'Upload daily confession declarations.',
      href: '/admin/confessions',
      button: 'Open Confessions',
      variant: 'default',
    },
    {
      key: 'video-declarations',
      pageKey: ADMIN_PAGE.VIDEO_DECLARATIONS,
      title: 'Video Declarations',
      description: 'Publish the video or audio declaration shown on the homepage.',
      href: '/admin/video-declarations',
      button: 'Open Declarations',
      variant: 'default',
    },
    {
      key: 'livechat',
      pageKey: ADMIN_PAGE.LIVECHAT,
      title: 'Live Chat Archive',
      description: 'Review chat messages for every streamed video.',
      href: '/admin/livechat',
      button: 'Open Archive',
      variant: 'default',
    },
  ].filter((card) => {
    if (card.right) return canAccessRight(user, card.right);
    if (card.pageKey) return canAccessAdminPage(user, card.pageKey);
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">Admin</p>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">Admin Hub</h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Quick links for daily updates and reviewing archives.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div key={card.key} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-2">{card.title}</h2>
            <p className="text-foreground/70 mb-6">{card.description}</p>
            <Link href={card.href}>
              <Button variant={card.variant} className="rounded-full px-6 py-3">
                {card.button}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
