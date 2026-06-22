import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, apiUrl } from '@/lib/api';

type VideoDeclaration = {
  id: string;
  source: 'youtube' | 'upload';
  title: string;
  subtitle: string | null;
  mediaUrl: string;
  mediaKind: 'video' | 'audio';
  createdAt: string;
};

const FALLBACK_SUBTITLE = 'Video Declaration';

const normalizeMediaUrl = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

const getYouTubeEmbedUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace(/^\/+/, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return trimmed;
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
  } catch {
    return '';
  }

  return '';
};

async function getVideoDeclarations(): Promise<VideoDeclaration[]> {
  try {
    const response = await apiFetch('/api/video-declarations?limit=100', {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = await response.json().catch(() => null);
    return Array.isArray(data?.declarations) ? data.declarations : [];
  } catch {
    return [];
  }
}

function DeclarationMedia({ declaration }: { declaration: VideoDeclaration }) {
  const mediaUrl = normalizeMediaUrl(declaration.mediaUrl);
  const youtubeEmbedUrl = declaration.source === 'youtube' ? getYouTubeEmbedUrl(mediaUrl) : '';

  if (youtubeEmbedUrl) {
    return (
      <iframe
        src={youtubeEmbedUrl}
        title={declaration.title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (declaration.source === 'upload' && declaration.mediaKind === 'audio') {
    return (
      <div className="flex h-full items-center justify-center bg-primary/10 p-5">
        <audio src={mediaUrl} controls className="w-full" />
      </div>
    );
  }

  if (mediaUrl) {
    return <video src={mediaUrl} controls className="h-full w-full object-cover" />;
  }

  return <div className="flex h-full items-center justify-center bg-primary/10 text-sm text-foreground/60">Media unavailable</div>;
}

export default async function VideoDeclarationsArchivePage() {
  const declarations = await getVideoDeclarations();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)] px-4 py-16 text-white sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">{FALLBACK_SUBTITLE}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">Video Declarations</h1>
            <p className="mt-4 max-w-2xl text-white/80">
              Watch and revisit declarations shared from the PICC homepage.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {declarations.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {declarations.map((declaration) => (
                  <article key={declaration.id} className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
                    <div className="aspect-video bg-black">
                      <DeclarationMedia declaration={declaration} />
                    </div>
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-[0.25em] text-primary/70">
                        {declaration.subtitle || FALLBACK_SUBTITLE}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-foreground">{declaration.title}</h2>
                      <p className="mt-3 text-sm text-foreground/60">
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }).format(new Date(declaration.createdAt))}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                <h2 className="text-2xl font-semibold text-foreground">No video declarations yet</h2>
                <p className="mt-2 text-foreground/60">Published video declarations will appear here.</p>
              </div>
            )}

            <div className="mt-10">
              <Link href="/" className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Back Home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
