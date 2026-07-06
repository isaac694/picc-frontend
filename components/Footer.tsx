'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Music2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FaTiktok } from "react-icons/fa";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const prayerlineNumbers = ['+265 996 80 08 00', '+265 886 80 08 00'];
  const piccEmail = 'info@piccworldwide.org';
  const piccPhone = '+265 992 433 333';
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(piccEmail)}`;
  const [showFaqs, setShowFaqs] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const fallbackFaqs = [
    {
      question: 'What time are church services?',
      answer: 'Service times are listed on the Service Times page and updated weekly.',
    },
    {
      question: 'How can I join a ministry?',
      answer: 'Contact us or visit any of our church locations to connect with a ministry leader.',
    },
    {
      question: 'Where can I watch online?',
      answer: 'Use the Livestream page for live services and recent broadcasts.',
    },
  ];

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await apiFetch('/api/faqs');
        if (!response.ok) {
          setFaqs(fallbackFaqs);
          return;
        }

        const data = await response.json();
        const activeFaqs = (data || []).filter((f: any) => f.isActive);
        setFaqs(activeFaqs.length > 0 ? activeFaqs : fallbackFaqs);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setFaqs(fallbackFaqs);
      }
    };
    fetchFaqs();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setSubscriptionStatus({
        type: 'error',
        message: 'Please enter your email address.'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubscriptionStatus({
        type: 'error',
        message: 'Please enter a valid email address.'
      });
      return;
    }

    setIsSubscribing(true);
    setSubscriptionStatus({ type: null, message: '' });

    try {
      const response = await apiFetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const emailSent = typeof data?.emailSent === 'boolean' ? data.emailSent : null;

        setSubscriptionStatus({
          type: 'success',
          message:
            emailSent === false
              ? 'Thank you for subscribing! Your subscription was saved, but we could not send a confirmation email right now.'
              : 'Thank you for subscribing! You\'ll receive updates when new sermons are available.',
        });
        setEmail('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSubscriptionStatus({
          type: 'error',
          message: errorData.error || errorData.message || 'Failed to subscribe. Please try again.',
        });
      }
    } catch (error) {
      setSubscriptionStatus({
        type: 'error',
        message: 'Unable to connect. Please check your internet connection and try again.'
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-[#0b0b0b] text-white rounded-t-[36px] overflow-hidden">
      <div className="w-full px-0 pt-20 pb-0">
        <div className="w-full rounded-t-[36px] rounded-b-none bg-[#0b0b0b] px-8 pt-16 pb-6 md:px-12 md:pt-20 md:pb-8 shadow-2xl min-h-[520px]">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.8fr_1fr] gap-10 md:gap-12">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-16 h-16">
                  <Image src="/logo.png" alt="PICC logo" fill sizes="64px" className="object-contain" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Pentecost International</p>
                  <p className="text-lg font-semibold">Christian Center</p>
                </div>
              </div>
              <p className="text-sm text-white/75 leading-relaxed max-w-sm">
                Welcome to the home of success. Feel free to connect to our live service
                or stream in your favorite language.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm text-white/80">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/livestream" className="hover:text-white">Livestream</Link></li>
                <li><Link href="/events" className="hover:text-white">Events</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Address</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Pentecost International Christian Centre (PICC)
Along Kaunda Road, Near Best Oil Filling Station, Area 49
Post Office Box 31841
Lilongwe 3
Malawi

              </p>
              <div className="mt-5 space-y-4 text-sm text-white/80">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white">Prayerline:</span>
                  {prayerlineNumbers.map((number) => (
                    <a
                      key={number}
                      href={`https://wa.me/${number.replace(/[^0-9]/g, '')}`}
                      className="hover:text-white underline underline-offset-4"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {number}
                    </a>
                  ))}
                </div>
                <p>
                  <span className="font-semibold text-white">Email:</span>{' '}
                  <a
                    href={gmailHref}
                    className="hover:text-white underline underline-offset-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {piccEmail}
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-white">Phone:</span>{' '}
                  <a
                    href={`tel:${piccPhone.replace(/\s/g, '')}`}
                    className="hover:text-white underline underline-offset-4"
                  >
                    {piccPhone}
                  </a>
                </p>
              </div>
              <div className="mt-6 flex items-center gap-4 text-white/80">
                <Link href="https://www.facebook.com/PICCWorldwide/" aria-label="Facebook" className="hover:text-white" target="_blank" rel="noreferrer">
                  <Facebook size={20} />
                </Link>
                <Link href="https://www.instagram.com/piccworldwide/" aria-label="Instagram" className="hover:text-white" target="_blank" rel="noreferrer">
                  <Instagram size={20} />
                </Link>
                <Link href="#" aria-label="Twitter" className="hover:text-white">
                  <Twitter size={20} />
                </Link>
                <Link href="http://youtube.com/@piccworldwide" aria-label="YouTube" className="hover:text-white" target="_blank" rel="noreferrer">
                  <Youtube size={20} />
                </Link>
                <Link
                  href="https://www.tiktok.com/@campofgodcathedral?_r=1&_t=ZS-95CREQwHO3Y"
                  aria-label="TikTok"
                  className="hover:text-white"
                >
                  <FaTiktok size={20} />
                </Link>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-8">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2">Stay Connected</p>
              <h3 className="text-2xl font-semibold">Subscribe to Sermon Updates</h3>
              <p className="text-sm text-white/70 mt-3">
                Get notified whenever we upload new sermons and teachings to our website.
              </p>
            </div>
            <div className="flex flex-col justify-center">
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                      disabled={isSubscribing}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubscribing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                  >
                    {isSubscribing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Subscribing...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Subscribe
                      </>
                    )}
                  </Button>
                </div>
                {subscriptionStatus.type && (
                  <div className={`flex items-center gap-2 text-sm ${
                    subscriptionStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {subscriptionStatus.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {subscriptionStatus.message}
                  </div>
                )}
              </form>
            </div>
          </div>

          <div id="faq" className="mt-16 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-8">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2">FAQ</p>
              <h3 className="text-2xl font-semibold">Frequently Asked Questions</h3>
              <p className="text-sm text-white/70 mt-3">
                Quick answers to common questions. We can update these anytime.
              </p>
            </div>
            {!showFaqs ? (
              <button
                type="button"
                onClick={() => setShowFaqs(true)}
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80 hover:border-white/40 hover:text-white"
              >
                Show Questions
              </button>
            ) : (
              <Accordion type="single" collapsible className="w-full text-white/80">
                {faqs.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`} className="border-white/15">
                    <AccordionTrigger className="text-white hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <div className="mt-16 pt-10 border-t border-white/15 text-center text-sm text-white/60">
            &copy; {currentYear} Pentecost International Christian Centre. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
