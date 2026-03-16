// components/VerseSection.tsx

'use client';

import { useEffect, useRef, useState } from 'react';

export default function VerseSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

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

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              "And let us consider how we may spur one another on toward love and good deeds, not giving up meeting
              together, as some are in the habit of doing, but encouraging one another—and all the more as you see the
              Day approaching."
            </p>

            <footer
              className="
                mt-6 md:mt-8 
                text-lg md:text-xl 
                text-foreground/60 
                font-medium 
                tracking-wide
              "
            >
              — Hebrews 10:24-25
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
