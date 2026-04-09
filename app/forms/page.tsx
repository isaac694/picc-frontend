'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FormsPage() {
  const [memberForm, setMemberForm] = useState({
    fullName: '',
    gender: '',
    email: '',
    phone: '',
    city: '',
    country: '',
  });
  const [testimonyForm, setTestimonyForm] = useState({
    fullName: '',
    phone: '',
    area: '',
    situation: '',
    testimony: '',
  });
  const [prayerForm, setPrayerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    bornAgain: '',
    areaOfNeed: '',
    request: '',
  });

  const handleMemberChange = (field: keyof typeof memberForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setMemberForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleMemberSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = 'Membership Form Submission';
    const body = [
      `Full Name: ${memberForm.fullName}`,
      `Gender: ${memberForm.gender}`,
      `Email: ${memberForm.email}`,
      `Phone Number: ${memberForm.phone}`,
      `City/District: ${memberForm.city}`,
      `Country: ${memberForm.country}`,
    ].join('\n');

    window.location.href = `mailto:info@piccworldwide.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleTestimonyChange = (field: keyof typeof testimonyForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTestimonyForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleTestimonySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = 'Testimony Submission';
    const body = [
      `Full Name: ${testimonyForm.fullName}`,
      `Phone Number: ${testimonyForm.phone || 'N/A'}`,
      `Area of Testimony: ${testimonyForm.area || 'N/A'}`,
      '',
      'How the situation was like:',
      testimonyForm.situation,
      '',
      'What God has done:',
      testimonyForm.testimony,
    ].join('\n');

    window.location.href = `mailto:info@piccworldwide.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handlePrayerChange = (field: keyof typeof prayerForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setPrayerForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePrayerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = 'Prayer Request Submission';
    const body = [
      `Full Name: ${prayerForm.fullName}`,
      `Email: ${prayerForm.email || 'N/A'}`,
      `Phone: ${prayerForm.phone || 'N/A'}`,
      `Address: ${prayerForm.address || 'N/A'}`,
      `City: ${prayerForm.city || 'N/A'}`,
      `State: ${prayerForm.state || 'N/A'}`,
      `Country: ${prayerForm.country || 'N/A'}`,
      `Born Again: ${prayerForm.bornAgain || 'N/A'}`,
      `Area of Need: ${prayerForm.areaOfNeed || 'N/A'}`,
      '',
      'Prayer Request:',
      prayerForm.request,
    ].join('\n');

    window.location.href = `mailto:info@piccworldwide.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

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
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>

                <Card className="bg-white/15 backdrop-blur-sm text-white border-white/20 shadow-2xl rounded-3xl h-full">
                  <div className="px-6 py-8 md:px-8 md:py-10 h-full flex flex-col justify-center">
                    <h2 className="text-3xl font-semibold text-white mb-2">Become a member</h2>
                    <p className="text-white/80 mb-6">
                      If you made a decision today, we would love to connect with you.
                    </p>

                    <form className="space-y-4" onSubmit={handleMemberSubmit}>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          required
                          value={memberForm.fullName}
                          onChange={handleMemberChange('fullName')}
                          className="mt-2 w-full rounded-xl border border-white/20 bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                          Gender
                        </label>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          {['Male', 'Female'].map((option) => (
                            <label
                              key={option}
                              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/85 px-3 py-2 text-sm text-foreground shadow-sm"
                            >
                              <input
                                type="radio"
                                name="gender"
                                value={option}
                                required
                                checked={memberForm.gender === option}
                                onChange={handleMemberChange('gender')}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            Email
                          </label>
                          <input
                            type="email"
                            placeholder="Email Address"
                            required
                            value={memberForm.email}
                            onChange={handleMemberChange('email')}
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
                            required
                            value={memberForm.phone}
                            onChange={handleMemberChange('phone')}
                            className="mt-2 w-full rounded-xl border border-white/20 bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                            City/District
                          </label>
                          <input
                            type="text"
                            placeholder="City/District"
                            required
                            value={memberForm.city}
                            onChange={handleMemberChange('city')}
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
                            required
                            value={memberForm.country}
                            onChange={handleMemberChange('country')}
                            className="mt-2 w-full rounded-xl border border-white/20 bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          />
                        </div>
                      </div>

                      <Button className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        Submit
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

                  <form className="space-y-4" onSubmit={handleTestimonySubmit}>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={testimonyForm.fullName}
                        onChange={handleTestimonyChange('fullName')}
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-white px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={testimonyForm.phone}
                        onChange={handleTestimonyChange('phone')}
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-white px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                        Area of Testimony
                      </label>
                      <input
                        type="text"
                        placeholder="Area of Testimony"
                        value={testimonyForm.area}
                        onChange={handleTestimonyChange('area')}
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-white px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                        How the situation was like
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Describe the situation"
                        required
                        value={testimonyForm.situation}
                        onChange={handleTestimonyChange('situation')}
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-white px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                        What God has done
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Share what God has done"
                        required
                        value={testimonyForm.testimony}
                        onChange={handleTestimonyChange('testimony')}
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
                  sizes="(max-width: 1024px) 100vw, 50vw"
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
                  <form className="space-y-4" onSubmit={handlePrayerSubmit}>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={prayerForm.fullName}
                        onChange={handlePrayerChange('fullName')}
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
                          value={prayerForm.email}
                          onChange={handlePrayerChange('email')}
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
                          value={prayerForm.phone}
                          onChange={handlePrayerChange('phone')}
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
                          value={prayerForm.address}
                          onChange={handlePrayerChange('address')}
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
                          value={prayerForm.city}
                          onChange={handlePrayerChange('city')}
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
                          value={prayerForm.state}
                          onChange={handlePrayerChange('state')}
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
                          value={prayerForm.country}
                          onChange={handlePrayerChange('country')}
                          className="mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                        Are you born again?
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        {['Yes', 'No'].map((option) => (
                          <label
                            key={option}
                            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-sm text-foreground shadow-sm"
                          >
                            <input
                              type="radio"
                              name="bornAgain"
                              value={option}
                              required
                              checked={prayerForm.bornAgain === option}
                              onChange={handlePrayerChange('bornAgain')}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                        Area of Need
                      </label>
                      <select
                        value={prayerForm.areaOfNeed}
                        onChange={handlePrayerChange('areaOfNeed')}
                        className="mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        required
                      >
                        <option value="">Select area of need</option>
                        <option value="Spiritual Growth">Spiritual Growth</option>
                        <option value="Healing">Healing</option>
                        <option value="Financial">Financial</option>
                        <option value="Family">Family</option>
                        <option value="Marriage">Marriage</option>
                        <option value="Children">Children</option>
                        <option value="Career/Job">Career/Job</option>
                        <option value="Education">Education</option>
                        <option value="Relationships">Relationships</option>
                        <option value="Deliverance">Deliverance</option>
                        <option value="Guidance">Guidance</option>
                        <option value="Salvation">Salvation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70">
                        Prayer Request
                      </label>
                      <textarea
                        rows={4}
                        placeholder="What would you like us to pray with you about?"
                        required
                        value={prayerForm.request}
                        onChange={handlePrayerChange('request')}
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
                    sizes="(max-width: 1024px) 100vw, 50vw"
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

