import { NextResponse } from 'next/server';
import { channelStreamsUrl, fetchChannelStreams, LIVE_CHANNELS } from '@/lib/youtube-channel-streams';

export const revalidate = 60;

const MAX_VIDEOS = 12;

// Reads every channel's public streams page; a channel that fails comes back with an error instead of failing the rest.
export async function GET() {
  const results = await Promise.allSettled(LIVE_CHANNELS.map((channel) => fetchChannelStreams(channel)));
  const channels = LIVE_CHANNELS.map((channel, index) => {
    const result = results[index];
    const videos = result.status === 'fulfilled' ? result.value.slice(0, MAX_VIDEOS) : [];
    return {
      key: channel.key,
      name: channel.name,
      channelId: channel.channelId,
      streamsUrl: channelStreamsUrl(channel),
      live: videos.find((video) => video.isLive) || null,
      videos,
      error: result.status === 'rejected' ? 'Unable to load this channel right now.' : null,
    };
  });

  if (channels.every((channel) => channel.error)) {
    return NextResponse.json({ error: 'Unable to load the YouTube channel streams.', channels }, { status: 502 });
  }
  return NextResponse.json({ channels });
}
