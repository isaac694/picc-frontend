'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';

const FALLBACK_TITLE = "Listen to God's Word for You.";
const FALLBACK_SUBTITLE = 'Video Declaration';
const FALLBACK_IMAGE = '/hero/hero-15.png';

type DeclarationSource = 'youtube' | 'upload';
type DeclarationMediaKind = 'video' | 'audio';

type DeclarationContent = {
  source: DeclarationSource;
  title: string;
  subtitle: string;
  mediaUrl: string;
  mediaKind: DeclarationMediaKind;
};

type DeclarationRecord = DeclarationContent & {
  id: string;
  createdAt: string;
  updatedAt?: string;
  isActive?: boolean;
};

const EMPTY_CONTENT: DeclarationContent = {
  source: 'youtube',
  title: '',
  subtitle: FALLBACK_SUBTITLE,
  mediaUrl: '',
  mediaKind: 'video',
};

const normalizeMediaUrl = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const getYouTubeEmbedUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace(/^\/+/, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return trimmed;
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
  } catch {
    return '';
  }

  return '';
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

export default function VideoDeclarationsAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState<DeclarationContent>(EMPTY_CONTENT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [declarationSearch, setDeclarationSearch] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [archive, setArchive] = useState<DeclarationRecord[]>([]);

  const hasExistingDeclaration = Boolean(selectedId);
  const youtubeEmbedUrl = useMemo(
    () => (draft.source === 'youtube' ? getYouTubeEmbedUrl(draft.mediaUrl) : ''),
    [draft.mediaUrl, draft.source],
  );

  const loadArchive = async () => {
    if (!token) return;

    try {
      const response = await apiFetch('/api/admin/video-declarations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setStatus('Unable to load video declarations.');
        return;
      }

      const data = await response.json().catch(() => null);
      setArchive(Array.isArray(data?.declarations) ? data.declarations : []);
    } catch {
      setStatus('Unable to load video declarations.');
    }
  };

  useEffect(() => {
    void loadArchive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const startNewDeclaration = () => {
    setDraft(EMPTY_CONTENT);
    setSelectedId(null);
    setUploadName('');
    setStatus('');
  };

  const selectDeclaration = (declaration: DeclarationRecord) => {
    setSelectedId(declaration.id);
    setDraft({
      source: declaration.source === 'upload' ? 'upload' : 'youtube',
      title: declaration.title || '',
      subtitle: declaration.subtitle || FALLBACK_SUBTITLE,
      mediaUrl: normalizeMediaUrl(declaration.mediaUrl),
      mediaKind: declaration.mediaKind === 'audio' ? 'audio' : 'video',
    });
    setUploadName('');
    setStatus('');
  };

  const uploadMedia = async (file: File) => {
    if (!token) return null;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    setStatus('');

    try {
      const response = await apiFetch('/api/uploads/media', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus(typeof data?.error === 'string' ? data.error : 'Media upload failed.');
        return null;
      }

      const rawUrl = typeof data?.url === 'string' ? data.url : '';
      if (!rawUrl) {
        setStatus('Media upload failed.');
        return null;
      }

      return {
        url: apiUrl(rawUrl),
        kind: data?.kind === 'audio' || file.type.startsWith('audio/') ? 'audio' : 'video',
      } as const;
    } catch {
      setStatus('Media upload failed.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const saveDeclaration = async () => {
    if (!token) return;
    if (!draft.mediaUrl.trim()) {
      setStatus('Please add a YouTube link or upload a media file before posting.');
      return;
    }
    if (draft.source === 'youtube' && !youtubeEmbedUrl) {
      setStatus('Please enter a valid YouTube link.');
      return;
    }

    setIsSaving(true);
    setStatus('');

    try {
      const payload: DeclarationContent = {
        ...draft,
        title: draft.title.trim() || FALLBACK_TITLE,
        subtitle: draft.subtitle.trim() || FALLBACK_SUBTITLE,
        mediaUrl: draft.mediaUrl.trim(),
      };

      const response = await apiFetch(
        hasExistingDeclaration ? `/api/video-declarations/${selectedId}` : '/api/video-declarations',
        {
          method: hasExistingDeclaration ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        setStatus('Unable to save video declaration.');
        return;
      }

      const data = await response.json().catch(() => null);
      const saved = data?.declaration as DeclarationRecord | undefined;
      if (saved?.id) {
        setSelectedId(saved.id);
        setDraft({
          source: saved.source,
          title: saved.title,
          subtitle: saved.subtitle || FALLBACK_SUBTITLE,
          mediaUrl: normalizeMediaUrl(saved.mediaUrl),
          mediaKind: saved.mediaKind,
        });
      } else {
        setDraft(payload);
      }

      setUploadName('');
      setStatus(hasExistingDeclaration ? 'Video declaration saved.' : 'Video declaration posted.');
      await loadArchive();
    } catch {
      setStatus('Unable to save video declaration.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDeclaration = async () => {
    if (!token || !selectedId) return;

    setIsSaving(true);
    setStatus('');

    try {
      const response = await apiFetch(`/api/video-declarations/${selectedId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setStatus('Unable to delete video declaration.');
        return;
      }

      startNewDeclaration();
      setStatus('Video declaration deleted.');
      await loadArchive();
    } catch {
      setStatus('Unable to delete video declaration.');
    } finally {
      setIsSaving(false);
    }
  };

  const requestDeleteConfirmation = () => {
    if (!selectedId) return;
    confirmDeleteToast({
      title: 'Delete this video declaration?',
      description: draft.title || 'This declaration will be removed from the public archive.',
      onConfirm: deleteDeclaration,
    });
  };

  const filteredArchive = useMemo(() => {
    const query = declarationSearch.trim().toLowerCase();
    if (!query) return archive;

    return archive.filter((item) => {
      const date = item.createdAt ? item.createdAt.slice(0, 10) : '';
      return (
        item.title.toLowerCase().includes(query) ||
        (item.subtitle || '').toLowerCase().includes(query) ||
        date.includes(query)
      );
    });
  }, [archive, declarationSearch]);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Video Declarations</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Post declarations for the homepage and public video declarations archive.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={startNewDeclaration}>New Declaration</Button>
          <Button variant="outline" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {hasExistingDeclaration ? 'Edit Declaration' : 'New Declaration'}
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              New posts become the homepage declaration and are added to the archive.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-background p-1">
            {(['youtube', 'upload'] as const).map((source) => (
              <button
                key={source}
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    source,
                    mediaUrl: source === prev.source ? prev.mediaUrl : '',
                    mediaKind: 'video',
                  }))
                }
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  draft.source === source ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'
                }`}
              >
                {source === 'youtube' ? 'YouTube Link' : 'Upload File'}
              </button>
            ))}
          </div>

          <div>
            <Label htmlFor="declaration-title">Title</Label>
            <Input
              id="declaration-title"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder={FALLBACK_TITLE}
              className="rounded-xl border-border bg-background px-4 py-3"
            />
          </div>

          <div>
            <Label htmlFor="declaration-subtitle">Label</Label>
            <Input
              id="declaration-subtitle"
              value={draft.subtitle}
              onChange={(event) => setDraft((prev) => ({ ...prev, subtitle: event.target.value }))}
              placeholder={FALLBACK_SUBTITLE}
              className="rounded-xl border-border bg-background px-4 py-3"
            />
          </div>

          {draft.source === 'youtube' ? (
            <div>
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                value={draft.mediaUrl}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, mediaUrl: event.target.value, mediaKind: 'video' }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
                className="rounded-xl border-border bg-background px-4 py-3"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="declaration-upload">Upload video or audio</Label>
              <input
                id="declaration-upload"
                type="file"
                accept="video/*,audio/*,.mp3,.m4a,.aac,.wav,.flac,.ogg,.oga,.opus,.wma,.mp4,.m4v,.mov,.webm,.ogv,.avi,.wmv,.mkv,.mpeg,.mpg,.3gp,.3g2"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = '';
                  if (!file) return;
                  setUploadName(file.name);
                  const uploaded = await uploadMedia(file);
                  if (!uploaded) return;
                  setDraft((prev) => ({
                    ...prev,
                    source: 'upload',
                    mediaUrl: uploaded.url,
                    mediaKind: uploaded.kind,
                  }));
                }}
                className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
              />
              {uploadName && (
                <p className="text-xs text-foreground/60">
                  {isUploading ? 'Uploading' : 'Selected'}: {uploadName}
                </p>
              )}
              {draft.mediaUrl && (
                <p className="break-all rounded-xl bg-muted px-3 py-2 text-xs text-foreground/60">
                  Current file: {draft.mediaUrl}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={saveDeclaration} disabled={isSaving || isUploading}>
              {isSaving ? 'Saving...' : hasExistingDeclaration ? 'Save Declaration' : 'Post Declaration'}
            </Button>
            <Button variant="outline" onClick={startNewDeclaration} disabled={isSaving || isUploading}>
              Clear Form
            </Button>
            <Button
              variant="destructive"
              onClick={requestDeleteConfirmation}
              disabled={isSaving || isUploading || !hasExistingDeclaration}
            >
              Delete
            </Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Preview</h3>
            <div className="relative min-h-[280px] overflow-hidden rounded-xl bg-black sm:min-h-[360px]">
              {draft.source === 'youtube' && youtubeEmbedUrl ? (
                <iframe
                  src={youtubeEmbedUrl}
                  title={draft.title || 'Video declaration'}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : draft.source === 'upload' && draft.mediaUrl && draft.mediaKind === 'video' ? (
                <video src={draft.mediaUrl} controls className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${FALLBACK_IMAGE})` }} />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
              <div className="pointer-events-none relative p-6 text-white md:p-8">
                <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/70">
                  {draft.subtitle || FALLBACK_SUBTITLE}
                </p>
                <h3 className="max-w-2xl text-2xl font-semibold leading-tight md:text-4xl">
                  {draft.title || FALLBACK_TITLE}
                </h3>
              </div>
              {draft.source === 'upload' && draft.mediaUrl && draft.mediaKind === 'audio' && (
                <div className="absolute inset-x-6 bottom-6">
                  <audio src={draft.mediaUrl} controls className="w-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Declarations</h2>

          <div className="mb-4">
            <input
              type="search"
              value={declarationSearch}
              onChange={(event) => setDeclarationSearch(event.target.value)}
              placeholder="Search by title, label, or date..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40"
            />
          </div>

          {archive.length === 0 ? (
            <p className="text-sm text-foreground/60">No video declarations yet.</p>
          ) : filteredArchive.length === 0 ? (
            <p className="text-sm text-foreground/60">No declarations match your search.</p>
          ) : (
            <div className="max-h-[720px] space-y-3 overflow-y-auto pr-2">
              {filteredArchive.map((declaration, index) => (
                <button
                  key={declaration.id}
                  type="button"
                  onClick={() => selectDeclaration(declaration)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    selectedId === declaration.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 bg-background hover:border-primary/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {declaration.title || 'Untitled declaration'}
                    </p>
                    {index === 0 ? (
                      <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                        Homepage
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-foreground/50">
                    {declaration.createdAt ? formatDate(declaration.createdAt) : 'No date'}
                  </p>
                  <p className="mt-2 text-xs text-foreground/60">{declaration.subtitle || FALLBACK_SUBTITLE}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
