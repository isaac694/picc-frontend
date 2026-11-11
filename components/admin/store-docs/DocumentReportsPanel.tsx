'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, Banknote, CheckCircle2, Clock, Download, FileSpreadsheet, FileText, Loader2, Percent, Printer, RefreshCw, Scale, Truck } from 'lucide-react';
import { KpiCard } from '@/components/admin/DashboardBits';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { printHtml } from '@/lib/book-labels';
import { downloadReport, periodLabel, periodParams, periodSlug, withParams, type Period } from '@/lib/admin-reports';
import { money } from '@/lib/store-receipt';
import { documentAmount, documentHtml, downloadHtmlPdf, escapeHtml, invoiceDate, INVOICE_STATUS_LABEL, type InvoiceStatus } from '@/lib/store-invoice';
import { DELIVERY_STATUS_LABEL, type DeliveryNoteStatus } from '@/lib/store-documents';
import { cn } from '@/lib/utils';

type Group = { count: number; value: number };
type StatusGroup = { count: number; total: number; paid: number; balance: number };
export type DocumentReport = {
  range: { from: string | null; to: string };
  receivables: { opening: number; invoiced: number; collected: number; cancelled: number; closing: number; difference: number; balanced: boolean };
  invoices: {
    issued: { count: number; total: number; subtotal: number; discount: number; delivery: number };
    live: StatusGroup;
    pending: StatusGroup; partlyPaid: StatusGroup; paid: StatusGroup; cancelled: StatusGroup;
    collectionRate: number | null;
    stockProblems: Array<{ invoiceNumber: string; error: string }>;
    copiesSoldOnPayment: number;
  };
  aging: Array<{ key: string; label: string; count: number; amount: number }>;
  debtors: Array<{ customer: string; customerReference: string | null; contact: string | null; invoices: number; owed: number; oldestDue: string | null; daysOverdue: number }>;
  payments: { count: number; total: number; byMethod: Array<{ method: string; count: number; amount: number }>; onDelivery: { count: number; amount: number } };
  quotations: { count: number; value: number; open: Group; expired: Group; accepted: Group; declined: Group; conversionRate: number | null; fromWebsite: number };
  deliveries: {
    count: number; dispatched: number; delivered: number; copies: number; value: number; collected: number;
    byBook: Array<{ title: string; copies: number; value: number }>;
    toDeliver: { copies: number; value: number };
    deliveredUnpaid: { count: number; balance: number };
  };
  registers: {
    invoices: Array<{ invoiceNumber: string; issueDate: string | null; dueDate: string | null; customer: string; customerReference: string | null; orderReference: string | null; status: InvoiceStatus; subtotal: number; discount: number; delivery: number; total: number; paid: number; balance: number; receipt: string | null }>;
    payments: Array<{ date: string; invoiceNumber: string; customer: string; method: string; reference: string | null; amount: number; onDelivery: boolean; by: string | null }>;
    deliveryNotes: Array<{ deliveryNoteNumber: string; deliveryDate: string; invoiceNumber: string; deliverTo: string; status: DeliveryNoteStatus; copies: number; value: number; collected: number; receivedBy: string | null }>;
  };
};

const percent = (value: number | null) => (value === null ? '—' : `${value}%`);

function Card({ title, icon: Icon, children, className }: { title: string; icon: typeof FileText; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border border-border/60 bg-card p-4', className)}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-[#087989]" /> {title}</h3>
      {children}
    </section>
  );
}

