'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Group = 'church-admins' | 'secretariates';
type Person = { id: string; userId: string; designation: string; description: string | null; imageLinkPath: string | null; parentId: string | null; sortOrder: number; isPublished: boolean; user: { id: string; name: string; email: string } };
type User = { id: string; name: string; email: string };
type Form = { userId: string; designation: string; description: string; imageLinkPath: string; parentId: string; sortOrder: number; isPublished: boolean };
const blank: Form = { userId: '', designation: '', description: '', imageLinkPath: '', parentId: '', sortOrder: 0, isPublished: true };
const input = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200';

export default function LeadershipManager() {
  const [group, setGroup] = useState<Group>('church-admins');
  const [records, setRecords] = useState<Person[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    const [a, b] = await Promise.all([apiFetch(`/api/leadership-manage/${group}`), apiFetch('/api/leadership-users')]);
    if (!a.ok || !b.ok) throw new Error('Could not load records. Please check that you are signed in as an administrator.');
    setRecords(await a.json()); setUsers(await b.json());
  }, [group]);
  useEffect(() => { let active = true; load().catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [load]);
  function switchGroup(value: Group) { setGroup(value); setEditing(null); setForm(blank); setError(''); setNotice(''); }
  function edit(person: Person) { setEditing(person.id); setForm({ userId: person.userId, designation: person.designation, description: person.description ?? '', imageLinkPath: person.imageLinkPath ?? '', parentId: person.parentId ?? '', sortOrder: person.sortOrder, isPublished: person.isPublished }); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const response = await apiFetch(`/api/${group}${editing ? `/${editing}` : ''}`, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, parentId: form.parentId || null }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save leadership profile.');
      setNotice(editing ? 'Profile updated.' : 'Profile created.'); setForm(blank); setEditing(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save.'); } finally { setBusy(false); }
  }
  async function remove(person: Person) {
    if (!window.confirm(`Delete ${person.user.name} from this group? Direct reports will become top-level positions.`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await apiFetch(`/api/${group}/${person.id}`, { method: 'DELETE' });
      if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error ?? 'Could not delete record.'); }
      if (editing === person.id) { setEditing(null); setForm(blank); }
      await load(); setNotice('Leadership profile deleted.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete.'); } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-8"><div className="mx-auto max-w-6xl">
    <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[.25em] text-amber-700">PICC Administration</p><h1 className="mt-2 text-4xl font-semibold">Leadership Management</h1><p className="mt-3 text-slate-500">Manage official roles, reporting relationships and the order in which profiles appear.</p></div>
    <div className="mb-8 flex flex-wrap gap-3">{([['church-admins', 'Church Administration'], ['secretariates', 'Church Secretariat']] as const).map(([value, label]) => <button key={value} onClick={() => switchGroup(value)} className={`rounded-xl px-5 py-3 text-sm font-semibold ${group === value ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{label}</button>)}</div>
    {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}{notice && <div role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</div>}
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form onSubmit={save} className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-6 text-xl font-bold">{editing ? 'Edit leadership profile' : 'Add leadership profile'}</h2>
        <label className="mb-4 block text-sm font-medium">User *<select required value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} className={`mt-2 ${input}`}><option value="">Select registered user</option>{users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</select></label>
        <label className="mb-4 block text-sm font-medium">Designation *<input required maxLength={191} className={`mt-2 ${input}`} value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} placeholder="e.g. Chief Administration Officer" /></label>
        <label className="mb-4 block text-sm font-medium">Reports to<select className={`mt-2 ${input}`} value={form.parentId} onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))}><option value="">None — top level</option>{records.filter(r => r.id !== editing).map(r => <option key={r.id} value={r.id}>{r.designation} — {r.user.name}</option>)}</select></label>
        <label className="mb-4 block text-sm font-medium">Display order<input type="number" min="0" step="1" className={`mt-2 ${input}`} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} /></label>
        <label className="mb-4 block text-sm font-medium">Photo URL or stored image path<input className={`mt-2 ${input}`} value={form.imageLinkPath} onChange={e => setForm(p => ({ ...p, imageLinkPath: e.target.value }))} placeholder="uploads/leadership/photo.jpg" /></label>
        <label className="mb-4 block text-sm font-medium">Responsibilities<textarea rows={4} className={`mt-2 ${input}`} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></label>
        <label className="mb-6 flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))} />Published on public website</label>
        <div className="flex gap-3"><button disabled={busy} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Update Profile' : 'Add Profile'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); }} className="rounded-xl border border-slate-300 px-4 py-3 text-sm">Cancel</button>}</div>
      </form>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-bold">Leadership records</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{records.length} profiles</span></div>
        {records.length === 0 ? <p className="py-10 text-center text-slate-500">No records yet. Create the first leader using the form.</p> : <div className="space-y-3">{records.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"><div><p className="font-semibold">{r.user.name}</p><p className="text-sm text-slate-500">{r.designation}</p><p className="mt-2 text-xs text-slate-400">Reports to: {records.find(p => p.id === r.parentId)?.user.name ?? 'Top level'} · Order {r.sortOrder} · {r.isPublished ? 'Published' : 'Draft'}</p></div><div className="flex gap-2"><button disabled={busy} onClick={() => edit(r)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold">Edit</button><button disabled={busy} onClick={() => remove(r)} className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">Delete</button></div></div>)}</div>}
      </section>
    </div>
  </div></main>;
}
