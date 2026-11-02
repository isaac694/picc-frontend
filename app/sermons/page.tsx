'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Calendar, Eye, Headphones, Loader2, Mic2, Play, Search, Share2, Video, X } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, resolveMediaImageUrl } from '@/lib/api';
import { spotifyEmbedUrl, youTubeEmbedUrl } from '@/lib/media-links';
import {
  compactNumber,
  formatSermonDate,
  hasAudio,
  hasVideo,
  parseSermons,
  sermonThumbnail,
  sermonViews,
  trackSermonPlay,
  type Sermon,
} from '@/lib/sermons';
import { cn } from '@/lib/utils';

const sample = (id: string, title: string, date: string, youtubeUrl: string): Sermon => ({
  id: `sample-${id}`,
  title,
  date,
  speaker: '',
  description: '',
  youtubeUrl,
  spotifyUrl: '',
  audioUrl: '',
  thumbnailUrl: '',
  series: '',
  topic: '',
  scripture: '',
  isActive: true,
  isFeatured: false,
  siteViews: 0,
  siteListens: 0,
  youtubeViews: null,
  youtubeLikes: null,
});

// Shown only if the sermon list cannot be loaded.
const SAMPLE_SERMONS: Sermon[] = [
  sample('1', 'Faith for All-Round Possibilities', '2025-04-10', 'https://www.youtube.com/watch?v=joxnOHDoQvk'),
  sample('2', 'Faith for Supernatural Supplies', '2025-04-10', 'https://www.youtube.com/watch?v=IloZ7uo2UYY'),
  sample('3', 'Operating in the Spirit of Faith', '2023-02-16', 'https://www.youtube.com/watch?v=ubcp3QMiMAE&t=280s'),
  sample('4', 'The Faith That Works', '2023-02-16', 'https://www.youtube.com/watch?v=hMJUnkBimKg'),
];

