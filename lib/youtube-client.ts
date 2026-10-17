/** Placeholder titles we must not store or show when a real YouTube title exists. */
export const GENERIC_LIVE_CHAT_TITLES = new Set([
  'Sunday Livestream',
  'Sunday livestream',
  'Youth Church Live',
  'Women of Hope Live',
  'Men of Valour Live',
  'Wailing Woman Live',
  'ICD Live',
  'Crusade Live',
  'Live Broadcast',
  'Stream in English',
  'Watch live',
]);

export function isGenericLiveChatTitle(title?: string | null): boolean {
  const trimmed = title?.trim();
  if (!trimmed) return true;
  return GENERIC_LIVE_CHAT_TITLES.has(trimmed);
}

export function pickYouTubeVideoTitle(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed && !isGenericLiveChatTitle(trimmed)) {
      return trimmed;
    }
  }
  return undefined;
}

export async function fetchYouTubeVideoTitles(
  videoIds: string[],
  apiKey: string,
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const unique = [...new Set(videoIds.filter((id) => id && id !== 'legacy'))];
  if (!apiKey || unique.length === 0) return resolved;

  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('id', batch.join(','));
      url.searchParams.set('key', apiKey);
      const res = await fetch(url.toString());
      if (!res.ok) continue;
      const data = (await res.json().catch(() => null)) as {
        items?: Array<{ id?: string; snippet?: { title?: string } }>;
      };
      const items = Array.isArray(data?.items) ? data.items : [];
      for (const item of items) {
        const id = typeof item?.id === 'string' ? item.id : null;
        const title = typeof item?.snippet?.title === 'string' ? item.snippet.title.trim() : '';
        if (id && title) resolved.set(id, title);
      }
    } catch {
      // ignore batch failures
    }
  }

  return resolved;
}

export async function fetchYouTubeVideoTitle(
  videoId: string,
  apiKey: string,
): Promise<string | null> {
  const map = await fetchYouTubeVideoTitles([videoId], apiKey);
  return map.get(videoId) ?? null;
}

/** Public oEmbed endpoint — no API key; safe to call from the server. */
export async function fetchYouTubeTitleViaOEmbed(videoId: string): Promise<string | null> {
  const trimmed = videoId.trim();
  if (!trimmed || trimmed === 'legacy') return null;
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(trimmed)}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
    const response = await fetch(oembedUrl, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const data = (await response.json()) as { title?: string };
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    return title || null;
  } catch {
    return null;
  }
}

export async function resolveYouTubeVideoTitle(
  videoId: string,
  apiKey?: string,
): Promise<string | null> {
  if (apiKey) {
    const fromDataApi = await fetchYouTubeVideoTitle(videoId, apiKey);
    if (fromDataApi && !isGenericLiveChatTitle(fromDataApi)) {
      return fromDataApi;
    }
  }
  const fromOEmbed = await fetchYouTubeTitleViaOEmbed(videoId);
  if (fromOEmbed && !isGenericLiveChatTitle(fromOEmbed)) {
    return fromOEmbed;
  }
  return null;
}

const YOUTUBE_VIDEO_ID_RE = /^[\w-]{11}$/;

export function isValidYouTubeVideoId(videoId: string | null | undefined): videoId is string {
  return Boolean(videoId && YOUTUBE_VIDEO_ID_RE.test(videoId));
}
