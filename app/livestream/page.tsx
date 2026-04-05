'use client';

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LivestreamFooter from '@/components/LivestreamFooter';
import LiveChat from '@/components/LiveChat';
import QuillEditor from '@/components/QuillEditor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenText, MessageSquareText, StickyNote } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { sendGivingNotification } from '@/lib/email';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type ToolKey = 'bible' | 'notepad' | 'chat' | 'testimony' | 'give' | null;

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
};

const TOOL_CONFIG = {
  bible: {
    label: 'Bible',
    url: 'https://app.fetch.bible',
  },
} as const;

const TOOL_TABS: Array<{ key: ToolKey; label: string; kind: 'embed' | 'component' | 'form' }> = [
  { key: 'chat', label: 'Live Chat', kind: 'component' },
  { key: 'notepad', label: 'Notepad', kind: 'component' },
  { key: 'bible', label: 'Bible', kind: 'embed' },
  { key: 'testimony', label: 'Send Testimony', kind: 'form' },
  { key: 'give', label: 'Give', kind: 'form' },
];

export default function LivestreamPage() {
  const [ytReady, setYtReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>(null);
  const [notepadContent, setNotepadContent] = useState('');
  const [testimonyForm, setTestimonyForm] = useState({
    fullName: '',
    phone: '',
    area: '',
    situation: '',
    testimony: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [giveForm, setGiveForm] = useState({
    currency: 'MWK',
    amount: '',
    fullName: '',
    email: '',
    phone: '',
    phoneCountry: '+265',
    bookletNumber: '',
    givingDate: '',
    givingType: '',
    specialRecipient: '',
    reason: '',
    paymentMethod: 'airtel',
  });
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const CHANNEL_ID = 'UC5iA3dWaUBlP_PBlGSQvgNQ';
  const FALLBACK_HERO_ID = 'ydTADwZRquA';
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
  const activeEmbedTool = activeTool && activeTool !== 'testimony' && activeTool !== 'give' && activeTool !== 'chat' && activeTool !== 'notepad'
    ? TOOL_CONFIG[activeTool]
    : null;

  const featuredVideo = videos[0] || null;
  const gridVideos = videos.slice(1, 4);

  const formatDate = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    let isMounted = true;

    const toVideo = (item: any): YouTubeVideo | null => {
      const videoId = item?.id?.videoId;
      if (!videoId) return null;
      const snippet = item.snippet || {};
      return {
        videoId,
        title: snippet.title || '',
        publishedAt: snippet.publishedAt || '',
        updatedAt: snippet.publishedAt || '',
        channelTitle: snippet.channelTitle || '',
        description: snippet.description || '',
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        isLive: snippet.liveBroadcastContent === 'live',
      };
    };

    const fetchJson = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load videos');
      }
      return response.json();
    };

    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (!YOUTUBE_API_KEY) {
          throw new Error('Missing API key');
        }

        const liveUrl = new URL('https://www.googleapis.com/youtube/v3/search');
        liveUrl.searchParams.set('part', 'snippet');
        liveUrl.searchParams.set('channelId', CHANNEL_ID);
        liveUrl.searchParams.set('eventType', 'live');
        liveUrl.searchParams.set('type', 'video');
        liveUrl.searchParams.set('maxResults', '1');
        liveUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const recentUrl = new URL('https://www.googleapis.com/youtube/v3/search');
        recentUrl.searchParams.set('part', 'snippet');
        recentUrl.searchParams.set('channelId', CHANNEL_ID);
        recentUrl.searchParams.set('order', 'date');
        recentUrl.searchParams.set('type', 'video');
        recentUrl.searchParams.set('maxResults', '4');
        recentUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const [liveData, recentData] = await Promise.all([
          fetchJson(liveUrl.toString()),
          fetchJson(recentUrl.toString()),
        ]);

        const liveVideo = Array.isArray(liveData?.items) ? toVideo(liveData.items[0]) : null;
        const recentVideos: YouTubeVideo[] = Array.isArray(recentData?.items)
          ? recentData.items
            .map(toVideo)
            .filter((item: YouTubeVideo | null): item is YouTubeVideo => Boolean(item))
          : [];

        const merged: YouTubeVideo[] = [];
        if (liveVideo) merged.push(liveVideo);
        recentVideos.forEach((video: YouTubeVideo) => {
          if (!merged.find((existing) => existing.videoId === video?.videoId) && video) {
            merged.push(video);
          }
        });

        if (isMounted) {
          setVideos(merged.slice(0, 4));
        }
      } catch (error) {
        if (isMounted) {
          setLoadError('Unable to load the latest videos right now.');
          setVideos([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchVideos();
    return () => {
      isMounted = false;
    };
  }, [YOUTUBE_API_KEY]);

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

  const handleTestimonyChange = (field: keyof typeof testimonyForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTestimonyForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleTestimonySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = 'Testimony Submission';
    const body = [
      `Full Name: ${testimonyForm.fullName}`,
      `Phone Number: ${testimonyForm.phone || 'N/A'}`,
      `Area of Testimony: ${testimonyForm.area || 'N/A'}`,
      '',
      'How the situation was like:',
      testimonyForm.situation,
      '',
      'What God has done:',
      testimonyForm.testimony,
    ].join('\n');

    window.location.href = `mailto:info@piccworldwide.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const normalizePaychanguPhone = (countryCode: string, rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    if (countryCode === '+265') {
      return digits.replace(/^0+/, '');
    }
    return `${countryCode}${digits}`;
  };

  const handleGiveChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setGiveForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGiveSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!giveForm.amount || !giveForm.fullName || !giveForm.phone) {
      setFormError('Please complete the required fields before submitting.');
      return;
    }

    const nameParts = giveForm.fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      setFormError('Please enter your full name (first and last).');
      return;
    }
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const normalizedPhone = normalizePaychanguPhone(giveForm.phoneCountry, giveForm.phone);
    if (giveForm.phoneCountry === '+265' && normalizedPhone.length !== 9) {
      setFormError('Please enter a valid Malawi mobile number with 9 digits.');
      return;
    }

    const resolvedReason =
      giveForm.reason || giveForm.givingType || 'Giving';

    setIsSubmitting(true);
    try {
      // First, save the giving record to the database
      const givingResponse = await fetch(apiUrl('/api/giving'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookletNumber: giveForm.bookletNumber,
          givingDate: giveForm.givingDate,
          givingType: giveForm.givingType,
          specialRecipient: giveForm.specialRecipient,
          amount: parseFloat(giveForm.amount),
          currency: giveForm.currency,
          fullName: giveForm.fullName,
          email: giveForm.email,
          phone: normalizedPhone,
          phoneCountry: giveForm.phoneCountry,
          paymentMethod: giveForm.paymentMethod,
          reason: resolvedReason,
        }),
      });

      if (!givingResponse.ok) {
        const givingData = await givingResponse.json();
        throw new Error(givingData.error || 'Failed to save giving record');
      }

      // Then proceed with PayChangu payment
      const paymentResponse = await fetch(apiUrl('/api/paychangu/initialize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: giveForm.amount,
          firstName,
          lastName,
          phone: normalizedPhone,
          paymentMethod: giveForm.paymentMethod,
          reason: resolvedReason,
        }),
      });

      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) {
        const errorMessage =
          typeof paymentData?.error === 'string'
            ? paymentData.error
            : paymentData?.message || JSON.stringify(paymentData?.error) || 'Payment initialization failed.';
        throw new Error(errorMessage);
      }

      try {
        await sendGivingNotification({
          userEmail: giveForm.email || undefined,
          churchEmail: 'info@piccworldwide.org',
          fullName: giveForm.fullName,
          amount: giveForm.amount,
          currency: giveForm.currency,
          phone: normalizedPhone,
          phoneCountry: giveForm.phoneCountry,
          paymentMethod: giveForm.paymentMethod,
          reason: resolvedReason,
          givingType: giveForm.givingType,
          specialRecipient: giveForm.specialRecipient,
          givingDate: giveForm.givingDate,
          bookletNumber: giveForm.bookletNumber,
        });
      } catch (emailError) {
        console.error('Giving notification email failed:', emailError);
      }

      setFormSuccess('Thank you! Your giving request was submitted. Follow the mobile prompt to complete payment.');
      setGiveForm((prev) => ({
        ...prev,
        currency: 'MWK',
        amount: '',
        fullName: '',
        email: '',
        phone: '',
        phoneCountry: '+265',
        bookletNumber: '',
        givingDate: '',
        givingType: '',
        specialRecipient: '',
        reason: '',
        paymentMethod: 'airtel',
      }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                  id="yt-hero"
                  src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                  title={featuredVideo?.title || 'Sunday Livestream'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="bg-white text-black px-6 py-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {featuredVideo?.title || 'Stream in English'}
                    </h3>
                    {featuredVideo?.publishedAt && (
                      <p className="text-xs text-black/60 mt-1">
                        {formatDate(featuredVideo.publishedAt)}
                      </p>
                    )}
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
                    <button
                      type="button"
                      onClick={() => setActiveTool('testimony')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#CFF6DF] px-3 py-1 text-xs font-medium text-[#137A3D] hover:bg-[#BDEFD3] transition-colors"
                    >
                      Send Testimony
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool('give')}
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
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {tool.label}
                      </button>
                    ))}
                    <span className="ml-auto text-[10px] normal-case tracking-normal text-white/50">
                      Embedded view
                    </span>
                  </div>
                  {activeEmbedTool && (
                    <div className="aspect-[4/3] w-full bg-black">
                      <iframe
                        className="h-full w-full"
                        src={activeEmbedTool.url}
                        title={activeEmbedTool.label}
                        allow="clipboard-write; fullscreen"
                      />
                    </div>
                  )}
                  {activeTool === 'chat' && (
                    <div className="h-[400px] w-full bg-black">
                      <LiveChat />
                    </div>
                  )}
                  {activeTool === 'notepad' && (
                    <div className="bg-black text-white p-6">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Notepad</h3>
                          <p className="text-white/70 text-sm mb-4">
                            Take notes during the livestream. Your notes are saved locally in your browser.
                          </p>
                        </div>
                        <div className="bg-white rounded-lg overflow-hidden">
                          <QuillEditor
                            value={notepadContent}
                            onChange={setNotepadContent}
                            placeholder="Type your notes here..."
                            modules={{
                              toolbar: [
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ list: 'ordered' }, { list: 'bullet' }],
                                ['blockquote', 'code-block'],
                                ['link'],
                                ['clean'],
                              ],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTool === 'testimony' && (
                    <div className="px-5 py-6 text-white">
                      <h3 className="text-lg font-semibold mb-2">Submit a testimony</h3>
                      <p className="text-white/70 mb-5">
                        Share what God has done in your life and encourage others.
                      </p>
                      <form className="grid gap-4" onSubmit={handleTestimonySubmit}>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            Full Name
                          </label>
                          <input
                            type="text"
                            placeholder="Full Name"
                            required
                            value={testimonyForm.fullName}
                            onChange={handleTestimonyChange('fullName')}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={testimonyForm.phone}
                            onChange={handleTestimonyChange('phone')}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            Area of Testimony
                          </label>
                          <input
                            type="text"
                            placeholder="Area of Testimony"
                            value={testimonyForm.area}
                            onChange={handleTestimonyChange('area')}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            How the situation was like
                          </label>
                          <textarea
                            rows={4}
                            placeholder="Describe the situation"
                            required
                            value={testimonyForm.situation}
                            onChange={handleTestimonyChange('situation')}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            What God has done
                          </label>
                          <textarea
                            rows={4}
                            placeholder="Share what God has done"
                            required
                            value={testimonyForm.testimony}
                            onChange={handleTestimonyChange('testimony')}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                        <Button className="w-full bg-white text-black hover:bg-white/90">
                          Submit Testimony
                        </Button>
                      </form>
                    </div>
                  )}
                  {activeTool === 'give' && (
                    <div className="px-5 py-6 text-white">
                      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-black/10 text-black">
                        <div className="border-2 border-black/10 rounded-2xl p-4 sm:p-6">
                          <div className="text-center space-y-2">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
                              <Image
                                src="/logo.png"
                                alt="PICC logo"
                                width={40}
                                height={40}
                                className="h-10 w-10 object-contain"
                              />
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-black/50">
                              Pentecost International Christian Centre
                            </p>
                            <h3 className="text-xl font-semibold text-black">Give Now</h3>
                          </div>

                          <form onSubmit={handleGiveSubmit} className="mt-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                                <span className="sm:min-w-[110px] text-black/70">Booklet No.</span>
                                <input
                                  type="text"
                                  name="bookletNumber"
                                  value={giveForm.bookletNumber}
                                  onChange={handleGiveChange}
                                  className="w-full min-w-0 flex-1 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                                  placeholder="..............."
                                />
                              </label>
                              <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                                <span className="sm:min-w-[70px] text-black/70">Date</span>
                                <input
                                  type="date"
                                  name="givingDate"
                                  value={giveForm.givingDate}
                                  onChange={handleGiveChange}
                                  className="w-full min-w-0 flex-1 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
                              <div>
                                <p className="text-sm font-semibold text-black/70 mb-3">Tick where appropriate</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                  {[
                                    'First Fruit',
                                    'Tithe',
                                    'Project Offering',
                                    'Thanks Giving',
                                    "Prophet's Offering",
                                  ].map((label) => (
                                    <label key={label} className="flex items-center gap-3">
                                      <input
                                        type="radio"
                                        name="givingType"
                                        value={label}
                                        checked={giveForm.givingType === label}
                                        onChange={handleGiveChange}
                                        className="h-4 w-4 border border-black/40"
                                      />
                                      <span className="text-black/70">{label}</span>
                                    </label>
                                  ))}
                                </div>
                                <label className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm min-w-0">
                                  <span className="sm:min-w-[130px] text-black/70">Special Recipient</span>
                                  <input
                                    type="text"
                                    name="specialRecipient"
                                    value={giveForm.specialRecipient}
                                    onChange={handleGiveChange}
                                    className="w-full min-w-0 flex-1 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                                    placeholder="........................"
                                  />
                                </label>
                              </div>

                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] items-start sm:items-center gap-3 text-sm min-w-0">
                                  <span className="text-black/70">Amount</span>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                                    <select
                                      id="currency"
                                      name="currency"
                                      value={giveForm.currency}
                                      onChange={handleGiveChange}
                                      className="h-10 w-full sm:w-auto rounded-full border border-black/20 bg-white px-3 text-xs"
                                    >
                                      <option value="MWK">MWK</option>
                                      <option value="USD">USD</option>
                                    </select>
                                    <input
                                      id="amount"
                                      type="number"
                                      name="amount"
                                      value={giveForm.amount}
                                      onChange={handleGiveChange}
                                      placeholder="0.00"
                                      min="1"
                                      step="any"
                                      inputMode="decimal"
                                      className="h-10 w-full min-w-0 flex-1 rounded-full border border-black/10 bg-white px-3 text-sm"
                                      required
                                    />
                                  </div>
                                </div>

                                <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm min-w-0">
                                  <span className="sm:min-w-[110px] text-black/70">Full Names</span>
                                  <input
                                    type="text"
                                    name="fullName"
                                    value={giveForm.fullName}
                                    onChange={handleGiveChange}
                                    className="w-full min-w-0 flex-1 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                                    placeholder="...................................."
                                    required
                                  />
                                </label>

                                <div className="grid grid-cols-1 gap-3 text-sm">
                                  <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                                    <span className="sm:min-w-[110px] text-black/70">Email</span>
                                    <input
                                      type="email"
                                      name="email"
                                      value={giveForm.email}
                                      onChange={handleGiveChange}
                                      className="w-full min-w-0 flex-1 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                                      placeholder="name@email.com"
                                    />
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 min-w-0">
                                    <select
                                      id="phoneCountry"
                                      name="phoneCountry"
                                      value={giveForm.phoneCountry}
                                      onChange={handleGiveChange}
                                      className="h-10 w-full rounded-full border border-black/20 bg-white px-3 text-xs"
                                    >
                                      <option value="+265">Malawi (+265)</option>
                                      <option value="+233">Ghana (+233)</option>
                                      <option value="+234">Nigeria (+234)</option>
                                      <option value="+254">Kenya (+254)</option>
                                      <option value="+255">Tanzania (+255)</option>
                                      <option value="+260">Zambia (+260)</option>
                                      <option value="+27">South Africa (+27)</option>
                                      <option value="+44">United Kingdom (+44)</option>
                                      <option value="+1">United States (+1)</option>
                                    </select>
                                    <input
                                      id="phone"
                                      type="tel"
                                      name="phone"
                                      value={giveForm.phone}
                                      onChange={handleGiveChange}
                                      placeholder="Phone number"
                                      className="h-10 w-full min-w-0 rounded-full border border-black/10 bg-white px-3 text-sm"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-black/10 bg-white p-5">
                              <h4 className="text-lg font-semibold text-black mb-4">Payment Info</h4>
                              <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-black">Payment Method</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <label htmlFor="paymentMethodAirtel" className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3">
                                    <input
                                      id="paymentMethodAirtel"
                                      type="radio"
                                      name="paymentMethod"
                                      value="airtel"
                                      checked={giveForm.paymentMethod === 'airtel'}
                                      onChange={handleGiveChange}
                                    />
                                    <span className="text-sm font-medium text-black">Airtel Money</span>
                                  </label>
                                  <label htmlFor="paymentMethodMpamba" className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3">
                                    <input
                                      id="paymentMethodMpamba"
                                      type="radio"
                                      name="paymentMethod"
                                      value="mpamba"
                                      checked={giveForm.paymentMethod === 'mpamba'}
                                      onChange={handleGiveChange}
                                    />
                                    <span className="text-sm font-medium text-black">Mpamba</span>
                                  </label>
                                </div>
                              </div>
                              <div className="mt-4 flex flex-col gap-2">
                                <label htmlFor="reason" className="text-sm font-medium text-black">
                                  Giving Reason
                                </label>
                                <input
                                  id="reason"
                                  type="text"
                                  name="reason"
                                  value={giveForm.reason}
                                  onChange={handleGiveChange}
                                  placeholder="Giving Reason"
                                  className="h-12 rounded-full border border-black/10 bg-white px-4 text-sm"
                                />
                              </div>
                              <div className="mt-6">
                                <Button
                                  type="submit"
                                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? 'Processing...' : 'Give'}
                                </Button>
                              </div>
                              {formError && (
                                <p className="mt-4 text-sm text-red-600">{formError}</p>
                              )}
                              {formSuccess && (
                                <p className="mt-4 text-sm text-green-600">{formSuccess}</p>
                              )}
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/70">
                    <span>
                      {activeTool === 'testimony'
                        ? 'Testimony Form'
                        : activeTool === 'give'
                          ? 'Giving Form'
                          : activeTool === 'chat'
                            ? 'Live Chat'
                            : activeEmbedTool?.label}
                      {activeTool === 'notepad' && (
                        <span className="ml-2 text-white/50">
                          Tip: use the save/download button inside the notepad.
                        </span>
                      )}
                    </span>
                    {activeEmbedTool && (
                      <Link
                        href={activeEmbedTool.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white/80 hover:text-white hover:underline"
                      >
                        Open in new tab
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </section>
            <section className="md:hidden">
              <div className="fixed inset-0 z-40 bg-black">
                <div className="h-[40vh] bg-black">
                  <iframe
                    className="h-full w-full"
                    data-yt-id={featuredVideo?.videoId || FALLBACK_HERO_ID}
                    id="yt-mobile"
                    src={`${featuredVideo?.embedUrl || `https://www.youtube.com/embed/${FALLBACK_HERO_ID}`}?enablejsapi=1&rel=0`}
                    title={featuredVideo?.title || 'Sunday Livestream'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="flex h-[60vh] flex-col overflow-hidden border-t border-white/10 bg-[#111111]">
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
                  <div className="flex-1 overflow-y-auto px-4 py-5 text-white">
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
                        <LiveChat />
                      </div>
                    )}
                    {activeTool === 'notepad' && (
                      <div className="bg-black text-white mb-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Notepad</h3>
                            <p className="text-white/70 text-sm mb-4">
                              Take notes during the livestream. Your notes are saved locally in your browser.
                            </p>
                          </div>
                          <div className="bg-white rounded-lg overflow-hidden">
                            <QuillEditor
                              value={notepadContent}
                              onChange={setNotepadContent}
                              placeholder="Type your notes here..."
                              modules={{
                                toolbar: [
                                  ['bold', 'italic', 'underline', 'strike'],
                                  [{ list: 'ordered' }, { list: 'bullet' }],
                                  ['blockquote', 'code-block'],
                                  ['link'],
                                  ['clean'],
                                ],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTool === 'testimony' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Submit a testimony</h3>
                        <p className="text-white/70 mb-5">
                          Share what God has done in your life and encourage others.
                        </p>
                        <form className="grid gap-4" onSubmit={handleTestimonySubmit}>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                              Full Name
                            </label>
                            <input
                              type="text"
                              placeholder="Full Name"
                              required
                              value={testimonyForm.fullName}
                              onChange={handleTestimonyChange('fullName')}
                              className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              placeholder="Phone Number"
                              value={testimonyForm.phone}
                              onChange={handleTestimonyChange('phone')}
                              className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                              Area of Testimony
                            </label>
                            <input
                              type="text"
                              placeholder="Area of Testimony"
                              value={testimonyForm.area}
                              onChange={handleTestimonyChange('area')}
                              className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                              How the situation was like
                            </label>
                            <textarea
                              rows={4}
                              placeholder="Describe the situation"
                              required
                              value={testimonyForm.situation}
                              onChange={handleTestimonyChange('situation')}
                              className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                              What God has done
                            </label>
                            <textarea
                              rows={4}
                              placeholder="Share what God has done"
                              required
                              value={testimonyForm.testimony}
                              onChange={handleTestimonyChange('testimony')}
                              className="mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                            />
                          </div>
                          <Button className="w-full bg-white text-black hover:bg-white/90">
                            Submit Testimony
                          </Button>
                        </form>
                      </div>
                    )}
                    {activeTool === 'give' && (
                      <div className="px-4 py-5 text-white">
                        <div className="rounded-3xl bg-white p-5 shadow-sm border border-black/10 text-black">
                          <div className="border-2 border-black/10 rounded-2xl p-4">
                            <div className="text-center space-y-2">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
                                <Image
                                  src="/logo.png"
                                  alt="PICC logo"
                                  width={36}
                                  height={36}
                                  className="h-9 w-9 object-contain"
                                />
                              </div>
                              <p className="text-[10px] uppercase tracking-[0.35em] text-black/50">
                                Pentecost International Christian Centre
                              </p>
                              <h3 className="text-lg font-semibold text-black">Give Now</h3>
                            </div>

                            <form onSubmit={handleGiveSubmit} className="mt-5 space-y-6">
                              <div className="grid grid-cols-1 gap-3 text-sm">
                                <label className="flex flex-col gap-2 min-w-0">
                                  <span className="text-black/70">Booklet No.</span>
                                  <input
                                    type="text"
                                    name="bookletNumber"
                                    value={giveForm.bookletNumber}
                                    onChange={handleGiveChange}
                                    className="w-full min-w-0 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                                    placeholder="..............."
                                  />
                                </label>
                                <label className="flex flex-col gap-2 min-w-0">
                                  <span className="text-black/70">Date</span>
                                  <input
                                    type="date"
                                    name="givingDate"
                                    value={giveForm.givingDate}
                                    onChange={handleGiveChange}
                                    className="w-full min-w-0 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                                  />
                                </label>
                              </div>

                              <div className="space-y-3">
                                <p className="text-sm font-semibold text-black/70">Tick where appropriate</p>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                  {[
                                    'First Fruit',
                                    'Tithe',
                                    'Project Offering',
                                    'Thanks Giving',
                                    "Prophet's Offering",
                                  ].map((label) => (
                                    <label key={label} className="flex items-center gap-3">
                                      <input
                                        type="radio"
                                        name="givingType"
                                        value={label}
                                        checked={giveForm.givingType === label}
                                        onChange={handleGiveChange}
                                        className="h-4 w-4 border border-black/40"
                                      />
                                      <span className="text-black/70">{label}</span>
                                    </label>
                                  ))}
                                </div>
                                <label className="mt-2 flex flex-col gap-2 text-sm min-w-0">
                                  <span className="text-black/70">Special Recipient</span>
                                  <input
                                    type="text"
                                    name="specialRecipient"
                                    value={giveForm.specialRecipient}
                                    onChange={handleGiveChange}
                                    className="w-full min-w-0 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                                    placeholder="........................"
                                  />
                                </label>
                              </div>

                              <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-3 text-sm min-w-0">
                                  <span className="text-black/70">Amount</span>
                                  <div className="flex flex-col gap-3 min-w-0">
                                    <select
                                      id="currencyMobile"
                                      name="currency"
                                      value={giveForm.currency}
                                      onChange={handleGiveChange}
                                      className="h-10 w-full rounded-full border border-black/20 bg-white px-3 text-xs"
                                    >
                                      <option value="MWK">MWK</option>
                                      <option value="USD">USD</option>
                                    </select>
                                    <input
                                      id="amountMobile"
                                      type="number"
                                      name="amount"
                                      value={giveForm.amount}
                                      onChange={handleGiveChange}
                                      placeholder="0.00"
                                      min="1"
                                      step="any"
                                      inputMode="decimal"
                                      className="h-10 w-full min-w-0 rounded-full border border-black/10 bg-white px-3 text-sm"
                                      required
                                    />
                                  </div>
                                </div>

                                <label className="flex flex-col gap-2 text-sm min-w-0">
                                  <span className="text-black/70">Full Names</span>
                                  <input
                                    type="text"
                                    name="fullName"
                                    value={giveForm.fullName}
                                    onChange={handleGiveChange}
                                    className="w-full min-w-0 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                                    placeholder="...................................."
                                    required
                                  />
                                </label>

                                <label className="flex flex-col gap-2 text-sm min-w-0">
                                  <span className="text-black/70">Email</span>
                                  <input
                                    type="email"
                                    name="email"
                                    value={giveForm.email}
                                    onChange={handleGiveChange}
                                    className="w-full min-w-0 border-b border-dashed border-black/40 bg-transparent py-1 outline-none"
                                    placeholder="name@email.com"
                                  />
                                </label>

                                <div className="grid grid-cols-1 gap-3 min-w-0">
                                  <select
                                    id="phoneCountryMobile"
                                    name="phoneCountry"
                                    value={giveForm.phoneCountry}
                                    onChange={handleGiveChange}
                                    className="h-10 w-full rounded-full border border-black/20 bg-white px-3 text-xs"
                                  >
                                    <option value="+265">Malawi (+265)</option>
                                    <option value="+233">Ghana (+233)</option>
                                    <option value="+234">Nigeria (+234)</option>
                                    <option value="+254">Kenya (+254)</option>
                                    <option value="+255">Tanzania (+255)</option>
                                    <option value="+260">Zambia (+260)</option>
                                    <option value="+27">South Africa (+27)</option>
                                    <option value="+44">United Kingdom (+44)</option>
                                    <option value="+1">United States (+1)</option>
                                  </select>
                                  <input
                                    id="phoneMobile"
                                    type="tel"
                                    name="phone"
                                    value={giveForm.phone}
                                    onChange={handleGiveChange}
                                    placeholder="Phone number"
                                    className="h-10 w-full min-w-0 rounded-full border border-black/10 bg-white px-3 text-sm"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="rounded-2xl border border-black/10 bg-white p-4">
                                <h4 className="text-base font-semibold text-black mb-3">Payment Info</h4>
                                <div className="flex flex-col gap-2">
                                  <span className="text-sm font-medium text-black">Payment Method</span>
                                  <div className="grid grid-cols-1 gap-3">
                                    <label htmlFor="paymentMethodAirtelMobile" className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3">
                                      <input
                                        id="paymentMethodAirtelMobile"
                                        type="radio"
                                        name="paymentMethod"
                                        value="airtel"
                                        checked={giveForm.paymentMethod === 'airtel'}
                                        onChange={handleGiveChange}
                                      />
                                      <span className="text-sm font-medium text-black">Airtel Money</span>
                                    </label>
                                    <label htmlFor="paymentMethodMpambaMobile" className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3">
                                      <input
                                        id="paymentMethodMpambaMobile"
                                        type="radio"
                                        name="paymentMethod"
                                        value="mpamba"
                                        checked={giveForm.paymentMethod === 'mpamba'}
                                        onChange={handleGiveChange}
                                      />
                                      <span className="text-sm font-medium text-black">Mpamba</span>
                                    </label>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-col gap-2">
                                  <label htmlFor="reasonMobile" className="text-sm font-medium text-black">
                                    Giving Reason
                                  </label>
                                  <input
                                    id="reasonMobile"
                                    type="text"
                                    name="reason"
                                    value={giveForm.reason}
                                    onChange={handleGiveChange}
                                    placeholder="Giving Reason"
                                    className="h-12 rounded-full border border-black/10 bg-white px-4 text-sm"
                                  />
                                </div>
                                <div className="mt-5">
                                  <Button
                                    type="submit"
                                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting ? 'Processing...' : 'Give'}
                                  </Button>
                                </div>
                                {formError && (
                                  <p className="mt-4 text-sm text-red-600">{formError}</p>
                                )}
                                {formSuccess && (
                                  <p className="mt-4 text-sm text-green-600">{formSuccess}</p>
                                )}
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Search Section */}        <section className="py-10 md:py-12 bg-black border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          </div>
        </section>

        {/* Livestreams Grid */}
        <section className="py-16 sm:py-20 md:py-24 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-lg text-white/70">Loading latest videos...</p>
              </div>
            ) : loadError ? (
              <div className="text-center py-12">
                <p className="text-lg text-white/70">{loadError}</p>
              </div>
            ) : gridVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridVideos.map((stream) => (
                  <Card key={stream.videoId} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-white border-black/10 text-black">
                    <div className="aspect-video bg-black">
                      <iframe
                        className="h-full w-full"
                        data-yt-id={stream.videoId}
                        id={`yt-${stream.videoId}`}
                        src={`${stream.embedUrl}?enablejsapi=1&rel=0`}
                        title={stream.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-4 flex flex-col">
                      <h3 className="font-bold text-lg text-black mb-2 line-clamp-2">{stream.title}</h3>
                      <p className="text-sm text-black/70 mb-3 line-clamp-2">{stream.description}</p>
                      <div className="space-y-1 text-sm text-black/60 mb-2">
                        <p>{stream.channelTitle}</p>
                        {stream.publishedAt && <p>{formatDate(stream.publishedAt)}</p>}
                      </div>
                      {stream.url && (
                        <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                          <Link href={stream.url} target="_blank" rel="noreferrer">
                            Watch on YouTube
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-white/70">No recent videos available yet.</p>
              </div>
            )}
          </div>
        </section>

      </main>
      <LivestreamFooter />
    </>
  );
}
