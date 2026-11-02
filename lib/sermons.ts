import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import { getYouTubeId, youTubeThumbnail } from '@/lib/media-links';

export type Sermon = {
  id: string;
  title: string;
  date: string;
  speaker: string;
  description: string;
  youtubeUrl: string;
  spotifyUrl: string;
  audioUrl: string;
  thumbnailUrl: string;
  series: string;
  topic: string;
  scripture: string;
  isActive: boolean;
  isFeatured: boolean;
  siteViews: number;
  siteListens: number;
  youtubeViews: number | null;
  youtubeLikes: number | null;
};

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const count = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export function parseSermon(value: unknown): Sermon | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'string' || typeof record.id === 'number' ? String(record.id) : '';
  if (!id) return null;
  return {
    id,
    title: text(record.title) || 'Untitled sermon',
    date: text(record.date),
    speaker: text(record.speaker) || text(record.pastor),
    description: text(record.description),
    youtubeUrl: text(record.youtubeUrl) || text(record.videoUrl),
    spotifyUrl: text(record.spotifyUrl),
    audioUrl: text(record.audioSrc) || text(record.audioUrl),
    thumbnailUrl: text(record.thumbnailUrl) || text(record.image),
    series: text(record.series),
    topic: text(record.topic),
    scripture: text(record.scripture),
    isActive: record.isActive !== false,
    isFeatured: record.isFeatured === true,
    siteViews: count(record.siteViews),
    siteListens: count(record.siteListens),
    youtubeViews: typeof record.youtubeViews === 'number' ? record.youtubeViews : null,
    youtubeLikes: typeof record.youtubeLikes === 'number' ? record.youtubeLikes : null,
  };
}

export function parseSermons(data: unknown): Sermon[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { sermons?: unknown[] }).sermons)
      ? (data as { sermons: unknown[] }).sermons
      : [];
  return list.map(parseSermon).filter((sermon): sermon is Sermon => Boolean(sermon));
}

export function sermonThumbnail(sermon: Pick<Sermon, 'thumbnailUrl' | 'youtubeUrl'>, fallback = '/sermons/header.JPG') {
  return resolveMediaImageUrl(sermon.thumbnailUrl) || youTubeThumbnail(sermon.youtubeUrl) || fallback;
}

export function hasVideo(sermon: Pick<Sermon, 'youtubeUrl'>) {
  return Boolean(getYouTubeId(sermon.youtubeUrl));
}

export function hasAudio(sermon: Pick<Sermon, 'spotifyUrl' | 'audioUrl'>) {
  return Boolean(sermon.spotifyUrl || sermon.audioUrl);
}

/** People reached: YouTube views plus plays and listens on this website. */
export function sermonViews(sermon: Pick<Sermon, 'youtubeViews' | 'siteViews'>) {
  return Number(sermon.youtubeViews || 0) + sermon.siteViews;
}

export function formatSermonDate(value: string, style: 'long' | 'short' = 'long') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', style === 'long'
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** Counts one watch or listen per sermon per browser session. */
export function trackSermonPlay(sermonId: string, kind: 'watch' | 'listen') {
  if (!sermonId || sermonId.startsWith('sample-')) return;
  try {
    const key = `picc-sermon-${kind}:${sermonId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // Storage blocked: still count it.
  }
  void apiFetch(`/api/sermons/${encodeURIComponent(sermonId)}/play`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind }),
  }).catch(() => undefined);
}
