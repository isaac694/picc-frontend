'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function EventsPage() {
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 3;

  const events = [
    {
      id: 1,
      title: 'Uniport Miracle Crusade',
      date: '2026-03-27',
      time: '5:00 PM - 9:00 PM',
      image: '/events/event-1.jpg',
      location: 'Abuja Campus, Lawn Tennis Court (Open Field)',
    },
  ];

  const filteredEvents = useMemo(() => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    const startOfWeek = (date: Date) => {
      const day = date.getDay();
      return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() - day));
    };
    const endOfWeek = (date: Date) => {
      const start = startOfWeek(date);
      return endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
    };
    const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
    const endOfYear = (date: Date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

    let rangeStart = startOfDay(baseDate);
    let rangeEnd = endOfDay(baseDate);

    if (filter === 'week') {
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
      .map((event) => ({ ...event, dateObj: new Date(event.date) }))
      .filter((event) => event.dateObj >= rangeStart && event.dateObj <= rangeEnd)
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

  const formattedSelectedDate = useMemo(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [selectedDate]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Events List */}
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
                <Button className="rounded-full px-6 bg-[#7C9BFF] text-white hover:bg-[#6B8BF5]">
                  Find Events
                </Button>
                <div className="ml-auto flex items-center gap-3 text-xs text-foreground/60">
                  <button className="text-primary font-semibold">List</button>
                  <button className="hover:text-foreground">Month</button>
                  <button className="hover:text-foreground">Day</button>
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
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-primary/70">▾</span>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen((open) => !open)}
                    className="rounded-full border border-border bg-white px-3 py-1 text-foreground/80 hover:text-foreground"
                  >
                    {formattedSelectedDate}
                  </button>
                  {isCalendarOpen && (
                    <div className="absolute z-10 mt-2 w-56 rounded-xl border border-border bg-white p-3 shadow-lg">
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

              <div className="mt-8 border-t border-border pt-6">
                {groupedEvents.length === 0 ? (
                  <div className="py-12 text-center text-sm text-foreground/60">
                    No events found for this timeframe.
                  </div>
                ) : (
                  groupedEvents.map((group) => (
                    <div key={group.label} className="mb-10 last:mb-0">
                      <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-6">{group.label}</p>
                      {group.items.map((event) => {
                        const dateLabel = event.dateObj
                          .toLocaleString('en-US', { weekday: 'short' })
                          .toUpperCase();
                        const dateNumber = event.dateObj.getDate();

                        return (
                          <div key={event.id} className="grid grid-cols-1 md:grid-cols-[90px_1fr_240px] gap-6 items-center pb-10 border-b border-border last:border-b-0 last:pb-0">
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
                                <Link href="/contact">
                                  <Button variant="outline" className="rounded-full px-5 text-sm">
                                    Learn More
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            <div className="relative aspect-[3/4] max-w-[240px] w-full justify-self-center md:justify-self-end overflow-hidden rounded-xl shadow-sm">
                              <Image
                                src={event.image}
                                alt={event.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 flex items-center justify-between text-sm text-foreground/60">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={pagedEvents.safePage <= 1}
                  className={pagedEvents.safePage <= 1 ? 'cursor-not-allowed text-foreground/30' : 'hover:text-foreground'}
                >
                  Previous Events
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(pagedEvents.totalPages, prev + 1))}
                  disabled={pagedEvents.safePage >= pagedEvents.totalPages}
                  className={pagedEvents.safePage >= pagedEvents.totalPages ? 'cursor-not-allowed text-foreground/30' : 'hover:text-foreground'}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="rounded-full bg-black text-white px-6 py-3 text-sm font-semibold shadow-lg">
                Subscribe to calendar
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
