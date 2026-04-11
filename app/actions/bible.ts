'use server';

// =============================================================================
// Free Bible API – uses wldeh/bible-api hosted on jsDelivr CDN.
// No API key required. Public domain English translations only.
// CDN pattern:
//   https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/{id}/books/{book}/chapters/{chapter}.json
// =============================================================================

export type BibleVersion = {
  id: string;       // e.g. "en-kjv"
  title: string;
  abbreviation: string;
};

export type BibleBook = {
  id: string;       // lowercase slug, e.g. "genesis"
  name: string;     // display name, e.g. "Genesis"
  chapters: number; // total chapter count
};

export type BibleVerse = {
  verse: number;
  text: string;
};

// ---------------------------------------------------------------------------
// Static data – these never change, so no need to fetch them.
// ---------------------------------------------------------------------------

const VERSIONS: BibleVersion[] = [
  { id: 'en-kjv',  title: 'King James Version',          abbreviation: 'KJV' },
  { id: 'en-asv',  title: 'American Standard Version',   abbreviation: 'ASV' },
  { id: 'en-bbe',  title: 'Bible in Basic English',      abbreviation: 'BBE' },
  { id: 'en-web',  title: 'World English Bible',         abbreviation: 'WEB' },
  { id: 'en-ylt',  title: "Young's Literal Translation", abbreviation: 'YLT' },
  { id: 'en-dra',  title: 'Douay-Rheims American',       abbreviation: 'DRA' },
];

