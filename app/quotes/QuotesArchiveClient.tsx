'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Quote } from 'lucide-react';

type ArchivedQuote = {
  id: string;
  quote: string;
  author: string;
  imageUrl?: string;
  createdAt: string;
};

type QuotesArchiveClientProps = {
  initialQuotes: ArchivedQuote[];
};

export default function QuotesArchiveClient({ initialQuotes }: QuotesArchiveClientProps) {
  const [quotes] = useState<ArchivedQuote[]>(initialQuotes);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 sm:py-20 md:py-24 bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)] text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Quotes Archive</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              A collection of monthly wisdom and spiritual encouragement from our pastors.
            </p>
          </div>
        </section>

        {/* Quotes Grid */}
        <section className="py-16 sm:py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {quotes.length === 0 ? (
              <div className="text-center py-12">
                <Quote className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                <p className="text-foreground/60 italic">No archived quotes found yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {quotes.map((item) => (
                  <Card key={item.id} className="overflow-hidden border-border/40 hover:shadow-lg transition-all flex flex-col group">
                    {item.imageUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.author}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <Quote className="w-6 h-6 text-primary/40 mb-4" />
                      <blockquote className="text-lg font-medium text-foreground mb-6 flex-1 italic">
                        &ldquo;{item.quote}&rdquo;
                      </blockquote>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                        <div>
                          <p className="font-bold text-primary text-sm">{item.author}</p>
                          <p className="text-xs text-foreground/50">
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
