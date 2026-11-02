'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, apiUrl } from '@/lib/api';
import {
  CONTENT_COLLECTIONS,
  fetchContentCollections,
  seedsToItems,
  type ContentItem,
} from '@/lib/content-items';
import { ABOUT_CORE_VALUE_SEEDS, ABOUT_TENET_SEEDS, splitThemeText, yearlyThemeSeeds } from '@/lib/about-defaults';

type Theme = { id: string; year: number; theme: string; scripture: string; body: string };

const toThemes = (items: ContentItem[]): Theme[] =>
  items
    .map((item) => ({
      id: item.id,
      year: Number(item.data.year),
      theme: item.title,
      scripture: item.subtitle,
      body: item.body,
    }))
    .filter((entry) => Number.isFinite(entry.year) && entry.theme)
    .sort((a, b) => b.year - a.year);

function Accordion({ items, openIndex, onToggle }: { items: ContentItem[]; openIndex: number | null; onToggle: (index: number | null) => void }) {
  return (
    <>
      {items.map((entry, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={entry.id} className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4 shadow-sm transition-shadow hover:shadow-md">
            <button
              type="button"
              onClick={() => onToggle(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-lg font-semibold text-foreground">{entry.title}</span>
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 text-xl leading-none text-primary transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <div className={`grid transition-all duration-500 ease-out ${isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <p className="overflow-hidden leading-relaxed text-foreground/70">{entry.body}</p>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function AboutPage() {
  const [pageImages, setPageImages] = useState<Record<string, string>>({});
  const [storyVideoUrl, setStoryVideoUrl] = useState('https://www.youtube.com/embed/IloZ7uo2UYY');
  const [tenets, setTenets] = useState<ContentItem[]>(() => seedsToItems(CONTENT_COLLECTIONS.aboutTenets, ABOUT_TENET_SEEDS));
  const [coreValues, setCoreValues] = useState<ContentItem[]>(() => seedsToItems(CONTENT_COLLECTIONS.aboutCoreValues, ABOUT_CORE_VALUE_SEEDS));
  const [themes, setThemes] = useState<Theme[]>(() => toThemes(seedsToItems(CONTENT_COLLECTIONS.aboutYearlyThemes, yearlyThemeSeeds())));
  const [openTenet, setOpenTenet] = useState<number | null>(0);
  const [openCoreValue, setOpenCoreValue] = useState<number | null>(0);

  useEffect(() => {
    const imageKeys = [
      'about-header-bg',
      'about-tenets-image',
      'about-core-values-image',
      'about-themes-bg',
      'about-worship-image',
      'about-story-video',
      'about-yearly-themes',
    ];

    const load = async () => {
      const [entries, lists] = await Promise.all([
        Promise.all(
          imageKeys.map(async (key) => {
            try {
              const response = await apiFetch(`/api/site-content/${key}`);
              if (!response.ok) return [key, ''] as const;
              const data = await response.json();
              if (key === 'about-story-video' || key === 'about-yearly-themes') {
                return [key, String(data.body || '')] as const;
              }
              const imageUrl = data.imageUrl ? (data.imageUrl.startsWith('http') ? data.imageUrl : apiUrl(data.imageUrl)) : '';
              return [key, imageUrl] as const;
            } catch {
              return [key, ''] as const;
            }
          }),
        ),
        fetchContentCollections([
          CONTENT_COLLECTIONS.aboutTenets,
          CONTENT_COLLECTIONS.aboutCoreValues,
          CONTENT_COLLECTIONS.aboutYearlyThemes,
        ]),
      ]);

      const map = Object.fromEntries(entries) as Record<string, string>;
      setPageImages(map);
      const candidateVideo = (map['about-story-video'] || '').trim();
      if (candidateVideo) setStoryVideoUrl(candidateVideo);

      if (lists[CONTENT_COLLECTIONS.aboutTenets]) setTenets(lists[CONTENT_COLLECTIONS.aboutTenets]!);
      if (lists[CONTENT_COLLECTIONS.aboutCoreValues]) setCoreValues(lists[CONTENT_COLLECTIONS.aboutCoreValues]!);

      const savedThemes = lists[CONTENT_COLLECTIONS.aboutYearlyThemes];
      if (savedThemes) {
        setThemes(toThemes(savedThemes));
      } else {
        // Themes saved with the older single-text editor.
        try {
          const parsed = JSON.parse((map['about-yearly-themes'] || '').trim() || 'null');
          if (Array.isArray(parsed) && parsed.length) {
            const legacy = parsed
              .map((value: { year?: unknown; theme?: unknown }) => ({ year: Number(value?.year), theme: String(value?.theme ?? '').trim() }))
              .filter((entry) => Number.isFinite(entry.year) && entry.theme);
            if (legacy.length) {
              setThemes(legacy.map((entry, index) => ({ id: `legacy-${index}`, year: entry.year, ...splitThemeText(entry.theme), body: '' })).sort((a, b) => b.year - a.year));
            }
          }
        } catch {
          // Keep the built-in themes.
        }
      }
    };

    void load();
  }, []);

  const resolveImage = (key: string, fallback: string) => pageImages[key] || fallback;
  const currentYear = new Date().getFullYear();
  const firstYear = useMemo(() => (themes.length ? Math.min(...themes.map((entry) => entry.year)) : currentYear), [themes, currentYear]);
  const currentTheme = themes.find((entry) => entry.year === currentYear) || themes[0];

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-b-[36px] py-24 text-white sm:py-32 md:rounded-b-[48px] md:py-48">
          <div className="absolute inset-0">
            <div
              className="animate-ken-burns absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${resolveImage('about-header-bg', '/about/header.JPG')})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/35" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mt-8 max-w-3xl sm:mt-16 md:mt-32">
              <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
                <Link href="/" className="hover:text-white">Home</Link>
                <span className="text-white/50">/</span>
                <Link href="/about" className="hover:text-white">About</Link>
              </div>
              <h1 className="mb-4 text-4xl font-semibold md:text-6xl">About Our Church</h1>
            </div>
          </div>
        </section>

        {/* Tenets of faith */}
        <section className="bg-background py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.05fr_1fr]">
              <div className="relative h-72 overflow-hidden rounded-3xl shadow-xl sm:h-[28rem] lg:h-[60rem]">
                <Image
                  src={resolveImage('about-tenets-image', '/about/tenets-1.JPG')}
                  alt="Our church family"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="flex h-auto min-h-[24rem] flex-col lg:h-[60rem]">
                <h2 className="mb-4 text-3xl font-semibold leading-tight text-foreground md:text-4xl">
                  THE <span className="text-secondary">PICC</span> TENETS
                  <br />
                  OF <span className="text-secondary">FAITH.</span>
                </h2>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                  <Accordion items={tenets} openIndex={openTenet} onToggle={setOpenTenet} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="bg-background py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Our Foundation</p>
              <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-5xl">PICC Core Values</h2>
            </div>
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
              <div className="space-y-4">
                <Accordion items={coreValues} openIndex={openCoreValue} onToggle={setOpenCoreValue} />
              </div>
              <div className="relative h-72 overflow-hidden rounded-3xl shadow-xl sm:h-[28rem] lg:h-[60rem]">
                <Image
                  src={resolveImage('about-core-values-image', '/about/core-values.JPG')}
                  alt="PICC core values"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Watch Our Story */}
        <section className="bg-primary py-16 text-primary-foreground sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.4em] text-primary-foreground/80">Our 28th Anniversary Documentary</p>
            <h2 className="mt-4 text-3xl font-semibold md:text-5xl">Watch Our Story</h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
              The story of Pentecost International Christian Centre is a testament to God&apos;s grace and help through the years.
            </p>
            <div className="mt-12">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px] bg-black/90 shadow-2xl md:aspect-[21/9]">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={storyVideoUrl}
                  title="PICC 28th Anniversary Documentary"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <div className="mt-12 flex justify-end">
              <p className="text-right text-4xl font-semibold text-primary-foreground/35 md:text-6xl">Know more about the church.</p>
            </div>
          </div>
        </section>

        {/* Yearly Themes — the full list, newest first */}
        <section className="relative py-16 sm:py-20 md:py-24">
          <div className="absolute inset-0">
            <Image
              src={resolveImage('about-themes-bg', '/about/themes.jpeg')}
              alt="PICC yearly themes"
              fill
              sizes="100vw"
              className="object-cover object-[center_30%]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/85" />
          <div className="relative mx-auto max-w-6xl px-4 text-white sm:px-6 lg:px-8">
            <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-end">
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/70">Since {firstYear}</p>
                <h2 className="mb-3 text-3xl font-semibold md:text-5xl">PICC Yearly Themes</h2>
                <p className="max-w-xl text-white/75">
                  A living archive of the themes God has given our church, year after year.
                </p>
              </div>
              {currentTheme ? (
                <div className="rounded-3xl border border-secondary/40 bg-secondary/10 p-6 backdrop-blur-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-secondary">
                    {currentTheme.year === currentYear ? 'This year' : 'Latest theme'} · {currentTheme.year}
                  </p>
                  <p className="font-display mt-3 text-2xl font-semibold leading-snug md:text-3xl">{currentTheme.theme}</p>
                  {currentTheme.scripture ? <p className="mt-2 text-sm font-medium text-white/75">{currentTheme.scripture}</p> : null}
                </div>
              ) : null}
            </div>

            <ol className="relative border-l border-white/20 pl-6 sm:pl-10" data-reveal-stagger>
              {themes.map((entry) => {
                const isCurrent = entry.year === currentYear;
                return (
                  <li key={entry.id} className="relative pb-6 last:pb-0">
                    <span
                      className={`absolute -left-[31px] top-5 h-3 w-3 rounded-full ring-4 ring-black/40 sm:-left-[47px] ${isCurrent ? 'bg-secondary' : 'bg-white/60'}`}
                      aria-hidden="true"
                    />
                    <div
                      className={`grid gap-2 rounded-2xl border px-5 py-4 transition-colors sm:grid-cols-[110px_1fr] sm:items-center sm:gap-6 ${
                        isCurrent ? 'border-secondary/50 bg-white/15' : 'border-white/15 bg-white/[0.06] hover:bg-white/10'
                      }`}
                    >
                      <p className={`font-display text-3xl font-semibold tabular-nums ${isCurrent ? 'text-secondary' : 'text-white/90'}`}>{entry.year}</p>
                      <div>
                        <p className="text-lg font-semibold leading-snug text-white">{entry.theme}</p>
                        {entry.scripture ? <p className="mt-1 text-sm text-white/65">{entry.scripture}</p> : null}
                        {entry.body ? <p className="mt-2 text-sm leading-6 text-white/70">{entry.body}</p> : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Worship With Us */}
        <section className="bg-background pb-10 pt-24 md:pb-12 md:pt-32">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <p className="mb-4 text-3xl font-semibold text-primary/15 md:text-5xl">we love and celebrate you!</p>
            <div className="overflow-hidden rounded-[36px] bg-primary text-primary-foreground shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
                <div className="relative min-h-[18rem] sm:min-h-[22rem] md:min-h-[32rem] lg:min-h-[36rem]">
                  <Image
                    src={resolveImage('about-worship-image', '/about/worship-with-us.jpg')}
                    alt="Worship with us"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex h-full flex-col justify-center px-6 py-12 text-center sm:px-10 sm:py-16 md:px-14 md:py-20">
                  <h2 className="mb-4 text-3xl font-semibold md:text-4xl">Worship With Us</h2>
                  <p className="mb-8 leading-relaxed text-primary-foreground/85">
                    Join us every Sunday in any of our services and every Thursday for an uplifting time in God&apos;s presence.
                  </p>
                  <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Link href="/#see-you-in-church" className="rounded-full border border-primary-foreground/70 px-6 py-3 text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                      View This Week&apos;s Schedule
                    </Link>
                    <Link href="/locations" className="rounded-full border border-primary-foreground/70 px-6 py-3 text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                      Locate a Church
                    </Link>
                    <Link href="/livestream" className="rounded-full border border-primary-foreground/70 px-6 py-3 text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                      Attend Service Online
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
