'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Banknote, Clock3, FileSpreadsheet, FileText, Layers, Mail, Pencil, Plus, Ticket, Trash2, UserCheck, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatAdminDate, formatMoney } from '@/lib/admin-payments';
import { downloadRegistrationsExcel, downloadRegistrationsPdf, type ExportColumn } from '@/lib/event-registration-export';
import {
  parseEventForm,
  ticketsToDraft,
  type EventFormField,
  type EventFormSchema,
  type EventTicket,
  type EventTicketDraft,
} from '@/lib/event-forms';
import EventShareButton from '@/components/events/EventShareButton';

type ManagedEvent = {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  time?: string;
  location?: string;
  paymentCurrency?: string;
  tickets?: EventTicket[];
  registrationForm?: unknown;
  isPublished?: boolean;
};

type TicketKpi = {
  key: string;
  name: string;
  price: number | null;
  expected: number | null;
  sold: number;
  remaining: number | null;
  checkedIn: number;
  currency?: string;
  revenue?: number;
};

type EventKpis = {
  sold: number;
  expected: number | null;
  remaining: number | null;
  checkedIn: number;
  notCheckedIn: number;
  buyers: number;
  orders: number;
  pendingOrders: number;
  revenue: { currency: string; amount: number }[];
  pendingAmount: { currency: string; amount: number }[];
  expectedRevenue: number | null;
  expectedRevenueCurrency?: string;
  fillRate: number | null;
  tickets: TicketKpi[];
};

type EventCoupon = {
  id: string;
  code: string;
  label: string;
  discountType: 'PERCENT' | 'FIXED' | string;
  discountValue: number;
  ticketKey?: string | null;
  ticketName?: string | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string | null;
};

type CouponDraft = {
  id?: string;
  code: string;
  label: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: string;
  ticketKey: string;
  maxUses: string;
  expiresAt: string;
  isActive: boolean;
};

type RegistrationRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt?: string;
  answers?: Record<string, unknown>;
  answerRows?: unknown;
};

type BuyerRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  ticketName?: string | null;
  quantity?: number;
  amount?: number;
  currency?: string;
  status?: string;
  couponCode?: string | null;
  discountAmount?: number;
  ticketCode?: string | null;
  ticketCodes?: string[];
  checkedInAt?: string | null;
  passes?: { code: string; redeemed: boolean; checkedInAt?: string | null }[];
  paidAt?: string | null;
  createdAt?: string;
};

const inputClass = 'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground';

function formatAmountList(rows: { currency: string; amount: number }[] | undefined, fallbackCurrency: string) {
  if (!rows?.length) return formatMoney(0, fallbackCurrency);
  return rows.map((row) => formatMoney(row.amount, row.currency)).join(' · ');
}

function emptyCouponDraft(): CouponDraft {
  return {
    code: '',
    label: '',
    discountType: 'PERCENT',
    discountValue: '',
    ticketKey: '',
    maxUses: '',
    expiresAt: '',
    isActive: true,
  };
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function couponOffer(coupon: EventCoupon, currency: string) {
  if (coupon.discountType === 'FIXED') return `${formatMoney(coupon.discountValue, currency)} off the total`;
  return `${coupon.discountValue}% off`;
}

function couponState(coupon: EventCoupon) {
  if (!coupon.isActive) return 'Paused';
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return 'Expired';
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return 'Used up';
  return 'Active';
}

type AnswerColumn = {
  key: string;
  label: string;
  field?: EventFormField;
};

const CONTACT_LABELS = new Set(['full name', 'name', 'email', 'email address', 'phone', 'phone number']);
const CONTACT_KEYS = new Set(['full_name', 'name', 'email', 'email_address', 'phone', 'phone_number']);

function normalizeLabel(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function answerRowPairs(rows: unknown) {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!Array.isArray(row) || row.length < 2) return [];
    const label = String(row[0] || '').trim();
    return label ? [{ label, value: row[1] as unknown }] : [];
  });
}

