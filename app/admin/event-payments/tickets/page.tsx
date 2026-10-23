'use client';

import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import { RefreshCw, Ticket, UserCheck, UserX, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { adminErrorToast } from '@/components/admin/admin-toast';
import { EventPaymentsTabs } from '@/components/admin/payments/PaymentsSectionTabs';

type TicketKpi = {
  key: string;
  name: string;
  price?: number | null;
  expected: number | null;
  sold: number;
  remaining: number | null;
  checkedIn: number;
  notCheckedIn: number;
};

type EventTicketKpi = {
  id: string;
  title: string;
  expected: number | null;
  sold: number;
  remaining: number | null;
  checkedIn: number;
  notCheckedIn: number;
  tickets: TicketKpi[];
};

type Totals = {
  events: number;
  expected: number | null;
  sold: number;
  remaining: number | null;
  checkedIn: number;
  notCheckedIn: number;
};

const EMPTY_TOTALS: Totals = { events: 0, expected: null, sold: 0, remaining: null, checkedIn: 0, notCheckedIn: 0 };

const countText = (value: number | null | undefined) => (value == null ? '—' : value.toLocaleString());

export default function EventTicketKpisPage() {
  const { token } = useAdminAuth();
  const [events, setEvents] = useState<EventTicketKpi[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [eventId, setEventId] = useState('');
  const [expectedDrafts, setExpectedDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchKpis = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/event-tickets/kpis', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || 'Unable to load ticket KPIs.');
        return;
      }
      const nextEvents = Array.isArray(data.events) ? data.events as EventTicketKpi[] : [];
      setEvents(nextEvents);
      setTotals(data.totals || EMPTY_TOTALS);
      const drafts: Record<string, string> = {};
      nextEvents.forEach((event) => {
        event.tickets.forEach((ticket) => {
          drafts[`${event.id}:${ticket.key}`] = ticket.expected == null ? '' : String(ticket.expected);
        });
      });
      setExpectedDrafts(drafts);
    } catch {
      adminErrorToast('Unable to load ticket KPIs.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchKpis();
  }, [fetchKpis]);

  const saveExpected = async (event: EventTicketKpi, ticket: TicketKpi) => {
    if (!token) return;
    const draftKey = `${event.id}:${ticket.key}`;
    const raw = expectedDrafts[draftKey] ?? '';
    if (!Number.isInteger(Number(raw)) || Number(raw) < 1) {
      adminErrorToast('Enter the number of tickets.');
      return;
    }
    setSavingKey(draftKey);
    try {
      const response = await apiFetch('/api/admin/event-tickets/expected', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: event.id,
          ticketKey: ticket.key,
          expected: raw.trim() === '' ? null : Number(raw),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        adminErrorToast(data.error || 'Unable to save the expected count.');
        return;
      }
      await fetchKpis();
    } catch {
      adminErrorToast('Unable to save the expected count.');
    } finally {
      setSavingKey('');
    }
  };

  const visibleEvents = eventId ? events.filter((event) => event.id === eventId) : events;
  const visibleTotals = useMemo(() => {
    if (!eventId) return totals;
    const event = events.find((item) => item.id === eventId);
    if (!event) return EMPTY_TOTALS;
    return {
      events: 1,
      expected: event.expected,
      sold: event.sold,
      remaining: event.remaining,
      checkedIn: event.checkedIn,
      notCheckedIn: event.notCheckedIn,
    };
  }, [eventId, events, totals]);

  return (
    <div className="space-y-4">
      <EventPaymentsTabs activePath="/admin/event-payments/tickets" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-base font-semibold">Ticket KPIs</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Sold tickets against the expected count for each package, plus check-in.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Event
            <select
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              className="h-8 max-w-xs rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              <option value="">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={() => void fetchKpis()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Ticket} label="Tickets sold" value={countText(visibleTotals.sold)} detail={`${visibleTotals.events} events`} />
        <KpiCard icon={Users} label="Remaining" value={countText(visibleTotals.remaining)} detail={visibleTotals.expected == null ? 'Set an expected count' : `${countText(visibleTotals.expected)} expected`} />
        <KpiCard icon={UserCheck} label="Checked in" value={countText(visibleTotals.checkedIn)} detail="People already scanned" />
        <KpiCard icon={UserX} label="Not checked in" value={countText(visibleTotals.notCheckedIn)} detail="Sold tickets still to arrive" />
      </div>

      {visibleEvents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No ticket packages yet. Add a ticket type, such as VIP, on the event and set how many you expect to sell.
        </p>
      ) : visibleEvents.map((event) => (
        <section key={event.id} className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">{event.title}</h2>
              <p className="text-xs text-muted-foreground">
                {event.sold.toLocaleString()} sold
                {event.expected == null ? '' : ` of ${event.expected.toLocaleString()}`}
                {' · '}
                {event.checkedIn.toLocaleString()} checked in
                {' · '}
                {event.notCheckedIn.toLocaleString()} not checked in
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-semibold">Ticket</th>
                  <th className="px-4 py-2 font-semibold">Expected</th>
                  <th className="px-4 py-2 font-semibold">Sold</th>
                  <th className="px-4 py-2 font-semibold">Remaining</th>
                  <th className="px-4 py-2 font-semibold">Checked in</th>
                  <th className="px-4 py-2 font-semibold">Not checked in</th>
                </tr>
              </thead>
              <tbody>
                {event.tickets.map((ticket) => {
                  const draftKey = `${event.id}:${ticket.key}`;
                  const progress = ticket.expected ? Math.min(100, Math.round((ticket.sold / ticket.expected) * 100)) : null;
                  return (
                    <tr key={ticket.key} className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{ticket.name}</p>
                        {progress != null ? (
                          <div className="mt-2 h-1.5 w-28 rounded-full bg-muted">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progress}%` }} />
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={expectedDrafts[draftKey] ?? ''}
                            onChange={(input) => setExpectedDrafts((prev) => ({ ...prev, [draftKey]: input.target.value }))}
                            placeholder="100"
                            className="h-8 w-24 rounded-md border border-border bg-background px-2 text-foreground"
                            aria-label={`Expected ${ticket.name} tickets`}
                          />
                          <Button type="button" size="sm" variant="outline" disabled={savingKey === draftKey} onClick={() => void saveExpected(event, ticket)}>
                            {savingKey === draftKey ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{ticket.sold.toLocaleString()}</td>
                      <td className={`px-4 py-3 font-semibold ${ticket.remaining != null && ticket.remaining < 0 ? 'text-destructive' : ''}`}>
                        {countText(ticket.remaining)}
                      </td>
                      <td className="px-4 py-3">{ticket.checkedIn.toLocaleString()}</td>
                      <td className="px-4 py-3">{ticket.notCheckedIn.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, detail }: { icon: ComponentType<{ className?: string }>; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}
