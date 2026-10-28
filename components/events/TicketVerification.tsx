'use client';

export type EventTicketLookup = {
  ticketCode: string;
  holderName: string;
  ticketName: string | null;
  amount: number;
  currency: string;
  status: string;
  valid: boolean;
  checkedInAt: string | null;
  event: {
    id: string;
    title: string;
    date: string | null;
    time: string;
    location: string;
  };
};

export function formatTicketWhen(ticket: EventTicketLookup) {
  const start = ticket.event.date ? new Date(ticket.event.date) : null;
  const dateLabel = start && !Number.isNaN(start.getTime())
    ? start.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date to be announced';
  return ticket.event.time ? `${dateLabel} at ${ticket.event.time}` : dateLabel;
}

export function TicketVerification({
  ticket,
  canCheckIn = false,
  checkingIn = false,
  onCheckIn,
}: {
  ticket: EventTicketLookup;
  canCheckIn?: boolean;
  checkingIn?: boolean;
  onCheckIn?: () => void;
}) {
  const checkedIn = Boolean(ticket.checkedInAt);
  const tone = ticket.valid
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800'
    : checkedIn
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-800'
      : 'border-red-500/40 bg-red-500/10 text-red-700';
  const label = ticket.valid ? 'Redeem please' : checkedIn ? 'Redeemed' : 'Not paid';

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-foreground shadow-sm">
      {ticket.valid && onCheckIn ? (
        <button
          type="button"
          onClick={onCheckIn}
          disabled={checkingIn}
          className={`w-full rounded-full border px-3 py-3 text-center text-sm font-semibold disabled:opacity-60 ${tone}`}
        >
          {checkingIn ? 'Redeeming...' : 'Redeem please'}
        </button>
      ) : (
        <p className={`rounded-full border px-3 py-1 text-center text-sm font-semibold ${tone}`}>{label}</p>
      )}
      <h1 className="mt-4 text-2xl font-semibold">{ticket.event.title}</h1>
      <p className="mt-2 text-sm text-foreground/70">{formatTicketWhen(ticket)}</p>
      <p className="text-sm text-foreground/70">{ticket.event.location || 'Location to be announced'}</p>
      <dl className="mt-5 grid gap-3 text-sm">
        <div>
          <dt className="text-foreground/50">Name</dt>
          <dd className="font-medium">{ticket.holderName || 'Guest'}</dd>
        </div>
        <div>
          <dt className="text-foreground/50">Ticket</dt>
          <dd className="font-medium">{ticket.ticketName || 'Event ticket'}</dd>
        </div>
        <div>
          <dt className="text-foreground/50">Code</dt>
          <dd className="font-mono text-lg tracking-widest">{ticket.ticketCode}</dd>
        </div>
      </dl>
      {canCheckIn && ticket.valid && onCheckIn ? (
        <button
          type="button"
          onClick={onCheckIn}
          disabled={checkingIn}
          className="mt-6 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {checkingIn ? 'Redeeming...' : 'Redeem'}
        </button>
      ) : null}
    </div>
  );
}
