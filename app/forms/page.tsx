'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch, apiUrl } from '@/lib/api';
import { sendMembershipNotification, sendPrayerNotification, sendTestimonyNotification } from '@/lib/email';

export default function FormsPage() {
  const [memberForm, setMemberForm] = useState({
    fullName: '',
    gender: '',
    email: '',
    phone: '',
    city: '',
    country: '',
  });
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);
  const [testimonyForm, setTestimonyForm] = useState({
    fullName: '',
    phone: '',
    area: '',
    situation: '',
    testimony: '',
  });
  const [testimonySubmitting, setTestimonySubmitting] = useState(false);
  const [testimonyError, setTestimonyError] = useState<string | null>(null);
  const [testimonySuccess, setTestimonySuccess] = useState<string | null>(null);
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
  const [prayerSubmitting, setPrayerSubmitting] = useState(false);
  const [prayerError, setPrayerError] = useState<string | null>(null);
  const [prayerSuccess, setPrayerSuccess] = useState<string | null>(null);
  const [formImages, setFormImages] = useState<Record<string, string>>({
    membershipForm: '/images/our-church.JPG',
    testimonyForm: '/images/send-message-2.JPG',
    prayerForm: '/images/our-church.JPG',
  });

  const normalizeImageUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return apiUrl(url);
  };

  useEffect(() => {
    const fetchImages = async () => {
      const imageKeys = [
        { stateKey: 'membershipForm', key: 'membership-form-image', fallback: '/images/our-church.JPG' },
        { stateKey: 'testimonyForm', key: 'testimony-form-image', fallback: '/images/send-message-2.JPG' },
        { stateKey: 'prayerForm', key: 'prayer-form-image', fallback: '/images/our-church.JPG' },
      ];

      const entries = await Promise.all(
        imageKeys.map(async (item) => {
          try {
            const response = await apiFetch(`/api/site-content/${item.key}`);
            if (!response.ok) {
              return [item.stateKey, item.fallback] as const;
            }
            const data = await response.json();
            return [item.stateKey, data.imageUrl ? normalizeImageUrl(data.imageUrl) : item.fallback] as const;
          } catch (error) {
            return [item.stateKey, item.fallback] as const;
          }
        })
      );
      setFormImages(Object.fromEntries(entries));
    };

    fetchImages();
  }, []);

  const handleMemberChange = (field: keyof typeof memberForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setMemberForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleMemberSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMemberError(null);
    setMemberSuccess(null);

    if (!memberForm.fullName || !memberForm.gender || !memberForm.email || !memberForm.phone || !memberForm.city || !memberForm.country) {
      setMemberError('Please complete the required fields before submitting.');
      return;
    }

    setMemberSubmitting(true);
    try {
      await sendMembershipNotification({
        churchEmail: 'info@piccworldwide.org',
        fullName: memberForm.fullName,
        gender: memberForm.gender,
        email: memberForm.email,
        phone: memberForm.phone,
        city: memberForm.city,
        country: memberForm.country,
      });
      setMemberSuccess('Thank you! Your membership form was submitted.');
      setMemberForm({
        fullName: '',
        gender: '',
        email: '',
        phone: '',
        city: '',
        country: '',
      });
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : 'Failed to submit membership form.');
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleTestimonyChange = (field: keyof typeof testimonyForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTestimonyForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleTestimonySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTestimonyError(null);
    setTestimonySuccess(null);

    if (!testimonyForm.fullName || !testimonyForm.situation || !testimonyForm.testimony) {
      setTestimonyError('Please complete the required fields before submitting.');
      return;
    }

    setTestimonySubmitting(true);
    try {
      await sendTestimonyNotification({
        churchEmail: 'info@piccworldwide.org',
        fullName: testimonyForm.fullName,
        phone: testimonyForm.phone || undefined,
        area: testimonyForm.area || undefined,
        situation: testimonyForm.situation,
        testimony: testimonyForm.testimony,
      });
      setTestimonySuccess('Thank you! Your testimony has been sent.');
      setTestimonyForm({
        fullName: '',
        phone: '',
        area: '',
        situation: '',
        testimony: '',
      });
    } catch (error) {
      setTestimonyError(error instanceof Error ? error.message : 'Failed to submit testimony.');
    } finally {
      setTestimonySubmitting(false);
    }
  };

  const handlePrayerChange = (field: keyof typeof prayerForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setPrayerForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePrayerSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPrayerError(null);
    setPrayerSuccess(null);

    if (!prayerForm.fullName || !prayerForm.request) {
      setPrayerError('Please complete the required fields before submitting.');
      return;
    }

    setPrayerSubmitting(true);
    try {
      await sendPrayerNotification({
        churchEmail: 'info@piccworldwide.org',
        fullName: prayerForm.fullName,
        email: prayerForm.email || undefined,
        phone: prayerForm.phone || undefined,
        address: prayerForm.address || undefined,
        city: prayerForm.city || undefined,
        state: prayerForm.state || undefined,
        country: prayerForm.country || undefined,
        bornAgain: prayerForm.bornAgain || undefined,
        areaOfNeed: prayerForm.areaOfNeed || undefined,
        request: prayerForm.request,
      });
      setPrayerSuccess('Thank you! Your prayer request was submitted.');
      setPrayerForm({
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
    } catch (error) {
      setPrayerError(error instanceof Error ? error.message : 'Failed to submit prayer request.');
    } finally {
      setPrayerSubmitting(false);
    }
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
                    src={formImages.membershipForm}
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
                  {memberError && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {memberError}
                    </div>
                  )}
                  {memberSuccess && (
                    <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
                      {memberSuccess}
                    </div>
                  )}

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

                      <Button className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90" disabled={memberSubmitting}>
                        {memberSubmitting ? 'Sending...' : 'Submit'}
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
                  {testimonyError && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                      {testimonyError}
                    </div>
                  )}
                  {testimonySuccess && (
                    <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                      {testimonySuccess}
                    </div>
                  )}

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
                      <select
                        value={testimonyForm.area}
                        onChange={handleTestimonyChange('area') as any}
                        className="mt-2 w-full rounded-xl border border-foreground/10 bg-white px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        required
                      >
                        <option value="">Select area of testimony</option>
                        <option value="Healing & Health">Healing & Health</option>
                        <option value="Financial Breakthrough">Financial Breakthrough</option>
                        <option value="Family & Marriage">Family & Marriage</option>
                        <option value="Career & Business">Career & Business</option>
                        <option value="Spiritual Growth">Spiritual Growth</option>
                        <option value="Protection & Safety">Protection & Safety</option>
                        <option value="Academic Success">Academic Success</option>
                        <option value="Fruit of the Womb">Fruit of the Womb</option>
                        <option value="Salvation">Salvation</option>
                        <option value="Other">Other</option>
                      </select>
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
                    <Button className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90" disabled={testimonySubmitting}>
                      {testimonySubmitting ? 'Sending...' : 'Submit Testimony'}
                    </Button>
                  </form>
                </div>
              </Card>

              <div className="relative min-h-[20rem] sm:min-h-[26rem] md:min-h-[34rem] lg:min-h-[38rem] rounded-3xl overflow-hidden shadow-2xl bg-white/5">
                <Image
                  src={formImages.testimonyForm}
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
                  {prayerError && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {prayerError}
                    </div>
                  )}
                  {prayerSuccess && (
                    <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
                      {prayerSuccess}
                    </div>
                  )}
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
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={prayerSubmitting}>
                      {prayerSubmitting ? 'Sending...' : 'Send My Prayer'}
                    </Button>
                  </form>
                </div>

                <div className="relative min-h-[20rem] sm:min-h-[24rem] md:min-h-[30rem] lg:min-h-[34rem] rounded-3xl overflow-hidden bg-white/10 shadow-2xl">
                  <Image
                    src={formImages.prayerForm}
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
