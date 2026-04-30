'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sendEventRegistrationNotification } from '@/lib/email';
import { apiFetch } from '@/lib/api';

interface Event {
  id: number | string;
  title: string;
  date: string;
  time: string;
  image: string;
  location: string;
  description: string;
  imageUrl?: string | null;
  scope?: string | null;
}

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

const parseTime = (timeValue: string) => {
  const raw = String(timeValue ?? '').trim();
  const match = /^(\d{1,2})(?::(\d{2}))?\s*([AP]M)?$/i.exec(raw);
  if (!match) return { hours: 12, minutes: 0 };
  const rawHours = Number(match[1]);
  const rawMinutes = match[2] ? Number(match[2]) : 0;
  const period = match[3]?.toUpperCase();
  let hours = Number.isNaN(rawHours) ? 12 : rawHours;
  const minutes = Number.isNaN(rawMinutes) ? 0 : rawMinutes;

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
};

const parseDateOnly = (dateValue: string) => {
  const raw = String(dateValue ?? '').trim();
  const datePart = raw.split('T')[0]?.split(' ')[0] ?? raw;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(raw);
  if (isValidDate(parsed)) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return new Date();
};

const getEventDateRange = (event: Event) => {
  const time = event.time || '12:00 PM - 1:00 PM';
  const [startLabel, endLabel] = time.split(' - ');
  const dateOnly = parseDateOnly(event.date);
  const startTime = parseTime(startLabel);
  const endTime = parseTime(endLabel ?? startLabel);

  const start = new Date(
    dateOnly.getFullYear(),
    dateOnly.getMonth(),
    dateOnly.getDate(),
    startTime.hours,
    startTime.minutes,
    0,
  );
  const end = new Date(
    dateOnly.getFullYear(),
    dateOnly.getMonth(),
    dateOnly.getDate(),
    endTime.hours,
    endTime.minutes,
    0,
  );

  return { start, end };
};

const formatIcsDate = (date: Date) =>
  isValidDate(date) ? date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z') : null;

const escapeIcsText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

const buildIcsFile = (event: Event) => {
  const { start, end } = getEventDateRange(event);
  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(start);
  const dtEnd = formatIcsDate(end);

  if (!dtStamp || !dtStart || !dtEnd) return null;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PICC//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@picc-events`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
};

const DEFAULT_EVENTS: Event[] = [
  {
    id: 1,
    title: '2026 Chatroom',
    date: '2026-04-11',
    time: '8:00 AM - 4:00 PM',
    image: '/events/upcoming.JPG',
    location: 'African Bible College',
    description:
      'PICC Teens Ministry presents 2026 Chatroom. Registration fee MK18,000 (includes snacks and lunch). Age group 12–19 years. With Pastor Loyce Banda.',
  },
];

