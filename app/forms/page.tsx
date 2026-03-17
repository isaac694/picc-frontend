'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FormsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black text-white">
        <section className="py-20 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Forms</h1>
            <p className="text-white/70">
              Choose the form you need below.
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white text-black border-black/10">
                <div className="px-6">
                  <h2 className="text-xl font-semibold mb-2">Become a Registered Member</h2>
                  <p className="text-sm text-black/70 mb-6">
                    Complete the membership form to join Pentecost International Christian Center.
                  </p>
                  <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    <Link href="/forms/register">Start Registration</Link>
                  </Button>
                </div>
              </Card>

              <Card className="bg-white text-black border-black/10">
                <div className="px-6">
                  <h2 className="text-xl font-semibold mb-2">Submit a Testimony</h2>
                  <p className="text-sm text-black/70 mb-6">
                    Share what God has done in your life and encourage others.
                  </p>
                  <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    <Link href="/forms/testimony">Submit Testimony</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