function Table({ head, rows, foot }: { head: string[]; rows: Array<Array<ReactNode>>; foot?: Array<ReactNode> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>{head.map((label, index) => <th key={label} className={cn('pb-1.5 font-medium', index > 0 && 'text-right')}>{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.length ? rows.map((row, rowIndex) => (
            <tr key={rowIndex}>{row.map((cell, index) => <td key={index} className={cn('py-1.5', index > 0 && 'text-right tabular-nums')}>{cell}</td>)}</tr>
          )) : <tr><td colSpan={head.length} className="py-3 text-center text-xs text-muted-foreground">Nothing in this period.</td></tr>}
        </tbody>
        {foot ? <tfoot><tr className="border-t-2 border-border font-semibold">{foot.map((cell, index) => <td key={index} className={cn('pt-1.5', index > 0 && 'text-right tabular-nums')}>{cell}</td>)}</tr></tfoot> : null}
      </table>
    </div>
  );
}

/** The whole report as a branded A4 document, for printing or a PDF to send to the accounts office. */
function reportHtml(report: DocumentReport, label: string) {
  const amount = (value: number) => documentAmount(value);
  const table = (head: string[], rows: Array<Array<string | number>>) => `<table class="items rep"><thead><tr>${head.map((cell, index) => `<th class="${index ? 'right' : ''}">${escapeHtml(cell)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map((row, rowIndex) => `<tr class="${rowIndex % 2 === 0 ? 'shade' : ''}">${row.map((cell, index) => `<td class="${index ? 'right' : ''}">${escapeHtml(cell)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${head.length}">Nothing in this period.</td></tr>`}</tbody></table>`;
  const r = report.receivables;
  const content = `
  <div class="details">
    <div class="label">Period</div><div class="label">Prepared</div>
    <div class="field"><span>Covering</span><span class="value">${escapeHtml(label)}</span></div>
    <div class="field"><span>Printed</span><span class="value">${escapeHtml(invoiceDate(new Date().toISOString()))}</span></div>
  </div>
  <h2>Receivables statement (MWK)</h2>
  ${table(['', 'Amount'], [
    ['Owed by customers at the start', amount(r.opening)],
    ['+ Invoiced in the period', amount(r.invoiced)],
    ['− Collected in the period', amount(r.collected)],
    ['− Cancelled invoices', amount(r.cancelled)],
    ['= Owed at the end', amount(r.closing)],
  ])}
  <p class="note">${r.balanced ? 'The statement balances.' : `Check: the figures differ by ${amount(r.difference)}.`}</p>
  <h2>Invoices issued in the period</h2>
  ${table(['Status', 'Invoices', 'Total', 'Paid', 'Balance'], [
    ['Pending', report.invoices.pending.count, amount(report.invoices.pending.total), amount(report.invoices.pending.paid), amount(report.invoices.pending.balance)],
    ['Part paid', report.invoices.partlyPaid.count, amount(report.invoices.partlyPaid.total), amount(report.invoices.partlyPaid.paid), amount(report.invoices.partlyPaid.balance)],
    ['Paid', report.invoices.paid.count, amount(report.invoices.paid.total), amount(report.invoices.paid.paid), amount(report.invoices.paid.balance)],
    ['Cancelled', report.invoices.cancelled.count, amount(report.invoices.cancelled.total), '—', '—'],
  ])}
  <h2>What is owed, by age (at the end of the period)</h2>
  ${table(['Age', 'Invoices', 'Amount'], report.aging.map((bucket) => [bucket.label, bucket.count, amount(bucket.amount)]))}
  <h2>Money collected, by method</h2>
  ${table(['Method', 'Payments', 'Amount'], [...report.payments.byMethod.map((entry) => [entry.method, entry.count, amount(entry.amount)]), ['Of which collected on delivery', report.payments.onDelivery.count, amount(report.payments.onDelivery.amount)]])}
  <h2>Customers who owe the most</h2>
  ${table(['Customer', 'Invoices', 'Days overdue', 'Owed'], report.debtors.map((debtor) => [`${debtor.customer}${debtor.customerReference ? ` (${debtor.customerReference})` : ''}`, debtor.invoices, debtor.daysOverdue > 0 ? debtor.daysOverdue : 'Not due', amount(debtor.owed)]))}
  <h2>Quotations</h2>
  ${table(['', 'Count', 'Value'], [
    ['Prepared', report.quotations.count, amount(report.quotations.value)],
    ['Turned into invoices', report.quotations.accepted.count, amount(report.quotations.accepted.value)],
    ['Still open', report.quotations.open.count, amount(report.quotations.open.value)],
    ['Expired', report.quotations.expired.count, amount(report.quotations.expired.value)],
    ['Declined', report.quotations.declined.count, amount(report.quotations.declined.value)],
  ])}
  <p class="note">Conversion rate: ${percent(report.quotations.conversionRate)} · ${report.quotations.fromWebsite} from the website.</p>
  <h2>Deliveries</h2>
  ${table(['', 'Value'], [
    [`Delivery notes: ${report.deliveries.count} (${report.deliveries.delivered} delivered, ${report.deliveries.dispatched} awaiting signature)`, ''],
    [`Copies delivered: ${report.deliveries.copies}`, amount(report.deliveries.value)],
    ['Money collected on delivery', amount(report.deliveries.collected)],
    [`Still to deliver (all open invoices): ${report.deliveries.toDeliver.copies} copies`, amount(report.deliveries.toDeliver.value)],
    [`Delivered but not fully paid: ${report.deliveries.deliveredUnpaid.count} invoices`, amount(report.deliveries.deliveredUnpaid.balance)],
  ])}`;
  const css = `
  h2 { font-size: 11pt; margin: 6mm 0 2mm; color: #123747; }
  table.rep td { height: auto; padding: 1.4mm 2mm; }
  .note { margin: 1.5mm 0 0; color: #425B65; font-size: 8.5pt; }
  .details { grid-template-columns: 1fr 1fr; }`;
  return documentHtml({ title: `Sales documents report ${label}`, heading: 'Invoices & Deliveries Report', content, css });
}

export default function DocumentReportsPanel({ headers, period }: { headers: () => Record<string, string>; period: Period }) {
  const [report, setReport] = useState<DocumentReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const label = periodLabel(period);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(withParams('/api/admin/store/document-reports', periodParams(period)), { headers: headers(), cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok) return adminErrorToast(data?.error || 'Unable to load the report.');
      setReport(data);
    } finally {
      setLoading(false);
    }
  }, [period, headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportRegister = async (kind: 'invoices' | 'payments' | 'deliveries', format: 'excel' | 'pdf') => {
    if (!report) return;
    setExporting(`${kind}:${format}`);
    try {
      const slug = periodSlug(period);
      if (kind === 'invoices') {
        const rows = report.registers.invoices;
        await downloadReport({
          format,
          title: `Invoice register · ${label}`,
          fileName: `invoice-register-${slug}`,
          columns: [
            { key: 'invoiceNumber', label: 'Invoice' }, { key: 'issueDate', label: 'Issued' }, { key: 'dueDate', label: 'Due' }, { key: 'customer', label: 'Customer' },
            { key: 'customerReference', label: 'Customer ref.' }, { key: 'orderReference', label: 'Quotation / order ref.' }, { key: 'status', label: 'Status' },
            { key: 'subtotal', label: 'Subtotal' }, { key: 'discount', label: 'Discount' }, { key: 'delivery', label: 'Delivery' }, { key: 'total', label: 'Total' },
            { key: 'paid', label: 'Paid' }, { key: 'balance', label: 'Balance' }, { key: 'receipt', label: 'Sale receipt' },
          ],
          rows: rows.map((row) => ({
            ...row,
            issueDate: invoiceDate(row.issueDate), dueDate: invoiceDate(row.dueDate), customerReference: row.customerReference || '', orderReference: row.orderReference || '',
            status: INVOICE_STATUS_LABEL[row.status] || row.status, subtotal: documentAmount(row.subtotal), discount: documentAmount(row.discount), delivery: documentAmount(row.delivery),
            total: documentAmount(row.total), paid: documentAmount(row.paid), balance: documentAmount(row.balance), receipt: row.receipt || '',
          })),
          summary: [
            ['Invoices', rows.length],
            ['Invoiced', money(report.receivables.invoiced)],
            ['Owed at the start', money(report.receivables.opening)],
            ['Collected', money(report.receivables.collected)],
            ['Cancelled', money(report.receivables.cancelled)],
            ['Owed at the end', money(report.receivables.closing)],
          ],
        });
      } else if (kind === 'payments') {
        const rows = report.registers.payments;
        await downloadReport({
          format,
          title: `Payments received · ${label}`,
          fileName: `invoice-payments-${slug}`,
          columns: [
            { key: 'date', label: 'Date' }, { key: 'invoiceNumber', label: 'Invoice' }, { key: 'customer', label: 'Customer' }, { key: 'method', label: 'Method' },
            { key: 'reference', label: 'Reference' }, { key: 'amount', label: 'Amount' }, { key: 'onDelivery', label: 'On delivery' }, { key: 'by', label: 'Recorded by' },
          ],
          rows: rows.map((row) => ({ ...row, date: invoiceDate(row.date), reference: row.reference || '', amount: documentAmount(row.amount), onDelivery: row.onDelivery ? 'Yes' : '', by: row.by || '' })),
          summary: [['Payments', rows.length], ['Total collected', money(report.payments.total)], ...report.payments.byMethod.map((entry) => [entry.method, money(entry.amount)] as [string, string])],
        });
      } else {
        const rows = report.registers.deliveryNotes;
        await downloadReport({
          format,
          title: `Delivery notes · ${label}`,
          fileName: `delivery-notes-${slug}`,
          columns: [
            { key: 'deliveryNoteNumber', label: 'Delivery note' }, { key: 'deliveryDate', label: 'Date' }, { key: 'invoiceNumber', label: 'Invoice' }, { key: 'deliverTo', label: 'Deliver to' },
            { key: 'status', label: 'Status' }, { key: 'copies', label: 'Copies' }, { key: 'value', label: 'Value' }, { key: 'collected', label: 'Collected' }, { key: 'receivedBy', label: 'Received by' },
          ],
          rows: rows.map((row) => ({ ...row, deliveryDate: invoiceDate(row.deliveryDate), status: DELIVERY_STATUS_LABEL[row.status] || row.status, copies: String(row.copies), value: documentAmount(row.value), collected: documentAmount(row.collected), receivedBy: row.receivedBy || '' })),
          summary: [['Delivery notes', rows.length], ['Copies delivered', report.deliveries.copies], ['Value delivered', money(report.deliveries.value)], ['Collected on delivery', money(report.deliveries.collected)]],
        });
      }
    } catch {
      adminErrorToast('Could not make the file.');
    } finally {
      setExporting(null);
    }
  };

  const downloadFullPdf = async () => {
    if (!report) return;
    setExporting('full:pdf');
    try {
      await downloadHtmlPdf(reportHtml(report, label), `invoices-deliveries-report-${periodSlug(period)}.pdf`);
    } catch {
      adminErrorToast('Could not make the PDF. Use Print and choose Save as PDF instead.');
    } finally {
      setExporting(null);
    }
  };

  if (!report) {
    return <div className="flex items-center justify-center rounded-xl border border-border/60 bg-card py-16 text-sm text-muted-foreground">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'No report yet.'}</div>;
  }

  const r = report.receivables;
  const agingMax = Math.max(1, ...report.aging.map((bucket) => bucket.amount));
  const exportButton = (kind: 'invoices' | 'payments' | 'deliveries', title: string) => (
    <div className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs">
      <span className="mr-1 font-medium">{title}</span>
      {(['excel', 'pdf'] as const).map((format) => (
        <Button key={format} size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void exportRegister(kind, format)} disabled={Boolean(exporting)}>
          {exporting === `${kind}:${format}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : format === 'excel' ? <FileSpreadsheet className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />} {format === 'excel' ? 'Excel' : 'PDF'}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {exportButton('invoices', 'Invoice register')}
          {exportButton('payments', 'Payments')}
          {exportButton('deliveries', 'Delivery notes')}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-9" onClick={() => void load()} disabled={loading} aria-label="Refresh"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
          <Button size="sm" variant="outline" className="h-9" onClick={() => printHtml(reportHtml(report, label), `Report ${label}`)}><Printer className="h-4 w-4" /> Print report</Button>
          <Button size="sm" className="h-9" onClick={() => void downloadFullPdf()} disabled={Boolean(exporting)}>
            {exporting === 'full:pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Report PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={FileText} label="Invoiced" value={money(r.invoiced)} detail={`${report.invoices.issued.count} invoices · ${label}`} />
        <KpiCard icon={Banknote} label="Collected" value={money(r.collected)} detail={`${report.payments.count} payments received`} />
        <KpiCard icon={Clock} label="Owed at the end" value={money(r.closing)} detail={`${report.aging.reduce((sum, bucket) => sum + bucket.count, 0)} invoices with a balance`} />
        <KpiCard icon={Percent} label="Collection rate" value={percent(report.invoices.collectionRate)} detail="Paid, of what was invoiced in the period" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Receivables statement" icon={Scale}>
          <dl className="space-y-1.5 text-sm">
            {[
              ['Owed by customers at the start', r.opening, ''],
              ['Invoiced in the period', r.invoiced, '+'],
              ['Collected in the period', r.collected, '−'],
              ['Cancelled invoices', r.cancelled, '−'],
            ].map(([name, value, sign]) => (
              <div key={String(name)} className="flex justify-between gap-3"><dt className="text-muted-foreground">{sign ? `${sign} ` : ''}{name}</dt><dd className="tabular-nums">{money(Number(value))}</dd></div>
            ))}
            <div className="flex justify-between gap-3 border-t-2 border-border pt-1.5 font-semibold"><dt>= Owed at the end</dt><dd className="tabular-nums">{money(r.closing)}</dd></div>
          </dl>
          <p className={cn('mt-3 flex items-center gap-1.5 text-xs', r.balanced ? 'text-emerald-700 dark:text-emerald-300' : 'text-destructive')}>
            {r.balanced ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {r.balanced ? 'Balances: start + invoiced − collected − cancelled = end.' : `Out by ${money(r.difference)}. An invoice may have been edited after payments were taken.`}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Invoiced counts invoices dated in the period. Collected counts money received in the period, whatever the invoice date. Discounts given: {money(report.invoices.issued.discount)}; delivery charged: {money(report.invoices.issued.delivery)}.
          </p>
        </Card>

        <Card title="What is owed, by age" icon={Clock}>
          <div className="space-y-2">
            {report.aging.map((bucket) => (
              <div key={bucket.key} className="text-sm">
                <div className="flex justify-between gap-3"><span>{bucket.label} <span className="text-xs text-muted-foreground">({bucket.count})</span></span><span className="tabular-nums">{money(bucket.amount)}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className={cn('h-1.5 rounded-full', bucket.key === 'current' ? 'bg-sky-500' : bucket.key === 'd1_30' ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${(bucket.amount / agingMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">As at {invoiceDate(report.range.to)}, counted from each invoice&apos;s due date.</p>
        </Card>

        <Card title="Invoices issued in the period" icon={FileText}>
          <Table
            head={['Status', 'Invoices', 'Total', 'Paid', 'Balance']}
            rows={([['Pending', report.invoices.pending], ['Part paid', report.invoices.partlyPaid], ['Paid', report.invoices.paid], ['Cancelled', report.invoices.cancelled]] as const).map(([name, group]) => [
              name, group.count, money(group.total), name === 'Cancelled' ? '—' : money(group.paid), name === 'Cancelled' ? '—' : money(group.balance),
            ])}
            foot={['Live invoices', report.invoices.live.count, money(report.invoices.live.total), money(report.invoices.live.paid), money(report.invoices.live.balance)]}
          />
          <p className="mt-2 text-[11px] text-muted-foreground">{report.invoices.copiesSoldOnPayment} copies sold on invoices paid in the period.</p>
          {report.invoices.stockProblems.length ? (
            <p className="mt-2 text-xs text-destructive">Not out of stock yet: {report.invoices.stockProblems.map((entry) => `${entry.invoiceNumber} (${entry.error})`).join('; ')}</p>
          ) : null}
        </Card>

        <Card title="Money collected, by method" icon={Banknote}>
          <Table
            head={['Method', 'Payments', 'Amount']}
            rows={report.payments.byMethod.map((entry) => [entry.method, entry.count, money(entry.amount)])}
            foot={['Total', report.payments.count, money(report.payments.total)]}
          />
          <p className="mt-2 text-[11px] text-muted-foreground">Of which {money(report.payments.onDelivery.amount)} ({report.payments.onDelivery.count}) was collected on delivery.</p>
        </Card>

        <Card title="Customers who owe the most" icon={AlertTriangle}>
          <Table
            head={['Customer', 'Invoices', 'Overdue', 'Owed']}
            rows={report.debtors.map((debtor) => [
              <span key="c">{debtor.customer}<span className="block text-[11px] text-muted-foreground">{[debtor.customerReference, debtor.contact].filter(Boolean).join(' · ')}</span></span>,
              debtor.invoices,
              debtor.daysOverdue > 0 ? <span key="d" className="text-destructive">{debtor.daysOverdue} days</span> : 'Not due',
              money(debtor.owed),
            ])}
          />
        </Card>

        <Card title="Quotations" icon={Percent}>
          <Table
            head={['', 'Count', 'Value']}
            rows={[
              ['Prepared', report.quotations.count, money(report.quotations.value)],
              ['Turned into invoices', report.quotations.accepted.count, money(report.quotations.accepted.value)],
              ['Still open', report.quotations.open.count, money(report.quotations.open.value)],
              ['Expired', report.quotations.expired.count, money(report.quotations.expired.value)],
              ['Declined', report.quotations.declined.count, money(report.quotations.declined.value)],
            ]}
          />
          <p className="mt-2 text-[11px] text-muted-foreground">Conversion rate {percent(report.quotations.conversionRate)} · {report.quotations.fromWebsite} came from the website.</p>
        </Card>

        <Card title="Deliveries" icon={Truck} className="xl:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <dl className="space-y-1.5 text-sm">
              {[
                ['Delivery notes', `${report.deliveries.count} (${report.deliveries.delivered} delivered, ${report.deliveries.dispatched} awaiting signature)`],
                ['Copies delivered', `${report.deliveries.copies} · ${money(report.deliveries.value)}`],
                ['Collected on delivery', money(report.deliveries.collected)],
                ['Still to deliver (all open invoices)', `${report.deliveries.toDeliver.copies} copies · ${money(report.deliveries.toDeliver.value)}`],
                ['Delivered but not fully paid', `${report.deliveries.deliveredUnpaid.count} invoices · ${money(report.deliveries.deliveredUnpaid.balance)} owed`],
              ].map(([name, value]) => (
                <div key={name} className="flex justify-between gap-3"><dt className="text-muted-foreground">{name}</dt><dd className="text-right tabular-nums">{value}</dd></div>
              ))}
            </dl>
            <Table head={['Book', 'Copies', 'Value']} rows={report.deliveries.byBook.map((book) => [book.title, book.copies, money(book.value)])} />
          </div>
        </Card>
      </div>
    </div>
  );
}
