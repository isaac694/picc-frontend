'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

export type VideoDeclarationCardContent = {
  source: 'youtube' | 'upload';
  title: string;
  subtitle: string;
  mediaUrl: string;
  mediaKind: 'video' | 'audio';
};

type Props = {
  declaration: VideoDeclarationCardContent | null;
  fallbackImage: string;
  fallbackTitle: string;
  fallbackSubtitle: string;
};

type YouTubePlayerState = {
  PLAYING: number;
  PAUSED: number;
  ENDED: number;
};

type YouTubePlayer = {
  destroy: () => void;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: YouTubePlayerState;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const getYouTubeVideoId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace(/^\/+/, '').split('/')[0] || '';
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/').filter(Boolean)[1] || '';
      }
      if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/').filter(Boolean)[1] || '';
      }
      return url.searchParams.get('v') || '';
    }
  } catch {
    return '';
  }

  return '';
};

const loadYouTubeApi = () =>
  new Promise<YouTubeNamespace>((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
    }
  });

export default function VideoDeclarationCard({
  declaration,
  fallbackImage,
  fallbackTitle,
  fallbackSubtitle,
}: Props) {
  const [showOverlay, setShowOverlay] = useState(true);
  const youtubeHostRef = useRef<HTMLDivElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);

  const title = declaration?.title || fallbackTitle;
  const subtitle = declaration?.subtitle || fallbackSubtitle;
  const youtubeVideoId = useMemo(
    () => (declaration?.source === 'youtube' ? getYouTubeVideoId(declaration.mediaUrl) : ''),
    [declaration],
  );

  useEffect(() => {
    if (declaration?.source !== 'youtube' || !youtubeVideoId || !youtubeHostRef.current) {
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
      return;
    }

    let cancelled = false;
    const host = youtubeHostRef.current;

    void loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = new YT.Player(host, {
        videoId: youtubeVideoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              setShowOverlay(false);
            }
            if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
              setShowOverlay(true);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, [declaration?.source, youtubeVideoId]);

  return (
    <div className="relative overflow-hidden rounded-[28px] shadow-2xl max-w-5xl mx-auto min-h-[360px] sm:min-h-[440px] md:min-h-[560px] flex items-center bg-black">
      <div className="absolute inset-0">
        {declaration?.source === 'youtube' && youtubeVideoId ? (
          <div ref={youtubeHostRef} className="h-full w-full" />
        ) : declaration?.source === 'upload' && declaration.mediaKind === 'video' ? (
          <video
            src={declaration.mediaUrl}
            controls
            className="h-full w-full object-cover"
            onPlay={() => setShowOverlay(false)}
            onPause={() => setShowOverlay(true)}
            onEnded={() => setShowOverlay(true)}
          />
        ) : (
          <Image
            src={fallbackImage}
            alt="Video declaration"
            fill
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="object-cover"
          />
        )}
      </div>

      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10 transition-opacity duration-300 ${
          showOverlay ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`pointer-events-none relative p-8 md:p-12 lg:p-14 text-white transition-opacity duration-300 ${
          showOverlay ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4">{subtitle}</p>
        <h2 className="text-3xl md:text-5xl font-semibold leading-tight mb-6 max-w-2xl">
          {title}
        </h2>
      </div>

      {declaration?.source === 'upload' && declaration.mediaKind === 'audio' && (
        <div className="absolute inset-x-8 bottom-8">
          <audio
            src={declaration.mediaUrl}
            controls
            className="w-full"
            onPlay={() => setShowOverlay(false)}
            onPause={() => setShowOverlay(true)}
            onEnded={() => setShowOverlay(true)}
          />
        </div>
      )}
    </div>
  );
}
