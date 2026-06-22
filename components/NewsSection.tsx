'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
  maxItems = 6,
}: {
  kicker?: string;
  title?: string;
  description?: string;
  items: NewsSectionItem[];
  backgroundClassName?: string;
  maxItems?: number;
}) {
  const [selectedItem, setSelectedItem] = useState<NewsSectionItem | null>(null);

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
          {items.slice(0, maxItems).map((item, index) => (
            <div
              key={`${item.title}-${item.date}-${index}`}
              className="group cursor-pointer rounded-3xl border border-primary/10 bg-white/90 shadow-sm overflow-hidden transition-all hover:shadow-md"
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative h-56 sm:h-64 lg:h-72 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
                    {item.badge}
                  </span>
                  <span className="uppercase tracking-[0.2em]">{item.date}</span>
                </div>
                <h3 className="mt-3 text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl lg:max-w-6xl xl:max-w-7xl p-0 overflow-hidden border-none bg-white rounded-3xl shadow-2xl">
          {selectedItem && (
            <div className="flex flex-col lg:flex-row lg:h-[80vh] min-h-[500px]">
              <DialogHeader className="sr-only">
                <DialogTitle>{selectedItem.title}</DialogTitle>
                <DialogDescription>
                  News from {selectedItem.badge} on {selectedItem.date}
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
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
                      {selectedItem.badge}
                    </span>
                    <span className="uppercase tracking-[0.25em] text-foreground/50 font-medium">
                      {selectedItem.date}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-foreground leading-tight">
                    {selectedItem.title}
                  </h2>
                  <div className="mt-6 h-1 w-20 rounded-full bg-primary/20" />
                </div>
                
                <div className="text-foreground/80 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
