import { isValidYouTubeVideoId } from '@/lib/youtube-client';

/** Browser-safe title lookup via Next.js (oEmbed + optional Data API on server). */
export async function fetchYouTubeVideoTitleFromApp(
  videoId: string,
): Promise<string | null> {
  if (!isValidYouTubeVideoId(videoId)) return null;
  try {
    const response = await fetch(
      `/api/youtube/video-title?videoId=${encodeURIComponent(videoId)}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { title?: string };
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    return title || null;
  } catch {
    return null;
  }
}