export default function EventsListSection({
  apiPath = '/api/events',
}: {
  apiPath?: string;
}) {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    residence: '',
    phone: '',
    email: '',
  });
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const pageSize = 3;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiFetch(apiPath);
        if (response.ok) {
          const data = (await response.json().catch(() => null)) as unknown;
          const eventsList: unknown[] = Array.isArray(data)
            ? data
            : isRecord(data) && Array.isArray(data.events)
              ? (data.events as unknown[])
              : [];

          const normalized: Event[] = eventsList
            .filter(isRecord)
            .map((event) => ({
              id: typeof event.id === 'string' || typeof event.id === 'number' ? event.id : String(event.id ?? ''),
              title: typeof event.title === 'string' ? event.title : '',
              date: event.date ? String(event.date).slice(0, 10) : '',
              time: typeof event.time === 'string' ? event.time : '',
              image:
                typeof event.image === 'string'
                  ? event.image
                  : typeof event.imageUrl === 'string'
                    ? event.imageUrl
                    : '',
              location: typeof event.location === 'string' ? event.location : '',
              description: typeof event.description === 'string' ? event.description : '',
              imageUrl: typeof event.imageUrl === 'string' ? event.imageUrl : null,
              scope: typeof event.scope === 'string' ? event.scope : null,
            }))
            .filter((event) => Boolean(event.title) && Boolean(event.date));
          setEvents(normalized.length > 0 ? normalized : DEFAULT_EVENTS);
        } else {
          setEvents(DEFAULT_EVENTS);
        }
      } catch {
        setEvents(DEFAULT_EVENTS);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, [apiPath]);

  const downloadIcs = (event: Event, filename: string) => {
    const ics = buildIcsFile(event);
    if (!ics) return;
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const filteredEvents = useMemo(() => {
    const baseDate = selectedDate ? parseDateOnly(selectedDate) : new Date();
    const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    const startOfWeek = (date: Date) => {
      const day = date.getDay();
      return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() - day));
    };
    const endOfWeek = (date: Date) => {
      const start = startOfWeek(date);
      return endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
    };
    const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
    const endOfYear = (date: Date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

    let rangeStart = startOfDay(baseDate);
    let rangeEnd: Date | null = endOfDay(baseDate);

    if (selectedDate) {
      rangeStart = startOfDay(baseDate);
      rangeEnd = endOfDay(baseDate);
    } else if (filter === 'today') {
      rangeEnd = null;
    } else if (filter === 'week') {
      rangeStart = startOfWeek(baseDate);
      rangeEnd = endOfWeek(baseDate);
    } else if (filter === 'month') {
      rangeStart = startOfMonth(baseDate);
      rangeEnd = endOfMonth(baseDate);
    } else if (filter === 'year') {
      rangeStart = startOfYear(baseDate);
      rangeEnd = endOfYear(baseDate);
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    return events
      .map((event) => ({ ...event, dateObj: parseDateOnly(event.date) }))
      .filter((event) =>
        rangeEnd ? event.dateObj >= rangeStart && event.dateObj <= rangeEnd : event.dateObj >= rangeStart,
      )
      .filter((event) => {
        if (!normalizedSearch) return true;
        return (
          event.title.toLowerCase().includes(normalizedSearch) ||
          event.location.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [events, filter, searchTerm, selectedDate]);

  const pagedEvents = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      items: filteredEvents.slice(start, start + pageSize),
      totalPages,
      safePage,
    };
  }, [filteredEvents, page, pageSize]);

  const groupedEvents = useMemo(() => {
    const groups: { label: string; items: typeof filteredEvents }[] = [];
    pagedEvents.items.forEach((event) => {
      const label = event.dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const last = groups[groups.length - 1];
      if (!last || last.label !== label) {
        groups.push({ label, items: [event] });
      } else {
        last.items.push(event);
      }
    });
    return groups;
  }, [pagedEvents.items]);

  const formattedToday = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const calendarEvent = useMemo(() => {
    return filteredEvents[0] ?? events[0] ?? null;
  }, [filteredEvents, events]);

  const calendarLinks = useMemo(() => {
    if (!calendarEvent) return null;
    const { start, end } = getEventDateRange(calendarEvent);
    const icsStart = formatIcsDate(start);
    const icsEnd = formatIcsDate(end);
    if (!icsStart || !icsEnd) return null;
    const details = [calendarEvent.title, calendarEvent.time, calendarEvent.location, calendarEvent.description]
      .filter(Boolean)
      .join('\n');

    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.set('action', 'TEMPLATE');
    googleUrl.searchParams.set('text', calendarEvent.title);
    googleUrl.searchParams.set('dates', `${icsStart}/${icsEnd}`);
    googleUrl.searchParams.set('details', details);
    googleUrl.searchParams.set('location', calendarEvent.location);

    const outlookBase = new URL('https://outlook.office.com/calendar/0/deeplink/compose');
    outlookBase.searchParams.set('path', '/calendar/action/compose');
    outlookBase.searchParams.set('rru', 'addevent');
    outlookBase.searchParams.set('subject', calendarEvent.title);
    outlookBase.searchParams.set('startdt', start.toISOString());
    outlookBase.searchParams.set('enddt', end.toISOString());
    outlookBase.searchParams.set('body', details);
    outlookBase.searchParams.set('location', calendarEvent.location);

    const outlookLive = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    outlookLive.searchParams.set('path', '/calendar/action/compose');
    outlookLive.searchParams.set('rru', 'addevent');
    outlookLive.searchParams.set('subject', calendarEvent.title);
    outlookLive.searchParams.set('startdt', start.toISOString());
    outlookLive.searchParams.set('enddt', end.toISOString());
    outlookLive.searchParams.set('body', details);
    outlookLive.searchParams.set('location', calendarEvent.location);

    return {
      google: googleUrl.toString(),
      outlook365: outlookBase.toString(),
      outlookLive: outlookLive.toString(),
    };
  }, [calendarEvent]);

  const openRegister = (event: typeof events[number]) => {
    setActiveEvent(event);
    setIsRegisterOpen(true);
    setRegisterError(null);
    setRegisterSuccess(null);
  };

  const submitRegistration = async () => {
    if (!activeEvent) return;
    setRegisterError(null);
    setRegisterSuccess(null);

    if (!registerForm.fullName || !registerForm.residence || !registerForm.phone || !registerForm.email) {
      setRegisterError('Please complete the required fields before submitting.');
      return;
    }

    setRegisterSubmitting(true);
    try {
      await sendEventRegistrationNotification({
        churchEmail: 'info@piccworldwide.org',
        eventTitle: activeEvent.title,
        eventDate: activeEvent.date,
        fullName: registerForm.fullName,
        residence: registerForm.residence,
        phone: registerForm.phone,
        email: registerForm.email,
      });
      setRegisterSuccess('Thank you! Your registration was submitted.');
      setRegisterForm({
        fullName: '',
        residence: '',
        phone: '',
        email: '',
      });
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Failed to submit registration.');
    } finally {
      setRegisterSubmitting(false);
    }
  };

  return (
    <>
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-white shadow-sm p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="flex-1 flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
                <Search className="h-4 w-4 text-foreground/60" />
                <input
                  type="text"
                  placeholder="Search for events"
                  className="w-full text-sm outline-none text-foreground"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="relative flex items-center gap-2">
                <Button className="rounded-full px-6 bg-[#7C9BFF] text-white hover:bg-[#6B8BF5]">
                  Find Events
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCalendarOpen((open) => !open)}
                  className="rounded-full px-4 text-foreground/80 hover:text-foreground"
                >
                  Pick Date
                </Button>
                {isCalendarOpen && (
                  <div className="absolute right-0 z-10 mt-12 w-56 rounded-xl border border-border bg-white p-3 shadow-lg">
                    <input
                      type="date"
                      className="w-full rounded-lg border border-border px-3 py-2 text-xs text-foreground"
                      value={selectedDate}
                      onChange={(event) => {
                        setSelectedDate(event.target.value);
                        setPage(1);
                        setIsCalendarOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-foreground/60">
              <div className="relative">
                <select
                  className="appearance-none rounded-full bg-primary/10 text-primary px-4 py-1 pr-8 text-xs font-semibold outline-none"
                  value={filter}
                  onChange={(event) => {
                    setFilter(event.target.value as 'today' | 'week' | 'month' | 'year');
                    setPage(1);
                  }}
                  aria-label="Filter events"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-primary/70">
                  ▾
                </span>
              </div>
              <div className="relative">
                <span className="rounded-full border border-border bg-white px-3 py-1 text-foreground/80">
                  {formattedToday}
                </span>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              {eventsLoading ? (
                <div className="py-12 text-center text-sm text-foreground/60">Loading events...</div>
              ) : groupedEvents.length === 0 ? (
                <div className="py-12 text-center text-sm text-foreground/60">
                  No events found for this timeframe.
                </div>
              ) : (
                groupedEvents.map((group) => (
                  <div key={group.label} className="mb-10 last:mb-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-6">
                      {group.label}
                    </p>
                    <div className="grid gap-8">
                      {group.items.map((event) => {
                        const dateLabel = event.dateObj
                          .toLocaleString('en-US', { weekday: 'short' })
                          .toUpperCase();
                        const dateNumber = event.dateObj.getDate();

                        return (
                          <div
                            key={event.id}
                            className="grid grid-cols-1 md:grid-cols-[90px_1fr_240px] gap-6 items-center pb-10 border-b border-border last:border-b-0 last:pb-0"
                          >
                            <div className="text-center md:text-left">
                              <p className="text-xs uppercase text-foreground/60">{dateLabel}</p>
                              <p className="text-3xl font-semibold text-foreground">{dateNumber}</p>
                            </div>
                            <div>
                              <h3 className="text-lg md:text-xl font-semibold text-primary">{event.title}</h3>
                              <p className="text-sm text-foreground/70 mt-2">
                                {group.label} • {event.time}
                              </p>
                              <p className="text-sm text-foreground/60 mt-2">{event.location}</p>
                              <div className="mt-4">
                                <Button
                                  variant="outline"
                                  className="rounded-full px-5 text-sm"
                                  onClick={() => openRegister(event)}
                                >
                                  Register for Event
                                </Button>
                              </div>
                            </div>
                            <div className="relative aspect-[3/4] max-w-[240px] w-full justify-self-center md:justify-self-end overflow-hidden rounded-xl shadow-sm">
                              <Image src={event.image} alt={event.title} fill className="object-cover" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 flex items-center justify-between text-sm text-foreground/60">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={pagedEvents.safePage <= 1}
                className={
                  pagedEvents.safePage <= 1
                    ? 'cursor-not-allowed text-foreground/30'
                    : 'hover:text-foreground'
                }
              >
                Previous Events
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(pagedEvents.totalPages, prev + 1))}
                disabled={pagedEvents.safePage >= pagedEvents.totalPages}
                className={
                  pagedEvents.safePage >= pagedEvents.totalPages
                    ? 'cursor-not-allowed text-foreground/30'
                    : 'hover:text-foreground'
                }
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Popover>
              <PopoverTrigger asChild>
                <Button className="rounded-full bg-black text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-black/90">
                  Subscribe to calendar
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                sideOffset={8}
                avoidCollisions={false}
                className="w-64 p-2"
              >
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
                  Add to calendar
                </p>
                {calendarEvent && calendarLinks ? (
                  <div className="mt-2 grid gap-1">
                    <a
                      href={calendarLinks.google}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      Google Calendar
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcs(calendarEvent, 'picc-event.ics')}
                      className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      iCalendar
                    </button>
                    <a
                      href={calendarLinks.outlook365}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      Outlook 365
                    </a>
                    <a
                      href={calendarLinks.outlookLive}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      Outlook Live
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcs(calendarEvent, 'picc-event.ics')}
                      className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      Export .ics file
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadIcs(calendarEvent, 'picc-event-outlook.ics')}
                      className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      Export Outlook .ics file
                    </button>
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-foreground/60">No upcoming events to subscribe.</p>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>

      <Dialog
        open={isRegisterOpen}
        onOpenChange={(open) => {
          setIsRegisterOpen(open);
          if (!open) {
            setActiveEvent(null);
            setRegisterError(null);
            setRegisterSuccess(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register for Event</DialogTitle>
            <DialogDescription>
              {activeEvent ? `You're registering for ${activeEvent.title}.` : 'Event registration'}
            </DialogDescription>
          </DialogHeader>
          {registerError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {registerError}
            </div>
          )}
          {registerSuccess && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
              {registerSuccess}
            </div>
          )}
          <div className="grid gap-3 text-sm">
            <label className="grid gap-1">
              <span className="text-foreground/80">Full name</span>
              <input
                className="rounded-md border border-border px-3 py-2 text-sm"
                value={registerForm.fullName}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))}
                type="text"
                placeholder="Your full name"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-foreground/80">Area of residence</span>
              <input
                className="rounded-md border border-border px-3 py-2 text-sm"
                value={registerForm.residence}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, residence: event.target.value }))
                }
                type="text"
                placeholder="City or area"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-foreground/80">Phone number</span>
              <input
                className="rounded-md border border-border px-3 py-2 text-sm"
                value={registerForm.phone}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))}
                type="tel"
                placeholder="Phone number"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-foreground/80">Email address</span>
              <input
                className="rounded-md border border-border px-3 py-2 text-sm"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                type="email"
                placeholder="Email address"
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              className="rounded-full px-5"
              onClick={submitRegistration}
              disabled={!activeEvent || registerSubmitting}
            >
              {registerSubmitting ? 'Sending...' : 'Register'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
