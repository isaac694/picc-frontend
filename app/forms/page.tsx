'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FormsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <section className="text-white bg-[radial-gradient(circle_at_top,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)] rounded-b-[36px] md:rounded-b-[48px]">
          <div className="py-16 md:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-6xl font-semibold mb-3">Forms</h1>
              <p className="text-white/80">
                Share your details and let us serve you better.
              </p>
            </div>
          </div>

          <div className="pb-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 items-stretch">
                <div className="relative min-h-[20rem] sm:min-h-[26rem] md:min-h-[34rem] lg:min-h-[38rem] rounded-3xl overflow-hidden shadow-2xl bg-white/10">
                  <Image
                    src="/images/our-church.JPG"
                    alt="PICC church family"
                    fill
                    className="object-cover"
                  />
                </div>

                <Card className="bg-white/15 backdrop-blur-sm text-white border-white/20 shadow-2xl rounded-3xl h-full">
                  <div className="px-6 py-8 md:px-8 md:py-10 h-full flex flex-col justify-center">
                    <h2 className="text-3xl font-semibold text-white mb-2">Become a member</h2>
                    <p className="text-white/80 mb-6">
                      If you made a decision today, we would love to connect with you.
                    </p>

                    <form className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          className="mt-2 w-full rounded-xl border border-white/20 bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            Email
                          </label>
                          <input
                            type="email"
                            placeholder="Email Address"
                            className="mt-2 w-full rounded-xl border border-white/20 bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            Phone/Mobile
                          </label>
                          <input
                            type="tel"
                            placeholder="Mobile Number"
                            className="mt-2 w-full rounded-xl border border-white/20 bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            Address
                          </label>
                          <input
                            type="text"
                            placeholder="Address"
                            className="mt-2 w-full rounded-xl border border-white/20 bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            City
                          </label>
                          <input
                            type="text"
                            placeholder="City"
                            className="mt-2 w-full rounded-xl border border-white/20 bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            State
                          </label>
                          <input
                            type="text"
                            placeholder="State"
                            className="mt-2 w-full rounded-xl border border-white/20 bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            Country
                          </label>
                          <input
                            type="text"
                            placeholder="Country"
                            className="mt-2 w-full rounded-xl border border-white/20 bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                      </div>

                      <Button className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        Let&apos;s Get You Started
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-10 items-stretch">
              <Card className="bg-white/10 backdrop-blur-sm text-foreground border border-border/20 shadow-2xl rounded-3xl h-full">
                <div className="px-6 py-8 md:px-8 md:py-10 h-full flex flex-col justify-center">
                  <h2 className="text-3xl font-semibold text-primary mb-2">Submit a testimony</h2>
                  <p className="text-foreground/70 mb-6">
                    Share what God has done in your life and encourage others.
                  </p>

                  <form className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-white px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                        Testimony
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Share your testimony"
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-white px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <Button className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      Submit Testimony
                    </Button>
                  </form>
                </div>
              </Card>

              <div className="relative min-h-[20rem] sm:min-h-[26rem] md:min-h-[34rem] lg:min-h-[38rem] rounded-3xl overflow-hidden shadow-2xl bg-white/5">
                <Image
                  src="/images/send-message-2.JPG"
                  alt="Share your testimony"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="rounded-[36px] bg-[radial-gradient(circle_at_top_left,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)] p-8 md:p-12 text-white shadow-2xl">
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-stretch">
                <div className="flex flex-col justify-center">
                  <h2 className="text-3xl md:text-4xl font-semibold mb-4">Prayer Request</h2>
                  <form className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="Email Address"
                          className="mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                          Phone/Mobile
                        </label>
                        <input
                          type="tel"
                          placeholder="Mobile Number"
                          className="mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                          Address
                        </label>
                        <input
                          type="text"
                          placeholder="Address"
                          className="mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="City"
                          className="mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                          State
                        </label>
                        <input
                          type="text"
                          placeholder="State"
                          className="mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                          Country
                        </label>
                        <input
                          type="text"
                          placeholder="Country"
                          className="mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                        Prayer Request
                      </label>
                      <textarea
                        rows={4}
                        placeholder="What would you like us to pray with you about?"
                        className="mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                      />
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Send My Prayer
                    </Button>
                  </form>
                </div>

                <div className="relative min-h-[20rem] sm:min-h-[24rem] md:min-h-[30rem] lg:min-h-[34rem] rounded-3xl overflow-hidden bg-white/10 shadow-2xl">
                  <Image
                    src="/images/our-church.JPG"
                    alt="Prayer request"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

