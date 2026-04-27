// components/VerseSection.tsx

'use client';

import { useEffect, useRef, useState } from 'react';

export default function VerseSection({
  text,
  reference,
}: {
  text?: string | null;
  reference?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const resolvedText =
    text ||
    'Now a river went out of Eden to water the garden, and from there it parted and became four riverheads.';
  const resolvedReference = reference || 'Genesis 2:10';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el); // animate only once
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="
        relative 
        h-[280px] md:h-[360px] 
        pt-10 md:pt-12 
        overflow-hidden 
        bg-gradient-to-br from-primary/5 via-background to-secondary/10
      "
    >
      {/* Optional subtle overlay/pattern – replace with real image for more elegance */}
      <div
        className="
          absolute inset-0 
          opacity-5 md:opacity-10 
          pointer-events-none 
          bg-repeat 
          mix-blend-soft-light
        "
        // Recommended: Download a very light, low-contrast texture (e.g. faint cross/dove/paper)
        // and place it in public/images/subtle-christian-pattern.png
      />

      <div className="relative mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`
            transition-all duration-1000 ease-out
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}
          `}
        >
          <blockquote className="text-center">
            <p
              className="
                text-2xl sm:text-3xl md:text-4xl lg:text-5xl 
                leading-relaxed md:leading-relaxed lg:leading-tight
                tracking-wide 
                text-foreground/90 
                italic 
                font-serif
              "
            >
              &ldquo;{resolvedText}&rdquo; &mdash; {resolvedReference}
            </p>

          </blockquote>
        </div>
      </div>
    </section>
  );
}
