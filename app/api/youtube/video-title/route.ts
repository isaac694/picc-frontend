import { isValidYouTubeVideoId, resolveYouTubeVideoTitle } from '@/lib/youtube-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const videoId = new URL(request.url).searchParams.get('videoId')?.trim();
  if (!isValidYouTubeVideoId(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 });
  }

  const apiKey =
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY?.trim() ||
    process.env.YOUTUBE_API_KEY?.trim() ||
    '';

  const title = await resolveYouTubeVideoTitle(videoId, apiKey || undefined);
  if (!title) {
    return NextResponse.json({ error: 'Title not found' }, { status: 404 });
  }

  return NextResponse.json({ videoId, title });
}
