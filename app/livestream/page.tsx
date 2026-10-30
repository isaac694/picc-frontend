'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LivestreamFooter from '@/components/LivestreamFooter';
import LiveChat from '@/components/LiveChat';
import NotepadTool from '@/components/livestream/NotepadTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import GiveTool from '@/components/livestream/GiveTool';
import PrayerRequestTool from '@/components/livestream/PrayerRequestTool';
import BibleTool from '@/components/livestream/BibleTool';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenText, MessageSquareText, StickyNote } from 'lucide-react';
import { useYouTubeVideoTitle } from '@/hooks/use-youtube-video-title';
import { pickYouTubeVideoTitle } from '@/lib/youtube-client';
import { LIVE_CHANNELS, type ChannelStream } from '@/lib/youtube-channel-streams';

type ToolKey = "bible" | "notepad" | "chat" | "testimony" | "prayer" | "give" | null;

type YouTubeVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
  updatedAt: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
  url: string;
  embedUrl: string;
  isLive?: boolean;
  canEmbed?: boolean;
};

type ChannelStreams = {
  key: string;
  name: string;
  channelId: string;
  streamsUrl: string;
  live: ChannelStream | null;
  videos: ChannelStream[];
  error?: string | null;
};

type YouTubePlayer = {
  pauseVideo: () => void;
  getCurrentTime?: () => number;
};

type YouTubePlayerStateChangeEvent = {
  data: number;
  target: YouTubePlayer;
};

const FALLBACK_HERO_ID = "ydTADwZRquA";
const RECENT_STREAM_COUNT = 4;

function toVideo(stream: ChannelStream, channelTitle: string): YouTubeVideo {
  return {
    videoId: stream.videoId,
    title: stream.title,
    publishedAt: "",
    updatedAt: "",
    channelTitle,
    description: "",
    thumbnail: stream.thumbnail,
    url: stream.url,
    embedUrl: stream.embedUrl,
    isLive: stream.isLive,
    canEmbed: true,
  };
}

const TOOL_TABS: Array<{
  key: ToolKey;
  label: string;
  kind: "embed" | "component" | "form";
}> = [
  { key: "chat", label: "Live Chat", kind: "component" },
  { key: "notepad", label: "Notepad", kind: "component" },
  { key: "bible", label: "Bible", kind: "component" },
  { key: "testimony", label: "Send Testimony", kind: "form" },
  { key: "prayer", label: "Prayer Request", kind: "form" },
  { key: "give", label: "Give", kind: "form" },
];

