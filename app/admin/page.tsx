'use client';

import type { ComponentType } from 'react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import {
  ADMIN_ACCESS_RIGHT,
  ADMIN_PAGE,
  canAccessAdminPage,
  canAccessEventPaymentPath,
  canAccessRight,
} from '@/lib/admin-pages';

type KpiCard = {
  key: string;
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCount = (value: number | null) => (value == null ? '—' : value.toLocaleString());

async function readJson(token: string, path: string) {
  const response = await apiFetch(path, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

export default function AdminDashboardPage() {
  const { token, user } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<KpiCard[]>([]);

  const load = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);

    const jobs: Array<Promise<KpiCard | null>> = [];

    if (canAccessRight(user, ADMIN_ACCESS_RIGHT.USER_LIST)) {
      jobs.push(
        readJson(token, '/api/admin/users').then((data) => {
          const users = asRecord(data)?.users;
          const list = Array.isArray(users) ? users.filter((item): item is Record<string, unknown> => Boolean(asRecord(item))) : null;
          const admins = list?.filter((item) => item.role === 'ADMIN' || item.role === 'SUPER_ADMIN').length ?? 0;
          return {
            key: 'users',
            label: 'Users',
            value: formatCount(list ? list.length : null),
            hint: list ? `${admins.toLocaleString()} admin accounts` : 'Unable to load',
            href: '/admin/users',
            icon: Users,
          };
        }),
      );
    }

    if (canAccessRight(user, ADMIN_ACCESS_RIGHT.ROLE_LIST)) {
      jobs.push(
        readJson(token, '/api/admin/roles').then((data) => {
          const roles = asRecord(data)?.roles;
          const list = Array.isArray(roles) ? roles : null;
          return {
            key: 'roles',
            label: 'Roles',
            value: formatCount(list ? list.length : null),
            hint: list ? 'Access roles' : 'Unable to load',
            href: '/admin/roles',
            icon: ShieldCheck,
          };
        }),
      );
    }

    if (canAccessAdminPage(user, ADMIN_PAGE.DEVOTIONS)) {
      jobs.push(
        readJson(token, '/api/devotions/admin?take=1').then((data) => ({
          key: 'devotions',
          label: 'Devotions',
          value: formatCount(data ? asNumber(asRecord(data)?.total) : null),
          hint: 'Published and scheduled',
          href: '/admin/devotions',
          icon: BookOpen,
        })),
      );
    }

    if (canAccessAdminPage(user, ADMIN_PAGE.EVENTS)) {
      jobs.push(
        readJson(token, '/api/admin/events?take=1').then((data) => ({
          key: 'events',
          label: 'Events',
          value: formatCount(data ? asNumber(asRecord(data)?.total) : null),
          hint: 'All church events',
          href: '/admin/events',
          icon: CalendarDays,
        })),
      );
    }

    if (canAccessAdminPage(user, ADMIN_PAGE.HR_PAGE)) {
      jobs.push(
        readJson(token, '/api/admin/hr/dashboard/kpis').then((data) => {
          const kpis = asRecord(asRecord(data)?.kpis);
          const vacancies = asRecord(kpis?.vacancies);
          const applicants = asRecord(kpis?.applicants);
          return {
            key: 'hr',
            label: 'Open vacancies',
            value: formatCount(vacancies ? asNumber(vacancies.open) : null),
            hint: `${formatCount(applicants ? asNumber(applicants.total) : null)} applicants`,
            href: '/admin/hr/dashboard',
            icon: BriefcaseBusiness,
          };
        }),
      );
    }

    if (canAccessAdminPage(user, ADMIN_PAGE.STORE_PAGE)) {
      jobs.push(
        readJson(token, '/api/admin/store/dashboard/kpis').then((data) => {
          const purchases = asRecord(asRecord(asRecord(data)?.kpis)?.purchases);
          return {
            key: 'store',
            label: 'Store sales',
            value: formatCount(purchases ? asNumber(purchases.paid) : null),
            hint: `${formatCount(purchases ? asNumber(purchases.pending) : null)} awaiting payment`,
            href: '/admin/store/dashboard',
            icon: ShoppingBag,
          };
        }),
      );
    }

    if (canAccessAdminPage(user, ADMIN_PAGE.GIVE_PAGE)) {
      jobs.push(
        readJson(token, '/api/admin/giving/dashboard/kpis').then((data) => {
          const givings = asRecord(asRecord(asRecord(data)?.kpis)?.givings);
          return {
            key: 'giving',
            label: 'Giving',
            value: formatCount(givings ? asNumber(givings.completed) : null),
            hint: `${formatCount(givings ? asNumber(givings.pending) : null)} pending`,
            href: '/admin/giving/dashboard',
            icon: Wallet,
          };
        }),
      );
    }

    if (canAccessEventPaymentPath(user, '/admin/event-payments/dashboard')) {
      jobs.push(
        readJson(token, '/api/admin/event-payments/dashboard/kpis').then((data) => {
          const payments = asRecord(asRecord(asRecord(data)?.kpis)?.payments);
          return {
            key: 'tickets',
            label: 'Event tickets',
            value: formatCount(payments ? asNumber(payments.completed) : null),
            hint: `${formatCount(payments ? asNumber(payments.pending) : null)} pending`,
            href: '/admin/event-payments/dashboard',
            icon: Ticket,
          };
        }),
      );
    }

    const next = (await Promise.all(jobs)).filter((card): card is KpiCard => Boolean(card));
    setCards(next);
    setLoading(false);
  }, [token, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">Admin</p>
          <h1 className="text-base font-semibold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Live counts for the areas this account can open.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {cards.length === 0 && !loading ? (
        <div className="rounded-lg border border-border/60 bg-card p-4 text-xs text-muted-foreground">
          No dashboard counts are available for this account.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          {(loading && cards.length === 0 ? Array.from({ length: 4 }, (_, index) => ({
            key: `loading-${index}`,
            label: 'Loading',
            value: '—',
            hint: 'Fetching',
            href: '/admin',
            icon: Users,
          })) : cards).map((card) => {
            const Icon = card.icon;
            const body = (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold leading-none text-foreground">{card.value}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{card.hint}</p>
              </>
            );
            return card.href === '/admin' ? (
              <div key={card.key} className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
                {body}
              </div>
            ) : (
              <Link key={card.key} href={card.href} className="rounded-xl border border-border/60 bg-card p-3 shadow-sm transition hover:border-primary/40">
                {body}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
