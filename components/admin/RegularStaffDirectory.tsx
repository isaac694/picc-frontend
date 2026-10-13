'use client';

import { useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { apiUrl } from '@/lib/api';

export type RegularStaffMember = {
  id: string;
  designation: string;
  description?: string | null;
  imageLinkPath?: string | null;
  sortOrder: number;
  user: {
    id: string;
    name: string;
  };
};

type Props = {
  members: RegularStaffMember[];
};

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="%23f1f5f9"/><circle cx="80" cy="62" r="30" fill="%23cbd5e1"/><path d="M26 142c0-29 24-52 54-52s54 23 54 52" fill="%23cbd5e1"/></svg>';

function pictureUrl(path?: string | null) {
  if (!path) return DEFAULT_AVATAR;

  if (
    /^https?:\/\//i.test(path) ||
    path.startsWith('data:')
  ) {
    return path;
  }

  return apiUrl(
    path.startsWith('/') ? path : `/${path}`
  );
}

export default function RegularStaffDirectory({
  members
}: Props) {
  const [search, setSearch] = useState('');

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const sorted = [...members].sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.user.name.localeCompare(b.user.name)
    );

    if (!query) return sorted;

    return sorted.filter(
      (person) =>
        person.user.name.toLowerCase().includes(query) ||
        person.designation.toLowerCase().includes(query)
    );
  }, [members, search]);

  if (members.length === 0) {
    return null;
  }

  return (
    <section
      className="mt-20 border-t border-slate-200 pt-16"
      aria-labelledby="regular-staff-heading"
    >
      {/* Section header */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Users className="h-6 w-6" />
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
          The People Behind Our Operations
        </p>

        <h2
          id="regular-staff-heading"
          className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          Secretariat Staff
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">
          Meet the dedicated members of our Secretariat
          team who support the daily administrative and
          operational activities of Pentecost International
          Christian Centre.
        </p>
      </div>

      {/* Staff count and search */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-900">
            {members.length}
          </span>{' '}
          {members.length === 1 ? 'Staff Member' : 'Staff Members'}
        </p>

        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search staff or designation..."
            aria-label="Search Secretariat staff"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
        </div>
      </div>

      {/* Staff grid */}
      {filteredMembers.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((person) => (
            <article
              key={person.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
            >
              <div className="h-1 bg-amber-400" />

              <div className="flex flex-col items-center p-6 text-center">
                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-amber-50 bg-slate-100 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pictureUrl(person.imageLinkPath)}
                    alt={person.user.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        DEFAULT_AVATAR;
                    }}
                  />
                </div>

                <h3 className="mt-5 text-base font-bold leading-snug text-slate-900">
                  {person.user.name}
                </h3>

                <p className="mt-2 text-xs font-semibold leading-relaxed text-amber-700">
                  {person.designation}
                </p>

                {person.description && (
                  <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-slate-500">
                    {person.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-300" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            No staff members match your search.
          </p>

          <button
            type="button"
            onClick={() => setSearch('')}
            className="mt-3 text-xs font-semibold text-amber-700 hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}
    </section>
  );
}