const BOOKS: BibleBook[] = [
  // Old Testament
  { id: 'genesis',         name: 'Genesis',          chapters: 50 },
  { id: 'exodus',          name: 'Exodus',           chapters: 40 },
  { id: 'leviticus',       name: 'Leviticus',        chapters: 27 },
  { id: 'numbers',         name: 'Numbers',          chapters: 36 },
  { id: 'deuteronomy',     name: 'Deuteronomy',      chapters: 34 },
  { id: 'joshua',          name: 'Joshua',           chapters: 24 },
  { id: 'judges',          name: 'Judges',           chapters: 21 },
  { id: 'ruth',            name: 'Ruth',             chapters: 4 },
  { id: '1 samuel',        name: '1 Samuel',         chapters: 31 },
  { id: '2 samuel',        name: '2 Samuel',         chapters: 24 },
  { id: '1 kings',         name: '1 Kings',          chapters: 22 },
  { id: '2 kings',         name: '2 Kings',          chapters: 25 },
  { id: '1 chronicles',    name: '1 Chronicles',     chapters: 29 },
  { id: '2 chronicles',    name: '2 Chronicles',     chapters: 36 },
  { id: 'ezra',            name: 'Ezra',             chapters: 10 },
  { id: 'nehemiah',        name: 'Nehemiah',         chapters: 13 },
  { id: 'esther',          name: 'Esther',           chapters: 10 },
  { id: 'job',             name: 'Job',              chapters: 42 },
  { id: 'psalms',          name: 'Psalms',           chapters: 150 },
  { id: 'proverbs',        name: 'Proverbs',         chapters: 31 },
  { id: 'ecclesiastes',    name: 'Ecclesiastes',     chapters: 12 },
  { id: 'song of solomon', name: 'Song of Solomon',  chapters: 8 },
  { id: 'isaiah',          name: 'Isaiah',           chapters: 66 },
  { id: 'jeremiah',        name: 'Jeremiah',         chapters: 52 },
  { id: 'lamentations',    name: 'Lamentations',     chapters: 5 },
  { id: 'ezekiel',         name: 'Ezekiel',          chapters: 48 },
  { id: 'daniel',          name: 'Daniel',           chapters: 12 },
  { id: 'hosea',           name: 'Hosea',            chapters: 14 },
  { id: 'joel',            name: 'Joel',             chapters: 3 },
  { id: 'amos',            name: 'Amos',             chapters: 9 },
  { id: 'obadiah',         name: 'Obadiah',          chapters: 1 },
  { id: 'jonah',           name: 'Jonah',            chapters: 4 },
  { id: 'micah',           name: 'Micah',            chapters: 7 },
  { id: 'nahum',           name: 'Nahum',            chapters: 3 },
  { id: 'habakkuk',        name: 'Habakkuk',         chapters: 3 },
  { id: 'zephaniah',       name: 'Zephaniah',        chapters: 3 },
  { id: 'haggai',          name: 'Haggai',           chapters: 2 },
  { id: 'zechariah',       name: 'Zechariah',        chapters: 14 },
  { id: 'malachi',         name: 'Malachi',          chapters: 4 },
  // New Testament
  { id: 'matthew',         name: 'Matthew',          chapters: 28 },
  { id: 'mark',            name: 'Mark',             chapters: 16 },
  { id: 'luke',            name: 'Luke',             chapters: 24 },
  { id: 'john',            name: 'John',             chapters: 21 },
  { id: 'acts',            name: 'Acts',             chapters: 28 },
  { id: 'romans',          name: 'Romans',           chapters: 16 },
  { id: '1 corinthians',   name: '1 Corinthians',    chapters: 16 },
  { id: '2 corinthians',   name: '2 Corinthians',    chapters: 13 },
  { id: 'galatians',       name: 'Galatians',        chapters: 6 },
  { id: 'ephesians',       name: 'Ephesians',        chapters: 6 },
  { id: 'philippians',     name: 'Philippians',      chapters: 4 },
  { id: 'colossians',      name: 'Colossians',       chapters: 4 },
  { id: '1 thessalonians', name: '1 Thessalonians',  chapters: 5 },
  { id: '2 thessalonians', name: '2 Thessalonians',  chapters: 3 },
  { id: '1 timothy',       name: '1 Timothy',        chapters: 6 },
  { id: '2 timothy',       name: '2 Timothy',        chapters: 4 },
  { id: 'titus',           name: 'Titus',            chapters: 3 },
  { id: 'philemon',        name: 'Philemon',         chapters: 1 },
  { id: 'hebrews',         name: 'Hebrews',          chapters: 13 },
  { id: 'james',           name: 'James',            chapters: 5 },
  { id: '1 peter',         name: '1 Peter',          chapters: 5 },
  { id: '2 peter',         name: '2 Peter',          chapters: 3 },
  { id: '1 john',          name: '1 John',           chapters: 5 },
  { id: '2 john',          name: '2 John',           chapters: 1 },
  { id: '3 john',          name: '3 John',           chapters: 1 },
  { id: 'jude',            name: 'Jude',             chapters: 1 },
  { id: 'revelation',      name: 'Revelation',       chapters: 22 },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getVersions(): Promise<BibleVersion[]> {
  return VERSIONS;
}

export async function getBooks(): Promise<BibleBook[]> {
  return BOOKS;
}

export async function getPassage(
  versionId: string,
  bookId: string,
  chapter: number,
): Promise<{ title: string; content: string }> {
  const CDN_BASE = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles';
  const url = `${CDN_BASE}/${versionId}/books/${bookId}/chapters/${chapter}.json`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // API returns { data: [{ book, chapter, verse, text }, ...] }
    const raw: BibleVerse[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

    // Deduplicate by verse number (API sometimes returns duplicates)
    const seen = new Set<string>();
    const verses = raw.filter((v) => {
      const key = String(v.verse);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const bookName = BOOKS.find((b) => b.id === bookId)?.name || bookId;
    const title = `${bookName} ${chapter}`;

    const html = verses
      .map(
        (v) =>
          `<p><sup class="verse-num">${v.verse}</sup> ${v.text}</p>`,
      )
      .join('\n');

    return { title, content: html };
  } catch (e) {
    console.error('Failed to fetch passage', e);
    return {
      title: 'Error',
      content: '<p>Failed to load passage. Please try again.</p>',
    };
  }
}
