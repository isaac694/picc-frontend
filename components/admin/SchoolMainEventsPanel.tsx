'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarPlus, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

type SchoolEvent = { id: string; title: string; startDate: string; location?: string | null; requiresRegistration?: boolean; isPublished?: boolean };

/**
 * School events are ordinary church events filed under the school, so they get the same registration
 * forms, payments and tickets. This lists them and links to the Events manager to add or edit them.
 */
export default function SchoolMainEventsPanel({ schoolKey, schoolName, publicHref }: { schoolKey: string; schoolName: string; publicHref: string }) {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiFetch(`/api/events?scope=${schoolKey}&take=100`)
      .then((response) => response.json().catch(() => null))
      .then((data) => {
        if (alive) setEvents(Array.isArray(data?.events) ? data.events : []);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [schoolKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{schoolName} events</h2>
          <p className="text-sm text-muted-foreground">
            Created in the main Events manager with &ldquo;Event for: {schoolName}&rdquo;, so they share its registration forms, payments and tickets.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href={`/admin/events?for=school:${schoolKey}`}><CalendarPlus className="h-4 w-4" /> Add or edit events</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={publicHref} target="_blank"><ExternalLink className="h-4 w-4" /> View page</Link>
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        {loading ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading events…</p> : null}
        {!loading && events.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No published {schoolName} events yet.</p>
        ) : null}
        {events.map((event) => (
          <div key={event.id} className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{event.title}</p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                {new Date(event.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {event.location ? <><MapPin className="ml-2 h-3 w-3" />{event.location}</> : null}
              </p>
            </div>
            {event.requiresRegistration ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Registration</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
