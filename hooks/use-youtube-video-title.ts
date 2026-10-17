'use client';

import { useEffect, useState } from 'react';
import { fetchYouTubeVideoTitleFromApp } from '@/lib/youtube-video-title-client';
import { isValidYouTubeVideoId } from '@/lib/youtube-client';

export function useYouTubeVideoTitle(videoId: string | null | undefined) {
  const [title, setTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isValidYouTubeVideoId(videoId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when video id cleared
      setTitle(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void fetchYouTubeVideoTitleFromApp(videoId).then((resolved) => {
      if (cancelled) return;
      setTitle(resolved);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  return { title, isLoading };
}
