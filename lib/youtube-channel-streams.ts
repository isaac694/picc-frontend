export type LiveChannel = {
  key: string;
  name: string;
  channelId: string;
  handle: string;
};

/** Channels the livestream page lets viewers choose between, in display order. */
export const LIVE_CHANNELS: LiveChannel[] = [
  { key: 'picc-worldwide', name: 'PICC Worldwide', channelId: 'UC6auo8Q1xb5cgyY_pGJbfdw', handle: 'piccworldwide' },
  { key: 'pastor-esau-banda', name: 'Pastor Esau Banda', channelId: 'UC5iA3dWaUBlP_PBlGSQvgNQ', handle: 'PastorEsauBanda' },
  { key: 'pastor-loyce-banda', name: 'Pastor Loyce Banda', channelId: 'UC8JUC-G4wKhrrPr7xjxYWJw', handle: 'PastorLoyceBanda' },
];

export function channelStreamsUrl(channel: LiveChannel) {
  return `https://www.youtube.com/@${channel.handle}/streams`;
}

export type ChannelStream = {
  videoId: string;
  title: string;
  thumbnail: string;
  url: string;
  embedUrl: string;
  isLive: boolean;
  duration: string;
};

const decodeTitle = (value: string) => {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value;
  }
};

export function parseChannelStreams(html: string): ChannelStream[] {
  const videos: ChannelStream[] = [];
  const seen = new Set<string>();

  for (const chunk of html.split('lockupViewModel').slice(1)) {
    const videoId = chunk.match(/\/vi\/([A-Za-z0-9_-]{11})\//)?.[1];
    const rawTitle = chunk.match(/"title":\{"content":"((?:\\.|[^"\\])*)"/)?.[1];
    if (!videoId || !rawTitle || seen.has(videoId)) continue;

    const title = decodeTitle(rawTitle).trim();
    if (!title || /^(add to queue|save to playlist|share)$/i.test(title)) continue;

    seen.add(videoId);
    videos.push({
      videoId,
      title,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      isLive: /"text":"LIVE"/.test(chunk),
      duration: chunk.match(/"text":"(\d+:\d{2}(?::\d{2})?)"/)?.[1] || '',
    });
  }

  const live = videos.filter((video) => video.isLive);
  const rest = videos.filter((video) => !video.isLive);
  return [...live, ...rest];
}

export async function fetchChannelStreams(channel: LiveChannel): Promise<ChannelStream[]> {
  const response = await fetch(channelStreamsUrl(channel), {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'en',
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Unable to load the YouTube streams page.');
  }

  return parseChannelStreams(await response.text());
}
