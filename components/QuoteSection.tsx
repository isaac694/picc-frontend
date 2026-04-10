import Image from 'next/image';

type QuoteSectionProps = {
  quote?: string | null;
  author?: string | null;
  imageUrl?: string | null;
};

export default function QuoteSection({ quote, author, imageUrl }: QuoteSectionProps) {
  const resolvedQuote =
    quote ||
    'Prayer is what makes time conducive.  Prayer is what brings time to season (John 2:3-5).';
  const resolvedAuthor = author || 'Pastor Esau Banda';
  const resolvedImage = imageUrl || '/pastor/pastor-photo.jpg';
  return (
    <section className="relative overflow-visible py-24 md:py-32 min-h-[680px] md:min-h-[760px] flex items-center">
      <style>{`
        /* Background gradient using site primary blues */
        .quote-bg {
          background: linear-gradient(120deg, #4B7BA7 0%, #2D5A8C 45%, #1E3A5F 100%);
        }

        /* Subtle animated radial glow */
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50%       { opacity: 0.28; transform: scale(1.08); }
        }
        .glow-orb {
          animation: pulseGlow 6s ease-in-out infinite;
        }

        /* Floating image */
        @keyframes floatBob {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }
        .floating-photo {
          animation: floatBob 5s ease-in-out infinite;
          transition: transform 0.35s ease, box-shadow 0.35s ease, filter 0.35s ease;
          will-change: transform;
        }
        .floating-photo:hover {
          animation-play-state: paused;
          transform: translateY(-22px) scale(1.02);
          filter: drop-shadow(0 18px 36px rgba(0,0,0,0.35));
        }

        /* Quote fade-in on load */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .quote-label   { animation: fadeUp 0.7s ease forwards; animation-delay: 0.1s; opacity: 0; }
        .quote-text    { animation: fadeUp 0.7s ease forwards; animation-delay: 0.3s; opacity: 0; }
        .quote-author  { animation: fadeUp 0.7s ease forwards; animation-delay: 0.55s; opacity: 0; }
      `}</style>

      {/* Gradient background */}
      <div className="quote-bg absolute inset-0" />

      {/* Decorative radial glow orbs */}
      <div className="glow-orb absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/15 blur-3xl pointer-events-none" />
      <div className="glow-orb absolute top-10 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative z-10 text-center">

          {/* Quote */}
          <div className="text-white">
            <p className="quote-label text-xs font-semibold tracking-[0.35em] uppercase text-white/70 mb-8">
              Quotes
            </p>
            <blockquote className="quote-text text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-8 max-w-6xl mx-auto">
              &ldquo;{resolvedQuote}&rdquo;
            </blockquote>
            <p className="quote-author text-sm text-white/70 tracking-[0.18em] uppercase">
              -- {resolvedAuthor}
            </p>
          </div>

        </div>
      </div>

      {/* Bottom-right photo, partially visible like the reference */}
      <div className="absolute -bottom-12 sm:-bottom-14 md:-bottom-16 right-1/2 translate-x-1/2 md:right-6 md:translate-x-0">
        <div className="floating-photo relative w-[88vw] max-w-[420px] h-[200px] sm:h-[220px] md:w-[360px] md:h-[220px] lg:w-[460px] lg:h-[280px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
          <Image
            src={resolvedImage}
            alt={resolvedAuthor}
            fill
            sizes="(max-width: 768px) 88vw, (max-width: 1024px) 360px, 460px"
            className="object-cover object-top"
            style={{ filter: 'grayscale(25%) contrast(1.05)' }}
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      </div>
    </section>
  );
}
