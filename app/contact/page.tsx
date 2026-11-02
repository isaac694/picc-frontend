'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Facebook,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Youtube,
} from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiFetch, apiUrl } from '@/lib/api';
import { CONTENT_COLLECTIONS, fetchContentCollections, seedsToItems, type ContentItem } from '@/lib/content-items';
import { CONTACT_CARD_SEEDS } from '@/lib/contact-defaults';
import { cn } from '@/lib/utils';

type ServiceRecord = {
  id?: string | null;
  title?: string | null;
  dayOfWeek?: string | null;
  time?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

const CARD_ICONS: Record<string, typeof Phone> = {
  phone: Phone,
  email: Mail,
  location: MapPin,
  whatsapp: MessageCircle,
  clock: Clock,
  facebook: Facebook,
  youtube: Youtube,
};

const DEFAULT_SERVICE_LINES = [
  'Prophetic Sunday Service - 6:00 AM - 7:15 AM',
  'Prophetic Sunday Service (Second) - 7:30 AM - 9:30 AM',
  'Prophetic Sunday Service (Third) - 10:00 AM - 12:30 PM',
  'Sunday Youth Church - 1:30 PM - 3:30 PM',
  'Last Sunday of the Month - Miracle and Celebration Service - 7:00 AM - 12:00 PM',
  'Every Quarter of the Year - Mega Sunday Service - 7:00 AM - 12:00 PM',
  'Everyday - Morning Glory - 5:00 AM - 6:00 AM',
  'Every Tuesday - Home Church - 5:30 PM - 7:00 PM',
  'Every Thursday - Special Word Encounter - 6:00 PM - 8:00 PM',
];

const SUBJECTS = ['General enquiry', 'Prayer request', 'Pastoral care', 'Partnership', 'Events', 'Media'];

const MAP_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3086.6576842444136!2d33.7453956!3d-13.9240918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1921d5bac6745c93%3A0x8c408a3504600518!2sPICC%20Headquarters!5e0!3m2!1sen!2sus!4v1730985600000!5m2!1sen!2sus';

/** "Every Thursday - Special Word Encounter - 6:00 PM - 8:00 PM" → name + time. */
function splitServiceLine(line: string) {
  const match = line.match(/^(.*?)\s-\s(\d{1,2}:\d{2}\s?[AP]M.*)$/i);
  return match ? { name: match[1], time: match[2] } : { name: line, time: '' };
}

const fieldClass =
  'peer w-full rounded-2xl border border-border/80 bg-white/80 px-5 pb-3 pt-6 text-sm text-foreground outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10';
const floatingLabel =
  'pointer-events-none absolute left-5 top-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/45 peer-focus:text-primary';

export default function ContactPage() {
  const [pageImages, setPageImages] = useState<Record<string, string>>({});
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [cards, setCards] = useState<ContentItem[]>(() => seedsToItems(CONTENT_COLLECTIONS.contactCards, CONTACT_CARD_SEEDS));
  const [offices, setOffices] = useState<ContentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  useEffect(() => {
    const imageKeys = ['contact-header-bg', 'contact-locate-image', 'contact-send-message-image'];
    void Promise.all(
      imageKeys.map(async (key) => {
        try {
          const response = await apiFetch(`/api/site-content/${key}`);
          if (!response.ok) return [key, ''] as const;
          const data = await response.json();
          const imageUrl = data.imageUrl ? (data.imageUrl.startsWith('http') ? data.imageUrl : apiUrl(data.imageUrl)) : '';
          return [key, imageUrl] as const;
        } catch {
          return [key, ''] as const;
        }
      }),
    ).then((entries) => setPageImages(Object.fromEntries(entries)));

    void fetchContentCollections([CONTENT_COLLECTIONS.contactCards, CONTENT_COLLECTIONS.contactOffices]).then((lists) => {
      if (lists[CONTENT_COLLECTIONS.contactCards]) setCards(lists[CONTENT_COLLECTIONS.contactCards]!);
      if (lists[CONTENT_COLLECTIONS.contactOffices]) setOffices(lists[CONTENT_COLLECTIONS.contactOffices]!);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/services')
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        setServices(
          (data || []).map((service: ServiceRecord) => ({
            ...service,
            time: service.startTime ? (service.endTime ? `${service.startTime} - ${service.endTime}` : service.startTime) : service.time || '',
          })),
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setServicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveImage = (key: string, fallback: string) => pageImages[key] || fallback;

  const serviceLines = useMemo(() => {
    const loaded = services
      .map((service) => {
        const title = String(service.title || '').trim();
        const day = String(service.dayOfWeek || '').trim();
        const time = String(service.time || '').trim();
        const lineTitle = day ? `${day} - ${title || 'Service'}` : title || 'Service';
        return time ? `${lineTitle} - ${time}` : lineTitle;
      })
      .filter(Boolean);
    const normalize = (line: string) => line.toLowerCase().replace(/\s+/g, ' ').trim();
    return [...loaded, ...DEFAULT_SERVICE_LINES].filter(
      (line, index, lines) => lines.findIndex((item) => normalize(item) === normalize(line)) === index,
    );
  }, [services]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(typeof data?.error === 'string' && data.error.trim() ? data.error : 'There was an error sending your message. Please try again.');
        return;
      }
      toast.success('Thank you for reaching out! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setSent(true);
    } catch {
      toast.error('There was an error sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#f8f6f1]">
        {/* Hero */}
        <section className="relative overflow-hidden pb-40 pt-32 text-white md:pb-52 md:pt-44">
          <div className="absolute inset-0">
            <div
              className="animate-ken-burns absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${resolveImage('contact-header-bg', '/images/our-church.JPG')})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b2e]/85 via-[#0d1b2e]/70 to-[#0d1b2e]/90" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.35em] text-white/60">
              <Link href="/" className="hover:text-white">Home</Link>
              <span className="text-white/40">/</span>
              <span>Contact</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-secondary">Contact us</p>
            <h1 className="font-display mx-auto mt-5 max-w-3xl text-5xl font-semibold leading-[1.05] md:text-7xl">
              We&apos;d love to hear <span className="italic text-secondary">from you</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/75 md:text-lg">
              Questions, prayer, a visit, or a word of encouragement: our doors and our hearts are open.
            </p>
          </div>
        </section>

        {/* Contact cards overlap the hero */}
        <section className="relative z-10 -mt-28 md:-mt-36">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className={cn('grid gap-5', cards.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3')} data-reveal-stagger>
              {cards.map((card) => {
                const Icon = CARD_ICONS[String(card.data.icon || '')] || ArrowUpRight;
                const content = (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </span>
                    <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/45">{card.title}</p>
                    <p className="mt-2 break-words text-lg font-semibold text-foreground">{card.subtitle}</p>
                    {card.body ? <p className="mt-2 text-sm leading-6 text-foreground/60">{card.body}</p> : null}
                    {card.linkUrl ? (
                      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Get in touch <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    ) : null}
                  </>
                );
                const className = 'group hover-lift block h-full rounded-3xl border border-white bg-white/95 p-7 shadow-xl shadow-black/5 backdrop-blur';
                return card.linkUrl ? (
                  <a
                    key={card.id}
                    href={card.linkUrl}
                    target={card.linkUrl.startsWith('http') ? '_blank' : undefined}
                    rel={card.linkUrl.startsWith('http') ? 'noreferrer' : undefined}
                    className={className}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={card.id} className={className}>{content}</div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Form + details */}
        <section className="py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div className="rounded-[2rem] border border-border/60 bg-white p-6 shadow-2xl shadow-primary/5 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Write to us</p>
              <h2 className="font-display mt-3 text-4xl font-semibold text-foreground">Send a message</h2>
              <p className="mt-3 text-sm leading-6 text-foreground/60">Fill in the form and someone from the church office will get back to you.</p>

              {sent ? (
                <div className="mt-10 flex flex-col items-center rounded-3xl bg-primary/5 px-6 py-14 text-center">
                  <CheckCircle2 className="h-14 w-14 text-primary" />
                  <p className="font-display mt-5 text-2xl font-semibold">Message received</p>
                  <p className="mt-2 max-w-sm text-sm text-foreground/65">Thank you for reaching out. We will reply to you soon. God bless you.</p>
                  <button type="button" onClick={() => setSent(false)} className="mt-6 text-sm font-semibold text-primary underline underline-offset-4">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="relative block">
                      <input name="name" value={formData.name} onChange={handleChange} required placeholder=" " className={fieldClass} />
                      <span className={floatingLabel}>Your name</span>
                    </label>
                    <label className="relative block">
                      <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder=" " className={fieldClass} />
                      <span className={floatingLabel}>Email address</span>
                    </label>
                  </div>
                  <label className="relative block">
                    <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder=" " className={fieldClass} />
                    <span className={floatingLabel}>Phone (optional)</span>
                  </label>
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/45">What is it about?</p>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((subject) => (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, subject }))}
                          className={cn(
                            'rounded-full border px-4 py-1.5 text-xs font-semibold transition-all',
                            formData.subject === subject ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border text-foreground/65 hover:border-primary/40',
                          )}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                    <label className="relative mt-3 block">
                      <input name="subject" value={formData.subject} onChange={handleChange} required placeholder=" " className={fieldClass} />
                      <span className={floatingLabel}>Subject</span>
                    </label>
                  </div>
                  <label className="relative block">
                    <textarea name="message" value={formData.message} onChange={handleChange} required rows={6} placeholder=" " className={cn(fieldClass, 'resize-none')} />
                    <span className={floatingLabel}>Your message</span>
                  </label>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              )}
            </div>

            <aside className="space-y-6">
              <div className="relative overflow-hidden rounded-[2rem]">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={resolveImage('contact-send-message-image', '/images/send-message-2.JPG')}
                    alt="PICC church family"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2e]/90 via-transparent to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">Headquarters</p>
                  <p className="font-display mt-2 text-2xl font-semibold leading-snug">Pentecost International Christian Centre</p>
                  <p className="mt-2 text-sm text-white/75">P.O. Box 31841, Lilongwe 3, Malawi</p>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[#0d1b2e] p-7 text-white">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-secondary" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">Service times</p>
                </div>
                {servicesLoading ? (
                  <p className="mt-5 text-sm text-white/60">Loading service times...</p>
                ) : (
                  <ul className="mt-5 divide-y divide-white/10">
                    {serviceLines.map((line) => {
                      const { name, time } = splitServiceLine(line);
                      return (
                        <li key={line} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                          <span className="text-white/85">{name}</span>
                          {time ? <span className="shrink-0 text-xs font-semibold text-secondary">{time}</span> : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Link href="/locations" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline">
                  Find a branch near you <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </section>

        {offices.length ? (
          <section className="pb-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Directory</p>
              <h2 className="font-display mt-3 text-4xl font-semibold text-foreground">Offices &amp; departments</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
                {offices.map((office) => (
                  <div key={office.id} className="hover-lift rounded-3xl border border-border/60 bg-white p-6">
                    <p className="font-semibold text-foreground">{office.title}</p>
                    {office.subtitle ? <p className="mt-1 text-sm text-foreground/60">{office.subtitle}</p> : null}
                    <div className="mt-4 space-y-2 text-sm">
                      {office.data.phone ? (
                        <a href={`tel:${String(office.data.phone).replace(/\s+/g, '')}`} className="flex items-center gap-2 text-primary hover:underline">
                          <Phone className="h-4 w-4" /> {String(office.data.phone)}
                        </a>
                      ) : null}
                      {office.data.email ? (
                        <a href={`mailto:${String(office.data.email)}`} className="flex items-center gap-2 break-all text-primary hover:underline">
                          <Mail className="h-4 w-4" /> {String(office.data.email)}
                        </a>
                      ) : null}
                    </div>
                    {office.body ? <p className="mt-3 text-xs leading-5 text-foreground/55">{office.body}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        

        {/* Map + location phouuuuuuto */}
        <section className="pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid overflow-hidden rounded-[2rem] border border-border/60 bg-white shadow-xl lg:grid-cols-[1.4fr_1fr]">
              <div className="relative min-h-[320px] lg:min-h-[460px]">
                <iframe
                  src={MAP_EMBED}
                  title="Map to PICC Headquarters"
                  className="absolute inset-0 h-full w-full border-0 grayscale-[30%]"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={resolveImage('contact-locate-image', '/images/our-church.JPG')}
                    alt="PICC Headquarters"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center p-7">
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary/70">Find us</p>
                  <p className="font-display mt-2 text-2xl font-semibold">The Camp of God Cathedral</p>
                  <p className="mt-3 text-sm leading-6 text-foreground/65">
                    Along Kaunda Road, near Best Oil Filling Station, Area 49, Lilongwe, Malawi.
                  </p>
                  <a
                    href="https://maps.google.com/?q=PICC+Headquarters+Lilongwe"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    Get directions <ArrowUpRight className="h-4 w-4" />
                  </a>
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
