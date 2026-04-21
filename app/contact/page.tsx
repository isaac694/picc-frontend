'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, apiUrl } from '@/lib/api';
import Link from 'next/link';

type ServiceRecord = {
  id?: string | null;
  title?: string | null;
  dayOfWeek?: string | null;
  time?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
};

export default function ContactPage() {
  const [pageImages, setPageImages] = useState<Record<string, string>>({});
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const familySlides = [
    ['/moments/1.jpg', '/moments/2.jpg', '/moments/3.jpg'],
    ['/moments/4.jpg', '/moments/5.jpg', '/moments/6.jpg'],
    ['/moments/7.jpg', '/moments/8.jpg', '/moments/9.jpg'],
  ];
  const extendedSlides = [
    familySlides[familySlides.length - 1],
    ...familySlides,
    familySlides[0],
  ];

  const [currentSlide, setCurrentSlide] = useState(1);
  const [slideTransition, setSlideTransition] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    const imageKeys = [
      'contact-header-bg',
      'contact-locate-image',
      'contact-send-message-image',
    ];

    const fetchImages = async () => {
      const entries = await Promise.all(
        imageKeys.map(async (key) => {
          try {
            const response = await apiFetch(`/api/site-content/${key}`);
            if (!response.ok) return [key, ''] as const;
            const data = await response.json();
            const imageUrl = data.imageUrl
              ? data.imageUrl.startsWith('http')
                ? data.imageUrl
                : apiUrl(data.imageUrl)
              : '';
            return [key, imageUrl] as const;
          } catch {
            return [key, ''] as const;
          }
        })
      );

      setPageImages(Object.fromEntries(entries));
    };

    fetchImages();
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await apiFetch('/api/services');
        if (!response.ok) return;
        const data = await response.json();
        const normalized = (data || []).map((service: ServiceRecord) => ({
          ...service,
          time: service.startTime
            ? service.endTime
              ? `${service.startTime} - ${service.endTime}`
              : service.startTime
            : service.time || '',
        }));
        setServices(normalized);
      } catch {
        setServices([]);
      }
    };

    loadServices();
  }, []);

  const resolveImage = (key: string, fallback: string) => pageImages[key] || fallback;

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

  const serviceLines = services.length
    ? services
      .map((service) => {
        const title = String(service.title || '').trim();
        const day = String(service.dayOfWeek || '').trim();
        const time = String(service.time || '').trim();
        const lineTitle = day ? `${day} - ${title || 'Service'}` : title || 'Service';
        return time ? `${lineTitle} - ${time}` : lineTitle;
      })
      .filter(Boolean)
    : DEFAULT_SERVICE_LINES;

  const splitIndex = Math.ceil(serviceLines.length / 2);
  const leftServiceLines = serviceLines.slice(0, splitIndex);
  const rightServiceLines = serviceLines.slice(splitIndex);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Thank you for reaching out! We will get back to you soon.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error sending your message. Please try again.');
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-28 md:py-40 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${resolveImage('contact-header-bg', '/images/our-church.JPG')})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/35" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4 flex items-center gap-3">
                <Link href="/" className="hover:text-white">Home</Link>
                <span className="text-white/50">/</span>
                <Link href="/contact" className="hover:text-white">Contact</Link>
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold mb-4">Get in Touch</h1>
              <p className="text-lg text-white/80">
                We&apos;d love to hear from you. Reach out with any questions or concerns.
              </p>
            </div>
          </div>
        </section>

        {/* Let's Talk + Map Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-stretch">
              <div className="rounded-2xl p-6 md:p-8">
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Let&apos;s Talk</h2>
                <p className="text-foreground/70 mb-6">
                  We&apos;re here to help. Reach out anytime and we&apos;ll respond as soon as we can.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">ADDRESS:</p>
                    <p className="text-foreground/80 leading-relaxed">
                      Malawi, Lilongwe, Area 49, Baghdad
                    </p>
                    <p className="text-foreground/80 leading-relaxed">
                      PICC Headquarters
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">SERVICE TIMES:</p>
                    <ul className="space-y-2 text-foreground/80">
                      <li>Sunday - 7:00 AM - 12:00 PM</li>
                      <li>Tuesday - 5:30 AM - 7:30 PM</li>
                      <li>Wednesday - 9:00 AM - 12:00 PM</li>
                      <li>Thursday - 6:00 PM - 8:00 PM</li>
                      <li>Saturday - 8:30 AM - 11:00 AM</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 text-sm text-foreground/80">
                  <p>
                    <span className="font-semibold text-foreground">PHONE:</span>{' '}
                    <a href="tel:+265992433333" className="underline underline-offset-4">
                      +265 992 433 333
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">EMAIL:</span>{' '}
                    <a href="mailto:info@piccworldwide.org" className="underline underline-offset-4">
                      info@piccworldwide.org
                    </a>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-border min-h-[360px] bg-muted">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3086.6576842444136!2d33.7453956!3d-13.9240918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1921d5bac6745c93%3A0x8c408a3504600518!2sPICC%20Headquarters!5e0!3m2!1sen!2sus!4v1730985600000!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* Locate Us Section */}
        <section className="py-16 sm:py-20 md:py-24 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-center text-foreground mb-10">
              Locate Us
            </h2>

            <div className="relative w-full max-w-4xl mx-auto aspect-[16/9] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src={resolveImage('contact-locate-image', '/images/our-church.JPG')}
                alt="PICC Headquarters"
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>

            <div className="max-w-4xl mx-auto mt-10">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
                Pentecost International Christian Center Headquarters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="text-[11px] tracking-[0.24em] uppercase text-foreground/60 font-bold mb-3">
                    Address:
                  </p>
                  <p className="text-foreground/80 leading-relaxed">
                    Malawi, Lilongwe, Area 49, Baghdad
                  </p>
                  <p className="text-foreground/80 leading-relaxed">
                    The Camp of God Cathedral 
                  </p>
                  <div className="mt-4 text-sm text-foreground">
                    <a
                      href="https://www.google.com/maps/place/PICC+Headquarters/@-13.9240918,33.745401,17z/data=!3m1!4b1!4m6!3m5!1s0x1921d5bac6745c93:0x8c408a3504600518!8m2!3d-13.9240918!4d33.7479759!16s%2Fg%2F11ghzntzhp?entry=ttu&g_ep=EgoyMDI2MDMxNS4wIKXMDSoASAFQAw%3D%3D"
                      className="underline underline-offset-4"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] tracking-[0.24em] uppercase text-foreground/60 font-bold mb-3">
                    Service Times:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-foreground/80">
                    <div className="space-y-2">
                      {leftServiceLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {rightServiceLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href="/locations" className="underline underline-offset-4 text-foreground">
                      Locate A Branch Near You
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info & Form Section */}
        <section className="py-16 sm:py-20 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              {/* Image */}
              <div className="relative min-h-[360px] sm:min-h-[440px] md:min-h-[520px] rounded-2xl overflow-hidden">
                <Image
                  src={resolveImage('contact-send-message-image', '/images/send-message-2.JPG')}
                  alt="Send us a message"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Send us a Message</h2>
                <Card className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Name</label>
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
                        placeholder="+265 123 456 799"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                      <Input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What is this about?"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Your message here..."
                        rows={5}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      ></textarea>
                    </div>

                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Send Message
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          </div>
        </section>


        {/* We Are Family Section */}
        <section className="py-16 sm:py-20 md:py-24 bg-background">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">We Are Family</h2>
              <p className="text-foreground/70 mt-2">Snapshots of life together.</p>
            </div>

            <div className="relative overflow-hidden w-full">
              <div
                className={slideTransition ? 'flex transition-transform duration-600' : 'flex'}
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                onTransitionEnd={() => {
                  if (currentSlide === 0) {
                    setSlideTransition(false);
                    setCurrentSlide(familySlides.length);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setSlideTransition(true));
                    });
                  } else if (currentSlide === extendedSlides.length - 1) {
                    setSlideTransition(false);
                    setCurrentSlide(1);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setSlideTransition(true));
                    });
                  }
                }}
              >
                {extendedSlides.map((slide, slideIndex) => (
                  <div key={slideIndex} className="min-w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {slide.map((src, idx) => (
                        <div key={`${src}-${idx}`} className="relative h-[16rem] sm:h-[20rem] md:h-[28rem]">
                          <Image
                            src={src}
                            alt="We are family moment"
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => setCurrentSlide((s) => s - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => setCurrentSlide((s) => s + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary"
              >
                ›
              </button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}


