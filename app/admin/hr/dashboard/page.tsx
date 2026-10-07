'use client';

import type { ComponentType, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { BriefcaseBusiness, FileText, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminErrorToast } from '@/components/admin/admin-toast';

type VacancyStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED';

type HrDashboard = {
  vacancies: {
    total: number;
    open: number;
    draft: number;
    closed: number;
    archived: number;
    closingSoon: number;
    byStatus: Partial<Record<VacancyStatus, number>>;
    byDepartment: Array<{ department: string; count: number }>;
  };
  applicants: { total: number };
  applications: {
    total: number;
    newLast30Days: number;
    submitted: number;
    underReview: number;
    shortlisted: number;
    rejected: number;
    hired: number;
    withdrawn: number;
    hireRate: number;
  };
  documents: { uploaded: number };
};

type RecentApplication = {
  id: string;
  status: string;
  createdAt?: string;
  applicant?: {
    name?: string;
    email?: string;
  };
  vacancy?: {
    title?: string;
    department?: string;
  };
};

const EMPTY_DASHBOARD: HrDashboard = {
  vacancies: {
    total: 0,
    open: 0,
    draft: 0,
    closed: 0,
    archived: 0,
    closingSoon: 0,
    byStatus: {},
    byDepartment: [],
  },
  applicants: { total: 0 },
  applications: {
    total: 0,
    newLast30Days: 0,
    submitted: 0,
    underReview: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
    withdrawn: 0,
    hireRate: 0,
  },
  documents: { uploaded: 0 },
};

const numberValue = (value: unknown) => Number(value || 0);

const normalizeDashboard = (value: unknown): { dashboard: HrDashboard; recentApplications: RecentApplication[] } => {
  const record = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const kpis = (record.kpis && typeof record.kpis === 'object' ? record.kpis : {}) as Record<string, unknown>;
  const vacancies = (kpis.vacancies && typeof kpis.vacancies === 'object' ? kpis.vacancies : {}) as Record<string, unknown>;
  const applications = (kpis.applications && typeof kpis.applications === 'object' ? kpis.applications : {}) as Record<string, unknown>;
  const applicants = (kpis.applicants && typeof kpis.applicants === 'object' ? kpis.applicants : {}) as Record<string, unknown>;
  const documents = (kpis.documents && typeof kpis.documents === 'object' ? kpis.documents : {}) as Record<string, unknown>;

  return {
    dashboard: {
      vacancies: {
        total: numberValue(vacancies.total),
        open: numberValue(vacancies.open),
        draft: numberValue(vacancies.draft),
        closed: numberValue(vacancies.closed),
        archived: numberValue(vacancies.archived),
        closingSoon: numberValue(vacancies.closingSoon),
        byStatus: (vacancies.byStatus && typeof vacancies.byStatus === 'object'
          ? vacancies.byStatus
          : {}) as Partial<Record<VacancyStatus, number>>,
        byDepartment: Array.isArray(vacancies.byDepartment)
          ? vacancies.byDepartment.map((item) => {
              const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
              return {
                department: String(row.department || 'Unassigned'),
                count: numberValue(row.count),
              };
            })
          : [],
      },
      applicants: { total: numberValue(applicants.total) },
      applications: {
        total: numberValue(applications.total),
        newLast30Days: numberValue(applications.newLast30Days),
        submitted: numberValue(applications.submitted),
        underReview: numberValue(applications.underReview),
        shortlisted: numberValue(applications.shortlisted),
        rejected: numberValue(applications.rejected),
        hired: numberValue(applications.hired),
        withdrawn: numberValue(applications.withdrawn),
        hireRate: numberValue(applications.hireRate),
      },
      documents: { uploaded: numberValue(documents.uploaded) },
    },
    recentApplications: Array.isArray(record.recentApplications)
      ? (record.recentApplications as RecentApplication[])
      : [],
  };
};

export default function HrDashboardPage() {
  const { token } = useAdminAuth();
  const [dashboard, setDashboard] = useState<HrDashboard>(EMPTY_DASHBOARD);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/hr/dashboard/kpis', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || data.message || 'Unable to load HR dashboard.');
        return;
      }
      const normalized = normalizeDashboard(data);
      setDashboard(normalized.dashboard);
      setRecentApplications(normalized.recentApplications);
    } catch {
      adminErrorToast('Unable to load HR dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const statusRows = [
    { label: 'Draft', value: numberValue(dashboard.vacancies.byStatus.DRAFT ?? dashboard.vacancies.draft) },
    { label: 'Open', value: numberValue(dashboard.vacancies.byStatus.OPEN ?? dashboard.vacancies.open) },
    { label: 'Closed', value: numberValue(dashboard.vacancies.byStatus.CLOSED ?? dashboard.vacancies.closed) },
    { label: 'Archived', value: numberValue(dashboard.vacancies.byStatus.ARCHIVED ?? dashboard.vacancies.archived) },
  ];
  const maxStatus = Math.max(...statusRows.map((row) => row.value), 1);
  const maxDepartment = Math.max(...dashboard.vacancies.byDepartment.map((row) => row.count), 1);
  const applicationRows = [
    { label: 'Submitted', value: dashboard.applications.submitted },
    { label: 'Under Review', value: dashboard.applications.underReview },
    { label: 'Shortlisted', value: dashboard.applications.shortlisted },
    { label: 'Rejected', value: dashboard.applications.rejected },
    { label: 'Hired', value: dashboard.applications.hired },
    { label: 'Withdrawn', value: dashboard.applications.withdrawn },
  ];
  const maxApplication = Math.max(...applicationRows.map((row) => row.value), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">HR vacancies, applicant activity, and hiring progress.</p>
        </div>
        <Button variant="outline" onClick={fetchDashboard} loading={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={BriefcaseBusiness} label="Total Vacancies" value={dashboard.vacancies.total} detail={`${dashboard.vacancies.open} open, ${dashboard.vacancies.closingSoon} closing soon`} />
        <KpiCard icon={Users} label="Applicants" value={dashboard.applicants.total} detail="Registered applicant profiles" />
        <KpiCard icon={FileText} label="Applications" value={dashboard.applications.total} detail={`${dashboard.applications.newLast30Days} new in last 30 days`} />
        <KpiCard icon={TrendingUp} label="Hire Rate" value={`${dashboard.applications.hireRate}%`} detail={`${dashboard.documents.uploaded} documents uploaded`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Vacancies by Status">
          {statusRows.map((row) => <BarRow key={row.label} label={row.label} value={row.value} max={maxStatus} />)}
        </ChartCard>
        <ChartCard title="Applications Pipeline">
          {applicationRows.map((row) => <BarRow key={row.label} label={row.label} value={row.value} max={maxApplication} />)}
        </ChartCard>
        <ChartCard title="Departments">
          {dashboard.vacancies.byDepartment.map((row) => <BarRow key={row.department} label={row.department} value={row.count} max={maxDepartment} />)}
          {dashboard.vacancies.byDepartment.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No department data yet.</p>
          ) : null}
        </ChartCard>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="text-lg font-semibold">Recent Applications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Applicant</th>
                <th className="px-5 py-3 font-semibold">Vacancy</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentApplications.map((application) => (
                <tr key={application.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{application.applicant?.name || 'Applicant'}</p>
                    <p className="text-xs text-muted-foreground">{application.applicant?.email || '-'}</p>
                  </td>
                  <td className="px-5 py-4">{application.vacancy?.title || '-'}</td>
                  <td className="px-5 py-4"><Badge variant="outline">{application.status}</Badge></td>
                  <td className="px-5 py-4">{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentApplications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent applications yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}
