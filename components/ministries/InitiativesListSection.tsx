'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type Initiative = {
  id: string;
  title: string;
  description?: string | null;
  /** Kind of initiative, e.g. "Current Initiative" or "Outreach". */
  type?: string | null;
  status?: string | null;
  image?: string | null;
};

/**
 * Ministry initiatives laid out like the main events list (/events): a search card with the
 * entries grouped in a table, and a details dialog for each one.
 */
export default function InitiativesListSection({
  ministryName,
  items,
  kicker = 'Ministry initiatives',
  title = 'Ministry Initiatives',
  description,
  archiveHref,
  sectionClassName = 'bg-background',
}: {
  ministryName: string;
  items: Initiative[];
  kicker?: string;
  title?: string;
  description?: string;
  archiveHref?: string;
  sectionClassName?: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selected, setSelected] = useState<Initiative | null>(null);

  const types = useMemo(() => ['All', ...Array.from(new Set(items.map((item) => item.type || '').filter(Boolean)))], [items]);

  const grouped = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (typeFilter !== 'All' && item.type !== typeFilter) return false;
      if (!term) return true;
      return [item.title, item.description, item.type, item.status].join(' ').toLowerCase().includes(term);
    });
    const groups = new Map<string, Initiative[]>();
    for (const item of filtered) {
      const key = item.type || 'Initiatives';
      groups.set(key, [...(groups.get(key) || []), item]);
    }
    return [...groups.entries()].map(([label, entries]) => ({ label, items: entries }));
  }, [items, searchTerm, typeFilter]);

  return (
    <section className={`py-16 md:py-20 ${sectionClassName}`}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.45em] text-primary/70">{kicker}</p>
          <h2 className="text-3xl font-semibold text-foreground md:text-5xl">{title}</h2>
          <div className="mx-auto mt-4 h-[3px] w-14 rounded-full bg-primary" />
          {description ? <p className="mx-auto mt-4 max-w-2xl text-foreground/70">{description}</p> : null}
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
              <Search className="h-4 w-4 text-foreground/60" />
              <input
                type="text"
                placeholder="Search initiatives"
                className="w-full text-sm text-foreground outline-none"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            {types.length > 2 ? (
              <div className="relative">
                <select
                  className="appearance-none rounded-full bg-primary/10 px-4 py-2 pr-8 text-xs font-semibold text-primary outline-none"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  aria-label="Filter initiatives"
                >
                  {types.map((type) => <option key={type} value={type}>{type === 'All' ? 'All initiatives' : type}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary/70">▾</span>
              </div>
            ) : null}
          </div>

          <div className="mt-8 border-t border-border pt-6">
            {grouped.length === 0 ? (
              <div className="py-12 text-center text-sm text-foreground/60">
                {items.length ? 'No initiatives match your search.' : 'Initiatives will be listed here soon.'}
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.label} className="mb-10 last:mb-0">
                  <p className="mb-6 text-xs uppercase tracking-[0.3em] text-foreground/50">{group.label}</p>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-muted/40 text-xs uppercase tracking-wide text-foreground/60">
                        <tr>
                          <th className="px-3 py-2 font-medium">Initiative</th>
                          <th className="px-3 py-2 font-medium">Ministry</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium" />
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item) => (
                          <tr key={item.id} className="border-t border-border/70">
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                {item.image ? <img src={item.image} alt="" className="hidden h-12 w-16 shrink-0 rounded-md object-cover sm:block" /> : null}
                                <button type="button" onClick={() => setSelected(item)} className="text-left font-medium text-primary hover:underline">
                                  {item.title}
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-foreground/70">{ministryName}</td>
                            <td className="px-3 py-3 text-foreground/70">{item.status || 'Active'}</td>
                            <td className="px-3 py-3 text-right">
                              <Button size="sm" className="rounded-full" onClick={() => setSelected(item)}>View details</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {archiveHref ? (
          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="rounded-full px-8">
              <Link href={archiveHref}>View archive</Link>
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto p-0 sm:max-w-2xl">
          {selected ? (
            <div>
              {selected.image ? <img src={selected.image} alt={selected.title} className="aspect-video w-full object-cover" /> : null}
              <div className="p-6 sm:p-8">
                <DialogHeader className="text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">{selected.type || 'Initiative'}</p>
                  <DialogTitle className="text-2xl font-semibold">{selected.title}</DialogTitle>
                  <DialogDescription>{ministryName} · Status: {selected.status || 'Active'}</DialogDescription>
                </DialogHeader>
                {selected.description ? <p className="mt-5 whitespace-pre-wrap leading-7 text-foreground/75">{selected.description}</p> : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
