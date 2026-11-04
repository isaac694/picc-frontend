'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { HandHeart, Sparkles, UserPlus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MembershipTool from '@/components/livestream/MembershipTool';
import TestimonyTool from '@/components/livestream/TestimonyTool';
import PrayerRequestTool from '@/components/livestream/PrayerRequestTool';
import { apiFetch, apiUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

type FormKey = 'membership' | 'testimony' | 'prayer';

// Same tab-and-panel layout as the livestream tools, using the same form components.
const FORMS: Array<{
  key: FormKey;
  label: string;
  blurb: string;
  icon: typeof UserPlus;
  pill: string;
  imageKey: string;
  fallback: string;
}> = [
  {
    key: 'membership',
    label: 'Become a member',
    blurb: 'Join the PICC family and let us walk with you.',
    icon: UserPlus,
    pill: 'bg-[#EAF2FF] text-[#1E4FA3] hover:bg-[#DCEAFF]',
    imageKey: 'membership-form-image',
    fallback: '/images/our-church.JPG',
  },
  {
    key: 'testimony',
    label: 'Send Testimony',
    blurb: 'Share what God has done and encourage others.',
    icon: Sparkles,
    pill: 'bg-[#CFF6DF] text-[#137A3D] hover:bg-[#BDEFD3]',
    imageKey: 'testimony-form-image',
    fallback: '/images/send-message-2.JPG',
  },
  {
    key: 'prayer',
    label: 'Prayer Request',
    blurb: 'Tell us what to pray with you about.',
    icon: HandHeart,
    pill: 'bg-[#FFF2DA] text-[#8A5A00] hover:bg-[#FFE9C2]',
    imageKey: 'prayer-form-image',
    fallback: '/images/our-church.JPG',
  },
];

export default function FormsPage() {
  const [active, setActive] = useState<FormKey>('membership');
  const [images, setImages] = useState<Record<string, string>>(() => Object.fromEntries(FORMS.map((form) => [form.imageKey, form.fallback])));

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('form');
    if (requested && FORMS.some((form) => form.key === requested)) setActive(requested as FormKey);

    void Promise.all(
      FORMS.map(async (form) => {
        try {
          const response = await apiFetch(`/api/site-content/${form.imageKey}`);
          const data = response.ok ? await response.json() : null;
          const url = data?.imageUrl ? String(data.imageUrl) : '';
          return [form.imageKey, url ? (url.startsWith('http') ? url : apiUrl(url)) : form.fallback] as const;
        } catch {
          return [form.imageKey, form.fallback] as const;
        }
      }),
    ).then((entries) => setImages(Object.fromEntries(entries)));
  }, []);

  const current = FORMS.find((form) => form.key === active) || FORMS[0];

  const choose = (key: FormKey) => {
    setActive(key);
    const url = new URL(window.location.href);
    url.searchParams.set('form', key);
    window.history.replaceState(null, '', url);
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black text-white">
        <section className="py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Church <span className="text-[#39D98A]">Forms</span>
            </h1>
            <p className="text-base text-white/80 md:text-lg">Share your details and let us serve you better.</p>
          </div>
        </section>

        <section aria-label="Choose a form">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Choose a form</p>
            <div role="tablist" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {FORMS.map((form) => {
                const selected = form.key === active;
                return (
                  <button
                    key={form.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => choose(form.key)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                      selected ? 'border-white bg-white text-black' : 'border-white/15 bg-white/5 text-white hover:bg-white/10',
                    )}
                  >
                    <form.icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{form.label}</span>
                      <span className={cn('block truncate text-xs', selected ? 'text-black/60' : 'text-white/50')}>{form.blurb}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-8 pb-20 md:py-10 md:pb-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                {FORMS.map((form) => (
                  <button
                    key={form.key}
                    type="button"
                    onClick={() => choose(form.key)}
                    className={cn('rounded-full px-3 py-1 transition-colors', active === form.key ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20')}
                  >
                    {form.label}
                  </button>
                ))}
              </div>
              <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
                <div className="px-5 py-6 md:px-8 md:py-8">
                  {active === 'membership' && <MembershipTool source="forms" />}
                  {active === 'testimony' && <TestimonyTool source="forms" />}
                  {active === 'prayer' && <PrayerRequestTool ministryKey="forms" />}
                </div>
                <div className="relative hidden min-h-[28rem] lg:block">
                  <Image src={images[current.imageKey] || current.fallback} alt="" fill sizes="40vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 p-6">
                    <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium', current.pill)}>
                      <current.icon className="h-3 w-3" /> {current.label}
                    </span>
                    <p className="mt-3 text-sm text-white/80">{current.blurb}</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 px-4 py-3 text-xs text-white/60">
                Your details go straight to the church office and are kept private.
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
