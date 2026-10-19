'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch } from '@/lib/api';
import { TicketVerification, type EventTicketLookup } from '@/components/events/TicketVerification';

export default function EventTicketCheckInPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(String(params?.code || '')).trim().toUpperCase();
  const [ticket, setTicket] = useState<EventTicketLookup | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(false);

  useEffect(() => {
    setCanCheckIn(Boolean(window.localStorage.getItem('admin_token')));
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      const response = await apiFetch(`/api/event-tickets/${encodeURIComponent(code)}`);
      const data = await response.json().catch(() => null);
      if (!active) return;
      if (!response.ok) {
        setTicket(null);
        setError(data?.error || 'Ticket not found.');
      } else {
        setTicket(data.ticket as EventTicketLookup);
      }
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [code]);

  const checkIn = async () => {
    const token = window.localStorage.getItem('admin_token');
    if (!token || !ticket) return;
    setCheckingIn(true);
    setError('');
    try {
      const response = await apiFetch('/api/admin/event-tickets/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: ticket.ticketCode }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Could not check in this ticket.');
        if (data?.ticket) setTicket(data.ticket as EventTicketLookup);
        return;
      }
      setTicket(data.ticket as EventTicketLookup);
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-md">
          {loading ? <p className="text-sm text-foreground/60">Looking up ticket...</p> : null}
          {error ? <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          {ticket ? (
            <TicketVerification ticket={ticket} canCheckIn={canCheckIn} checkingIn={checkingIn} onCheckIn={checkIn} />
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
