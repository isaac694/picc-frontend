'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, apiUrl } from '@/lib/api';

type Group = 'church-admins' | 'secretariates';
type Member = {
  id: string; designation: string; description?: string | null;
  imageLinkPath?: string | null; parentId?: string | null;
  sortOrder: number; user: { id: string; name: string };
};

function pictureUrl(path?: string | null) {
  if (!path) return '/leadership/placeholder.jpg';
  if (/^https?:\/\//i.test(path)) return path;
  // Images served from your backend (adjust the base if static images live on the frontend).
  return apiUrl(path.startsWith('/') ? path : `/${path}`);
}

function Portrait({ person }: { person: Member }) {
  return (
    <article className="w-full max-w-[320px] overflow-hidden rounded-[26px] border border-slate-200 bg-white text-center shadow-[0_16px_50px_-28px_rgba(15,23,42,.4)] transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative mx-auto mt-6 h-32 w-32 overflow-hidden rounded-full border-[5px] border-amber-100 bg-slate-100">
        {/* Standard img supports uploaded/backend image URLs without Next image remotePatterns. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pictureUrl(person.imageLinkPath)} alt={person.user.name} className="h-full w-full object-cover" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/leadership/placeholder.jpg'; }} />
      </div>
      <div className="px-5 pb-7 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-amber-700">{person.designation}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{person.user.name}</h3>
        {person.description && <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-500">{person.description}</p>}
      </div>
    </article>
  );
}

function Branch({ person, members, ancestry = [] }: { person: Member; members: Member[]; ancestry?: string[] }) {
  if (ancestry.includes(person.id)) return null;
  const descendants = members.filter(m => m.parentId === person.id);
  return (
    <div className="flex min-w-0 flex-col items-center">
      <Portrait person={person} />
      {descendants.length > 0 && <>
        <div className="h-9 w-px bg-amber-300" aria-hidden="true" />
        <div className="w-full rounded-[28px] border border-slate-200/80 bg-slate-50/90 p-4 sm:p-7">
          <p className="mb-6 text-center text-[11px] font-bold uppercase tracking-[.22em] text-slate-400">Reporting structure</p>
          <div className="grid grid-cols-1 items-start justify-items-center gap-8 md:grid-cols-2 xl:grid-cols-3">
            {descendants.map(child => <Branch key={child.id} person={child} members={members} ancestry={[...ancestry, person.id]} />)}
          </div>
        </div>
      </>}
    </div>
  );
}

export default function LeadershipPage() {
  const [group, setGroup] = useState<Group>('church-admins');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    apiFetch(`/api/${group}`).then(async response => {
      if (!response.ok) throw new Error('Leadership records could not be loaded.');
      return response.json() as Promise<Member[]>;
    }).then(data => { if (active) setMembers(data); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [group]);

  const roots = useMemo(() => {
    const ids = new Set(members.map(m => m.id));
    return members.filter(m => !m.parentId || !ids.has(m.parentId));
  }, [members]);
  const title = group === 'church-admins' ? 'Church Administration' : 'Church Secretariat';

  return <>
    <Navigation />
    <main className="min-h-screen bg-white">
      <section className="relative isolate overflow-hidden bg-slate-950 py-32 text-white sm:py-40">
        <div className="absolute inset-0 -z-10 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/about/header.JPG')" }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-900/30" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <nav className="mb-9 flex gap-3 text-xs uppercase tracking-[.2em] text-white/60"><Link href="/">Home</Link><span>/</span><Link href="/about">About</Link><span>/</span><span className="text-amber-300">Leadership</span></nav>
          <span className="inline-block rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-2 text-xs font-semibold uppercase tracking-[.25em] text-amber-300">Leadership &amp; Governance</span>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">Leading with faith.<br/><span className="text-amber-300">Serving with purpose.</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/75">Meet the people entrusted with providing spiritual, administrative and operational leadership at Pentecost International Christian Centre.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="text-center"><p className="text-xs font-bold uppercase tracking-[.32em] text-amber-700">Our organizational structure</p><h2 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">Church Leadership</h2><p className="mx-auto mt-5 max-w-2xl text-slate-500">Explore the leadership hierarchy and reporting structure of our church administration and secretariat.</p></div>
        <div className="mx-auto mt-12 flex max-w-xl rounded-2xl border border-slate-200 bg-slate-100 p-1.5" role="tablist" aria-label="Leadership group">
          {([['church-admins','Church Administration'],['secretariates','Church Secretariat']] as const).map(([id,label]) => <button key={id} role="tab" aria-selected={group === id} onClick={() => setGroup(id)} className={`flex-1 rounded-xl px-3 py-4 text-sm font-semibold transition ${group === id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>{label}</button>)}
        </div>
        <div className="mt-14"><div className="mb-10 text-center"><h3 className="text-2xl font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm text-slate-500">Leadership arranged according to the current official hierarchy</p></div>
          {loading ? <div role="status" className="py-20 text-center text-slate-500">Loading leadership…</div> : error ? <div role="alert" className="rounded-xl bg-red-50 p-6 text-center text-red-700">{error}</div> : roots.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-500">No published leadership profiles are available yet.</div> : <div className="space-y-14">{roots.map(root => <Branch key={root.id} person={root} members={members} />)}</div>}
        </div>
      </section>
      <section className="bg-slate-950 px-5 py-20 text-center text-white"><p className="text-xs font-bold uppercase tracking-[.3em] text-amber-300">Pentecost International Christian Centre</p><h2 className="mt-4 text-3xl font-semibold sm:text-5xl">Serving God. Serving His people.</h2><p className="mx-auto mt-5 max-w-xl text-white/60">Leadership committed to stewardship, service and excellence.</p></section>
    </main>
    <Footer />
  </>;
}
