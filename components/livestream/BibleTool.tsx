'use client';

import { useState, useEffect } from 'react';
import { getVersions, getBooks, getPassage } from '@/app/actions/bible';
import '@youversion/platform-core/browser/styles/index.css';
import { Sun, Moon } from 'lucide-react';

const OSIS_BOOK_MAP: Record<string, string> = {
  GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers", DEU: "Deuteronomy",
  JOS: "Joshua", JDG: "Judges", RUT: "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
  "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
  EZR: "Ezra", NEH: "Nehemiah", EST: "Esther", JOB: "Job", PSA: "Psalms", PRO: "Proverbs",
  ECC: "Ecclesiastes", SNG: "Song of Solomon", ISA: "Isaiah", JER: "Jeremiah", LAM: "Lamentations",
  EZK: "Ezekiel", DAN: "Daniel", HOS: "Hosea", JOL: "Joel", AMO: "Amos", OBA: "Obadiah",
  JON: "Jonah", MIC: "Micah", NAM: "Nahum", HAB: "Habakkuk", ZEP: "Zephaniah", HAG: "Haggai",
  ZEC: "Zechariah", MAL: "Malachi",
  MAT: "Matthew", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts", ROM: "Romans",
  "1CO": "1 Corinthians", "2CO": "2 Corinthians", GAL: "Galatians", EPH: "Ephesians",
  PHP: "Philippians", COL: "Colossians", "1TH": "1 Thessalonians", "2TH": "2 Thessalonians",
  "1TI": "1 Timothy", "2TI": "2 Timothy", TIT: "Titus", PHM: "Philemon", HEB: "Hebrews",
  JAS: "James", "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John",
  "3JN": "3 John", JUD: "Jude", REV: "Revelation",
};

export default function BibleTool() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [versions, setVersions] = useState<{ id: number; title: string; abbreviation?: string }[]>([]);
  const [books, setBooks] = useState<{ id: string; name: string; chapters: string[] }[]>([]);
  
  const [selectedVersion, setSelectedVersion] = useState<number>(0);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  
  const [passage, setPassage] = useState<{ title: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const cacheKey = 'yv_versions';
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setVersions(data);
        if (data.length > 0) setSelectedVersion(data[0].id);
        return;
      }
    } catch {}

    getVersions().then((data) => {
       try { window.localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
       setVersions(data);
       if (data.length > 0) setSelectedVersion(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedVersion) return;
    const cacheKey = `yv_books_${selectedVersion}`;
    
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setBooks(data);
        if (data.length > 0) {
          setSelectedBook(data[0].id);
          setSelectedChapter(data[0].chapters[0] || '1');
        }
        return;
      }
    } catch {}

    setBooks([]);
    getBooks(selectedVersion).then((data) => {
       try { window.localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
       setBooks(data);
       if (data.length > 0) {
         setSelectedBook(data[0].id);
         setSelectedChapter(data[0].chapters[0] || '1');
       }
    });
  }, [selectedVersion]);

  useEffect(() => {
    if (!selectedVersion || !selectedBook || !selectedChapter) return;
    let isMounted = true;
    const passageId = `${selectedBook}.${selectedChapter}`;
    const cacheKey = `yv_passage_${selectedVersion}_${passageId}`;

    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        setPassage(JSON.parse(cached));
        setIsLoading(false);
        return;
      }
    } catch {}

    setIsLoading(true);
    getPassage(selectedVersion, passageId).then((data) => {
      if (isMounted) {
        try { window.localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        setPassage(data);
        setIsLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [selectedVersion, selectedBook, selectedChapter]);

  const activeBook = books.find(b => b.id === selectedBook);

  // Dynamic theme classes
  const containerBg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const containerText = theme === 'dark' ? 'text-white' : 'text-black';
  const toolbarBg = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10';
  
  const inputBg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const inputText = theme === 'dark' ? 'text-white' : 'text-black';
  const inputBorder = theme === 'dark' ? 'border-white/15' : 'border-black/15';
  const focusRing = theme === 'dark' ? 'focus:ring-white/60' : 'focus:ring-black/60';

  return (
    <div className={`flex flex-col h-[500px] ${containerBg}`} data-yv-theme={theme}>
      {/* Toolbar */}
      <div className={`flex flex-wrap items-center gap-2 p-4 border-b shrink-0 rounded-t-xl ${toolbarBg}`}>
        <select
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(Number(e.target.value))}
          className={`rounded-xl border ${inputBorder} ${inputBg} px-3 py-2 text-sm ${inputText} shadow-sm focus:outline-none focus:ring-2 ${focusRing} max-w-[150px] truncate`}
          disabled={versions.length === 0}
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.abbreviation ? `${v.abbreviation} - ${v.title}` : v.title}
            </option>
          ))}
        </select>
        
        <select
          value={selectedBook}
          onChange={(e) => {
            setSelectedBook(e.target.value);
            const b = books.find(book => book.id === e.target.value);
            setSelectedChapter(b?.chapters[0] || '1');
          }}
          className={`rounded-xl border ${inputBorder} ${inputBg} px-3 py-2 text-sm ${inputText} shadow-sm focus:outline-none focus:ring-2 ${focusRing} max-w-[150px]`}
          disabled={books.length === 0}
        >
          {books.map((b) => {
            const displayName = OSIS_BOOK_MAP[b.id] || b.name;
            return <option key={b.id} value={b.id}>{displayName}</option>;
          })}
        </select>

        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(e.target.value)}
          className={`rounded-xl border ${inputBorder} ${inputBg} px-3 py-2 text-sm ${inputText} shadow-sm focus:outline-none focus:ring-2 ${focusRing}`}
          disabled={!activeBook || activeBook.chapters.length === 0}
        >
          {activeBook?.chapters.map((ch) => (
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
              data-slot="yv-bible-renderer"
              className="mx-auto"
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
