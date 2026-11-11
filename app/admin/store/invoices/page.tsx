'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, FileSignature, FileText, Truck } from 'lucide-react';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { type InvoiceDefaults } from '@/components/admin/InvoiceEditorDialog';
import PeriodFilter from '@/components/admin/PeriodFilter';
import DeliveryNotesPanel from '@/components/admin/store-docs/DeliveryNotesPanel';
import DocumentReportsPanel from '@/components/admin/store-docs/DocumentReportsPanel';
import InvoicesPanel from '@/components/admin/store-docs/InvoicesPanel';
import QuotationsPanel from '@/components/admin/store-docs/QuotationsPanel';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { type Period } from '@/lib/admin-reports';
import type { AdminInvoice } from '@/lib/store-invoice';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'invoices', label: 'Invoices', icon: FileText, hint: 'Record payments, mark invoices paid and send books out.' },
  { key: 'quotations', label: 'Quotations', icon: FileSignature, hint: 'Quotes from the website and the counter; turn an accepted one into an invoice.' },
  { key: 'delivery', label: 'Delivery notes', icon: Truck, hint: 'Books sent out against invoices, who signed for them and money collected.' },
  { key: 'reports', label: 'Reports', icon: BarChart3, hint: 'What was invoiced, collected and is still owed, with deliveries and quotations.' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/** Hope Publishing House sales documents: quotations, invoices, delivery notes and their reports. */
export default function StoreDocumentsPage() {
  return (
    <Suspense fallback={null}>
      <StoreDocuments />
    </Suspense>
  );
}

function StoreDocuments() {
  const { token, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requested = searchParams.get('tab');
  const tab: TabKey = TABS.some((entry) => entry.key === requested) ? (requested as TabKey) : 'invoices';
  const [period, setPeriod] = useState<Period>({ preset: 'month' });
  const [defaults, setDefaults] = useState<InvoiceDefaults | null>(null);
  const [focusInvoice, setFocusInvoice] = useState<AdminInvoice | null>(null);

  const headers = useCallback(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);
  const goTo = useCallback((key: TabKey) => router.replace(`${pathname}?tab=${key}`, { scroll: false }), [router, pathname]);

  const loadDefaults = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch('/api/admin/store/invoice-defaults', { headers: headers() });
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setDefaults({
        paymentInstructions: data?.paymentInstructions || null,
        termsDays: data?.termsDays || 14,
        quotationTerms: data?.quotationTerms || null,
        quotationValidDays: data?.quotationValidDays || 30,
      });
    }
  }, [token, headers]);

  useEffect(() => {
    void loadDefaults();
  }, [loadDefaults]);

  const clearFocus = useCallback(() => setFocusInvoice(null), []);

  if (!token) {
    return <AdminLoginCard email={email} password={password} loginError={loginError} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />;
  }

  const current = TABS.find((entry) => entry.key === tab) || TABS[0];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Hope Publishing House</p>
        <h1 className="text-2xl font-semibold">Invoices, quotations &amp; deliveries</h1>
        <p className="text-sm text-muted-foreground">{current.hint}</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border/60 bg-card p-1" aria-label="Sales documents">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => goTo(entry.key)}
            aria-current={tab === entry.key ? 'page' : undefined}
            className={cn('flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium', tab === entry.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
          >
            <entry.icon className="h-4 w-4" /> {entry.label}
          </button>
        ))}
      </nav>

      <div className="rounded-xl border border-border/60 bg-card p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Period for the figures and lists below</p>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {tab === 'invoices' ? (
        <InvoicesPanel headers={headers} period={period} defaults={defaults} onDefaultsChanged={() => void loadDefaults()} focus={focusInvoice} onFocusHandled={clearFocus} />
      ) : null}
      {tab === 'quotations' ? (
        <QuotationsPanel
          headers={headers}
          period={period}
          defaults={defaults}
          onDefaultsChanged={() => void loadDefaults()}
          onInvoiced={(invoice) => {
            setFocusInvoice(invoice);
            goTo('invoices');
          }}
        />
      ) : null}
      {tab === 'delivery' ? <DeliveryNotesPanel headers={headers} period={period} onOpenInvoices={() => goTo('invoices')} /> : null}
      {tab === 'reports' ? <DocumentReportsPanel headers={headers} period={period} /> : null}
    </div>
  );
}
