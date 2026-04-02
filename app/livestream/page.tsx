'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LivestreamFooter from '@/components/LivestreamFooter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpenText, MessageSquareText, StickyNote } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type ToolKey = 'bible' | 'notepad' | 'chat' | null;

const TOOL_CONFIG = {
  bible: {
    label: 'Bible',
    url: 'https://www.biblegateway.com/versions/New-King-James-Version-NKJV-Bible/',
  },
  notepad: {
    label: 'Notepad',
    url: 'https://devtoollab.com/tools/online-notepad',
  },
  chat: {
    label: 'Live Chat',
    url: 'https://tlk.io/picc-worldwide-live',
  },
} as const;

export default function LivestreamPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);

  const livestreams = [
    {
      id: 1,
      title: '01 April 2026',
      channel: 'PICC WorldWide',
      date: '',
      duration: 0,
      description: 'Morning Glory Prayers.',
      type: 'video',
      href: '',
      embed: 'https://www.youtube.com/embed/ED_nMbVeytM',
    },
    {
      id: 2,
      title: '30 March 2026',
      channel: 'PICC WorldWide',
      date: '',
      duration: 0,
      description: 'Morning Glory Prayers.',
      type: 'video',
      href: '',
      embed: 'https://www.youtube.com/embed/abOVO5i-P3g',
    },
    {
      id: 3,
      title: '31 March 2026',
      channel: 'PICC WorldWide',
      date: '',
      duration: 0,
      description: 'Morning Glory Prayers.',
      type: 'video',
      href: '',
      embed: 'https://www.youtube.com/embed/wAwMiy57iXg',
    },
  ];

  const filteredLivestreams = livestreams.filter((stream) =>
    stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stream.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const existingScript = document.getElementById('youtube-iframe-api');

    const handleReady = () => setYtReady(true);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = handleReady;
    } else if (window.YT && window.YT.Player) {
      handleReady();
    } else {
      window.onYouTubeIframeAPIReady = handleReady;
    }
  }, []);

  useEffect(() => {
    if (!ytReady || typeof window === 'undefined' || !window.YT?.Player) return;
    const players = new Map<string, any>();
    const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>('[data-yt-id]'));

    iframes.forEach((iframe) => {
      const videoId = iframe.dataset.ytId;
      if (!videoId || players.has(videoId)) return;
      const player = new window.YT.Player(iframe, {
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
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
  }, [ytReady]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black text-white">
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

        {/* Sunday Livestream Section */}
        <section className="py-12 md:py-16 bg-black">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <div className="aspect-video bg-black">
                <iframe
                  className="h-full w-full"
                  data-yt-id="ydTADwZRquA"
                  id="yt-hero"
                  src="https://www.youtube.com/embed/ydTADwZRquA?enablejsapi=1&rel=0"
                  title="Sunday Livestream"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="bg-white text-black px-6 py-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-semibold">Stream in English</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTool('bible')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-medium text-[#1E4FA3] hover:bg-[#DCEAFF] transition-colors"
                    >
                      <BookOpenText size={12} />
                      Bible
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool('notepad')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#FFF2DA] px-3 py-1 text-xs font-medium text-[#8A5A00] hover:bg-[#FFE9C2] transition-colors"
                    >
                      <StickyNote size={12} />
                      Notepad
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool('chat')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#E8FFF3] px-3 py-1 text-xs font-medium text-[#0F7A3E] hover:bg-[#D8F7E7] transition-colors"
                    >
                      <MessageSquareText size={12} />
                      Live Chat
                    </button>
                    <Link
                      href="/forms"
                      className="inline-flex items-center gap-2 rounded-full bg-[#CFF6DF] px-3 py-1 text-xs font-medium text-[#137A3D] hover:bg-[#BDEFD3] transition-colors"
                    >
                      Church Forms
                    </Link>
                    <Button asChild size="sm" className="rounded-full px-4 bg-[#39D98A] text-black hover:bg-[#2FC77C]">
                      <Link href="/give">Give</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-10 md:py-12 bg-black border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          </div>
        </section>

        {/* Livestreams Grid */}
        <section className="py-16 sm:py-20 md:py-24 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredLivestreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLivestreams.map((stream) => (
                  <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-white border-black/10 text-black">
                    <div className="aspect-video bg-black">
                      <iframe
                        className="h-full w-full"
                        data-yt-id={stream.embed.split('/embed/')[1]}
                        id={`yt-${stream.id}`}
                        src={`${stream.embed}?enablejsapi=1&rel=0`}
                        title={stream.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-4 flex flex-col">
                      <h3 className="font-bold text-lg text-black mb-2 line-clamp-2">{stream.title}</h3>
                      <p className="text-sm text-black/70 mb-3 line-clamp-2">{stream.description}</p>
                      <div className="space-y-1 text-sm text-black/60 mb-2">
                        <p>{stream.channel}</p>
                        {stream.date && <p>{stream.date}</p>}
                        {stream.duration > 0 && <p>{stream.duration} minutes</p>}
                      </div>
                      {stream.href && (
                        <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                          <Link href={stream.href} target="_blank" rel="noreferrer">
                            Watch Livestream
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-white/70">No streams found matching your search.</p>
              </div>
            )}
          </div>
        </section>

      </main>
      <LivestreamFooter />
      {activeTool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${TOOL_CONFIG[activeTool].label} modal`}
          onClick={() => setActiveTool(null)}
        >
          <div
            className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
              <p className="text-sm font-semibold text-black">
                {TOOL_CONFIG[activeTool].label}
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href={TOOL_CONFIG[activeTool].url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open in new tab
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTool(null)}
                  aria-label="Close"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black hover:bg-black/10"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="aspect-[4/3] w-full bg-black">
              <iframe
                className="h-full w-full"
                src={TOOL_CONFIG[activeTool].url}
                title={TOOL_CONFIG[activeTool].label}
                allow="clipboard-write; fullscreen"
              />
            </div>
            <div className="border-t border-black/10 px-5 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}




