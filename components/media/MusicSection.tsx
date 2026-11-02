'use client';

import { useEffect, useMemo, useState } from 'react';
import { Headphones, Music2, Pause, Play, X } from 'lucide-react';
import {
  CONTENT_COLLECTIONS,
  contentImage,
  fetchContentCollections,
  recordContentView,
  type ContentItem,
} from '@/lib/content-items';
import { getYouTubeId, spotifyEmbedUrl } from '@/lib/media-links';
import { resolveMediaImageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

type YouTubeVideo = { videoId: string; title: string; thumbnail: string };

const MUSIC_CHANNEL_ID = 'UCsrF1bC3s230vmduZSjEsBQ';

function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
      {[0, 150, 300, 450].map((delay) => (
        <span key={delay} className="equalizer-bar w-1 rounded-sm bg-secondary" style={{ height: '100%', animationDelay: `${delay}ms` }} />
      ))}
    </span>
  );
}

export default function MusicSection() {
  const [videos, setVideos] = useState<ContentItem[]>([]);
  const [audios, setAudios] = useState<ContentItem[]>([]);
  const [channelVideos, setChannelVideos] = useState<YouTubeVideo[]>([]);
  const [tab, setTab] = useState<'videos' | 'audio'>('videos');
  const [activeVideo, setActiveVideo] = useState<{ id: string; title: string } | null>(null);
  const [activeAudio, setActiveAudio] = useState<ContentItem | null>(null);

  useEffect(() => {
    void fetchContentCollections([CONTENT_COLLECTIONS.musicVideos, CONTENT_COLLECTIONS.musicAudios]).then((lists) => {
      setVideos(lists[CONTENT_COLLECTIONS.musicVideos] || []);
      setAudios(lists[CONTENT_COLLECTIONS.musicAudios] || []);
      if (!lists[CONTENT_COLLECTIONS.musicVideos]?.length && lists[CONTENT_COLLECTIONS.musicAudios]?.length) setTab('audio');
    });
  }, []);

  // Until admins add music videos, show the latest uploads from the PICC music channel.
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
    if (!key || videos.length) return;
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('channelId', MUSIC_CHANNEL_ID);
    url.searchParams.set('order', 'date');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '12');
    url.searchParams.set('key', key);
    fetch(url.toString())
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        setChannelVideos(
          items
            .map((item: { id?: { videoId?: string }; snippet?: { title?: string; thumbnails?: Record<string, { url?: string }> } }) => ({
              videoId: item.id?.videoId || '',
              title: item.snippet?.title || 'Music video',
              thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
            }))
            .filter((video: YouTubeVideo) => video.videoId),
        );
      })
      .catch(() => undefined);
  }, [videos.length]);

  const videoCards = useMemo(() => {
    if (videos.length) {
      return videos
        .map((item) => {
          const id = getYouTubeId(item.linkUrl);
          return id
            ? { key: item.id, id, title: item.title, artist: item.subtitle, thumb: contentImage(item) || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, item }
            : null;
        })
        .filter((card): card is NonNullable<typeof card> => Boolean(card));
    }
    return channelVideos.map((video) => ({ key: video.videoId, id: video.videoId, title: video.title, artist: '', thumb: video.thumbnail, item: null }));
  }, [videos, channelVideos]);

  if (!videoCards.length && !audios.length) return null;

  const [featured, ...moreVideos] = videoCards;
  const activeSpotify = activeAudio ? spotifyEmbedUrl(activeAudio.linkUrl) : '';

  return (
    <section className="relative overflow-hidden bg-[#0b1220] py-20 text-white md:py-28">
      <div className="pointer-events-none absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-primary/40 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-secondary/20 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.45em] text-secondary">
              <Music2 className="h-4 w-4" /> PICC Music
            </p>
            <h2 className="font-display mt-3 text-4xl font-semibold md:text-6xl">Music videos &amp; audio</h2>
            <p className="mt-4 max-w-xl text-white/65">Worship, praise and ministry songs from the PICC family.</p>
          </div>
          <div className="flex rounded-full border border-white/15 bg-white/5 p-1">
            {(['videos', 'audio'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                disabled={value === 'videos' ? !videoCards.length : !audios.length}
                className={cn(
                  'rounded-full px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors disabled:opacity-30',
                  tab === value ? 'bg-secondary text-secondary-foreground' : 'text-white/70 hover:text-white',
                )}
              >
                {value === 'videos' ? `Videos (${videoCards.length})` : `Audio (${audios.length})`}
              </button>
            ))}
          </div>
        </div>

        {tab === 'videos' && featured ? (
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <button
              type="button"
              onClick={() => {
                setActiveVideo({ id: featured.id, title: featured.title });
                if (featured.item) recordContentView(featured.item.collection, featured.item.id);
              }}
              className="group relative aspect-video overflow-hidden rounded-3xl text-left"
            >
              <img src={featured.thumb} alt={featured.title} className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/40 backdrop-blur-md transition-transform duration-500 group-hover:scale-110">
                <Play className="ml-1 h-8 w-8 fill-white" />
              </span>
              <div className="absolute bottom-0 p-6 md:p-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">Featured video</p>
                <p className="font-display mt-2 text-2xl font-semibold md:text-3xl">{featured.title}</p>
                {featured.artist ? <p className="mt-1 text-sm text-white/70">{featured.artist}</p> : null}
              </div>
            </button>
            <div className="grid max-h-[520px] gap-4 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-2 lg:grid-cols-1" data-reveal-stagger>
              {moreVideos.map((video) => (
                <button
                  key={video.key}
                  type="button"
                  onClick={() => {
                    setActiveVideo({ id: video.id, title: video.title });
                    if (video.item) recordContentView(video.item.collection, video.item.id);
                  }}
                  className="group grid grid-cols-[140px_1fr] items-center gap-4 rounded-2xl bg-white/5 p-2 text-left transition-colors hover:bg-white/10"
                >
                  <div className="relative aspect-video overflow-hidden rounded-xl">
                    <img src={video.thumb} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-6 w-6 fill-white" />
                    </span>
                  </div>
                  <div className="min-w-0 pr-2">
                    <p className="line-clamp-2 text-sm font-semibold">{video.title}</p>
                    {video.artist ? <p className="mt-1 truncate text-xs text-white/55">{video.artist}</p> : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {tab === 'audio' && audios.length ? (
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <ol className="space-y-2" data-reveal-stagger>
              {audios.map((audio, index) => {
                const playing = activeAudio?.id === audio.id;
                return (
                  <li key={audio.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAudio(playing ? null : audio);
                        if (!playing) recordContentView(audio.collection, audio.id);
                      }}
                      className={cn(
                        'group flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-colors',
                        playing ? 'bg-white/15' : 'bg-white/5 hover:bg-white/10',
                      )}
                    >
                      <span className="w-6 text-center text-sm tabular-nums text-white/45">{index + 1}</span>
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                        {audio.imageUrl ? <img src={resolveMediaImageUrl(audio.imageUrl) || ''} alt="" className="h-full w-full object-cover" /> : <Headphones className="m-4 h-6 w-6 text-white/50" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{audio.title}</p>
                        <p className="truncate text-xs text-white/55">{audio.subtitle || 'PICC Music'}</p>
                      </div>
                      {playing ? <Equalizer /> : null}
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform group-hover:scale-110">
                        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="lg:sticky lg:top-24 lg:self-start">
              {activeAudio ? (
                <div className="overflow-hidden rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">Now playing</p>
                  <p className="font-display mt-2 text-2xl font-semibold">{activeAudio.title}</p>
                  {activeAudio.subtitle ? <p className="text-sm text-white/60">{activeAudio.subtitle}</p> : null}
                  <div className="mt-5">
                    {activeSpotify ? (
                      <iframe
                        key={activeSpotify}
                        src={activeSpotify}
                        title={activeAudio.title}
                        className="h-[232px] w-full rounded-2xl border-0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    ) : (
                      <audio key={activeAudio.id} controls autoPlay src={resolveMediaImageUrl(activeAudio.linkUrl) || activeAudio.linkUrl} className="w-full">
                        Your browser does not support audio playback.
                      </audio>
                    )}
                  </div>
                  {activeAudio.body ? <p className="mt-4 text-sm leading-6 text-white/65">{activeAudio.body}</p> : null}
                </div>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 p-8 text-center text-white/55">
                  <Headphones className="h-10 w-10" />
                  <p className="mt-3 text-sm">Choose a song to start listening.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {activeVideo ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setActiveVideo(null)}>
          <div className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setActiveVideo(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close video">
              <X className="h-6 w-6" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
              title={activeVideo.title}
              className="h-full w-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
