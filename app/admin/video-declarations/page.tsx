'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { SchoolAdminDialogShell } from '@/components/admin/school-admin-dialog-shell';
import { Pencil, Plus, Trash2 } from 'lucide-react';

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
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState<DeclarationContent>(EMPTY_CONTENT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [declarationSearch, setDeclarationSearch] = useState('');
  const [uploadName, setUploadName] = useState('');
  const { runUploadWithKind, progress, uploading: isUploading } = useMediaUpload();
  const [isSaving, setIsSaving] = useState(false);
  const [archive, setArchive] = useState<DeclarationRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    if (!token) return;
    const id = setTimeout(() => {
      void loadArchive();
    }, 0);
    return () => clearTimeout(id);
  }, [token]);

  const clearDeclarationSelection = () => {
    setDraft(EMPTY_CONTENT);
    setSelectedId(null);
    setUploadName('');
  };

  const closeDeclarationDialog = () => {
    setDialogOpen(false);
    clearDeclarationSelection();
  };

  const openAddDialog = () => {
    clearDeclarationSelection();
    setStatus('');
    setDialogOpen(true);
  };

  const openEditDialog = (declaration: DeclarationRecord) => {
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
    setDialogOpen(true);
  };

  const uploadMedia = async (file: File) => {
    setStatus('');

    try {
      const result = await runUploadWithKind(file, 'media');
      const url = result.url.startsWith('http') ? result.url : apiUrl(result.url);
      return { url, kind: result.kind } as const;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Media upload failed.');
      return null;
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

      setUploadName('');
      setStatus(hasExistingDeclaration ? 'Video declaration saved.' : 'Video declaration posted.');
      setDialogOpen(false);
      clearDeclarationSelection();
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

      setDialogOpen(false);
      clearDeclarationSelection();
      setStatus('Video declaration deleted.');
      await loadArchive();
    } catch {
      setStatus('Unable to delete video declaration.');
    } finally {
      setIsSaving(false);
    }
  };

  const requestDeleteConfirmation = (declaration?: DeclarationRecord) => {
    const id = declaration?.id ?? selectedId;
    if (!id) return;
    const title = declaration?.title ?? draft.title;
    confirmDeleteToast({
      title: 'Delete this video declaration?',
      description: title || 'This declaration will be removed from the public archive.',
      onConfirm: async () => {
        if (declaration) setSelectedId(declaration.id);
        await deleteDeclaration();
      },
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
        <Button type="button" onClick={openAddDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New declaration
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <SchoolAdminDialogShell
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) clearDeclarationSelection();
        }}
        title={hasExistingDeclaration ? 'Edit declaration' : 'New declaration'}
        description="New posts become the homepage declaration and are added to the archive."
        saving={isSaving || isUploading}
        saveLabel={hasExistingDeclaration ? 'Save declaration' : 'Post declaration'}
        onSave={() => void saveDeclaration()}
        onCancel={closeDeclarationDialog}
        maxWidthClass="sm:max-w-2xl"
      >
          <div className="space-y-5">
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
              <MediaUploadProgress uploading={isUploading} progress={progress} className="mt-2" />
              {draft.mediaUrl && (
                <p className="break-all rounded-xl bg-muted px-3 py-2 text-xs text-foreground/60">
                  Current file: {draft.mediaUrl}
                </p>
              )}
            </div>
          )}

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
      </SchoolAdminDialogShell>

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
            <div className="max-h-[720px] overflow-auto rounded-xl border border-border/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-foreground/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Title</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Placement</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArchive.map((declaration, index) => (
                    <tr key={declaration.id} className="border-t border-border/60 align-top">
                      <td className="px-3 py-2">
                        <p className="font-medium text-foreground">{declaration.title || 'Untitled declaration'}</p>
                        <p className="mt-1 line-clamp-1 text-foreground/60">{declaration.subtitle || FALLBACK_SUBTITLE}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-foreground/70">
                        {declaration.createdAt ? formatDate(declaration.createdAt) : 'No date'}
                      </td>
                      <td className="px-3 py-2 text-foreground/70">{index === 0 ? 'Homepage' : 'Archive'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${declaration.title || 'declaration'}`}
                            onClick={() => openEditDialog(declaration)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            aria-label={`Delete ${declaration.title || 'declaration'}`}
                            onClick={() => requestDeleteConfirmation(declaration)}
                          >
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
    </div>
  );
}
