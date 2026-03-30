import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Quote } from 'lucide-react';

export default function TestimoniesPage() {
  const testimonies = [
    {
      id: 1,
      name: 'John Smith',
      title: 'My Journey to Faith',
      image: '/placeholder-profile.jpg',
      content: 'Coming to this church changed my entire life. I found a community of believers who truly care about each other and about our faith. Through the sermons and fellowship, I discovered a deeper relationship with God that has transformed everything about how I see the world.'
    },
    {
      id: 2,
      name: 'Mary Johnson',
      title: 'Healed by Faith',
      image: '/placeholder-profile.jpg',
      content: 'When I was going through my darkest hours, the prayers and support from our church family lifted me up. I felt God\'s love through every person here. The prayer team\'s faithful intercession gave me strength when I had none of my own. I\'m grateful for this body of believers.'
    },
    {
      id: 3,
      name: 'David Lee',
      title: 'From Doubt to Conviction',
      image: '/placeholder-profile.jpg',
      content: 'I came to this church skeptical about faith, but the genuine love and authentic worship I witnessed opened my heart. The pastor\'s teaching helped me understand Scripture in a new way, and I finally surrendered my life to Christ. This church became my family in Christ.'
    },
    {
      id: 4,
      name: 'Sarah Williams',
      title: 'Finding Purpose',
      image: '/placeholder-profile.jpg',
      content: 'Through the discipleship program at this church, I discovered God\'s purpose for my life. I went from feeling lost and purposeless to finding joy in serving others. The mentorship I received has been invaluable, and I\'m now able to mentor others in their faith journey.'
    },
    {
      id: 5,
      name: 'Michael Brown',
      title: 'Restored Family',
      image: '/placeholder-profile.jpg',
      content: 'My family was broken and hurting, but through the counseling and prayer support from this church community, we found restoration. God healed our relationships, and we\'re now stronger than ever. The love shown to us by church members demonstrated Christ\'s love in a powerful way.'
    },
    {
      id: 6,
      name: 'Jennifer Davis',
      title: 'Called to Service',
      image: '/placeholder-profile.jpg',
      content: 'This church helped me discover my spiritual gifts and calling to ministry. Through the various volunteer opportunities and training, I found my passion for serving God and others. I\'m now leading a ministry that impacts dozens of lives each week.'
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Member Testimonies</h1>
            <p className="text-lg text-primary-foreground/90">
              Read inspiring stories from members of our church community about how God has worked in their lives.
            </p>
          </div>
        </section>

        {/* Testimonies Grid */}
        <section className="py-16 sm:py-20 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonies.map((testimony) => (
                <Card key={testimony.id} className="p-8 hover:shadow-lg transition-shadow flex flex-col">
                  <Quote className="w-8 h-8 text-secondary mb-4" />
                  
                  <p className="text-foreground/80 mb-6 flex-1 leading-relaxed italic">
                    &ldquo;{testimony.content}&rdquo;
                  </p>

                  <div className="flex items-center gap-4 pt-6 border-t border-border">
                    <div className="w-16 h-16 relative flex-shrink-0">
                      <Image
                        src={testimony.image}
                        alt={testimony.name}
                        fill
                        className="object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary">{testimony.name}</h3>
                      <p className="text-sm text-foreground/70">{testimony.title}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Share Your Story CTA */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">Share Your Testimony</h2>
            <p className="text-foreground/70 mb-6">
              Do you have a story about how God has worked in your life? We&apos;d love to hear it and share it with our community to encourage others in their faith.
            </p>
            <button className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors">
              Share Your Story
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}


