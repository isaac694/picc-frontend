'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, apiUrl } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { CalendarClock, MapPin, Search, ArrowLeft, Filter, Play, Music, X } from 'lucide-react';

interface Sermon {
  id: string;
  title: string;
  date: string;
  image: string;
  views: string;
  youtubeUrl: string;
  audioSrc: string;
  pastor?: string;
  series?: string;
  topic?: string;
}

const FALLBACK_SERMON_IMAGE = '/sermons/header.JPG';

// Helper functions for YouTube
function getYouTubeId(url: string): string {
  if (!url) return '';
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : '';
}

function getYouTubeStart(url: string): number {
  if (!url) return 0;
  const match = url.match(/[?&]t=(\d+)s?/);
  return match ? parseInt(match[1], 10) : 0;
}

// Helper functions for Podbean
const isPodbeanUrl = (url?: string): boolean => {
  if (!url) return false;
  try {
    return new URL(url).hostname.toLowerCase().includes('podbean.com');
  } catch {
    return false;
  }
};

const isPodbeanEmbedUrl = (url?: string): boolean => {
  if (!url || !isPodbeanUrl(url)) return false;
  return /player|embed/i.test(url);
};

export default function SermonsArchivePage() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const normalizeAssetUrl = (url?: string | null): string | undefined => {
    const trimmed = typeof url === 'string' ? url.trim() : '';
    if (!trimmed) return undefined;
    if (trimmed.startsWith('http')) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return apiUrl(`/${trimmed}`);
  };

  const normalizeSermon = (value: unknown): Sermon | null => {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    const id = typeof record.id === 'string' || typeof record.id === 'number' ? String(record.id) : '';
    if (!id) return null;

    return {
      id,
      title: typeof record.title === 'string' ? record.title : 'Untitled sermon',
      date: typeof record.date === 'string' ? record.date : '',
      image: typeof record.image === 'string' ? record.image : '',
      views: typeof record.views === 'string' ? record.views : '0',
      youtubeUrl: typeof record.youtubeUrl === 'string' ? record.youtubeUrl : '',
      audioSrc: typeof record.audioSrc === 'string' ? record.audioSrc : '',
      pastor: typeof record.pastor === 'string' ? record.pastor : '',
      series: typeof record.series === 'string' ? record.series : '',
      topic: typeof record.topic === 'string' ? record.topic : '',
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiFetch('/api/sermons?take=1000'); 
        if (response.ok) {
          const data = await response.json();
          const list = data.sermons || [];
          setSermons(list.map(normalizeSermon).filter(Boolean) as Sermon[]);
        }
      } catch (error) {
        console.error('Failed to fetch sermons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derived filter options
  const filterOptions = useMemo(() => {
    const speakers = new Set<string>();
    const years = new Set<string>();
    const series = new Set<string>();
    const topics = new Set<string>();

    sermons.forEach(s => {
      if (s.pastor) speakers.add(s.pastor);
      if (s.series) series.add(s.series);
      if (s.topic) topics.add(s.topic);
      if (s.date) {
        const year = new Date(s.date).getFullYear();
        if (!isNaN(year)) years.add(String(year));
      }
    });

    return {
      speakers: Array.from(speakers).sort(),
      years: Array.from(years).sort((a, b) => b.localeCompare(a)),
      series: Array.from(series).sort(),
      topics: Array.from(topics).sort(),
    };
  }, [sermons]);

  const filteredSermons = useMemo(() => {
    return sermons.filter(s => {
      const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || (s.pastor || '').toLowerCase().includes(search.toLowerCase());
      const matchesSpeaker = selectedSpeaker === 'all' || s.pastor === selectedSpeaker;
      const matchesYear = selectedYear === 'all' || (s.date && new Date(s.date).getFullYear().toString() === selectedYear);
      const matchesMonth = selectedMonth === 'all' || (s.date && (new Date(s.date).getMonth() + 1).toString() === selectedMonth);
      const matchesSeries = selectedSeries === 'all' || s.series === selectedSeries;
      const matchesTopic = selectedTopic === 'all' || s.topic === selectedTopic;

      return matchesSearch && matchesSpeaker && matchesYear && matchesMonth && matchesSeries && matchesTopic;
    });
  }, [sermons, search, selectedSpeaker, selectedYear, selectedMonth, selectedSeries, selectedTopic]);

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const handleOpenSermon = (sermon: Sermon) => {
    setSelectedSermon(sermon);
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-50 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Simple Header */}
          <div className="mb-12">
            <Link 
              href="/sermons"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sermons
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-primary/70 mb-3">
                  Spiritual Archive
                </p>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900">Sermon Library</h1>
                <p className="mt-4 text-slate-600 max-w-2xl text-lg">
                  Explore our full collection of spiritual teachings, filterable by speaker, topic, or series.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by title or speaker..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm h-11"
                />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-10 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mr-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">Filters</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 flex-grow">
              <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-10">
                  <SelectValue placeholder="Speaker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Speakers</SelectItem>
                  {filterOptions.speakers.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-10">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {filterOptions.years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-10">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-10">
                  <SelectValue placeholder="Series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Series</SelectItem>
                  {filterOptions.series.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-10">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {filterOptions.topics.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(selectedSpeaker !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all' || selectedSeries !== 'all' || selectedTopic !== 'all' || search) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearch('');
                  setSelectedSpeaker('all');
                  setSelectedYear('all');
                  setSelectedMonth('all');
                  setSelectedSeries('all');
                  setSelectedTopic('all');
                }}
                className="text-primary hover:text-primary/80 h-10 px-4 font-semibold"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between mb-8 px-2">
            <p className="text-sm font-medium text-slate-500">
              Showing <span className="text-slate-900 font-bold">{filteredSermons.length}</span> sermons
            </p>
          </div>

          {/* Sermons Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredSermons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredSermons.map((sermon) => (
                <article 
                  key={sermon.id} 
                  className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 cursor-pointer"
                  onClick={() => handleOpenSermon(sermon)}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={normalizeAssetUrl(sermon.image) ?? FALLBACK_SERMON_IMAGE}
                      alt={sermon.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                      </div>
                    </div>
                    {sermon.series && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-primary/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
                          {sermon.series}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-md">
                        <CalendarClock className="w-3 h-3" />
                        {new Date(sermon.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {sermon.topic && (
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                          {sermon.topic}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2 text-slate-900">
                      {sermon.title}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      {sermon.pastor || 'PICC'}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold text-primary hover:underline uppercase tracking-widest flex items-center gap-2">
                        {sermon.youtubeUrl ? <Play className="w-3 h-3 fill-primary" /> : <Music className="w-3 h-3" />}
                        {sermon.youtubeUrl ? 'Watch Video' : 'Listen Audio'}
                      </span>
                      <div className="flex items-center gap-3 text-slate-400">
                        {sermon.youtubeUrl && (
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        )}
                        {sermon.audioSrc && (
                          <Music className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-200 shadow-sm">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No sermons found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your filters or search keywords.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearch('');
                  setSelectedSpeaker('all');
                  setSelectedYear('all');
                  setSelectedMonth('all');
                  setSelectedSeries('all');
                  setSelectedTopic('all');
                }}
                className="mt-8 rounded-xl"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Sermon Player Modal */}
      <Dialog open={!!selectedSermon} onOpenChange={(open) => !open && setSelectedSermon(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden border-none bg-slate-900 rounded-2xl md:rounded-3xl shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedSermon?.title}</DialogTitle>
            <DialogDescription>
              {selectedSermon?.pastor} - {selectedSermon?.date}
            </DialogDescription>
          </DialogHeader>

          {selectedSermon && (
            <div className="flex flex-col h-full max-h-[90vh]">
              {/* Media Section */}
              <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                {selectedSermon.youtubeUrl ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(selectedSermon.youtubeUrl)}?autoplay=1&start=${getYouTubeStart(selectedSermon.youtubeUrl)}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : selectedSermon.audioSrc ? (
                  <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-800 to-slate-900">
                    {isPodbeanEmbedUrl(selectedSermon.audioSrc) ? (
                      <iframe
                        src={selectedSermon.audioSrc}
                        className="w-full h-[150px] border-0"
                        scrolling="no"
                        title={selectedSermon.title}
                      />
                    ) : (
                      <div className="w-full max-w-md text-center">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Music className="w-10 h-10 text-primary" />
                        </div>
                        <audio
                          src={selectedSermon.audioSrc}
                          controls
                          autoPlay
                          className="w-full h-12"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <p>Media content currently unavailable.</p>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="p-6 md:p-8 bg-white overflow-y-auto">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary mb-4">
                  <span>{new Date(selectedSermon.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  {selectedSermon.topic && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-slate-500">{selectedSermon.topic}</span>
                    </>
                  )}
                  {selectedSermon.series && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-slate-500">{selectedSermon.series}</span>
                    </>
                  )}
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                  {selectedSermon.title}
                </h2>
                
                <div className="flex items-center gap-4 py-4 border-t border-slate-100 mt-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedSermon.pastor || 'PICC'}</p>
                    <p className="text-xs text-slate-500">Spiritual Teacher</p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedSermon(null)}
                    className="rounded-full px-6"
                  >
                    Close Player
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
}
