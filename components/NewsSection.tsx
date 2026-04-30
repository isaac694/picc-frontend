'use client';

import Image from 'next/image';

export type NewsSectionItem = {
  badge: string;
  date: string;
  title: string;
  description: string;
  image: string;
};

export default function NewsSection({
  kicker = "What's happening",
  title = 'News',
  description,
  items,
  backgroundClassName = 'bg-[#eef4fb]',
}: {
  kicker?: string;
  title?: string;
  description?: string;
  items: NewsSectionItem[];
  backgroundClassName?: string;
}) {
  return (
    <section className={`py-16 sm:py-20 md:py-24 ${backgroundClassName}`}>
      <div className="w-full px-0">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.45em] text-primary/70 mb-3">
            {kicker}
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold text-foreground">{title}</h2>
          <div className="mx-auto mt-4 h-[3px] w-14 rounded-full bg-primary" />
          {description ? (
            <p className="mt-4 text-foreground/70 max-w-2xl mx-auto">{description}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 px-4 sm:px-6 lg:px-10">
          {items.slice(0, 6).map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-primary/10 bg-white/90 shadow-sm overflow-hidden"
            >
              <div className="relative h-56 sm:h-64 lg:h-72">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
                    {item.badge}
                  </span>
                  <span className="uppercase tracking-[0.2em]">{item.date}</span>
                </div>
                <h3 className="mt-3 text-lg md:text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-foreground/70">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

