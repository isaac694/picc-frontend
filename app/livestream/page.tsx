'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LivestreamFooter from '@/components/LivestreamFooter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, MapPin } from 'lucide-react';

export default function LivestreamPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const livestreams = [
    {
      id: 1,
      title: 'Faith in Hard Times',
      pastor: 'Pastor James',
      date: 'March 3, 2024',
      duration: 45,
      description: 'A powerful message about trusting God through challenges',
      type: 'audio'
    },
    {
      id: 2,
      title: 'The Power of Prayer',
      pastor: 'Pastor Sarah',
      date: 'February 25, 2024',
      duration: 50,
      description: 'Understanding effective prayer and its impact on our lives',
      type: 'audio'
    },
    {
      id: 3,
      title: 'Living with Purpose',
      pastor: 'Pastor Michael',
      date: 'February 18, 2024',
      duration: 48,
      description: 'Discovering God\'s purpose for your life and ministry',
      type: 'audio'
    },
    {
      id: 4,
      title: 'Grace and Redemption',
      pastor: 'Pastor James',
      date: 'February 11, 2024',
      duration: 52,
      description: 'Understanding the transformative power of God\'s grace',
      type: 'audio'
    },
    {
      id: 5,
      title: 'Community and Fellowship',
      pastor: 'Pastor Sarah',
      date: 'February 4, 2024',
      duration: 46,
      description: 'Building strong relationships in Christ',
      type: 'audio'
    },
    {
      id: 6,
      title: 'The Kingdom of God',
      pastor: 'Pastor Michael',
      date: 'January 28, 2024',
      duration: 55,
      description: 'Understanding what the Kingdom of God means for us today',
      type: 'audio'
    },
  ];

  const filteredLivestreams = livestreams.filter((stream) =>
    stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stream.pastor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <section className="py-20 md:py-24 bg-black text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Watch <span className="text-red-500">Live</span> Services
            </h1>
            <p className="text-base md:text-lg text-white/80">
              Experience the Presence of God Anytime, Anywhere.
            </p>
          </div>
        </section>

        {/* Sunday Livestream Section */}
        <section className="py-12 md:py-16 bg-black">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <div className="aspect-video bg-white/10 flex items-center justify-center text-white/70">
                Sunday Livestream Placeholder
              </div>
              <div className="bg-white text-black px-6 py-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-semibold">Stream in English</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#F1E7FF] px-3 py-1 text-xs font-medium text-[#5B2B9A]">
                      Live Stream
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#DCEAFF] px-3 py-1 text-xs font-medium text-[#1E4FA3]">
                      <MapPin size={12} />
                      Area 49, Lilongwe
                    </span>
                    <Link
                      href="/forms"
                      className="inline-flex items-center gap-2 rounded-full bg-[#CFF6DF] px-3 py-1 text-xs font-medium text-[#137A3D] hover:bg-[#BDEFD3] transition-colors"
                    >
                      Expectation form
                    </Link>
                    <Button asChild size="sm" className="rounded-full px-4 bg-[#39D98A] text-black hover:bg-[#2FC77C]">
                      <Link href="/give">Give</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-10 md:py-12 bg-black border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2">
              <Input
                placeholder="Search streams by title or pastor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-white/5 border-white/15 text-white placeholder:text-white/50"
              />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Search
              </Button>
            </div>
          </div>
        </section>

        {/* Livestreams Grid */}
        <section className="py-20 md:py-24 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredLivestreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLivestreams.map((stream) => (
                  <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-white border-black/10 text-black">
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center relative">
                      <Image
                        src="/placeholder-event.jpg"
                        alt={stream.title}
                        fill
                        className="object-cover opacity-20"
                      />
                      <Play className="w-16 h-16 text-secondary relative z-10" fill="currentColor" />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-bold text-lg text-black mb-2 line-clamp-2">{stream.title}</h3>
                      <p className="text-sm text-black/70 mb-4 flex-1 line-clamp-2">{stream.description}</p>
                      <div className="space-y-2 text-sm text-black/60 mb-4">
                        <p>👤 {stream.pastor}</p>
                        <p>📅 {stream.date}</p>
                        <p>⏱️ {stream.duration} minutes</p>
                      </div>
                      <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        Watch Livestream
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-white/70">No streams found matching your search.</p>
              </div>
            )}
          </div>
        </section>

      </main>
      <LivestreamFooter />
    </>
  );
}


