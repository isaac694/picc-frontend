'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl } from '@/lib/api';
import { Heart } from 'lucide-react';

export default function PrayerPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    request: '',
    isPrivate: true
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(apiUrl('/api/prayer-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', request: '', isPrivate: true });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Error submitting prayer request:', error);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Prayer Requests</h1>
            <p className="text-lg text-primary-foreground/90">
              We believe in the power of prayer. Share your prayer requests with our prayer team.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Info Section */}
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">How Prayer Works</h2>
                <div className="space-y-6">
                  <Card className="p-6 border-l-4 border-l-secondary">
                    <h3 className="font-bold text-primary mb-2">Share Your Burden</h3>
                    <p className="text-foreground/70">
                      Tell us what&apos;s on your heart. Whether it&apos;s personal, family, health-related, or community concerns, we want to know.
                    </p>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-secondary">
                    <h3 className="font-bold text-primary mb-2">Our Team Prays</h3>
                    <p className="text-foreground/70">
                      Our prayer team will lift your request up in prayer during our daily prayer time and prayer meetings.
                    </p>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-secondary">
                    <h3 className="font-bold text-primary mb-2">Trust in God</h3>
                    <p className="text-foreground/70">
                      We trust God to work in your situation according to His perfect will and timing.
                    </p>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-secondary">
                    <h3 className="font-bold text-primary mb-2">Share Your Testimony</h3>
                    <p className="text-foreground/70">
                      When God answers, we&apos;d love to hear about it! Your story can encourage others in their faith.
                    </p>
                  </Card>
                </div>
              </div>

              {/* Prayer Request Form */}
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Submit Your Prayer Request</h2>
                <Card className="p-8">
                  {submitted && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">Thank you! Your prayer request has been submitted. We will pray for you.</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Your Name</label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Phone (Optional)</label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Your Prayer Request</label>
                      <textarea
                        name="request"
                        value={formData.request}
                        onChange={handleChange}
                        placeholder="Share what's on your heart..."
                        rows={6}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      ></textarea>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        name="isPrivate"
                        checked={formData.isPrivate}
                        onChange={handleChange}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="isPrivate" className="text-sm text-foreground/70 cursor-pointer">
                        Keep this request private (not shared with the congregation)
                      </label>
                    </div>

                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <Heart className="w-4 h-4 mr-2" />
                      Submit Prayer Request
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Prayer Commitment Section */}
        <section className="py-12 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">Our Prayer Commitment</h2>
            <p className="text-foreground/70 mb-6">
              &quot;Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective.&quot; - James 5:16
            </p>
            <p className="text-foreground/70">
              We take every prayer request seriously and commit to lifting your concerns to the Lord in prayer.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