function StatPill({ icon: Icon, value, label }: { icon: typeof Eye; value: number; label: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur" title={label}>
      <Icon className="h-3.5 w-3.5" /> {compactNumber(value)} <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

function AudioPlayer({ sermon }: { sermon: Sermon }) {
  const spotify = spotifyEmbedUrl(sermon.spotifyUrl);
  if (spotify) {
    return (
      <iframe
        key={spotify}
        src={spotify}
        title={`${sermon.title} on Spotify`}
        className="h-[152px] w-full rounded-2xl border-0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    );
  }
  const audio = sermon.audioUrl;
  if (/podbean\.com/i.test(audio) && /player|embed/i.test(audio)) {
    return <iframe key={audio} src={audio} title={`${sermon.title} audio`} className="h-[150px] w-full rounded-2xl border-0 bg-white" allow="autoplay" />;
  }
  return (
    <audio
      key={audio}
      controls
      src={resolveMediaImageUrl(audio) || audio}
      className="w-full"
      onPlay={() => trackSermonPlay(sermon.id, 'listen')}
    >
      Your browser does not support audio playback.
    </audio>
  );
}

export default function SermonsPage() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [headerImage, setHeaderImage] = useState('/sermons/header.JPG');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<'watch' | 'listen'>('watch');
  const [query, setQuery] = useState('');
  const [series, setSeries] = useState('All');
  const [speaker, setSpeaker] = useState('All');
  const [visibleCount, setVisibleCount] = useState(9);
  const [shared, setShared] = useState(false);
  const playerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [sermonsResponse, headerResponse] = await Promise.all([
          apiFetch('/api/sermons?take=200'),
          apiFetch('/api/site-content/sermons-header-image'),
        ]);
        if (!alive) return;
        const list = sermonsResponse.ok ? parseSermons(await sermonsResponse.json()) : [];
        setSermons(list.length ? list : SAMPLE_SERMONS);
        if (headerResponse.ok) {
          const data = await headerResponse.json();
          const resolved = resolveMediaImageUrl(data.imageUrl);
          if (resolved) setHeaderImage(resolved);
        }
      } catch {
        if (alive) setSermons(SAMPLE_SERMONS);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const featured = useMemo(() => sermons.find((sermon) => sermon.isFeatured) || sermons[0] || null, [sermons]);
  const active = useMemo(() => sermons.find((sermon) => sermon.id === activeId) || featured, [sermons, activeId, featured]);

  const seriesOptions = useMemo(() => ['All', ...Array.from(new Set(sermons.map((sermon) => sermon.series).filter(Boolean)))], [sermons]);
  const speakerOptions = useMemo(() => ['All', ...Array.from(new Set(sermons.map((sermon) => sermon.speaker).filter(Boolean)))], [sermons]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sermons.filter((sermon) => {
      if (series !== 'All' && sermon.series !== series) return false;
      if (speaker !== 'All' && sermon.speaker !== speaker) return false;
      if (!term) return true;
      return [sermon.title, sermon.speaker, sermon.series, sermon.topic, sermon.scripture, formatSermonDate(sermon.date)]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [sermons, query, series, speaker]);

  const choose = (sermon: Sermon, nextMode?: 'watch' | 'listen') => {
    setActiveId(sermon.id);
    setPlaying(false);
    setMode(nextMode || (hasVideo(sermon) ? 'watch' : 'listen'));
    if (nextMode === 'listen') trackSermonPlay(sermon.id, 'listen');
    requestAnimationFrame(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const startWatching = () => {
    if (!active) return;
    setPlaying(true);
    trackSermonPlay(active.id, 'watch');
  };

  const startListening = () => {
    if (!active) return;
    setMode('listen');
    setPlaying(false);
    trackSermonPlay(active.id, 'listen');
  };

  const share = async () => {
    if (!active) return;
    const url = active.youtubeUrl || window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: active.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // Share sheet closed.
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#f6f4ef]">
        {/* Player */}
        <section ref={playerRef} className="relative overflow-hidden bg-[#0b1424] pb-16 pt-28 text-white md:pb-24 md:pt-32">
          <div className="absolute inset-0 opacity-30">
            <div className="animate-ken-burns absolute inset-0 bg-cover bg-center blur-sm" style={{ backgroundImage: `url(${active ? sermonThumbnail(active, headerImage) : headerImage})` }} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b1424]/70 via-[#0b1424]/90 to-[#0b1424]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/60">
              <Link href="/" className="hover:text-white">Home</Link>
              <span className="text-white/40">/</span>
              <span>Sermons</span>
            </div>

            {loading || !active ? (
              <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white/70" /></div>
            ) : (
              <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:items-center">
                <div>
                  <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-2xl ring-1 ring-white/10">
                    {mode === 'watch' && playing && hasVideo(active) ? (
                      <iframe
                        key={active.id}
                        src={youTubeEmbedUrl(active.youtubeUrl, { autoplay: true })}
                        title={active.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full border-0"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={hasVideo(active) ? startWatching : startListening}
                        className="group absolute inset-0"
                        aria-label={hasVideo(active) ? 'Play sermon video' : 'Listen to this sermon'}
                      >
                        <img src={sermonThumbnail(active, headerImage)} alt={active.title} className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[0_0_0_12px_rgba(212,175,55,0.25)] transition-transform duration-500 group-hover:scale-110">
                          {hasVideo(active) ? <Play className="ml-1 h-8 w-8 fill-current" /> : <Headphones className="h-8 w-8" />}
                        </span>
                      </button>
                    )}
                  </div>

                  {hasAudio(active) && (mode === 'listen' || !hasVideo(active)) ? (
                    <div className="mt-5 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                      <AudioPlayer sermon={active} />
                    </div>
                  ) : null}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-secondary">
                    {active.id === featured?.id && !activeId ? 'Latest message' : 'Now selected'}
                  </p>
                  <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.1] md:text-5xl">{active.title}</h1>
                  <div className="mt-5 space-y-2 text-sm text-white/75">
                    {active.speaker ? <p className="flex items-center gap-2"><Mic2 className="h-4 w-4 text-secondary" /> {active.speaker}</p> : null}
                    {active.date ? <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-secondary" /> {formatSermonDate(active.date)}</p> : null}
                    {active.scripture ? <p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-secondary" /> {active.scripture}</p> : null}
                  </div>
                  {active.series || active.topic ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {active.series ? <span className="rounded-full border border-secondary/50 px-3 py-1 text-xs font-semibold text-secondary">Series: {active.series}</span> : null}
                      {active.topic ? <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/75">{active.topic}</span> : null}
                    </div>
                  ) : null}
                  {active.description ? <p className="mt-5 line-clamp-4 leading-7 text-white/70">{active.description}</p> : null}

                  <div className="mt-6 flex flex-wrap gap-2">
                    <StatPill icon={Eye} value={sermonViews(active)} label="views" />
                    <StatPill icon={Headphones} value={active.siteListens} label="listens" />
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {hasVideo(active) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('watch');
                          startWatching();
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground transition-transform hover:-translate-y-0.5"
                      >
                        <Video className="h-4 w-4" /> Watch on the website
                      </button>
                    ) : null}
                    {hasAudio(active) ? (
                      <button
                        type="button"
                        onClick={startListening}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors',
                          mode === 'listen' ? 'bg-white text-[#0b1424]' : 'border border-white/30 hover:bg-white/10',
                        )}
                      >
                        <Headphones className="h-4 w-4" /> {active.spotifyUrl ? 'Listen on Spotify' : 'Listen to audio'}
                      </button>
                    ) : null}
                    <button type="button" onClick={() => void share()} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/10">
                      <Share2 className="h-4 w-4" /> {shared ? 'Link copied' : 'Share'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Library */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/70">Sermon library</p>
                <h2 className="font-display mt-2 text-4xl font-semibold text-foreground md:text-5xl">Latest messages</h2>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <label className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5">
                  <Search className="h-4 w-4 text-foreground/40" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setVisibleCount(9);
                    }}
                    placeholder="Search title, scripture, speaker"
                    className="w-full bg-transparent text-sm outline-none sm:w-60"
                  />
                  {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X className="h-4 w-4 text-foreground/40" /></button> : null}
                </label>
                {speakerOptions.length > 2 ? (
                  <select
                    value={speaker}
                    onChange={(event) => setSpeaker(event.target.value)}
                    className="rounded-full border border-border bg-white px-4 py-2.5 text-sm"
                    aria-label="Filter by speaker"
                  >
                    {speakerOptions.map((option) => <option key={option} value={option}>{option === 'All' ? 'All speakers' : option}</option>)}
                  </select>
                ) : null}
              </div>
            </div>

            {seriesOptions.length > 1 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {seriesOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSeries(option);
                      setVisibleCount(9);
                    }}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors',
                      series === option ? 'bg-primary text-primary-foreground' : 'bg-white text-foreground/65 hover:bg-primary/5',
                    )}
                  >
                    {option === 'All' ? 'All series' : option}
                  </button>
                ))}
              </div>
            ) : null}

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <p className="py-20 text-center text-sm text-foreground/60">No sermons match your search.</p>
            ) : (
              <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
                {filtered.slice(0, visibleCount).map((sermon) => {
                  const isActive = active?.id === sermon.id;
                  return (
                    <article key={sermon.id} className={cn('group hover-lift overflow-hidden rounded-3xl bg-white', isActive && 'ring-2 ring-secondary')}>
                      <button type="button" onClick={() => choose(sermon)} className="relative block aspect-video w-full overflow-hidden" aria-label={`Open ${sermon.title}`}>
                        <img src={sermonThumbnail(sermon, headerImage)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <span className="absolute left-3 top-3 flex gap-1.5">
                          {hasVideo(sermon) ? <span className="rounded-full bg-black/60 p-1.5 text-white backdrop-blur" title="Video"><Video className="h-3.5 w-3.5" /></span> : null}
                          {hasAudio(sermon) ? <span className="rounded-full bg-black/60 p-1.5 text-white backdrop-blur" title="Audio"><Headphones className="h-3.5 w-3.5" /></span> : null}
                        </span>
                        <span className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground opacity-0 transition-all duration-300 group-hover:opacity-100">
                          <Play className="ml-0.5 h-5 w-5 fill-current" />
                        </span>
                        {sermonViews(sermon) ? (
                          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                            <Eye className="h-3 w-3" /> {compactNumber(sermonViews(sermon))}
                          </span>
                        ) : null}
                      </button>
                      <div className="p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
                          {formatSermonDate(sermon.date, 'short')}{sermon.series ? ` · ${sermon.series}` : ''}
                        </p>
                        <h3 className="font-display mt-2 text-xl font-semibold leading-snug text-foreground">
                          <button type="button" onClick={() => choose(sermon)} className="text-left hover:text-primary">{sermon.title}</button>
                        </h3>
                        {sermon.speaker ? <p className="mt-1 text-sm text-foreground/60">{sermon.speaker}</p> : null}
                        {sermon.scripture ? <p className="mt-1 text-xs text-primary/80">{sermon.scripture}</p> : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {hasVideo(sermon) ? (
                            <button type="button" onClick={() => choose(sermon, 'watch')} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                              <Video className="h-3.5 w-3.5" /> Watch
                            </button>
                          ) : null}
                          {hasAudio(sermon) ? (
                            <button type="button" onClick={() => choose(sermon, 'listen')} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold text-primary">
                              <Headphones className="h-3.5 w-3.5" /> Listen
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {visibleCount < filtered.length ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((value) => value + 9)}
                  className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Load more sermons
                </button>
              ) : null}
              <Link
                href="/sermons/archive"
                className="rounded-full border-2 border-primary/20 bg-white px-8 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/40"
              >
                Browse full archive
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
