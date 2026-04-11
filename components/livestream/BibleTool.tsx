'use client';

import { useState, useEffect } from 'react';
import { getVersions, getBooks, getPassage } from '@/app/actions/bible';
import type { BibleVersion, BibleBook } from '@/app/actions/bible';
import { Sun, Moon } from 'lucide-react';

export default function BibleTool() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  
  const [passage, setPassage] = useState<{ title: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load static version & book lists on mount
  useEffect(() => {
    Promise.all([getVersions(), getBooks()]).then(([v, b]) => {
      setVersions(v);
      setBooks(b);
      if (v.length > 0) setSelectedVersion(v[0].id);
      if (b.length > 0) {
        setSelectedBook(b[0].id);
        setSelectedChapter(1);
      }
    });
  }, []);

  // Fetch passage when selection changes
  useEffect(() => {
    if (!selectedVersion || !selectedBook || !selectedChapter) return;
    let isMounted = true;

    const isDev = process.env.NODE_ENV === 'development';
    const cacheKey = `bible_${selectedVersion}_${selectedBook}_${selectedChapter}`;

    if (!isDev) {
      try {
        const cached = window.localStorage.getItem(cacheKey);
        if (cached) {
          setPassage(JSON.parse(cached));
          setIsLoading(false);
          return;
        }
      } catch {}
    }

    setIsLoading(true);
    getPassage(selectedVersion, selectedBook, selectedChapter).then((data) => {
      if (isMounted) {
        if (!isDev) {
          try { window.localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        }
        setPassage(data);
        setIsLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [selectedVersion, selectedBook, selectedChapter]);

  const activeBook = books.find(b => b.id === selectedBook);
  const chapterList = activeBook
    ? Array.from({ length: activeBook.chapters }, (_, i) => i + 1)
    : [];

  // Dynamic theme classes
  const containerBg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const containerText = theme === 'dark' ? 'text-white' : 'text-black';
  const toolbarBg = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10';
  
  const inputBg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const inputText = theme === 'dark' ? 'text-white' : 'text-black';
  const inputBorder = theme === 'dark' ? 'border-white/15' : 'border-black/15';
  const focusRing = theme === 'dark' ? 'focus:ring-white/60' : 'focus:ring-black/60';

  return (
    <div className={`flex flex-col h-[500px] ${containerBg}`}>
      {/* Toolbar */}
      <div className={`flex flex-wrap items-center gap-2 p-4 border-b shrink-0 rounded-t-xl ${toolbarBg}`}>
        <select
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
          className={`rounded-xl border ${inputBorder} ${inputBg} px-3 py-2 text-sm ${inputText} shadow-sm focus:outline-none focus:ring-2 ${focusRing} max-w-[150px] truncate`}
          disabled={versions.length === 0}
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.abbreviation} - {v.title}
            </option>
          ))}
        </select>
        
        <select
          value={selectedBook}
          onChange={(e) => {
            setSelectedBook(e.target.value);
            setSelectedChapter(1);
          }}
          className={`rounded-xl border ${inputBorder} ${inputBg} px-3 py-2 text-sm ${inputText} shadow-sm focus:outline-none focus:ring-2 ${focusRing} max-w-[150px]`}
          disabled={books.length === 0}
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(Number(e.target.value))}
          className={`rounded-xl border ${inputBorder} ${inputBg} px-3 py-2 text-sm ${inputText} shadow-sm focus:outline-none focus:ring-2 ${focusRing}`}
          disabled={chapterList.length === 0}
        >
          {chapterList.map((ch) => (
            <option key={ch} value={ch}>Chapter {ch}</option>
          ))}
        </select>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          className={`ml-auto p-2 rounded-full border ${inputBorder} transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${containerBg} ${containerText} relative`}>
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center ${theme === 'dark' ? 'bg-black/60' : 'bg-white/60'} z-10`}>
            <div className={`animate-pulse text-sm ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Loading passage...</div>
          </div>
        )}
        
        {passage ? (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6 text-center font-serif opacity-90">
              {passage.title}
            </h2>
            <div 
              className="mx-auto leading-relaxed [&_.verse-num]:text-xs [&_.verse-num]:font-bold [&_.verse-num]:opacity-50 [&_.verse-num]:mr-1 [&_p]:mb-1"
              dangerouslySetInnerHTML={{ __html: passage.content }} 
            />
          </div>
        ) : (
           <div className={`text-center pt-10 ${theme === 'dark' ? 'text-white/50' : 'text-black/50'}`}>
             {!isLoading && "Select a passage to read."}
           </div>
        )}
      </div>
    </div>
  );
}
