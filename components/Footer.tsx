'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Music2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FaTiktok } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showFaqs, setShowFaqs] = useState(false);
  const faqs = [
    {
      question: 'What time are services?',
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
                Malawi, Lilongwe, Area 49 Bahghdad
              </p>
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
            &copy; {currentYear} Pentecost International Christian Center. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