function formatAnswer(value: unknown, field?: EventFormField) {
  if (value == null || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const optionLabel = (item: unknown) =>
    field?.options?.find((option) => option.value === String(item))?.label || String(item);
  if (Array.isArray(value)) return value.map(optionLabel).filter(Boolean).join(', ');
  return optionLabel(value).trim();
}

// One column per registration form field, plus any submitted answers the current form no longer has.
function registrationAnswerColumns(form: EventFormSchema | null, registrations: RegistrationRow[]) {
  const columns: AnswerColumn[] = [];
  const seenLabels = new Set<string>();
  for (const field of form?.fields || []) {
    const label = normalizeLabel(field.label);
    if (CONTACT_KEYS.has(field.key) || CONTACT_LABELS.has(label) || seenLabels.has(label)) continue;
    seenLabels.add(label);
    columns.push({ key: `field:${field.key}`, label: field.label, field });
  }
  for (const person of registrations) {
    for (const pair of answerRowPairs(person.answerRows)) {
      const label = normalizeLabel(pair.label);
      if (CONTACT_LABELS.has(label) || seenLabels.has(label)) continue;
      seenLabels.add(label);
      columns.push({ key: `answer:${label}`, label: pair.label });
    }
  }
  return columns;
}

function registrationAnswer(person: RegistrationRow, column: AnswerColumn) {
  if (column.field && person.answers && column.field.key in person.answers) {
    return formatAnswer(person.answers[column.field.key], column.field);
  }
  const label = normalizeLabel(column.label);
  const match = answerRowPairs(person.answerRows).find((pair) => normalizeLabel(pair.label) === label);
  return match ? formatAnswer(match.value, column.field) : '';
}

function buyerPasses(buyer: BuyerRow) {
  if (buyer.passes?.length) return buyer.passes;
  if (buyer.status !== 'completed') return [];
  if (buyer.ticketCode) return [{ code: buyer.ticketCode, redeemed: Boolean(buyer.checkedInAt) }];
  return (buyer.ticketCodes || []).map((code) => ({ code, redeemed: Boolean(buyer.checkedInAt) }));
}

function exportFileSlug(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'event';
}

function emptyExportRow(columns: ExportColumn[]) {
  return Object.fromEntries(columns.map((column) => [column.key, '']));
}

function RegistrationTable({
  registrations,
  form,
  total,
  query,
  onQueryChange,
  exporting,
  onExport,
}: {
  registrations: RegistrationRow[];
  form: EventFormSchema | null;
  total: number;
  query: string;
  onQueryChange: (value: string) => void;
  exporting: boolean;
  onExport: (format: 'excel' | 'pdf') => void;
}) {
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? registrations.filter((person) =>
        [person.name, person.email, person.phone].some((value) => String(value || '').toLowerCase().includes(needle)),
      )
    : registrations;
  const answerColumns = registrationAnswerColumns(form, registrations);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-foreground/70">
          {total.toLocaleString()} {total === 1 ? 'person has' : 'people have'} registered.
          {total > registrations.length ? ` Showing the latest ${registrations.length.toLocaleString()}.` : ''}
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={exporting} onClick={() => onExport('excel')}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={exporting} onClick={() => onExport('pdf')}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <label className="block w-full text-sm text-foreground sm:w-56">
            Search
            <input
              value={query}
              onChange={(change) => onQueryChange(change.target.value)}
              placeholder="Name, email, or phone"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-foreground/60">
          {registrations.length === 0 ? 'No one has registered for this event yet.' : 'No registrations match that search.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                {answerColumns.map((column) => (
                  <th key={column.key} className="min-w-40 px-3 py-2 font-medium">{column.label}</th>
                ))}
                <th className="px-3 py-2 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((person) => (
                <tr key={person.id} className="border-t border-border/60 align-top">
                  <td className="px-3 py-3 font-medium text-foreground">{person.name || '—'}</td>
                  <td className="px-3 py-3 text-foreground/70">{person.email || '—'}</td>
                  <td className="px-3 py-3 text-foreground/70">{person.phone || '—'}</td>
                  {answerColumns.map((column) => (
                    <td key={column.key} className="px-3 py-3 text-foreground/70">{registrationAnswer(person, column) || '—'}</td>
                  ))}
                  <td className="px-3 py-3 whitespace-nowrap text-foreground/70">{person.createdAt ? formatAdminDate(person.createdAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function newTicketDraft(): EventTicketDraft {
  return { clientId: `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', price: '', expected: '' };
}

function ticketExpectedForPayload(value: string) {
  const count = Number(String(value ?? '').trim());
  return Number.isInteger(count) && count >= 1 ? count : null;
}

export default function ManageEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = String(params?.id || '');
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
  } = useAdminAuth();

  const [tab, setTab] = useState<'tickets' | 'buyers' | 'registrations' | 'coupons'>('tickets');
  const [status, setStatus] = useState('');
  const [event, setEvent] = useState<ManagedEvent | null>(null);
  const [kpis, setKpis] = useState<EventKpis | null>(null);
  const [currency, setCurrency] = useState('MWK');
  const [ticketDrafts, setTicketDrafts] = useState<EventTicketDraft[]>([]);
  const [savingTickets, setSavingTickets] = useState(false);
  const [ticketModal, setTicketModal] = useState<null | { mode: 'add' | 'edit'; draft: EventTicketDraft; currency: string }>(null);
  const [modalStatus, setModalStatus] = useState('');
  const [buyers, setBuyers] = useState<BuyerRow[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [registrationTotal, setRegistrationTotal] = useState(0);
  const [registrationQuery, setRegistrationQuery] = useState('');
  const [exporting, setExporting] = useState<'tickets' | 'registrations' | null>(null);
  const [ticketFilter, setTicketFilter] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ name: '', email: '', ticketKey: '' });
  const [issueStatus, setIssueStatus] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [coupons, setCoupons] = useState<EventCoupon[]>([]);
  const [couponModal, setCouponModal] = useState<CouponDraft | null>(null);
  const [couponModalStatus, setCouponModalStatus] = useState('');
  const [savingCoupon, setSavingCoupon] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!token || !eventId) return;
    const response = await apiFetch(`/api/admin/events/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || 'Unable to load this event.');
      return;
    }
    const loaded = data.event as ManagedEvent;
    setEvent(loaded);
    setKpis(data.kpis || null);
    setCurrency(loaded.paymentCurrency || 'MWK');
    setTicketDrafts(ticketsToDraft(loaded.tickets || []));
  }, [eventId, token]);

  const loadBuyers = useCallback(async () => {
    if (!token || !eventId) return;
    const response = await apiFetch(`/api/admin/events/${eventId}/payments?take=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || 'Unable to load ticket buyers.');
      return;
    }
    setBuyers(Array.isArray(data.payments) ? data.payments : []);
  }, [eventId, token]);

  const loadCoupons = useCallback(async () => {
    if (!token || !eventId) return;
    const response = await apiFetch(`/api/admin/events/${eventId}/coupons`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || 'Unable to load coupons.');
      return;
    }
    setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
  }, [eventId, token]);

  const loadRegistrations = useCallback(async () => {
    if (!token || !eventId) return;
    const response = await apiFetch(`/api/admin/events/${eventId}/registrations?take=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || 'Unable to load registrations.');
      return;
    }
    setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
    setRegistrationTotal(Number(data.total || 0));
  }, [eventId, token]);

  const fetchAllPages = useCallback(async (path: string, listKey: 'payments' | 'registrations') => {
    if (!token) return [];
    const collected: unknown[] = [];
    let skip = 0;
    let total = 0;
    do {
      const joiner = path.includes('?') ? '&' : '?';
      const response = await apiFetch(`${path}${joiner}take=200&skip=${skip}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to export.');
      const batch = Array.isArray(data[listKey]) ? data[listKey] : [];
      total = Number(data.total || 0);
      collected.push(...batch);
      skip += batch.length || 200;
      if (!batch.length) break;
    } while (collected.length < total);
    return collected;
  }, [token]);

  const exportTickets = async (format: 'excel' | 'pdf') => {
    setExporting('tickets');
    setStatus('');
    try {
      const query = ticketFilter ? `?ticketName=${encodeURIComponent(ticketFilter)}` : '';
      const payments = await fetchAllPages(`/api/admin/events/${eventId}/payments${query}`, 'payments') as BuyerRow[];
      if (!payments.length) {
        setStatus('There are no ticket purchases to export.');
        return;
      }
      const columns: ExportColumn[] = [
        { key: 'name', label: 'Buyer' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'ticketType', label: 'Ticket type' },
        { key: 'quantity', label: 'Qty' },
        { key: 'amount', label: 'Amount' },
        { key: 'ticketCode', label: 'Ticket code' },
        { key: 'status', label: 'Status' },
        { key: 'redeemed', label: 'Redeemed' },
      ];
      const rows: Array<Record<string, string>> = payments.map((buyer) => {
        const passes = buyerPasses(buyer);
        return {
          name: buyer.name || '',
          email: buyer.email || '',
          phone: buyer.phone || '',
          ticketType: buyer.ticketName || '',
          quantity: String(buyer.quantity || 1),
          amount: formatMoney(buyer.amount, buyer.currency),
          ticketCode: passes.map((pass) => pass.code).join(', '),
          status: buyer.status || 'pending',
          redeemed: passes.length ? passes.map((pass) => (pass.redeemed ? 'Redeemed' : 'Not redeemed')).join(', ') : '',
        };
      });
      const sold = payments.filter((buyer) => buyer.status === 'completed');
      const ticketsSold = sold.reduce((sum, buyer) => sum + Number(buyer.quantity || 1), 0);
      const amountTotals = new Map<string, number>();
      for (const buyer of sold) {
        const code = buyer.currency || currency;
        amountTotals.set(code, (amountTotals.get(code) || 0) + Number(buyer.amount || 0));
      }
      const totalAmount = amountTotals.size
        ? [...amountTotals.entries()].map(([code, amount]) => formatMoney(amount, code)).join(' · ')
        : formatMoney(0, currency);
      const byType = new Map<string, { quantity: number; rows: BuyerRow[] }>();
      for (const buyer of sold) {
        const name = buyer.ticketName || 'Ticket';
        const current = byType.get(name) || { quantity: 0, rows: [] };
        current.quantity += Number(buyer.quantity || 1);
        current.rows.push(buyer);
        byType.set(name, current);
      }
      rows.push(emptyExportRow(columns));
      for (const [name, group] of byType) {
        const groupAmounts = new Map<string, number>();
        for (const buyer of group.rows) {
          const code = buyer.currency || currency;
          groupAmounts.set(code, (groupAmounts.get(code) || 0) + Number(buyer.amount || 0));
        }
        rows.push({
          ...emptyExportRow(columns),
          name: `SOLD — ${name}`,
          ticketType: name,
          quantity: String(group.quantity),
          amount: [...groupAmounts.entries()].map(([code, amount]) => formatMoney(amount, code)).join(' · '),
        });
      }
      rows.push({
        ...emptyExportRow(columns),
        name: 'TOTAL TICKETS SOLD',
        quantity: String(ticketsSold),
        amount: totalAmount,
      });
      if (format === 'pdf') {
        const summaryTickets = (kpis?.tickets || []).filter((ticket) => !ticketFilter || ticket.name === ticketFilter);
        rows.push(emptyExportRow(columns));
        rows.push({
          ...emptyExportRow(columns),
          name: 'EXPECTED REVENUE IF ALL TICKETS SELL',
          amount: kpis?.expectedRevenue == null
            ? 'Set a ticket count to calculate this'
            : formatMoney(kpis.expectedRevenue, kpis.expectedRevenueCurrency || currency),
        });
        for (const ticket of summaryTickets) {
          rows.push({
            ...emptyExportRow(columns),
            name: `CHECKED IN — ${ticket.name}`,
            ticketType: ticket.name,
            quantity: `${ticket.checkedIn} of ${ticket.sold} bought`,
            amount: ticket.expected != null && ticket.price != null
              ? formatMoney(Number(ticket.price) * Number(ticket.expected), ticket.currency || currency)
              : '',
            redeemed: `${ticket.checkedIn} checked in`,
          });
        }
      }
      const day = new Date().toISOString().slice(0, 10);
      const slug = exportFileSlug(event?.title || 'event');
      const scope = ticketFilter ? ` — ${ticketFilter}` : '';
      if (format === 'excel') {
        downloadRegistrationsExcel({
          fileName: `${slug}-tickets-${day}.xls`,
          sheetName: 'Tickets bought',
          columns,
          rows,
        });
      } else {
        await downloadRegistrationsPdf({
          title: `${event?.title || 'Event'} tickets bought${scope}`,
          fileName: `${slug}-tickets-${day}.pdf`,
          columns,
          rows,
        });
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to export ticket purchases.');
    } finally {
      setExporting(null);
    }
  };

  const exportRegistrations = async (format: 'excel' | 'pdf') => {
    setExporting('registrations');
    setStatus('');
    try {
      const people = await fetchAllPages(`/api/admin/events/${eventId}/registrations`, 'registrations') as RegistrationRow[];
      const needle = registrationQuery.trim().toLowerCase();
      const visible = needle
        ? people.filter((person) => [person.name, person.email, person.phone].some((value) => String(value || '').toLowerCase().includes(needle)))
        : people;
      if (!visible.length) {
        setStatus('There are no registrations to export.');
        return;
      }
      const answerColumns = registrationAnswerColumns(registrationForm, visible);
      const columns: ExportColumn[] = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        ...answerColumns.map((column) => ({ key: column.key, label: column.label })),
        { key: 'registered', label: 'Registered' },
      ];
      const rows: Array<Record<string, string>> = visible.map((person) => ({
        name: person.name || '',
        email: person.email || '',
        phone: person.phone || '',
        ...Object.fromEntries(answerColumns.map((column) => [column.key, registrationAnswer(person, column)])),
        registered: person.createdAt ? formatAdminDate(person.createdAt) : '',
      }));
      rows.push(emptyExportRow(columns));
      rows.push({
        ...emptyExportRow(columns),
        name: 'TOTAL REGISTERED',
        email: String(visible.length),
      });
      const day = new Date().toISOString().slice(0, 10);
      const slug = exportFileSlug(event?.title || 'event');
      if (format === 'excel') {
        downloadRegistrationsExcel({
          fileName: `${slug}-registrations-${day}.xls`,
          sheetName: 'Registrations',
          columns,
          rows,
        });
      } else {
        await downloadRegistrationsPdf({
          title: `${event?.title || 'Event'} registrations`,
          fileName: `${slug}-registrations-${day}.pdf`,
          columns,
          rows,
        });
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to export registrations.');
    } finally {
      setExporting(null);
    }
  };

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      void loadEvent();
      void loadBuyers();
      void loadCoupons();
      void loadRegistrations();
    }, 0);
    return () => clearTimeout(id);
  }, [token, loadEvent, loadBuyers, loadCoupons, loadRegistrations]);

  const ticketTypeOptions = useMemo(() => {
    const names = new Set<string>();
    for (const ticket of event?.tickets || []) {
      if (ticket.name) names.add(ticket.name);
    }
    for (const buyer of buyers) {
      if (buyer.ticketName) names.add(buyer.ticketName);
    }
    return [...names];
  }, [buyers, event?.tickets]);

  const registrationForm = parseEventForm(event?.registrationForm);

  const visibleBuyers = useMemo(() => {
    if (!ticketFilter) return buyers;
    return buyers.filter((buyer) => (buyer.ticketName || '') === ticketFilter);
  }, [buyers, ticketFilter]);

  const persistTickets = async (rows: EventTicketDraft[], nextCurrency = currency) => {
    if (!token) return false;
    setSavingTickets(true);
    setStatus('');
    setModalStatus('');
    try {
      const response = await apiFetch(`/api/admin/events/${eventId}/tickets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentCurrency: nextCurrency,
          tickets: rows.map((ticket) => ({
            ...(ticket.key ? { key: ticket.key } : {}),
            name: ticket.name.trim(),
            price: Number(ticket.price),
            expected: ticketExpectedForPayload(ticket.expected),
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.error || 'Unable to save ticket types.';
        setModalStatus(message);
        setStatus(message);
        return false;
      }
      const saved = data.event as ManagedEvent;
      setEvent(saved);
      setCurrency(saved.paymentCurrency || nextCurrency);
      setTicketDrafts(ticketsToDraft(saved.tickets || []));
      setStatus(rows.length ? 'Ticket type saved.' : 'Ticket sales turned off for this event.');
      void loadEvent();
      return true;
    } catch {
      setStatus('Unable to save ticket types.');
      setModalStatus('Unable to save ticket types.');
      return false;
    } finally {
      setSavingTickets(false);
    }
  };

  const openAddTicket = () => {
    setModalStatus('');
    setTicketModal({ mode: 'add', draft: newTicketDraft(), currency });
  };

  const openEditTicket = (ticket: EventTicketDraft) => {
    setModalStatus('');
    setTicketModal({ mode: 'edit', draft: { ...ticket }, currency });
  };

  const saveTicketModal = async () => {
    if (!ticketModal) return;
    const ticket = ticketModal.draft;
    if (!ticket.name.trim()) {
      setModalStatus('Enter a ticket name.');
      return;
    }
    if (!Number(ticket.price) || Number(ticket.price) <= 0) {
      setModalStatus('Enter a price greater than 0.');
      return;
    }
    if (!Number.isInteger(Number(ticket.expected)) || Number(ticket.expected) < 1) {
      setModalStatus('Enter the number of tickets.');
      return;
    }
    const nextRows = ticketModal.mode === 'add'
      ? [...ticketDrafts, ticket]
      : ticketDrafts.map((row) => (row.clientId === ticket.clientId ? ticket : row));
    const saved = await persistTickets(nextRows, ticketModal.currency);
    if (saved) setTicketModal(null);
  };

  const removeTicket = (ticket: EventTicketDraft) => {
    confirmDeleteToast({
      title: `Delete ${ticket.name || 'this ticket type'}?`,
      description: 'Buyers will no longer be able to purchase this ticket type.',
      onConfirm: () => persistTickets(ticketDrafts.filter((row) => row.clientId !== ticket.clientId)),
    });
  };

  const openCouponModal = (coupon?: EventCoupon) => {
    setCouponModalStatus('');
    if (!coupon) {
      setCouponModal(emptyCouponDraft());
      return;
    }
    setCouponModal({
      id: coupon.id,
      code: coupon.code,
      label: coupon.label,
      discountType: coupon.discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
      discountValue: String(coupon.discountValue),
      ticketKey: coupon.ticketKey || '',
      maxUses: coupon.maxUses == null ? '' : String(coupon.maxUses),
      expiresAt: toDatetimeLocal(coupon.expiresAt),
      isActive: coupon.isActive,
    });
  };

  const saveCoupon = async () => {
    if (!token || !couponModal) return;
    setSavingCoupon(true);
    setCouponModalStatus('');
    try {
      const path = couponModal.id
        ? `/api/admin/events/${eventId}/coupons/${couponModal.id}`
        : `/api/admin/events/${eventId}/coupons`;
      const response = await apiFetch(path, {
        method: couponModal.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: couponModal.code,
          label: couponModal.label,
          discountType: couponModal.discountType,
          discountValue: Number(couponModal.discountValue),
          ticketKey: couponModal.ticketKey,
          maxUses: couponModal.maxUses.trim() ? Number(couponModal.maxUses) : null,
          expiresAt: couponModal.expiresAt ? new Date(couponModal.expiresAt).toISOString() : null,
          isActive: couponModal.isActive,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setCouponModalStatus(data.error || 'Unable to save this coupon.');
        return;
      }
      setCouponModal(null);
      setStatus(couponModal.id ? 'Coupon updated.' : 'Coupon added. Buyers can use it at checkout.');
      await loadCoupons();
    } catch {
      setCouponModalStatus('Unable to save this coupon.');
    } finally {
      setSavingCoupon(false);
    }
  };

  const removeCoupon = (coupon: EventCoupon) => {
    if (!token) return;
    confirmDeleteToast({
      title: `Delete coupon ${coupon.code}?`,
      description: 'Buyers will no longer be able to use this code.',
      onConfirm: async () => {
        const response = await apiFetch(`/api/admin/events/${eventId}/coupons/${coupon.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setStatus(data.error || 'Unable to delete this coupon.');
          return;
        }
        setStatus('Coupon deleted.');
        await loadCoupons();
      },
    });
  };

  const sendManualTicket = async () => {
    if (!token) return;
    if (!issueForm.name.trim()) {
      setIssueStatus('Enter the buyer name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(issueForm.email.trim())) {
      setIssueStatus('Enter a valid email address.');
      return;
    }
    if (!issueForm.ticketKey) {
      setIssueStatus('Choose a ticket type.');
      return;
    }
    setIssuing(true);
    setIssueStatus('');
    try {
      const response = await apiFetch(`/api/admin/events/${eventId}/manual-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: issueForm.name.trim(),
          email: issueForm.email.trim(),
          ticketKey: issueForm.ticketKey,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setIssueStatus(data.error || 'Unable to send this ticket.');
        return;
      }
      setIssueOpen(false);
      setStatus(data.message || `Ticket sent to ${issueForm.email.trim()}.`);
      await Promise.all([loadEvent(), loadBuyers()]);
    } catch {
      setIssueStatus('Unable to send this ticket.');
    } finally {
      setIssuing(false);
    }
  };

  const resendTicket = async (buyer: BuyerRow) => {
    if (!token) return;
    setResendingId(buyer.id);
    setStatus('');
    try {
      const response = await apiFetch(`/api/admin/event-payments/${buyer.id}/resend-ticket`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      setStatus(response.ok ? `Ticket sent to ${buyer.email}.` : data.error || 'Unable to resend the ticket.');
    } catch {
      setStatus('Unable to resend the ticket.');
    } finally {
      setResendingId(null);
    }
  };

  if (!token) {
    return (
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  const when = event?.startDate ? formatAdminDate(event.startDate) : '';
  const remainingLabel = !kpis || kpis.expected == null
    ? 'Set ticket counts to track capacity'
    : kpis.remaining != null && kpis.remaining < 0
      ? `${Math.abs(kpis.remaining).toLocaleString()} over capacity`
      : kpis.remaining === 0
        ? 'Sold out'
        : `${(kpis.remaining ?? 0).toLocaleString()} still available`;
  const summaryCards = [
    {
      key: 'sold',
      label: 'Tickets sold',
      value: kpis ? kpis.sold.toLocaleString() : '—',
      hint: kpis?.fillRate == null ? `${kpis?.orders ?? 0} paid orders` : `${kpis.fillRate}% of capacity filled`,
      icon: Ticket,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: formatAmountList(kpis?.revenue, currency),
      hint: kpis?.pendingOrders ? `${formatAmountList(kpis.pendingAmount, currency)} still pending` : 'From completed payments',
      icon: Banknote,
    },
    {
      key: 'expected-revenue',
      label: 'Expected revenue',
      value: kpis?.expectedRevenue == null ? '—' : formatMoney(kpis.expectedRevenue, kpis.expectedRevenueCurrency || currency),
      hint: 'If every ticket sells',
      icon: Banknote,
    },
    {
      key: 'available',
      label: 'Still available',
      value: kpis?.expected == null ? '—' : Math.max(kpis.remaining ?? 0, 0).toLocaleString(),
      hint: remainingLabel,
      icon: Layers,
    },
    {
      key: 'checked-in',
      label: 'Checked in',
      value: kpis ? kpis.checkedIn.toLocaleString() : '—',
      hint: kpis ? `${kpis.notCheckedIn.toLocaleString()} not checked in yet` : 'Arrivals at the event',
      icon: UserCheck,
    },
    {
      key: 'buyers',
      label: 'Buyers',
      value: kpis ? kpis.buyers.toLocaleString() : '—',
      hint: kpis ? `${kpis.orders.toLocaleString()} completed purchases` : 'People who paid',
      icon: Users,
    },
    {
      key: 'pending',
      label: 'Awaiting payment',
      value: kpis ? kpis.pendingOrders.toLocaleString() : '—',
      hint: 'Checkouts that have not finished',
      icon: Clock3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Link href="/admin/events" className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Events
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{event?.title || 'Event'}</h1>
            <p className="mt-2 text-sm text-foreground/70">
              {[when, event?.time, event?.location].filter(Boolean).join(' · ') || 'Manage tickets for this event.'}
            </p>
          </div>
          {event ? <EventShareButton eventId={event.id} title={event.title || 'Event'} /> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-foreground/50">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold leading-none text-foreground">{card.value}</p>
              <p className="mt-2 text-xs text-foreground/60">{card.hint}</p>
            </div>
          );
        })}
      </div>

      {kpis?.tickets?.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {kpis.tickets.map((ticket) => {
            const capped = ticket.expected != null && ticket.expected > 0;
            const ratio = capped ? Math.min(100, Math.round((ticket.sold / Number(ticket.expected)) * 100)) : ticket.sold > 0 ? 100 : 0;
            const over = ticket.remaining != null && ticket.remaining < 0;
            return (
              <button
                key={ticket.key}
                type="button"
                onClick={() => {
                  setTicketFilter(ticket.name);
                  setTab('buyers');
                }}
                className="rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{ticket.name}</p>
                    <p className="mt-1 text-xs text-foreground/60">
                      {ticket.price != null ? formatMoney(ticket.price, ticket.currency || currency) : 'Price not set'}
                      {ticket.revenue ? ` · ${formatMoney(ticket.revenue, ticket.currency || currency)} collected` : ''}
                    </p>
                  </div>
                  <p className="text-right">
                    <span className="block text-xl font-semibold text-foreground">{ticket.sold.toLocaleString()}</span>
                    <span className="text-[11px] uppercase tracking-wide text-foreground/50">sold</span>
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${over ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${ratio}%` }} />
                </div>
                <p className="mt-2 text-xs text-foreground/60">
                  {`${ticket.checkedIn.toLocaleString()} checked in of ${ticket.sold.toLocaleString()} bought`}
                </p>
                <p className="mt-1 text-xs text-foreground/60">
                  {capped
                    ? `${ticket.sold.toLocaleString()} of ${Number(ticket.expected).toLocaleString()} · ${over ? `${Math.abs(ticket.remaining || 0).toLocaleString()} over` : `${(ticket.remaining ?? 0).toLocaleString()} left`}`
                    : 'No limit set'}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      {status ? <p className="text-sm text-foreground/70">{status}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === 'tickets' ? 'default' : 'outline'} onClick={() => setTab('tickets')}>
          Ticket management
        </Button>
        <Button type="button" variant={tab === 'buyers' ? 'default' : 'outline'} onClick={() => setTab('buyers')}>
          Event tickets bought
        </Button>
        <Button type="button" variant={tab === 'registrations' ? 'default' : 'outline'} onClick={() => setTab('registrations')}>
          Event registration
        </Button>
        <Button type="button" variant={tab === 'coupons' ? 'default' : 'outline'} onClick={() => setTab('coupons')}>
          Coupon management
        </Button>
      </div>

      {tab === 'tickets' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-foreground/70">Currency: {currency}</p>
            <Button type="button" onClick={openAddTicket} className="gap-2">
              <Plus className="h-4 w-4" />
              Add ticket type
            </Button>
          </div>
          {ticketDrafts.length === 0 ? (
            <p className="text-sm text-foreground/60">No ticket types yet. Add one to turn on website payment.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Ticket type</th>
                    <th className="px-3 py-2 font-medium">Price</th>
                    <th className="px-3 py-2 font-medium">Available</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketDrafts.map((ticket) => (
                    <tr key={ticket.clientId} className="border-t border-border/60">
                      <td className="px-3 py-3 font-medium text-foreground">{ticket.name}</td>
                      <td className="px-3 py-3 text-foreground/70">{formatMoney(ticket.price, currency)}</td>
                      <td className="px-3 py-3 text-foreground/70">{ticket.expected || '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEditTicket(ticket)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeTicket(ticket)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === 'buyers' ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="block w-full max-w-xs text-sm text-foreground">
              Ticket type
              <select
                value={ticketFilter}
                onChange={(change) => setTicketFilter(change.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">All ticket types</option>
                {ticketTypeOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setIssueStatus('');
                  setIssueForm({
                    name: '',
                    email: '',
                    ticketKey: event?.tickets?.[0]?.key || '',
                  });
                  setIssueOpen(true);
                }}
                disabled={!event?.tickets?.length}
              >
                <Mail className="h-4 w-4" />
                Send ticket
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={exporting === 'tickets'} onClick={() => void exportTickets('excel')}>
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={exporting === 'tickets'} onClick={() => void exportTickets('pdf')}>
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
          {visibleBuyers.length === 0 ? (
            <p className="text-sm text-foreground/60">No ticket purchases for this filter.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Buyer</th>
                    <th className="px-3 py-2 font-medium">Ticket type</th>
                    <th className="px-3 py-2 font-medium">Qty</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Ticket code</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Redeemed</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBuyers.map((buyer) => {
                    const passes = buyerPasses(buyer);
                    return (
                    <tr key={buyer.id} className="border-t border-border/60">
                      <td className="px-3 py-3">
                        <p className="font-medium text-foreground">{buyer.name || 'Buyer'}</p>
                        <p className="text-xs text-foreground/60">{buyer.email || 'No email'}</p>
                        {buyer.phone ? <p className="text-xs text-foreground/60">{buyer.phone}</p> : null}
                      </td>
                      <td className="px-3 py-3 text-foreground/70">{buyer.ticketName || '—'}</td>
                      <td className="px-3 py-3 text-foreground/70">{buyer.quantity || 1}</td>
                      <td className="px-3 py-3 text-foreground/70">
                        <p>{formatMoney(buyer.amount, buyer.currency)}</p>
                        {buyer.couponCode ? (
                          <p className="text-xs text-foreground/60">
                            {buyer.couponCode}
                            {buyer.discountAmount ? ` · saved ${formatMoney(buyer.discountAmount, buyer.currency)}` : ''}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-foreground/80">
                        {passes.length ? passes.map((pass) => <p key={pass.code}>{pass.code}</p>) : '—'}
                      </td>
                      <td className="px-3 py-3 capitalize text-foreground/70">{buyer.status || 'pending'}</td>
                      <td className="px-3 py-3">
                        {passes.length ? passes.map((pass) => (
                          <p key={pass.code} className={pass.redeemed ? 'text-emerald-700' : 'text-foreground/60'}>
                            {pass.redeemed ? 'Redeemed' : 'Not redeemed'}
                          </p>
                        )) : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={buyer.status !== 'completed' || !buyer.email || resendingId === buyer.id}
                          onClick={() => void resendTicket(buyer)}
                        >
                          <Mail className="h-4 w-4" />
                          {resendingId === buyer.id ? 'Sending...' : 'Resend ticket'}
                        </Button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === 'coupons' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-foreground/70">
              Percent off or a fixed amount off the order. Buyers enter the code when they pay.
            </p>
            <Button type="button" onClick={() => openCouponModal()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add coupon
            </Button>
          </div>
          {coupons.length === 0 ? (
            <p className="text-sm text-foreground/60">No coupons yet. Add an early-bird code, a group discount, or a fixed amount off.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Offer</th>
                    <th className="px-3 py-2 font-medium">Applies to</th>
                    <th className="px-3 py-2 font-medium">Uses</th>
                    <th className="px-3 py-2 font-medium">Expires</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-t border-border/60">
                      <td className="px-3 py-3">
                        <p className="font-mono font-medium text-foreground">{coupon.code}</p>
                        <p className="text-xs text-foreground/60">{coupon.label}</p>
                      </td>
                      <td className="px-3 py-3 text-foreground/70">{couponOffer(coupon, currency)}</td>
                      <td className="px-3 py-3 text-foreground/70">{coupon.ticketName || 'All tickets'}</td>
                      <td className="px-3 py-3 text-foreground/70">
                        {coupon.usedCount.toLocaleString()}{coupon.maxUses == null ? ' used' : ` of ${coupon.maxUses.toLocaleString()}`}
                      </td>
                      <td className="px-3 py-3 text-foreground/70">{coupon.expiresAt ? formatAdminDate(coupon.expiresAt) : 'No expiry'}</td>
                      <td className="px-3 py-3 text-foreground/70">{couponState(coupon)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openCouponModal(coupon)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeCoupon(coupon)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <RegistrationTable
          registrations={registrations}
          form={registrationForm}
          total={registrationTotal}
          query={registrationQuery}
          onQueryChange={setRegistrationQuery}
          exporting={exporting === 'registrations'}
          onExport={(format) => void exportRegistrations(format)}
        />
      )}

      <Dialog open={issueOpen} onOpenChange={(open) => { if (!open && !issuing) setIssueOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send a ticket</DialogTitle>
            <DialogDescription>
              The buyer receives the ticket by email. That sale is counted on the ticket type and added to the revenue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm text-foreground">
              Buyer name
              <input
                type="text"
                value={issueForm.name}
                onChange={(change) => setIssueForm((current) => ({ ...current, name: change.target.value }))}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-sm text-foreground">
              Email
              <input
                type="email"
                value={issueForm.email}
                onChange={(change) => setIssueForm((current) => ({ ...current, email: change.target.value }))}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-sm text-foreground">
              Ticket type
              <select
                value={issueForm.ticketKey}
                onChange={(change) => setIssueForm((current) => ({ ...current, ticketKey: change.target.value }))}
                className={`${inputClass} mt-1`}
              >
                <option value="">Choose a ticket type</option>
                {(event?.tickets || []).map((ticket) => (
                  <option key={ticket.key} value={ticket.key}>
                    {ticket.name} · {formatMoney(ticket.price, currency)}
                  </option>
                ))}
              </select>
            </label>
            {issueStatus ? <p className="text-sm text-red-600">{issueStatus}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIssueOpen(false)} disabled={issuing}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void sendManualTicket()} disabled={issuing}>
              {issuing ? 'Sending...' : 'Send ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(ticketModal)} onOpenChange={(open) => { if (!open) setTicketModal(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ticketModal?.mode === 'edit' ? 'Edit ticket type' : 'Add ticket type'}</DialogTitle>
            <DialogDescription>
              Set the name, price, and how many tickets are available.
            </DialogDescription>
          </DialogHeader>
          {ticketModal ? (
            <div className="space-y-3">
              <label className="block text-sm text-foreground">
                Ticket name
                <input
                  type="text"
                  value={ticketModal.draft.name}
                  onChange={(change) =>
                    setTicketModal((current) =>
                      current ? { ...current, draft: { ...current.draft, name: change.target.value } } : current,
                    )
                  }
                  className={`${inputClass} mt-1`}
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-foreground">
                  Price
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={ticketModal.draft.price}
                    onChange={(change) =>
                      setTicketModal((current) =>
                        current ? { ...current, draft: { ...current.draft, price: change.target.value } } : current,
                      )
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-sm text-foreground">
                  Currency
                  <select
                    value={ticketModal.currency}
                    onChange={(change) =>
                      setTicketModal((current) => (current ? { ...current, currency: change.target.value } : current))
                    }
                    className={`${inputClass} mt-1`}
                  >
                    <option value="MWK">MWK</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm text-foreground">
                Number of tickets
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={ticketModal.draft.expected}
                  onChange={(change) =>
                    setTicketModal((current) =>
                      current ? { ...current, draft: { ...current.draft, expected: change.target.value } } : current,
                    )
                  }
                  className={`${inputClass} mt-1`}
                />
              </label>
              {modalStatus ? <p className="text-sm text-red-600">{modalStatus}</p> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTicketModal(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveTicketModal()} disabled={savingTickets}>
              {savingTickets ? 'Saving...' : ticketModal?.mode === 'edit' ? 'Save changes' : 'Add ticket type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(couponModal)} onOpenChange={(open) => { if (!open) setCouponModal(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{couponModal?.id ? 'Edit coupon' : 'Add coupon'}</DialogTitle>
            <DialogDescription>
              A percent comes off the order. A fixed amount is taken off the total, once.
            </DialogDescription>
          </DialogHeader>
          {couponModal ? (
            <div className="space-y-3">
              <label className="block text-sm text-foreground">
                Code
                <input
                  type="text"
                  value={couponModal.code}
                  onChange={(change) => setCouponModal((current) => current ? { ...current, code: change.target.value.toUpperCase() } : current)}
                  placeholder="YOUTH20"
                  className={`${inputClass} mt-1 uppercase`}
                />
              </label>
              <label className="block text-sm text-foreground">
                Name
                <input
                  type="text"
                  value={couponModal.label}
                  onChange={(change) => setCouponModal((current) => current ? { ...current, label: change.target.value } : current)}
                  placeholder="Youth weekend"
                  className={`${inputClass} mt-1`}
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-foreground">
                  Discount
                  <select
                    value={couponModal.discountType}
                    onChange={(change) => setCouponModal((current) => current ? { ...current, discountType: change.target.value === 'FIXED' ? 'FIXED' : 'PERCENT' } : current)}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="PERCENT">Percent off</option>
                    <option value="FIXED">Fixed amount off</option>
                  </select>
                </label>
                <label className="block text-sm text-foreground">
                  {couponModal.discountType === 'FIXED' ? `Amount (${currency})` : 'Percent'}
                  <input
                    type="number"
                    min="1"
                    max={couponModal.discountType === 'PERCENT' ? 100 : undefined}
                    step="any"
                    value={couponModal.discountValue}
                    onChange={(change) => setCouponModal((current) => current ? { ...current, discountValue: change.target.value } : current)}
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>
              <label className="block text-sm text-foreground">
                Applies to
                <select
                  value={couponModal.ticketKey}
                  onChange={(change) => setCouponModal((current) => current ? { ...current, ticketKey: change.target.value } : current)}
                  className={`${inputClass} mt-1`}
                >
                  <option value="">All ticket types</option>
                  {(event?.tickets || []).map((ticket) => (
                    <option key={ticket.key} value={ticket.key}>{ticket.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-foreground">
                  Use limit
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={couponModal.maxUses}
                    onChange={(change) => setCouponModal((current) => current ? { ...current, maxUses: change.target.value } : current)}
                    placeholder="Unlimited"
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-sm text-foreground">
                  Expires
                  <input
                    type="datetime-local"
                    value={couponModal.expiresAt}
                    onChange={(change) => setCouponModal((current) => current ? { ...current, expiresAt: change.target.value } : current)}
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>
              <label className="flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={couponModal.isActive}
                  onChange={(change) => setCouponModal((current) => current ? { ...current, isActive: change.target.checked } : current)}
                  className="h-4 w-4"
                />
                Coupon is active
              </label>
              {couponModalStatus ? <p className="text-sm text-red-600">{couponModalStatus}</p> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCouponModal(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveCoupon()} disabled={savingCoupon}>
              {savingCoupon ? 'Saving...' : couponModal?.id ? 'Save changes' : 'Add coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
