'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { ADMIN_PAGE, canAccessAdminPage } from '@/lib/admin-pages';

export default function AdminHomePage() {
  const { user, token, handleLogout } = useAdminAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const cards = [
    ...(isSuperAdmin
      ? [
          {
            key: 'users',
            title: 'User Management',
            description: 'Create admins and control which admin pages they can access.',
            href: '/admin/users',
            button: 'Manage Users',
            variant: 'default' as const,
          },
        ]
      : []),
    {
      key: 'devotions',
      pageKey: ADMIN_PAGE.DEVOTIONS,
      title: 'Devotions',
      description: 'Write and publish daily devotions.',
      href: '/admin/devotions',
      button: 'Open Devotions',
      variant: 'default' as const,
    },
    {
      key: 'confessions',
      pageKey: ADMIN_PAGE.CONFESSIONS,
      title: 'Confessions',
      description: 'Upload daily confession declarations.',
      href: '/admin/confessions',
      button: 'Open Confessions',
      variant: 'default' as const,
    },
    {
      key: 'video-declarations',
      pageKey: ADMIN_PAGE.VIDEO_DECLARATIONS,
      title: 'Video Declarations',
      description: 'Publish the video or audio declaration shown on the homepage.',
      href: '/admin/video-declarations',
      button: 'Open Declarations',
      variant: 'default' as const,
    },
    {
      key: 'livechat',
      pageKey: ADMIN_PAGE.LIVECHAT,
      title: 'Live Chat Archive',
      description: 'Review chat messages for every streamed video.',
      href: '/admin/livechat',
      button: 'Open Archive',
      variant: 'default' as const,
    },
  ].filter((card) => {
    if (!('pageKey' in card)) return true;
    // @ts-expect-error pageKey is optional on some cards
    return canAccessAdminPage(user, card.pageKey);
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
        {token && (
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        )}
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
