'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { CalendarClock, MapPin, Search, ArrowLeft } from 'lucide-react';
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

export type ArchiveNewsItem = {
  badge: string;
  date: string;
  title: string;
  description: string;
  image: string;
};

export type ArchiveOutreachItem = {
  title: string;
  date: string;
  description: string;
  image: string;
  location?: string;
  badge?: string; // Added for unified popup handling
};

interface MinistryArchiveProps {
  ministryName: string;
  ministryPath: string;
  ministryKey?: string;
  newsContentKey?: string;
  newsItems?: ArchiveNewsItem[];
  outreachItems?: ArchiveOutreachItem[];
  archiveCategories?: string[];
  kicker?: string;
}

type MinistryItem = {
  id?: string;
  category?: string;
  title?: string;
  description?: string | null;
  label?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  location?: string | null;
  sortOrder?: number | null;
  createdAt?: string | null;
};

const DEFAULT_ARCHIVE_CATEGORIES = ['outreach', 'project', 'initiative', 'program', 'highlight'];

const toAssetUrl = (value: string | null | undefined) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const itemKey = (title: string, date: string) =>
  `${title.trim().toLowerCase()}::${date.trim().toLowerCase()}`;

const mergeNewsItems = (fallback: ArchiveNewsItem[], loaded: ArchiveNewsItem[]) => {
  const seen = new Set<string>();
  return [...loaded, ...fallback].filter((item) => {
    const key = itemKey(item.title, item.date);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mergeOutreachItems = (fallback: ArchiveOutreachItem[], loaded: ArchiveOutreachItem[]) => {
  const seen = new Set<string>();
  return [...loaded, ...fallback].filter((item) => {
    const key = itemKey(item.title, item.date);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseSiteNewsItems = (body: unknown): ArchiveNewsItem[] => {
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    const items = parsed && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown[] }).items)
      ? (parsed as { items: unknown[] }).items
      : [];

    return items
      .map((item) => {
        const record = item as Partial<ArchiveNewsItem> & { imageUrl?: string };
        return {
          badge: String(record.badge || 'Update'),
          date: String(record.date || 'Recent'),
          title: String(record.title || '').trim(),
          description: String(record.description || '').trim(),
          image: toAssetUrl(record.image || record.imageUrl) || '/hero/hero-store.jpg',
        };
      })
      .filter((item) => item.title && item.description);
  } catch {
    return [];
  }
};

const ministryItemsToArchive = (items: MinistryItem[], categories: string[]): ArchiveOutreachItem[] => {
  const allowed = new Set(categories);
  return items
    .filter((item) => item.title && item.category && allowed.has(item.category))
    .sort((first, second) => {
      const sortDifference = (first.sortOrder ?? 0) - (second.sortOrder ?? 0);
      if (sortDifference !== 0) return sortDifference;
      return String(second.createdAt || '').localeCompare(String(first.createdAt || ''));
    })
    .map((item) => ({
      title: String(item.title),
      date: String(item.label || item.description || 'Recent'),
      description: String(item.description || item.label || 'Ministry archive item.'),
      image: toAssetUrl(item.imageUrl || item.image) || '/hero/hero-store.jpg',
      location: item.location || undefined,
    }));
};

export default function MinistryArchive({
  ministryName,
  ministryPath,
  ministryKey,
  newsContentKey,
  newsItems = [],
  outreachItems = [],
  archiveCategories = DEFAULT_ARCHIVE_CATEGORIES,
  kicker = "Archive"
}: MinistryArchiveProps) {
  const [loadedNewsItems, setLoadedNewsItems] = useState<ArchiveNewsItem[]>([]);
  const [loadedOutreachItems, setLoadedOutreachItems] = useState<ArchiveOutreachItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'outreaches'>(
    newsItems.length > 0 && outreachItems.length > 0 ? 'all' : 
    newsItems.length > 0 ? 'news' : 'outreaches'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ArchiveNewsItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadArchiveContent() {
      try {
        const [ministryResponse, newsResponse] = await Promise.all([
          ministryKey ? apiFetch(`/api/ministries/${encodeURIComponent(ministryKey)}/content`) : Promise.resolve(null),
          newsContentKey ? apiFetch(`/api/site-content/${encodeURIComponent(newsContentKey)}`) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        if (ministryResponse?.ok) {
          const data = await ministryResponse.json().catch(() => null);
          if (Array.isArray(data?.items)) {
            setLoadedOutreachItems(ministryItemsToArchive(data.items, archiveCategories));
          }
        }

        if (newsResponse?.ok) {
          const data = await newsResponse.json().catch(() => null);
          setLoadedNewsItems(parseSiteNewsItems(data?.body));
        }
      } catch (error) {
        console.error(`Failed to load ${ministryName} archive content`, error);
      }
    }

    loadArchiveContent();

    return () => {
      isMounted = false;
    };
  }, [archiveCategories, ministryKey, ministryName, newsContentKey]);

  const mergedNewsItems = useMemo(
    () => mergeNewsItems(newsItems, loadedNewsItems),
    [newsItems, loadedNewsItems]
  );

  const mergedOutreachItems = useMemo(
    () => mergeOutreachItems(outreachItems, loadedOutreachItems),
    [outreachItems, loadedOutreachItems]
  );

  const hasNews = mergedNewsItems.length > 0;
  const hasOutreaches = mergedOutreachItems.length > 0;

  const filteredNews = mergedNewsItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOutreaches = mergedOutreachItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <Link 
              href={ministryPath}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {ministryName}
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-primary/70 mb-3">
                  {kicker}
                </p>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900">{ministryName} Updates</h1>
                <p className="mt-4 text-slate-600 max-w-2xl">
                  Explore the history, stories, and impact of our ministry through the years.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search archive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          {hasNews && hasOutreaches && (
            <div className="flex gap-2 mb-8 bg-slate-200/50 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'all' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Updates
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'news' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                News & Stories
              </button>
              <button
                onClick={() => setActiveTab('outreaches')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'outreaches' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Outreaches
              </button>
            </div>
          )}

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {/* News Items */}
              {(activeTab === 'all' || activeTab === 'news') && filteredNews.map((item, idx) => (
                <motion.div
                  key={`news-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedItem(item)}
                >
                  <Card className="group h-full flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-all border-slate-200 hover:border-primary/20">
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                          {item.badge}
                        </span>
                      </div>
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

              {/* Outreach Items */}
              {(activeTab === 'all' || activeTab === 'outreaches') && filteredOutreaches.map((item, idx) => (
                <motion.div
                  key={`outreach-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedItem({ ...item, badge: 'Outreach' })}
                >
                  <Card className="group h-full flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-all border-slate-200 hover:border-primary/20">
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                          Outreach
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider">
                          <CalendarClock className="w-3.5 h-3.5" />
                          {item.date}
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-1 text-slate-500 text-xs">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.location}
                          </div>
                        )}
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
          {((activeTab === 'all' && filteredNews.length === 0 && filteredOutreaches.length === 0) ||
            (activeTab === 'news' && filteredNews.length === 0) ||
            (activeTab === 'outreaches' && filteredOutreaches.length === 0)) && (
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
                  {selectedItem.badge} update from {selectedItem.date}
                </DialogDescription>
              </DialogHeader>
              
              {/* Image Column */}
              <div className="relative h-64 sm:h-80 lg:h-auto lg:w-1/2 shrink-0 bg-muted/30">
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  fill
                  className="object-cover lg:object-contain"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden" />
                <div className="absolute bottom-6 left-6 right-6 text-white lg:hidden">
                  <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                    <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white">
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
                      selectedItem.badge === 'Outreach' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {selectedItem.badge}
                    </span>
                    <span className="uppercase tracking-[0.25em] text-foreground/50 font-medium">
                      {selectedItem.date}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-foreground leading-tight">
                    {selectedItem.title}
                  </h2>
                  <div className={`mt-6 h-1 w-20 rounded-full ${
                    selectedItem.badge === 'Outreach' ? 'bg-emerald-600/20' : 'bg-primary/20'
                  }`} />
                </div>
                
                <div className="text-foreground/80 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
