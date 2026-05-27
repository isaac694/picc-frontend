'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const CONTENT_KEY = 'home-video-declaration';
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

const EMPTY_CONTENT: DeclarationContent = {
  source: 'youtube',
  title: FALLBACK_TITLE,
  subtitle: FALLBACK_SUBTITLE,
  mediaUrl: '',
  mediaKind: 'video',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const youtubeEmbedUrl = useMemo(
    () => (draft.source === 'youtube' ? getYouTubeEmbedUrl(draft.mediaUrl) : ''),
    [draft.mediaUrl, draft.source],
  );

  useEffect(() => {
    if (!token) return;

    const loadContent = async () => {
      try {
        const response = await apiFetch(`/api/site-content/${CONTENT_KEY}`);
        if (!response.ok) return;
        const data = (await response.json().catch(() => null)) as unknown;
        const body = isRecord(data) && typeof data.body === 'string' ? data.body : '';
        const parsed = body ? (JSON.parse(body) as unknown) : null;
        if (!isRecord(parsed)) return;

        const source = parsed.source === 'upload' ? 'upload' : 'youtube';
        const mediaKind = parsed.mediaKind === 'audio' ? 'audio' : 'video';

        setDraft({
          source,
          title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : FALLBACK_TITLE,
          subtitle: typeof parsed.subtitle === 'string' && parsed.subtitle.trim() ? parsed.subtitle : FALLBACK_SUBTITLE,
          mediaUrl: normalizeMediaUrl(typeof parsed.mediaUrl === 'string' ? parsed.mediaUrl : ''),
          mediaKind,
        });
      } catch {
        setStatus('Unable to load video declaration settings.');
      }
    };

    void loadContent();
  }, [token]);

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
      setStatus('Please add a YouTube link or upload a media file before saving.');
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

      const response = await apiFetch(`/api/site-content/${CONTENT_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: payload.title,
          subtitle: payload.subtitle,
          body: JSON.stringify(payload),
        }),
      });

      if (!response.ok) {
        setStatus('Unable to save video declaration.');
        return;
      }

      setDraft(payload);
      setUploadName('');
      setStatus('Video declaration saved.');
    } catch {
      setStatus('Unable to save video declaration.');
    } finally {
      setIsSaving(false);
    }
  };

  const clearDeclaration = () => {
    setDraft(EMPTY_CONTENT);
    setUploadName('');
    setStatus('');
  };

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">Admin</p>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">Video Declarations</h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Publish the media declaration shown in the homepage feature card.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Declaration Media</h2>
            <p className="text-sm text-foreground/60 mt-1">
              Add a YouTube link or upload a video/audio file.
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
                  draft.source === source
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/70 hover:bg-muted'
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

          <div className="flex flex-wrap gap-3">
            <Button onClick={saveDeclaration} disabled={isSaving || isUploading}>
              {isSaving ? 'Saving...' : 'Save Declaration'}
            </Button>
            <Button variant="outline" onClick={clearDeclaration} disabled={isSaving || isUploading}>
              Clear Form
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Homepage Preview</h2>
            <p className="text-sm text-foreground/60 mt-1">
              Same card size and media treatment used on the public homepage.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-black min-h-[360px] sm:min-h-[440px] md:min-h-[560px]">
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
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${FALLBACK_IMAGE})` }}
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
            <div className="pointer-events-none relative p-8 md:p-12 lg:p-14 text-white">
              <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4">
                {draft.subtitle || FALLBACK_SUBTITLE}
              </p>
              <h3 className="text-3xl md:text-5xl font-semibold leading-tight max-w-2xl">
                {draft.title || FALLBACK_TITLE}
              </h3>
            </div>
            {draft.source === 'upload' && draft.mediaUrl && draft.mediaKind === 'audio' && (
              <div className="absolute inset-x-8 bottom-8">
                <audio src={draft.mediaUrl} controls className="w-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
