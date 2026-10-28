import { NextResponse } from 'next/server';
import {
  fetchPastorEsauStreams,
  PASTOR_ESAU_CHANNEL_ID,
  PASTOR_ESAU_STREAMS_URL,
} from '@/lib/pastor-esau-streams';

export const revalidate = 60;

export async function GET() {
  try {
    const videos = await fetchPastorEsauStreams();
    return NextResponse.json({
      channelId: PASTOR_ESAU_CHANNEL_ID,
      channelTitle: 'Pastor Esau Banda',
      streamsUrl: PASTOR_ESAU_STREAMS_URL,
      live: videos.find((video) => video.isLive) || null,
      videos,
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load the YouTube channel streams.' }, { status: 502 });
  }
}
