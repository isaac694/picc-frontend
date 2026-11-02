'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Eye, Headphones, ImagePlus, Pencil, Plus, Power, PowerOff, Star, Trash2, Video } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { adminErrorToast, adminSuccessToast, readApiMessage } from '@/components/admin/admin-toast';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { getYouTubeId, spotifyEmbedUrl } from '@/lib/media-links';
import { compactNumber, formatSermonDate, parseSermons, sermonThumbnail, sermonViews, type Sermon } from '@/lib/sermons';
import { cn } from '@/lib/utils';

const DEFAULT_HEADER_IMAGE = '/sermons/header.JPG';

type Draft = {
  title: string;
  date: string;
  speaker: string;
  youtubeUrl: string;
  spotifyUrl: string;
  audioUrl: string;
  thumbnailUrl: string;
  series: string;
  topic: string;
  scripture: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
};

const EMPTY_DRAFT: Draft = {
  title: '',
  date: '',
  speaker: '',
  youtubeUrl: '',
  spotifyUrl: '',
  audioUrl: '',
  thumbnailUrl: '',
  series: '',
  topic: '',
  scripture: '',
  description: '',
  isActive: true,
  isFeatured: false,
};

const inputClass = 'mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground';

export default function AdminSermonsPage() {
  const { token, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();
  const { runUpload, progress, uploading } = useMediaUpload();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [headerImage, setHeaderImage] = useState(DEFAULT_HEADER_IMAGE);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notifySubscribers, setNotifySubscribers] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  const fetchSermons = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch('/api/admin/sermons', { headers });
    if (!response.ok) {
      adminErrorToast(await readApiMessage(response, { fallback: 'Failed to fetch sermons.' }));
      return;
    }
    setSermons(parseSermons(await response.json()));
  }, [headers, token]);

  useEffect(() => {
    if (!token) return;
    void fetchSermons();
    apiFetch('/api/site-content/sermons-header-image')
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (data.imageUrl) setHeaderImage(data.imageUrl);
      })
      .catch(() => undefined);
  }, [token, fetchSermons]);

  const upload = async (file: File) => {
    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
      setFormError('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }
    try {
      return await runUpload(file, 'sermons');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File upload failed.';
      setFormError(message);
      adminErrorToast(message);
      return null;
    }
  };

  const saveHeaderImage = async () => {
    const response = await apiFetch('/api/site-content/sermons-header-image', {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageUrl: headerImage }),
    });
    if (response.ok) adminSuccessToast('Header image updated.');
    else adminErrorToast('Failed to update header image.');
  };

  const openAdd = () => {
    setDraft({ ...EMPTY_DRAFT, date: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
    setNotifySubscribers(false);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (sermon: Sermon) => {
    setDraft({
      title: sermon.title,
      date: sermon.date.slice(0, 10),
      speaker: sermon.speaker,
      youtubeUrl: sermon.youtubeUrl,
      spotifyUrl: sermon.spotifyUrl,
      audioUrl: sermon.audioUrl,
      thumbnailUrl: sermon.thumbnailUrl,
      series: sermon.series,
      topic: sermon.topic,
      scripture: sermon.scripture,
      description: sermon.description,
      isActive: sermon.isActive,
      isFeatured: sermon.isFeatured,
    });
    setEditingId(sermon.id);
    setFormError('');
    setDialogOpen(true);
  };

  const save = async () => {
    if (!draft.title.trim() || !draft.date) {
      setFormError('Please fill in the title and date.');
      return;
    }
    if (draft.youtubeUrl.trim() && !getYouTubeId(draft.youtubeUrl)) {
      setFormError('That YouTube link is not recognised. Paste the link from the YouTube Share button.');
      return;
    }
    if (draft.spotifyUrl.trim() && !spotifyEmbedUrl(draft.spotifyUrl)) {
      setFormError('That Spotify link is not recognised. Use Share → Copy link on the episode in Spotify.');
      return;
    }
    if (!draft.youtubeUrl.trim() && !draft.spotifyUrl.trim() && !draft.audioUrl.trim()) {
      setFormError('Add a YouTube link, a Spotify link, or an audio file so people can watch or listen.');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      const isEdit = Boolean(editingId);
      const response = await apiFetch(isEdit ? `/api/sermons/${editingId}` : '/api/sermons', {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({
          ...draft,
          pastor: draft.speaker,
          videoUrl: draft.youtubeUrl.trim(),
          audioUrl: draft.audioUrl.trim(),
          spotifyUrl: draft.spotifyUrl.trim(),
        }),
      });
      if (!response.ok) {
        setFormError(response.status === 401 ? 'Your admin session expired. Please log in again.' : await readApiMessage(response, { fallback: 'Failed to save sermon.' }));
        return;
      }
      adminSuccessToast(isEdit ? 'Sermon updated.' : 'Sermon added.');
      setDialogOpen(false);
      void fetchSermons();

      if (!isEdit && notifySubscribers) {
        const notifyResponse = await apiFetch('/api/admin/notify-subscribers', {
          method: 'POST',
          headers,
          body: JSON.stringify({ sermonTitle: draft.title, sermonUrl: draft.youtubeUrl || `${window.location.origin}/sermons` }),
        }).catch(() => null);
        if (notifyResponse?.ok) adminSuccessToast('Subscribers notified.');
        else adminErrorToast('Sermon added, but subscribers could not be notified.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const setStatus = async (sermon: Sermon, body: { isActive?: boolean; isFeatured?: boolean }, message: string) => {
    setBusyId(sermon.id);
    try {
      const response = await apiFetch(`/api/sermons/${sermon.id}/status`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!response.ok) {
        adminErrorToast(await readApiMessage(response, { fallback: 'Unable to update sermon.' }));
        return;
      }
      adminSuccessToast(message);
      void fetchSermons();
    } finally {
      setBusyId(null);
    }
  };

  const remove = (sermon: Sermon) => {
    confirmDeleteToast({
      title: 'Delete this sermon?',
      description: sermon.title,
      onConfirm: async () => {
        const response = await apiFetch(`/api/sermons/${sermon.id}`, { method: 'DELETE', headers });
        if (response.ok) {
          adminSuccessToast('Sermon deleted.');
          void fetchSermons();
        } else {
          adminErrorToast('Failed to delete sermon.');
        }
      },
    });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sermons.filter((sermon) => {
      if (statusFilter === 'active' && !sermon.isActive) return false;
      if (statusFilter === 'inactive' && sermon.isActive) return false;
      return !term || `${sermon.title} ${sermon.speaker} ${sermon.series} ${sermon.date}`.toLowerCase().includes(term);
    });
  }, [sermons, search, statusFilter]);

  const totals = useMemo(() => ({
    views: sermons.reduce((sum, sermon) => sum + sermonViews(sermon), 0),
    listens: sermons.reduce((sum, sermon) => sum + sermon.siteListens, 0),
    active: sermons.filter((sermon) => sermon.isActive).length,
  }), [sermons]);

  if (!token) {
    return (
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  const youtubeId = getYouTubeId(draft.youtubeUrl);
  const spotifyEmbed = spotifyEmbedUrl(draft.spotifyUrl);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Sermon Management</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Post the YouTube link for the video and the Spotify link for the audio. The website plays both and counts every watch and listen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/admin/sermons/dashboard"><BarChart3 className="h-4 w-4" /> Analytics</Link>
          </Button>
          <Button type="button" onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add sermon
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Sermons', value: sermons.length },
          { label: 'Live on website', value: totals.active },
          { label: 'Total views', value: totals.views },
          { label: 'Website listens', value: totals.listens },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border/60 bg-card px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/50">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="h-24 w-full shrink-0 rounded-xl border border-border/60 bg-cover bg-center sm:w-48" style={{ backgroundImage: `url(${sermonThumbnail({ thumbnailUrl: headerImage, youtubeUrl: '' })})` }} />
        <div className="flex-1">
          <h2 className="font-semibold">Page header picture</h2>
          <p className="text-sm text-foreground/60">Shown behind the player when a sermon has no thumbnail.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
              <ImagePlus className="h-4 w-4" /> Choose picture
              <input
                type="file"
                accept="image/*,.heic,.heif,.avif"
                className="hidden"
                onChange={async (event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = '';
                  if (!file) return;
                  const url = await upload(file);
                  if (url) setHeaderImage(url);
                }}
              />
            </label>
            <Button variant="outline" size="sm" onClick={() => void saveHeaderImage()}>Save picture</Button>
          </div>
        </div>
      </section>
      <MediaUploadProgress uploading={uploading} progress={progress} />

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, speaker, series or date..."
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex gap-1 rounded-xl border border-border p-1">
            {(['all', 'active', 'inactive'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold capitalize', statusFilter === value ? 'bg-primary text-primary-foreground' : 'text-foreground/60')}
              >
                {value === 'inactive' ? 'Deactivated' : value}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/60">{sermons.length ? 'No sermons match your filters.' : 'No sermons yet.'}</p>
        ) : (
          <div className="max-h-[680px] overflow-auto rounded-xl border border-border/70">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-muted text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-3 py-2 font-medium">Sermon</th>
                  <th className="px-3 py-2 font-medium">Media</th>
                  <th className="px-3 py-2 font-medium">Views</th>
                  <th className="px-3 py-2 font-medium">Listens</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sermon) => (
                  <tr key={sermon.id} className={cn('border-t border-border/60', !sermon.isActive && 'bg-muted/40 text-foreground/55')}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <img src={sermonThumbnail(sermon)} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
                        <div>
                          <p className="font-medium">{sermon.title}</p>
                          <p className="text-xs text-foreground/55">{formatSermonDate(sermon.date, 'short')}{sermon.speaker ? ` · ${sermon.speaker}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1.5 text-foreground/60">
                        {sermon.youtubeUrl ? <Video className="h-4 w-4" aria-label="YouTube video" /> : null}
                        {sermon.spotifyUrl || sermon.audioUrl ? <Headphones className="h-4 w-4" aria-label="Audio" /> : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2" title={`YouTube ${sermon.youtubeViews ?? 0} + website ${sermon.siteViews}`}>
                      <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{compactNumber(sermonViews(sermon))}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{compactNumber(sermon.siteListens)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {sermon.isActive ? <Badge className="bg-emerald-600 hover:bg-emerald-600">Live</Badge> : <Badge variant="outline">Deactivated</Badge>}
                        {sermon.isFeatured ? <Badge className="bg-amber-500 hover:bg-amber-500">Featured</Badge> : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={busyId === sermon.id}
                          title={sermon.isFeatured ? 'Stop featuring' : 'Feature at the top of the sermons page'}
                          aria-label="Toggle featured"
                          onClick={() => void setStatus(sermon, { isFeatured: !sermon.isFeatured }, sermon.isFeatured ? 'No longer featured.' : 'Featured on the sermons page.')}
                        >
                          <Star className={cn('h-4 w-4', sermon.isFeatured && 'fill-amber-500 text-amber-500')} />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={busyId === sermon.id}
                          title={sermon.isActive ? 'Deactivate' : 'Activate'}
                          aria-label={sermon.isActive ? 'Deactivate' : 'Activate'}
                          onClick={() => void setStatus(sermon, { isActive: !sermon.isActive }, sermon.isActive ? 'Sermon hidden from the website.' : 'Sermon is live.')}
                        >
                          {sermon.isActive ? <Power className="h-4 w-4 text-emerald-600" /> : <PowerOff className="h-4 w-4" />}
                        </Button>
                        <Button type="button" size="icon" variant="ghost" aria-label="Edit sermon" onClick={() => openEdit(sermon)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Delete sermon" onClick={() => remove(sermon)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? 'Edit sermon' : 'Add sermon'}
        description="Paste the YouTube and Spotify links. Both play on the sermons page."
        saving={isSaving || uploading}
        saveLabel={editingId ? 'Save changes' : 'Add sermon'}
        onSave={() => void save()}
        onCancel={() => setDialogOpen(false)}
        maxWidthClass="sm:max-w-3xl"
      >
        <div className="space-y-4">
          {formError ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p> : null}
          <label className="block">
            <span className="text-sm font-medium">Title *</span>
            <input value={draft.title} onChange={(event) => set('title', event.target.value)} className={inputClass} placeholder="Sermon title" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Speaker / Pastor</span>
              <input value={draft.speaker} onChange={(event) => set('speaker', event.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Date *</span>
              <input type="date" value={draft.date} onChange={(event) => set('date', event.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Series</span>
              <input value={draft.series} onChange={(event) => set('series', event.target.value)} className={inputClass} placeholder="Optional" list="sermon-series" />
              <datalist id="sermon-series">
                {Array.from(new Set(sermons.map((sermon) => sermon.series).filter(Boolean))).map((entry) => <option key={entry} value={entry} />)}
              </datalist>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Scripture</span>
              <input value={draft.scripture} onChange={(event) => set('scripture', event.target.value)} className={inputClass} placeholder="e.g. Hebrews 11:1-6" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Topic</span>
              <input value={draft.topic} onChange={(event) => set('topic', event.target.value)} className={inputClass} placeholder="e.g. Faith, Healing, Prayer" />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium">Summary</span>
            <textarea value={draft.description} onChange={(event) => set('description', event.target.value)} rows={3} className={inputClass} />
          </label>

          <div className="rounded-2xl border border-border/70 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><Video className="h-4 w-4 text-red-600" /> YouTube video</p>
            <input value={draft.youtubeUrl} onChange={(event) => set('youtubeUrl', event.target.value.trim())} className={inputClass} placeholder="https://www.youtube.com/watch?v=…" />
            {youtubeId ? (
              <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="YouTube preview" className="mt-3 aspect-video w-full max-w-xs rounded-lg object-cover" />
            ) : draft.youtubeUrl ? (
              <p className="mt-2 text-xs text-destructive">This does not look like a YouTube video link.</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/70 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><Headphones className="h-4 w-4 text-emerald-600" /> Spotify audio</p>
            <input value={draft.spotifyUrl} onChange={(event) => set('spotifyUrl', event.target.value.trim())} className={inputClass} placeholder="https://open.spotify.com/episode/…" />
            {spotifyEmbed ? (
              <iframe src={spotifyEmbed} title="Spotify preview" className="mt-3 h-[152px] w-full rounded-xl border-0" loading="lazy" allow="encrypted-media" />
            ) : draft.spotifyUrl ? (
              <p className="mt-2 text-xs text-destructive">This does not look like a Spotify link.</p>
            ) : null}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-xs font-semibold text-foreground/60">No Spotify link? Use an audio file instead</summary>
              <div className="mt-2 space-y-2">
                <input value={draft.audioUrl} onChange={(event) => set('audioUrl', event.target.value.trim())} className={inputClass} placeholder="Link to an MP3, or upload below" />
                <input
                  type="file"
                  accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac"
                  onChange={async (event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = '';
                    if (!file) return;
                    const url = await upload(file);
                    if (url) set('audioUrl', url);
                  }}
                  className="block w-full text-xs text-foreground/70 file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
                />
              </div>
            </details>
          </div>

          <div className="rounded-2xl border border-border/70 p-4">
            <p className="text-sm font-semibold">Thumbnail <span className="font-normal text-foreground/50">(optional, the YouTube picture is used otherwise)</span></p>
            <div className="mt-2 flex items-center gap-3">
              {draft.thumbnailUrl || youtubeId ? (
                <img src={sermonThumbnail({ thumbnailUrl: draft.thumbnailUrl, youtubeUrl: draft.youtubeUrl })} alt="" className="h-16 w-28 rounded-lg object-cover" />
              ) : null}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
                <ImagePlus className="h-4 w-4" /> Upload thumbnail
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.avif"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = '';
                    if (!file) return;
                    const url = await upload(file);
                    if (url) set('thumbnailUrl', url);
                  }}
                />
              </label>
              {draft.thumbnailUrl ? (
                <button type="button" onClick={() => set('thumbnailUrl', '')} className="text-xs font-semibold text-destructive">Remove</button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 rounded-xl bg-muted/30 px-4 py-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => set('isActive', event.target.checked)} /> Active on the website
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.isFeatured} onChange={(event) => set('isFeatured', event.target.checked)} /> Feature at the top
            </label>
          </div>

          {!editingId ? (
            <div className="flex items-center space-x-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <Checkbox id="notify-subscribers" checked={notifySubscribers} onCheckedChange={(checked) => setNotifySubscribers(checked === true)} />
              <Label htmlFor="notify-subscribers" className="cursor-pointer text-sm font-semibold">Notify subscribers about this new sermon</Label>
            </div>
          ) : null}
        </div>
      </SchoolAdminDialogShell>
    </div>
  );
}
