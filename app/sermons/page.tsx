'use client';

import { useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play } from 'lucide-react';

export default function SermonsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const sermons = [
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

  const filteredSermons = sermons.filter(sermon =>
    sermon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sermon.pastor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-12 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Sermon Library</h1>
            <p className="text-lg text-foreground/70">Listen to inspiring messages from our pastors</p>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-8 bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2">
              <Input
                placeholder="Search sermons by title or pastor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Search
              </Button>
            </div>
          </div>
        </section>

        {/* Sermons Grid */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredSermons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSermons.map((sermon) => (
                  <Card key={sermon.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                    <div className="aspect-video bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center relative">
                      <Image
                        src="/placeholder-event.jpg"
                        alt={sermon.title}
                        fill
                        className="object-cover opacity-20"
                      />
                      <Play className="w-16 h-16 text-secondary relative z-10" fill="currentColor" />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-bold text-lg text-primary mb-2 line-clamp-2">{sermon.title}</h3>
                      <p className="text-sm text-foreground/70 mb-4 flex-1 line-clamp-2">{sermon.description}</p>
                      <div className="space-y-2 text-sm text-foreground/60 mb-4">
                        <p>👤 {sermon.pastor}</p>
                        <p>📅 {sermon.date}</p>
                        <p>⏱️ {sermon.duration} minutes</p>
                      </div>
                      <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        Play Sermon
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-foreground/70">No sermons found matching your search.</p>
              </div>
            )}
          </div>
        </section>

        {/* Subscription CTA */}
        <section className="py-12 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">Never Miss a Sermon</h2>
            <p className="text-foreground/70 mb-6">Subscribe to receive notifications when new sermons are added</p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <Input placeholder="Enter your email" type="email" className="flex-1" />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Subscribe
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

