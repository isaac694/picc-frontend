'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type Tab = { label: string; href: string };

const GIVING_TABS: Tab[] = [
  { label: 'Giving dashboard', href: '/admin/giving/dashboard' },
  { label: 'Giving payments', href: '/admin/giving/payments' },
];

const STORE_TABS: Tab[] = [
  { label: 'Store dashboard', href: '/admin/store/dashboard' },
  { label: 'Book store payments', href: '/admin/store/payments' },
];

const EVENT_TABS: Tab[] = [
  { label: 'Events payment dashboard', href: '/admin/event-payments/dashboard' },
  { label: 'Events payment', href: '/admin/event-payments' },
];

export function GivingPaymentsTabs({ activePath }: { activePath: string }) {
  return <PaymentsTabs tabs={GIVING_TABS} activePath={activePath} />;
}

export function StorePaymentsTabs({ activePath }: { activePath: string }) {
  return <PaymentsTabs tabs={STORE_TABS} activePath={activePath} />;
}

export function EventPaymentsTabs({ activePath }: { activePath: string }) {
  return <PaymentsTabs tabs={EVENT_TABS} activePath={activePath} exact />;
}

function PaymentsTabs({ tabs, activePath, exact = false }: { tabs: Tab[]; activePath: string; exact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
      {tabs.map((tab) => {
        const active = exact
          ? activePath === tab.href
          : activePath === tab.href || activePath.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
