export {};

declare global {
  type YouTubePlayer = {
    pauseVideo: () => void;
    getCurrentTime?: () => number;
    destroy: () => void;
  };

  type YouTubeStateChangeEvent = {
    data: number;
    target: YouTubePlayer;
  };

  type YouTubeNamespace = {
    Player: new (
      element: HTMLElement | string,
      options: {
        videoId?: string;
        playerVars?: Record<string, string | number>;
        events?: {
          onStateChange?: (event: YouTubeStateChangeEvent) => void;
          onReady?: (event: { target: YouTubePlayer }) => void;
        };
      },
    ) => YouTubePlayer;
    PlayerState: {
      PLAYING: number;
      PAUSED: number;
      ENDED: number;
      BUFFERING: number;
      CUED: number;
    };
  };

  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}
