'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, apiUrl } from '@/lib/api';
import RegularStaffDirectory from '@/components/admin/RegularStaffDirectory';
type Group = 'church-admins' | 'secretariates';
type ViewMode = 'chart' | 'list';

type Member = {
  id: string;
  designation: string;
  description?: string | null;
  imageLinkPath?: string | null;

  parentId?: string | null;
  sortOrder: number;

  // Secretariat staff classification
  regularStaff?: boolean;

  user: {
    id: string;
    name: string;
  };
};

type ChildrenIndex = Map<string, Member[]>;

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="%23f1f5f9"/><circle cx="80" cy="62" r="30" fill="%23cbd5e1"/><path d="M26 142c0-29 24-52 54-52s54 23 54 52" fill="%23cbd5e1"/></svg>';

function pictureUrl(path?: string | null) {
  if (!path) return DEFAULT_AVATAR;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  return apiUrl(path.startsWith('/') ? path : `/${path}`);
}

function Avatar({ person, className }: { person: Member; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={pictureUrl(person.imageLinkPath)}
      alt={person.user.name}
      loading="lazy"
      decoding="async"
      className={`object-cover ${className}`}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = DEFAULT_AVATAR;
      }}
    />
  );
}

function Portrait({ person, isRoot }: { person: Member; isRoot: boolean }) {
  return (
    <article
      className={`flex w-[184px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-white text-center transition-shadow hover:shadow-md sm:w-[198px] ${isRoot ? 'border-amber-300 shadow-md' : 'border-slate-200 shadow-sm'
        }`}
    >
      <div className={`h-1 shrink-0 ${isRoot ? 'bg-amber-500' : 'bg-amber-200'}`} />
      <div className="flex flex-col items-center px-3 pb-4 pt-4">
        <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-full border-[3px] border-amber-100 bg-slate-100 sm:h-[84px] sm:w-[84px]">
          <Avatar person={person} className="h-full w-full" />
        </div>

        <h4
          title={person.user.name}
          className="mt-3 line-clamp-2 w-full break-words text-[13px] font-semibold leading-[18px] text-slate-900 sm:text-sm"
        >
          {person.user.name}
        </h4>
        <p
          title={person.designation}
          className="mt-1 line-clamp-3 w-full break-words text-[10px] font-medium leading-[14px] text-amber-800 sm:text-[11px]"
        >
          {person.designation}
        </p>
      </div>
    </article>
  );
}

