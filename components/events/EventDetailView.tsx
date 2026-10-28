'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EventCouponField, { type EventCouponQuote } from '@/components/events/EventCouponField';
import EventShareButton from '@/components/events/EventShareButton';
import EventFormFields from '@/components/events/EventFormFields';
import { apiFetch } from '@/lib/api';
import { PAYCHANGU_CHECKOUT_METHOD, processPaychanguPayment } from '@/lib/paychangu-initialize';
import { fetchPublicEvent, type PublicEvent } from '@/lib/public-event';
import {
  contactFromEventAnswers,
  emptyAnswers,
  formCollectsContact,
  validateEventAnswers,
  type EventAnswers,
} from '@/lib/event-forms';

const inputClass = 'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary';

function formatWhen(value?: string) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function money(currency: string, amount: number) {
  return `${currency || 'MWK'} ${Number(amount || 0).toLocaleString('en-US')}`;
}

export default function EventDetailView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerAnswers, setRegisterAnswers] = useState<EventAnswers>({});
  const [registerForm, setRegisterForm] = useState({ fullName: '', residence: '', phone: '', email: '' });
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [ticketKey, setTicketKey] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [paymentAnswers, setPaymentAnswers] = useState<EventAnswers>({});
  const [paymentForm, setPaymentForm] = useState({ fullName: '', email: '', phone: '', phoneCountry: '+265' });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<EventCouponQuote | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMissing(false);
    fetchPublicEvent(eventId)
      .then((item) => {
        if (cancelled) return;
        setEvent(item);
        setMissing(!item);
        if (item) {
          setRegisterAnswers(emptyAnswers(item.registrationForm));
          setPaymentAnswers(emptyAnswers(item.paymentForm));
          setTicketKey(item.tickets[0]?.key || '');
        }
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const ticket = useMemo(
    () => event?.tickets.find((item) => item.key === ticketKey) || event?.tickets[0] || null,
    [event, ticketKey],
  );
  const canPay = Boolean(event?.acceptsOnlinePayment && (ticket || (event.paymentAmount && event.paymentAmount > 0)));
  const unitAmount = ticket?.price || event?.paymentAmount || 0;
  const quantity = Math.min(10, Math.max(1, ticketQuantity || 1));
  const subtotal = unitAmount * quantity;
  const amount = appliedCoupon ? appliedCoupon.amount : subtotal;

  useEffect(() => {
    setAppliedCoupon(null);
  }, [ticketKey, ticketQuantity]);
  const dateLabel = event
    ? [formatWhen(event.startDate), event.endDate && formatWhen(event.endDate) !== formatWhen(event.startDate) ? formatWhen(event.endDate) : '']
        .filter(Boolean)
        .join(' – ')
    : '';

  const submitRegistration = async () => {
    if (!event?.requiresRegistration) return;
    setRegisterError('');
    setRegisterSuccess('');
    const form = event.registrationForm;
    if (form) {
      const answerError = validateEventAnswers(form, registerAnswers);
      if (answerError) {
        setRegisterError(answerError);
        return;
      }
    } else if (!registerForm.fullName || !registerForm.email || !registerForm.phone) {
      setRegisterError('Please enter your name, email, and phone number.');
      return;
    }

    setRegisterSubmitting(true);
    try {
      const response = await apiFetch(`/api/events/${event.id}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          form
            ? { answers: registerAnswers }
            : {
                name: registerForm.fullName.trim(),
                email: registerForm.email.trim(),
                phone: registerForm.phone.trim(),
                message: registerForm.residence.trim(),
              },
        ),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'Failed to submit registration.');
      setRegisterSuccess('You are registered. We look forward to seeing you.');
      setRegisterAnswers(emptyAnswers(form));
      setRegisterForm({ fullName: '', residence: '', phone: '', email: '' });
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Failed to submit registration.');
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const submitPayment = async () => {
    if (!event || !canPay) return;
    setPaymentError('');
    setPaymentSuccess('');
    const form = event.paymentForm;
    const answerError = validateEventAnswers(form, paymentAnswers);
    if (answerError) {
      setPaymentError(answerError);
      return;
    }
    if (event.tickets.length && !ticket) {
      setPaymentError('Choose a ticket.');
      return;
    }
    const collected = contactFromEventAnswers(form, paymentAnswers);
    const covered = formCollectsContact(form);
    const fullName = collected.name || paymentForm.fullName.trim();
    const email = collected.email || paymentForm.email.trim();
    const rawPhone = collected.phone || paymentForm.phone.trim();
    if (!fullName || !email || !rawPhone) {
      setPaymentError('Please enter your name, phone number, and email.');
      return;
    }
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      setPaymentError('Please enter your full name (first and last).');
      return;
    }
    const digits = rawPhone.replace(/\D/g, '');
    const phone = covered.phone ? rawPhone.replace(/\s+/g, '') : paymentForm.phoneCountry === '+265' ? digits.replace(/^0+/, '') : `${paymentForm.phoneCountry}${digits}`;
    if (!covered.phone && paymentForm.phoneCountry === '+265' && phone.length !== 9) {
      setPaymentError('Please enter a valid Malawi mobile number with 9 digits.');
      return;
    }

    setPaymentSubmitting(true);
    try {
      const paymentResponse = await apiFetch(`/api/events/${event.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: paymentAnswers,
          name: fullName,
          email,
          phone,
          ticketKey: ticket?.key,
          quantity,
          ...(appliedCoupon && event.acceptsCoupons ? { couponCode: appliedCoupon.code } : {}),
          paymentMethod: PAYCHANGU_CHECKOUT_METHOD,
          paychanguAccount: event.paymentAccount,
        }),
      });
      const paymentData = await paymentResponse.json().catch(() => null);
      if (!paymentResponse.ok) throw new Error(paymentData?.error || 'Failed to save payment record.');
      const chargeId = typeof paymentData?.chargeId === 'string' ? paymentData.chargeId : '';
      if (!chargeId) throw new Error('Payment could not be started.');
      const serverAmount = Number(paymentData?.payment?.amount);
      const payable = Number.isFinite(serverAmount) ? serverAmount : amount;
      if (paymentData?.free || payable <= 0) {
        setPaymentSuccess('This coupon covered the full price. Your tickets are on the way to your email.');
        setPaymentForm({ fullName: '', email: '', phone: '', phoneCountry: '+265' });
        setPaymentAnswers(emptyAnswers(form));
        setTicketQuantity(1);
        setTicketKey(event.tickets[0]?.key || '');
        setAppliedCoupon(null);
        return;
      }
      await processPaychanguPayment({
        amount: payable,
        currency: event.paymentCurrency,
        email,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        phone,
        reason: `Event: ${event.title}${ticket ? ` (${ticket.name})` : ''}`,
        givingId: chargeId,
        txRef: chargeId,
        account: event.paymentAccount,
        returnPath: `/events/${event.id}`,
        meta: { eventId: event.id, chargeId, ticketKey: ticket?.key },
      });
      setPaymentSuccess('Payment started. When PayChangu confirms it, every ticket and QR code will be emailed to you.');
      setPaymentForm({ fullName: '', email: '', phone: '', phoneCountry: '+265' });
      setPaymentAnswers(emptyAnswers(form));
      setTicketQuantity(1);
      setTicketKey(event.tickets[0]?.key || '');
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Failed to start payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-sm text-foreground/60">Loading event...</div>;
  }

  if (missing || !event) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold text-foreground">This event is no longer listed</h1>
        <p className="mt-3 text-foreground/70">It may have been removed, or the link is out of date.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/events">Back to events</Link>
        </Button>
      </div>
    );
  }

  const contact = formCollectsContact(event.paymentForm);

  return (
    <article>
      <section className="relative min-h-[260px] overflow-hidden bg-[#10233f] text-white">
        <Image src={event.image} alt="" fill priority className="object-cover opacity-45" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10233f] via-[#10233f]/75 to-[#10233f]/20" />
        <div className="relative mx-auto flex min-h-[260px] max-w-3xl flex-col justify-end px-4 py-8 sm:px-6">
          <Link href="/events" className="mb-6 w-fit text-xs font-semibold uppercase tracking-[0.22em] text-white/75 hover:text-white">
            All events
          </Link>
          {event.ministryName ? (
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d7e4ff]">{event.ministryName}</p>
          ) : null}
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">{event.title}</h1>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
              <CalendarDays className="h-4 w-4" />
              {dateLabel || 'Date to be announced'}
              {event.time ? ` · ${event.time}` : ''}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
              <MapPin className="h-4 w-4" />
              {event.location}
            </span>
            <EventShareButton eventId={event.id} title={event.title} tone="hero" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-5 px-4 py-8 sm:px-6">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
            <div className="relative aspect-[16/7] max-h-64">
              <Image src={event.image} alt={event.title} fill className="object-cover" unoptimized />
            </div>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">About this gathering</p>
            <p className="mt-4 whitespace-pre-line text-base leading-8 text-foreground/80">
              {event.description || 'Details for this event will be shared here. Use the panel beside this story to register or choose a ticket.'}
            </p>
          </div>
        </div>

        <aside className="mx-auto w-full max-w-md space-y-4">
          {event.requiresRegistration ? (
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">Reserve your place</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">{event.registrationForm?.title || 'Registration'}</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/70">
                {event.registrationForm?.description || 'Tell us you are coming. The form opens here so you can fill it in without leaving this page.'}
              </p>
              {registerSuccess ? <p className="mt-4 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">{registerSuccess}</p> : null}
              <Button className="mt-5 w-full rounded-full" onClick={() => setRegisterOpen(true)}>
                {registerSuccess ? 'Register someone else' : 'Register'}
              </Button>
            </div>
          ) : null}

          {canPay ? (
            <div className="rounded-3xl border border-border/70 bg-[#10233f] p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d7e4ff]">
                <Ticket className="h-4 w-4" />
                Tickets
              </div>
              <h2 className="mt-2 text-2xl font-semibold">{ticket ? ticket.name : 'Event ticket'}</h2>
              {appliedCoupon ? (
                <p className="mt-1 text-sm text-white/60 line-through">{money(event.paymentCurrency, subtotal)}</p>
              ) : null}
              <p className="mt-1 text-3xl font-semibold">{money(event.paymentCurrency, amount)}</p>
              {event.tickets.length > 0 ? (
                <fieldset className="mt-4 grid gap-2">
                  <legend className="sr-only">Ticket type</legend>
                  {event.tickets.map((item) => {
                    const selected = ticket?.key === item.key;
                    return (
                      <label
                        key={item.key}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                          selected ? 'border-white bg-white text-[#10233f]' : 'border-white/20 bg-white/5 text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`ticket-${event.id}`}
                          value={item.key}
                          checked={selected}
                          onChange={() => setTicketKey(item.key)}
                          className={`h-4 w-4 ${selected ? 'accent-[#10233f]' : 'accent-white'}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{item.name}</span>
                          <span className="mt-1 block text-sm opacity-80">{money(event.paymentCurrency, item.price)}</span>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              ) : null}
              <label className="mt-4 grid gap-1 text-sm">
                <span className="text-white/80">Number of tickets</span>
                <input
                  className="w-28 rounded-xl border border-white/20 bg-white px-3 py-2 text-[#10233f]"
                  type="number"
                  min={1}
                  max={10}
                  value={ticketQuantity}
                  onChange={(item) => setTicketQuantity(Math.min(10, Math.max(1, Number.parseInt(item.target.value, 10) || 1)))}
                />
              </label>
              {event.acceptsCoupons ? (
                <div className="mt-4">
                  <EventCouponField
                    eventId={event.id}
                    ticketKey={ticket?.key}
                    quantity={quantity}
                    applied={appliedCoupon}
                    onApplied={setAppliedCoupon}
                    tone="dark"
                  />
                </div>
              ) : null}
              {paymentError ? <p className="mt-4 rounded-xl bg-red-500/20 px-3 py-2 text-sm">{paymentError}</p> : null}
              {paymentSuccess ? <p className="mt-4 rounded-xl bg-emerald-500/20 px-3 py-2 text-sm">{paymentSuccess}</p> : null}
              <div className="mt-4 space-y-3 text-[#10233f]">
                {event.paymentForm ? (
                  <div className="rounded-2xl bg-white p-3">
                    <EventFormFields
                      form={event.paymentForm}
                      values={paymentAnswers}
                      onChange={(key, value) => setPaymentAnswers((prev) => ({ ...prev, [key]: value }))}
                    />
                  </div>
                ) : null}
                {contact.name ? null : (
                  <input className={inputClass} placeholder="Full name" value={paymentForm.fullName} onChange={(item) => setPaymentForm((prev) => ({ ...prev, fullName: item.target.value }))} />
                )}
                {contact.email ? null : (
                  <input className={inputClass} type="email" placeholder="Email" value={paymentForm.email} onChange={(item) => setPaymentForm((prev) => ({ ...prev, email: item.target.value }))} />
                )}
                {contact.phone ? null : (
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <select className={inputClass} value={paymentForm.phoneCountry} onChange={(item) => setPaymentForm((prev) => ({ ...prev, phoneCountry: item.target.value }))} aria-label="Country code">
                      <option value="+265">+265</option>
                      <option value="+27">+27</option>
                      <option value="+44">+44</option>
                      <option value="+1">+1</option>
                    </select>
                    <input className={inputClass} type="tel" placeholder="Phone" value={paymentForm.phone} onChange={(item) => setPaymentForm((prev) => ({ ...prev, phone: item.target.value }))} />
                  </div>
                )}
              </div>
              <Button className="mt-5 w-full rounded-full bg-white text-[#10233f] hover:bg-white/90" onClick={() => void submitPayment()} disabled={paymentSubmitting}>
                {paymentSubmitting ? 'Opening checkout...' : `Pay ${money(event.paymentCurrency, amount)}`}
              </Button>
              <p className="mt-3 text-xs leading-5 text-white/70">PayChangu opens next so you can pay with Airtel, Mpamba, bank, or card.</p>
            </div>
          ) : null}

          {!event.requiresRegistration && !canPay ? (
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground">You are welcome</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/70">This event does not need registration or a ticket. Come as you are.</p>
            </div>
          ) : null}
        </aside>
      </section>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-h-[min(88vh,760px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{event.registrationForm?.title || 'Register for this event'}</DialogTitle>
            <DialogDescription>
              {event.registrationForm?.description || `You're registering for ${event.title}.`}
            </DialogDescription>
          </DialogHeader>
          {registerError ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700">{registerError}</p> : null}
          {registerSuccess ? <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">{registerSuccess}</p> : null}
          <div className="space-y-3">
            {event.registrationForm ? (
              <EventFormFields
                form={event.registrationForm}
                values={registerAnswers}
                onChange={(key, value) => setRegisterAnswers((prev) => ({ ...prev, [key]: value }))}
              />
            ) : (
              <>
                <input className={inputClass} placeholder="Full name" value={registerForm.fullName} onChange={(item) => setRegisterForm((prev) => ({ ...prev, fullName: item.target.value }))} />
                <input className={inputClass} type="email" placeholder="Email" value={registerForm.email} onChange={(item) => setRegisterForm((prev) => ({ ...prev, email: item.target.value }))} />
                <input className={inputClass} type="tel" placeholder="Phone" value={registerForm.phone} onChange={(item) => setRegisterForm((prev) => ({ ...prev, phone: item.target.value }))} />
                <input className={inputClass} placeholder="Where you stay" value={registerForm.residence} onChange={(item) => setRegisterForm((prev) => ({ ...prev, residence: item.target.value }))} />
              </>
            )}
          </div>
          <DialogFooter>
            <Button className="rounded-full px-5" onClick={() => void submitRegistration()} disabled={registerSubmitting}>
              {registerSubmitting ? 'Sending...' : 'Submit registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
