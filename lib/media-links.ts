/** Helpers for YouTube and Spotify links pasted by admins. */

export function getYouTubeId(url?: string | null): string {
  if (!url) return '';
  const match = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : '';
}

export function getYouTubeStart(url?: string | null): number {
  if (!url) return 0;
  const match = String(url).match(/[?&](?:t|start)=(\d+)s?/);
  return match ? parseInt(match[1], 10) : 0;
}

export function youTubeEmbedUrl(url: string, { autoplay = false } = {}): string {
  const id = getYouTubeId(url);
  if (!id) return '';
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
  if (autoplay) params.set('autoplay', '1');
  const start = getYouTubeStart(url);
  if (start > 0) params.set('start', String(start));
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function youTubeThumbnail(url?: string | null): string {
  const id = getYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

/**
 * Turns an open.spotify.com link (episode, track, show, album, playlist) or a spotify: URI into
 * the embeddable player URL. Returns '' for anything that is not a Spotify link.
 */
export function spotifyEmbedUrl(url?: string | null): string {
  const value = String(url || '').trim();
  if (!value) return '';
  const uri = value.match(/^spotify:(episode|track|show|album|playlist|artist):([A-Za-z0-9]+)/);
  if (uri) return `https://open.spotify.com/embed/${uri[1]}/${uri[2]}`;
  try {
    const parsed = new URL(value);
    if (!parsed.hostname.endsWith('spotify.com')) return '';
    const parts = parsed.pathname.split('/').filter(Boolean).filter((part) => !part.startsWith('intl-') && part !== 'embed');
    const typeIndex = parts.findIndex((part) => ['episode', 'track', 'show', 'album', 'playlist', 'artist'].includes(part));
    if (typeIndex < 0 || !parts[typeIndex + 1]) return '';
    return `https://open.spotify.com/embed/${parts[typeIndex]}/${parts[typeIndex + 1]}`;
  } catch {
    return '';
  }
}

export function isSpotifyUrl(url?: string | null) {
  return Boolean(spotifyEmbedUrl(url));
}
