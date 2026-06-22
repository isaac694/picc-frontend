'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Search, ArrowLeft, Download, Eye, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { apiFetch, apiUrl } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DEFAULT_MEDIA_MAGAZINES,
  DEFAULT_MEDIA_NEWS,
  type MediaMagazineItem,
  type MediaNewsItem,
} from '@/lib/mediaDefaults';

type ArchiveItem = {
  type: 'news' | 'magazine';
  badge: string;
  date: string;
  title: string;
  description: string;
  image: string;
  fileUrl?: string;
  originalItem: any;
};

const normalizeAssetUrl = (value?: string | null) => {
  if (!value) return '';
  return value.startsWith('http') ? value : apiUrl(value);
};

export default function MediaArchivePage() {
  const [news, setNews] = useState<MediaNewsItem[]>([]);
  const [magazines, setMagazines] = useState<MediaMagazineItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'magazines'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const [newsRes, magRes] = await Promise.all([
          apiFetch('/api/site-content/media-news'),
          apiFetch('/api/site-content/media-magazines'),
        ]);

        if (!alive) return;

        let loadedNews: MediaNewsItem[] = [];
        if (newsRes.ok) {
          const data = await newsRes.json();
          const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
          loadedNews = Array.isArray(parsedBody?.items) ? parsedBody.items : [];
        }

        let loadedMags: MediaMagazineItem[] = [];
        if (magRes.ok) {
          const data = await magRes.json();
          const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
          loadedMags = Array.isArray(parsedBody?.items) ? parsedBody.items : [];
        }

        setNews(loadedNews);
        setMagazines(loadedMags);
      } catch (error) {
        console.error('Failed to load media archive content', error);
      }
    };

    void load();
    return () => { alive = false; };
  }, []);

  const allArchiveItems = useMemo(() => {
    const formattedNews: ArchiveItem[] = [
      ...news.map(n => ({
        type: 'news' as const,
        badge: n.badge || 'Update',
        date: n.date || 'Recent',
        title: n.title || '',
        description: n.description || '',
        image: normalizeAssetUrl(n.imageUrl) || '/hero/hero-4.JPG',
        originalItem: n
      })),
      ...DEFAULT_MEDIA_NEWS.map(n => ({
        type: 'news' as const,
        badge: n.badge,
        date: n.date,
        title: n.title,
        description: n.description,
        image: n.imageUrl,
        originalItem: n
      }))
    ];

    const formattedMags: ArchiveItem[] = [
      ...magazines.map(m => ({
        type: 'magazine' as const,
        badge: 'Magazine',
        date: m.issue || 'Recent Issue',
        title: m.title || '',
        description: 'PICC Church Magazine issue featuring latest stories, teachings, and updates.',
        image: normalizeAssetUrl(m.imageUrl) || '/magazine/magazine-1.jpeg',
        fileUrl: m.fileUrl ? normalizeAssetUrl(m.fileUrl) : undefined,
        originalItem: m
      })),
      ...DEFAULT_MEDIA_MAGAZINES.map(m => ({
        type: 'magazine' as const,
        badge: 'Magazine',
        date: m.issue,
        title: m.title,
        description: 'PICC Church Magazine issue featuring latest stories, teachings, and updates.',
        image: m.imageUrl,
        fileUrl: m.fileUrl ? normalizeAssetUrl(m.fileUrl) : undefined,
        originalItem: m
      }))
    ];

    // Deduplicate by title+date
    const seen = new Set<string>();
    return [...formattedNews, ...formattedMags].filter(item => {
      const key = `${item.title}-${item.date}-${item.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [news, magazines]);

  const filteredItems = useMemo(() => {
    return allArchiveItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.badge.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || (activeTab === 'news' && item.type === 'news') || (activeTab === 'magazines' && item.type === 'magazine');
      return matchesSearch && matchesTab;
    });
  }, [allArchiveItems, searchQuery, activeTab]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <Link 
              href="/media"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Media
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-primary/70 mb-3">
                  Media Library
                </p>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900">Media Archive</h1>
                <p className="mt-4 text-slate-600 max-w-2xl">
                  Browse through our history of news stories and church magazines.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search news or magazines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-slate-200/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'all' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Media
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'news' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              News Archive
            </button>
            <button
              onClick={() => setActiveTab('magazines')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'magazines' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Magazines
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={`${item.type}-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedItem(item)}
                >
                  <Card className="group h-full flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-all border-slate-200 hover:border-primary/20 bg-white">
                    <div className="relative h-56 sm:h-64 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className={`object-cover transition-transform duration-500 group-hover:scale-105 ${item.type === 'magazine' ? 'object-top' : ''}`}
                      />
                      <div className="absolute top-4 left-4">
                        <span className={`text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${item.type === 'magazine' ? 'bg-slate-900' : 'bg-primary'}`}>
                          {item.badge}
                        </span>
                      </div>
                      {item.type === 'magazine' && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-3 rounded-full shadow-lg">
                            <FileText className="w-6 h-6 text-slate-900" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider mb-3">
                        <CalendarClock className="w-3.5 h-3.5" />
                        {item.date}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No results found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your search or filters to find what you&apos;re looking for.</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 text-primary font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl lg:max-w-6xl xl:max-w-7xl p-0 overflow-hidden border-none bg-white rounded-3xl shadow-2xl">
          {selectedItem && (
            <div className="flex flex-col lg:flex-row lg:h-[80vh] min-h-[500px]">
              <DialogHeader className="sr-only">
                <DialogTitle>{selectedItem.title}</DialogTitle>
                <DialogDescription>
                  {selectedItem.badge} from {selectedItem.date}
                </DialogDescription>
              </DialogHeader>
              
              {/* Image Column */}
              <div className={`relative h-64 sm:h-80 lg:h-auto lg:w-1/2 shrink-0 ${selectedItem.type === 'magazine' ? 'bg-slate-100' : 'bg-muted/30'}`}>
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  fill
                  className={`object-cover lg:object-contain ${selectedItem.type === 'magazine' ? 'p-4 lg:p-12' : ''}`}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden" />
                <div className="absolute bottom-6 left-6 right-6 text-white lg:hidden">
                  <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white ${selectedItem.type === 'magazine' ? 'bg-slate-900' : 'bg-primary'}`}>
                      {selectedItem.badge}
                    </span>
                    <span className="uppercase tracking-[0.2em] text-white/90">{selectedItem.date}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                    {selectedItem.title}
                  </h2>
                </div>
              </div>

              {/* Content Column */}
              <div className="flex flex-col p-8 sm:p-10 lg:p-12 lg:w-1/2 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                <div className="lg:block mb-8">
                  <div className="flex items-center gap-4 text-xs mb-4">
                    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] ${
                      selectedItem.type === 'magazine' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {selectedItem.badge}
                    </span>
                    <span className="uppercase tracking-[0.25em] text-foreground/50 font-medium">
                      {selectedItem.date}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-slate-900 leading-tight">
                    {selectedItem.title}
                  </h2>
                  <div className={`mt-6 h-1 w-20 rounded-full ${
                    selectedItem.type === 'magazine' ? 'bg-slate-900/20' : 'bg-primary/20'
                  }`} />
                </div>
                
                <div className="text-slate-600 text-base sm:text-lg leading-relaxed whitespace-pre-wrap flex-1">
                  {selectedItem.description}
                </div>

                {selectedItem.type === 'magazine' && (
                  <div className="mt-10 pt-8 border-t border-slate-100 flex flex-wrap gap-4">
                    {selectedItem.fileUrl ? (
                      <>
                        <a href={selectedItem.fileUrl} target="_blank" rel="noreferrer">
                          <Button className="rounded-xl px-8 py-6 h-auto bg-slate-900 hover:bg-slate-800 gap-2 text-base font-bold">
                            <Eye className="w-5 h-5" /> View Magazine
                          </Button>
                        </a>
                        <a href={selectedItem.fileUrl} download>
                          <Button variant="outline" className="rounded-xl px-8 py-6 h-auto border-slate-200 hover:bg-slate-50 gap-2 text-base font-bold">
                            <Download className="w-5 h-5" /> Download PDF
                          </Button>
                        </a>
                      </>
                    ) : (
                      <Button disabled className="rounded-xl px-8 py-6 h-auto bg-slate-200 text-slate-500 gap-2 text-base font-bold">
                        Coming Soon
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