export default function LivestreamPage() {
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [activeCardTool, setActiveCardTool] = useState<ToolKey>(null);
  const [activeCardVideoId, setActiveCardVideoId] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelStreams[]>([]);
  const [chosenChannelKey, setChosenChannelKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileResumeAt, setMobileResumeAt] = useState<number | null>(null);
  const playersRef = useRef<Map<string, YouTubePlayer>>(new Map());

  // Until the viewer picks a channel, show whichever one is live (PICC Worldwide first).
  const selectedChannel =
    channels.find((channel) => channel.key === chosenChannelKey) ||
    channels.find((channel) => channel.live) ||
    channels.find((channel) => channel.videos.length > 0) ||
    channels[0] ||
    null;
  const selectedChannelName =
    selectedChannel?.name || LIVE_CHANNELS.find((channel) => channel.key === chosenChannelKey)?.name || LIVE_CHANNELS[0].name;
  const videos: YouTubeVideo[] = selectedChannel
    ? [
        ...(selectedChannel.live ? [selectedChannel.live] : []),
        ...selectedChannel.videos.filter((video) => video.videoId !== selectedChannel.live?.videoId),
      ].map((stream) => toVideo(stream, selectedChannel.name))
    : [];

  const featuredVideo = videos[0] || null;
  const primaryVideoId = featuredVideo?.videoId || FALLBACK_HERO_ID;
  const { title: youTubeHeroTitle, isLoading: heroTitleLoading } =
    useYouTubeVideoTitle(primaryVideoId);
  const heroStreamTitle =
    pickYouTubeVideoTitle(featuredVideo?.title, youTubeHeroTitle) ||
    (isLoading || heroTitleLoading ? 'Loading stream title…' : 'Live stream');
  const heroChatTitle = pickYouTubeVideoTitle(featuredVideo?.title, youTubeHeroTitle);

  const displayGridVideos = videos.slice(1, 1 + RECENT_STREAM_COUNT);
  const visibleVideoIds = [primaryVideoId, ...displayGridVideos.map((video) => video.videoId)].join(",");

  const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Africa/Blantyre",
    });
  };

  useEffect(() => {
    let isMounted = true;
    let hasChannels = false;

    const fetchChannels = async () => {
      try {
        if (!hasChannels) setIsLoading(true);
        const response = await fetch("/api/youtube/channel-streams", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        const nextChannels: ChannelStreams[] = Array.isArray(data?.channels) ? data.channels : [];
        if (!isMounted) return;
        if (nextChannels.some((channel) => channel.videos.length > 0)) {
          hasChannels = true;
          setChannels(nextChannels);
          setLoadError(null);
        } else if (!hasChannels) {
          setLoadError("Unable to load the latest streams right now.");
        }
      } catch {
        if (isMounted && !hasChannels) setLoadError("Unable to load the latest streams right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchChannels();
    const refreshId = window.setInterval(fetchChannels, 60_000);
    return () => {
      isMounted = false;
      window.clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existingScript = document.getElementById("youtube-iframe-api");

    const handleReady = () => setYtReady(true);

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = handleReady;
    } else if (window.YT && window.YT.Player) {
      handleReady();
    } else {
      window.onYouTubeIframeAPIReady = handleReady;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileViewport(event.matches);
    };
    handleChange(mediaQuery);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    legacyMediaQuery.addListener?.(
      handleChange as (event: MediaQueryListEvent) => void,
    );
    return () =>
      legacyMediaQuery.removeListener?.(
        handleChange as (event: MediaQueryListEvent) => void,
      );
  }, []);

  useEffect(() => {
    if (!ytReady || typeof window === "undefined" || !window.YT?.Player) return;
    const yt = window.YT;
    const players = playersRef.current;
    const iframes = Array.from(
      document.querySelectorAll<HTMLIFrameElement>("[data-yt-id]"),
    );
    const onScreen = new Set(iframes.map((iframe) => iframe.dataset.ytId));
    // Switching channels swaps the iframes, so forget players whose video left the page.
    players.forEach((_, videoId) => {
      if (!onScreen.has(videoId)) players.delete(videoId);
    });

    iframes.forEach((iframe) => {
      const videoId = iframe.dataset.ytId;
      if (!videoId || players.has(videoId)) return;
      const player = new yt.Player(iframe, {
        events: {
          onStateChange: (event: YouTubePlayerStateChangeEvent) => {
            if (event.data === yt.PlayerState.PLAYING) {
              players.forEach((p) => {
                if (p !== event.target) {
                  p.pauseVideo();
                }
              });
            }
          },
        },
      });
      players.set(videoId, player);
    });
  }, [ytReady, activeTool, visibleVideoIds]);

  const mobilePlayerActive = isMobileViewport && activeTool;
  const activeEmbedTool = TOOL_TABS.find(t => t.key === activeTool && t.kind === "embed") as { url: string; label: string } | undefined;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!mobilePlayerActive) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [mobilePlayerActive]);

  useEffect(() => {
    if (!isMobileViewport || !activeTool) return;
    const videoId = featuredVideo?.videoId || FALLBACK_HERO_ID;
    const player = playersRef.current.get(videoId);
    if (!player || typeof player.getCurrentTime !== 'function') {
      setMobileResumeAt(null);
      return;
    }
    try {
      const currentTime = player.getCurrentTime();
      if (Number.isFinite(currentTime)) {
        setMobileResumeAt(Math.floor(currentTime));
      } else {
        setMobileResumeAt(null);
      }
    } catch {
      setMobileResumeAt(null);
    }
  }, [activeTool, isMobileViewport, featuredVideo?.videoId]);

  const mobileVideoId = featuredVideo?.videoId || FALLBACK_HERO_ID;
  const mobileVideoStart = mobileResumeAt && mobileResumeAt > 0 ? `&start=${mobileResumeAt}` : '';


  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black text-white">
        {!mobilePlayerActive && (
          <>
            {/* Hero Section */}
            <section className="py-16 sm:py-20 md:py-24 bg-black text-white">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Watch <span className="text-red-500">Live</span> Services
                </h1>
                <p className="text-base md:text-lg text-white/80">
                  Experience the Presence of God Anytime, Anywhere.
                </p>
              </div>
            </section>
            {/* Channel picker */}
            <section className="bg-black" aria-label="Choose a channel">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Choose a channel</p>
                <div role="tablist" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {LIVE_CHANNELS.map((channel) => {
                    const streams = channels.find((item) => item.key === channel.key);
                    const selected = (selectedChannel?.key || LIVE_CHANNELS[0].key) === channel.key;
                    return (
                      <button
                        key={channel.key}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => {
                          setChosenChannelKey(channel.key);
                          setActiveCardVideoId(null);
                          setActiveCardTool(null);
                        }}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                          selected
                            ? "border-white bg-white text-black"
                            : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{channel.name}</span>
                          <span className={`block text-xs ${selected ? "text-black/60" : "text-white/50"}`}>
                            {isLoading && !streams
                              ? "Checking..."
                              : streams?.live
                                ? "Streaming now"
                                : streams?.error
                                  ? "Unavailable right now"
                                  : "Not live · latest stream"}
                          </span>
                        </span>
                        {streams?.live ? (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            Live
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
            {/* Sunday Livestream Section */}
            <section className="py-8 md:py-10 bg-black">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                  <div className="relative aspect-video bg-black">
                    <iframe
                      key={primaryVideoId}
                      className="h-full w-full"
                      data-yt-id={primaryVideoId}
                      id="yt-hero"
                      src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                      title={heroStreamTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <div className="bg-white text-black px-6 py-5">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(360px,auto)] md:items-center">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">{heroStreamTitle}</h3>
                        {featuredVideo ? (
                          <p className="text-xs text-black/60 mt-1">
                            {featuredVideo.isLive
                              ? `Live now from ${selectedChannelName}`
                              : `Latest stream from ${selectedChannelName}`}
                          </p>
                        ) : null}
                        {featuredVideo?.publishedAt && (
                          <p className="text-xs text-black/60 mt-1">
                            {formatDate(featuredVideo.publishedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveTool("bible")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-medium text-[#1E4FA3] hover:bg-[#DCEAFF] transition-colors"
                        >
                          <BookOpenText size={12} />
                          Bible
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("notepad")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#FFF2DA] px-3 py-1 text-xs font-medium text-[#8A5A00] hover:bg-[#FFE9C2] transition-colors"
                        >
                          <StickyNote size={12} />
                          Notepad
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("chat")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#E8FFF3] px-3 py-1 text-xs font-medium text-[#0F7A3E] hover:bg-[#D8F7E7] transition-colors"
                        >
                          <MessageSquareText size={12} />
                          Live Chat
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("testimony")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#CFF6DF] px-3 py-1 text-xs font-medium text-[#137A3D] hover:bg-[#BDEFD3] transition-colors"
                        >
                          Send Testimony
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("prayer")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-medium text-[#1E4FA3] hover:bg-[#DCEAFF] transition-colors"
                        >
                          Prayer Request
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("give")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#39D98A] px-3 py-1 text-xs font-semibold text-black hover:bg-[#2FC77C] transition-colors"
                        >
                          Give
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
        {activeTool && (
          <>
            <section className="pb-12 md:pb-16 bg-black hidden md:block">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                  <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    {TOOL_TABS.map((tool) => (
                      <button
                        key={tool.key}
                        type="button"
                        onClick={() => setActiveTool(tool.key)}
                        className={`rounded-full px-3 py-1 transition-colors ${
                          activeTool === tool.key
                            ? "bg-white text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {tool.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setActiveTool(null)}
                      className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Close Tools
                    </button>
                  </div>
                  {activeTool === "bible" && <BibleTool />}
                  {activeTool === "chat" && (
                    <div className="h-[400px] w-full bg-black">
                      <LiveChat
                        videoId={primaryVideoId}
                        videoTitle={heroChatTitle}
                      />
                    </div>
                  )}
                  {activeTool === "notepad" && <NotepadTool />}
                  {activeTool === "testimony" && (
                    <div className="px-5 py-6 text-white">
                      <TestimonyTool />
                    </div>
                  )}
                  {activeTool === "prayer" && (
                    <div className="px-5 py-6 text-white">
                      <PrayerRequestTool />
                    </div>
                  )}
                  {activeTool === "give" && (
                    <div className="px-5 py-6 text-white">
                      <GiveTool isMobile={false} />
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/70">
                    <span>
                      {activeTool === "testimony"
                        ? "Testimony Form"
                        : activeTool === "prayer"
                          ? "Prayer Request Form"
                        : activeTool === "give"
                          ? "Giving Form"
                          : activeTool === "chat"
                            ? "Live Chat"
                            : activeTool === "bible"
                              ? "Bible"
                              : ""}
                      {activeTool === "notepad" && (
                        <span className="ml-2 text-white/50">
                          Tip: use the save/download button inside the notepad.
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>
            {mobilePlayerActive ? (
              <section className="md:hidden fixed top-16 left-0 right-0 bottom-0 z-40 bg-black">
                <div className="h-full flex flex-col">
                  <div className="flex-[0_0_40%] bg-black">
                    <iframe
                      key={mobileVideoId}
                      className="h-full w-full"
                      data-yt-id={mobileVideoId}
                      id="yt-hero-mobile"
                      src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0&autoplay=1&playsinline=1${mobileVideoStart}`}
                      title={heroStreamTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex-[1_1_60%] px-4 py-5 text-white overflow-y-auto bg-black">
                    <div className="mb-4 border-b border-white/10 pb-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/70">
                        {TOOL_TABS.map((tool) => (
                          <button
                            key={tool.key}
                            type="button"
                            onClick={() => setActiveTool(tool.key)}
                            className={`rounded-full px-3 py-1 transition-colors ${
                              activeTool === tool.key
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            {tool.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setActiveTool(null)}
                          className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    {activeEmbedTool && (
                      <div className="aspect-[4/3] w-full bg-black mb-4">
                        <iframe
                          className="h-full w-full"
                          src={activeEmbedTool.url}
                          title={activeEmbedTool.label}
                          allow="clipboard-write; fullscreen"
                        />
                      </div>
                    )}
                    {activeTool === "chat" && (
                      <div className="h-[300px] w-full bg-black mb-4">
                        <LiveChat
                          videoId={primaryVideoId}
                          videoTitle={heroChatTitle}
                        />
                      </div>
                    )}
                    {activeTool === "bible" && (
                      <div className="mb-4">
                        <BibleTool />
                      </div>
                    )}
                    {activeTool === "notepad" && (
                      <div className="mb-4">
                        <NotepadTool />
                      </div>
                    )}
                    {activeTool === "testimony" && (
                      <div className="px-4 py-5 text-white">
                        <TestimonyTool />
                      </div>
                    )}
                    {activeTool === "prayer" && (
                      <div className="px-4 py-5 text-white">
                        <PrayerRequestTool />
                      </div>
                    )}
                    {activeTool === "give" && (
                      <div className="px-4 py-5 text-white">
                        <GiveTool isMobile={true} />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className="md:hidden pb-12 bg-black">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 h-[60vh] flex flex-col">
                    <div className="border-b border-white/10 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/70">
                        {TOOL_TABS.map((tool) => (
                          <button
                            key={tool.key}
                            type="button"
                            onClick={() => setActiveTool(tool.key)}
                            className={`rounded-full px-3 py-1 transition-colors ${
                              activeTool === tool.key
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            {tool.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setActiveTool(null)}
                          className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-5 text-white flex-1 overflow-y-auto">
                      {activeEmbedTool && (
                        <div className="aspect-[4/3] w-full bg-black mb-4">
                          <iframe
                            className="h-full w-full"
                            src={activeEmbedTool.url}
                            title={activeEmbedTool.label}
                            allow="clipboard-write; fullscreen"
                          />
                        </div>
                      )}
                      {activeTool === 'chat' && (
                        <div className="h-[300px] w-full bg-black mb-4">
                          <LiveChat
                            videoId={primaryVideoId}
                            videoTitle={heroChatTitle}
                          />
                        </div>
                      )}
                      {activeTool === 'bible' && (
                        <div className="mb-4">
                          <BibleTool />
                        </div>
                      )}
                      {activeTool === 'notepad' && (
                        <div className="mb-4">
                          <NotepadTool />
                        </div>
                      )}
                      {activeTool === 'testimony' && (
                        <div className="px-4 py-5 text-white">
                          <TestimonyTool />
                        </div>
                      )}
                      {activeTool === 'prayer' && (
                        <div className="px-4 py-5 text-white">
                          <PrayerRequestTool />
                        </div>
                      )}
                      {activeTool === 'give' && (
                        <div className="px-4 py-5 text-white">
                          <GiveTool isMobile={true} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Search Section */}
        <section className={`py-10 md:py-12 bg-black border-b border-white/10 ${mobilePlayerActive ? 'hidden md:block' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          </div>
        </section>
        {/* Livestreams Grid */}
        <section className={`py-16 sm:py-20 md:py-24 bg-black ${mobilePlayerActive ? 'hidden md:block' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-lg text-white/70">
                  Loading recent streams...
                </p>
              </div>
            ) : (
              <>
              {loadError && (
                <p className="mb-6 text-center text-sm text-white/60">
                  {loadError}{" "}
                  <Link href={selectedChannel?.streamsUrl || `https://www.youtube.com/@${LIVE_CHANNELS[0].handle}/streams`} target="_blank" rel="noreferrer" className="underline">
                    Watch on YouTube
                  </Link>
                </p>
              )}
              {displayGridVideos.length > 0 && (
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <h2 className="text-2xl font-bold">Recent streams from {selectedChannelName}</h2>
                  {selectedChannel?.streamsUrl && (
                    <Link href={selectedChannel.streamsUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-white/70 hover:text-white">
                      See all on YouTube
                    </Link>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {displayGridVideos.map((stream) => (
                  <Card
                    key={stream.videoId}
                    className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-white border-black/10 text-black"
                  >
                    <div className="aspect-video bg-black">
                      {stream.canEmbed === false ? (
                        <Link
                          href={stream.url}
                          target="_blank"
                          rel="noreferrer"
                          className="relative block h-full w-full"
                          aria-label={`Watch ${stream.title} on YouTube`}
                        >
                          {stream.thumbnail ? (
                            <Image
                              src={stream.thumbnail}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-black" />
                          )}
                          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg">
                              Watch on YouTube
                            </span>
                          </span>
                        </Link>
                      ) : (
                        <iframe
                          className="h-full w-full"
                          data-yt-id={stream.videoId}
                          id={`yt-${stream.videoId}`}
                          src={`${stream.embedUrl}?enablejsapi=1&rel=0`}
                          title={stream.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      )}
                    </div>
                    <div className="p-4 flex flex-col">
                      <h3 className="font-bold text-lg text-black mb-2 line-clamp-2">
                        {stream.title}
                      </h3>
                      <div className="space-y-1 text-sm text-black/60 mb-2">
                        <p>{stream.channelTitle}</p>
                        {stream.publishedAt && (
                          <p>{formatDate(stream.publishedAt)}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {TOOL_TABS.map((tool) => (
                          <button
                            key={`${stream.videoId}-${tool.key}`}
                            type="button"
                            onClick={() => {
                              if (
                                activeCardVideoId === stream.videoId &&
                                activeCardTool === tool.key
                              ) {
                                setActiveCardVideoId(null);
                                setActiveCardTool(null);
                              } else {
                                setActiveCardVideoId(stream.videoId);
                                setActiveCardTool(tool.key);
                              }
                            }}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              activeCardVideoId === stream.videoId &&
                              activeCardTool === tool.key
                                ? 'bg-black text-white'
                                : 'bg-slate-900/10 text-slate-900 hover:bg-slate-900/20'
                            }`}
                          >
                            {tool.label}
                          </button>
                        ))}
                      </div>
                      {activeCardVideoId === stream.videoId && activeCardTool && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white/5">
                          <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 bg-slate-950/10">
                            <div className="text-sm font-semibold text-slate-950">
                              {TOOL_TABS.find((tool) => tool.key === activeCardTool)?.label}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCardVideoId(null);
                                setActiveCardTool(null);
                              }}
                              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white hover:bg-slate-800 transition-colors"
                            >
                              Close Tools
                            </button>
                          </div>
                          <div className="p-4">
                            {activeCardTool === 'chat' && (
                              <div className="h-[300px] w-full bg-black">
                                <LiveChat
                                  videoId={stream.videoId}
                                  videoTitle={stream.title}
                                />
                              </div>
                            )}
                            {activeCardTool === 'bible' && <BibleTool />}
                            {activeCardTool === 'notepad' && <NotepadTool />}
                            {activeCardTool === 'testimony' && (
                              <div className="px-4 py-5 text-white">
                                <TestimonyTool />
                              </div>
                            )}
                            {activeCardTool === 'prayer' && (
                              <div className="px-4 py-5 text-white">
                                <PrayerRequestTool />
                              </div>
                            )}
                            {activeCardTool === 'give' && (
                              <div className="px-4 py-5 text-white">
                                <GiveTool isMobile={isMobileViewport} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              </>
            )}
          </div>
        </section>
      </main>
      {!mobilePlayerActive && <LivestreamFooter />}
    </>
  );
}