function ChartBranch({
  person,
  childrenByParent,
  ancestry = [],
  depth = 0,
}: {
  person: Member;
  childrenByParent: ChildrenIndex;
  ancestry?: string[];
  depth?: number;
}) {
  if (ancestry.includes(person.id)) return null; // Guard against invalid cyclic hierarchies.

  const path = [...ancestry, person.id];
  const children = (childrenByParent.get(person.id) ?? []).filter(
    (child) => !path.includes(child.id),
  );

  return (
    <div className="flex w-max flex-col items-center">
      <Portrait person={person} isRoot={depth === 0} />

      {children.length > 0 && (
        <>
          {/* Parent line descends to the sibling connector row. */}
          <div className="h-6 w-px bg-amber-300" aria-hidden="true" />
          <ul className="flex w-max items-start justify-center" aria-label={`Reports to ${person.user.name}`}>
            {children.map((child) => (
              <li
                key={child.id}
                className="relative flex flex-none flex-col items-center px-3 pt-6 before:absolute before:left-0 before:top-0 before:w-1/2 before:border-t before:border-amber-300 after:absolute after:right-0 after:top-0 after:w-1/2 after:border-t after:border-amber-300 first:before:hidden last:after:hidden only:before:hidden only:after:hidden"
              >
                {/* Each child is centered below its portion of the connector. */}
                <span
                  className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-amber-300"
                  aria-hidden="true"
                />
                <ChartBranch
                  person={child}
                  childrenByParent={childrenByParent}
                  ancestry={path}
                  depth={depth + 1}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function CompactBranch({
  person,
  childrenByParent,
  ancestry = [],
  depth = 0,
}: {
  person: Member;
  childrenByParent: ChildrenIndex;
  ancestry?: string[];
  depth?: number;
}) {
  if (ancestry.includes(person.id)) return null;

  const path = [...ancestry, person.id];
  const children = (childrenByParent.get(person.id) ?? []).filter(
    (child) => !path.includes(child.id),
  );

  return (
    <li className="min-w-0">
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-amber-100 bg-slate-100">
          <Avatar person={person} className="h-full w-full" />
        </div>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-5 text-slate-900">{person.user.name}</p>
          <p className="mt-0.5 break-words text-xs leading-4 text-amber-800">{person.designation}</p>
        </div>
      </div>

      {children.length > 0 && (
        <ul
          className={`mt-2 space-y-2 border-l-2 border-amber-200 pl-3 ${depth < 4 ? 'ml-3 sm:ml-5' : 'ml-0'}`}
          aria-label={`Reports to ${person.user.name}`}
        >
          {children.map((child) => (
            <CompactBranch
              key={child.id}
              person={child}
              childrenByParent={childrenByParent}
              ancestry={path}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function LeadershipPage() {
  const [group, setGroup] = useState<Group>('church-admins');
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setMembers([]);

    apiFetch(`/api/${group}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Leadership records could not be loaded.');
        return response.json() as Promise<Member[]>;
      })
      .then((data) => {
        if (active) setMembers(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load leadership.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [group]);

  const { seniorMembers, regularStaffMembers } = useMemo(() => {
    if (group === 'church-admins') {
      return {
        seniorMembers: members,
        regularStaffMembers: [] as Member[]
      };
    }

    return {
      seniorMembers: members.filter(
        (person) => !person.regularStaff
      ),

      regularStaffMembers: members.filter(
        (person) => person.regularStaff === true
      )
    };
  }, [members, group]);

const { roots, childrenByParent } = useMemo(() => {
  const ordered = [...seniorMembers].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      a.user.name.localeCompare(b.user.name)
  );

  const seniorIds = new Set(
    ordered.map((person) => person.id)
  );

  // Includes all published records so we can resolve
  // reporting relationships without exposing regular
  // staff in the organogram.
  const allMembersById = new Map(
    members.map((person) => [person.id, person])
  );

  const childrenByParent: ChildrenIndex = new Map();
  const roots: Member[] = [];

  function findVisibleSupervisor(
    person: Member
  ): string | null {
    let cursor = person.parentId ?? null;

    const visited = new Set<string>([person.id]);

    while (cursor) {
      // Prevent an accidental circular relationship.
      if (visited.has(cursor)) {
        return null;
      }

      visited.add(cursor);

      const supervisor = allMembersById.get(cursor);

      if (!supervisor) {
        return null;
      }

      // Only senior members qualify as visible
      // organogram supervisors.
      if (seniorIds.has(supervisor.id)) {
        return supervisor.id;
      }

      // A regular staff member is skipped visually,
      // but their reporting chain can still be followed.
      cursor = supervisor.parentId ?? null;
    }

    return null;
  }

  for (const person of ordered) {
    const visibleParentId = findVisibleSupervisor(person);

    if (visibleParentId) {
      const siblings =
        childrenByParent.get(visibleParentId) ?? [];

      siblings.push(person);

      childrenByParent.set(
        visibleParentId,
        siblings
      );
    } else {
      roots.push(person);
    }
  }

  return {
    roots,
    childrenByParent
  };
}, [seniorMembers, members]);

  const title = group === 'church-admins' ? 'Church Administration' : 'The Secretariat';

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white">
        <section className="relative isolate overflow-hidden bg-slate-950 py-24 text-white sm:py-32">
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('/about/header.JPG')" }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-900/30" />
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <nav className="mb-8 flex gap-3 text-xs uppercase tracking-[.15em] text-white/60" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/about">About</Link>
              <span>/</span>
              <span className="text-amber-300">Leadership</span>
            </nav>
            <span className="inline-block rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[.18em] text-amber-300">
              Leadership &amp; Governance
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Leading with faith.<br />
              <span className="text-amber-300">Serving with purpose.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75">
              Meet the people entrusted with providing spiritual, administrative and operational leadership at Pentecost International Christian Centre.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-amber-700">Our organizational structure</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Church Leadership</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">
              Explore the leadership hierarchy and reporting structure of our church administration and secretariat.
            </p>
          </div>

          <div className="mx-auto mt-10 flex max-w-xl rounded-2xl border border-slate-200 bg-slate-100 p-1.5" role="group" aria-label="Leadership group">
            {([
              ['church-admins', 'Church Administration'],
              ['secretariates', 'The Secretariat'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={group === id}
                onClick={() => setGroup(id)}
                className={`flex-1 rounded-xl px-2 py-3 text-xs font-semibold transition sm:px-3 sm:text-sm ${group === id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-12">
            <div className="mb-6 text-center">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h3>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Leadership arranged according to the current official hierarchy</p>
            </div>

            {loading ? (
              <div role="status" className="py-20 text-center text-slate-500">Loading leadership…</div>
            ) : error ? (
              <div role="alert" className="rounded-xl bg-red-50 p-6 text-center text-red-700">{error}</div>
            ) : roots.length === 0 ? (<div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
    {group === 'secretariates' && regularStaffMembers.length > 0
      ? 'No published senior Secretariat officers are available.'
      : 'No published leadership profiles are available yet.'}
  </div>) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" role="group" aria-label="Organogram display mode">
                    <button
                      type="button"
                      aria-pressed={viewMode === 'chart'}
                      onClick={() => setViewMode('chart')}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${viewMode === 'chart' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Organogram
                    </button>
                    <button
                      type="button"
                      aria-pressed={viewMode === 'list'}
                      onClick={() => setViewMode('list')}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Compact list
                    </button>
                  </div>
                </div>

                {viewMode === 'chart' ? (
                  <div
                    className="max-w-full overflow-x-auto overscroll-x-contain rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-6"
                    role="region"
                    aria-label={`${title} organogram`}
                    tabIndex={0}
                  >
                    <div className="flex w-max min-w-full flex-col items-center gap-12 py-4">
                      {roots.map((root) => (
                        <ChartBranch key={`${group}-${root.id}`} person={root} childrenByParent={childrenByParent} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <ul className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-6" aria-label={`${title} hierarchy`}>
                    {roots.map((root) => (
                      <CompactBranch key={`${group}-${root.id}`} person={root} childrenByParent={childrenByParent} />
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Regular Secretariat Staff Directory */}
          {!loading &&
            !error &&
            group === 'secretariates' && (
              <RegularStaffDirectory
                members={regularStaffMembers}
              />
            )}
        </section>

        <section className="bg-slate-950 px-5 py-16 text-center text-white">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-amber-300">Pentecost International Christian Centre</p>
          <h2 className="mt-4 text-2xl font-semibold sm:text-4xl">Serving God. Serving His people.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">Leadership committed to stewardship, service and excellence.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
