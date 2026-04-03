'use client';

import { useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';

const ministries = [
  {
    id: 'men-of-valour',
    name: 'Men of Valour',
    logo: '/logos/men-of-valour-logo.png', 
    image: '/hero/hero-7-mov.jpg',          
    shortDescription: 'Equipping men to lead with integrity and faith.',
    fullDescription: 'The Men of Valour ministry is dedicated to building strong, faith-filled men who serve as pillars in their homes, church, and community. We focus on mentorship, biblical teaching, and fellowship to help men navigate modern challenges through Christ.',
    subMinistries: [],
  },
  {
    id: 'women-of-hope',
    name: 'Women of Hope',
    logo: '/logos/women-hope-logo.png',
    image: '/hero/hero-8-woh.jpg',
    shortDescription: 'Empowering women to walk in their God-given purpose.',
    fullDescription: 'Women of Hope provides a nurturing environment for women of all ages to grow spiritually and support one another. Through prayer meetings, retreats, and community service, we strive to reflect the love and hope of Jesus in everything we do.',
    subMinistries: [],
  },
  {
    id: 'youth-church',
    name: 'Youth Church Ministry',
    logo: '/logos/youth-church-logo.png',
    image: '/hero/hero-10-yc.jpg',
    shortDescription: 'Raising a generation on fire for God.',
    fullDescription: 'Our Youth Church Ministry is a vibrant and dynamic space tailored for the next generation. We aim to foster deep spiritual roots, authentic relationships, and a passion for worship. The ministry is structured into specific groups to address the unique needs of every age group.',
    subMinistries: [
      'Young Adults',
      'Teens'
    ],
  },
  {
    id: 'called-to-greatness',
    name: 'Called to Greatness',
    logo: '/logos/called-to-greatness-logo.png',
    image: '/hero/hero-ctg.jpg',
    shortDescription: 'Empowering young professionals to excel and lead.',
    fullDescription: 'Called to Greatness focuses on equipping young men with practical tools needed to thrive in their life and callings. We believe in elevating young men to grow strong in the faith and to go on to be mighty men.',
    subMinistries: [],
  },
  {
    id: 'hope-and-beauty',
    name: 'Hope and Beauty Ministry',
    logo: '/logos/hope-and-beauty-logo.png',
    image: '/hero/hero-13-hb.jpg',
    shortDescription: 'Cultivating inner beauty, purity, and purpose in young women.',
    fullDescription: 'This ministry is dedicated to young women, helping them discover their true identity in Christ. Through mentorship, candid discussions, and fellowship, we nurture purity, confidence, and a deep understanding of Godly beauty.',
    subMinistries: [],
  },
  {
    id: 'heritage-ministry',
    name: 'Heritage Ministry',
    logo: '/logos/heritage-logo.png',
    image: '/hero/hero-12-heritage.jpg',
    shortDescription: 'Preserving our foundational values and honoring our elders.',
    fullDescription: 'The Heritage Ministry place for the kids in the church to grow together in the ministry and to be built up in christ. ',
    subMinistries: [],
  },
  {
    id: 'wailing-woman',
    name: 'Wailing Woman',
    logo: '/logos/wailing-woman-logo.png',
    image: '/hero/hero-9-ww.jpg',
    shortDescription: 'A global call to deep, transformative intercessory prayer.',
    fullDescription: 'Inspired by the biblical call for wailing women, this ministry is a dedicated force of prayer warriors. We stand in the gap for our families, our church, and our nation, believing in the power of persistent, fervent prayer to bring about breakthrough and healing.',
    subMinistries: [],
  },
  {
    id: 'icd',
    name: 'Intercession, Counselling & Deliverance (ICD)',
    logo: '/logos/icd-logo.png',
    image: '/hero/hero-11-icd.jpg',
    shortDescription: 'Providing spiritual and emotional support for women.',
    fullDescription: "The ICD ministry offers a safe, confidential space for women seeking spiritual liberation, emotional healing, and biblical counsel. Our trained ministers provide dedicated intercession and one-on-one guidance to help women overcome life's deepest hurdles.",
    subMinistries: [],
  },
  {
    id: 'prison-ministry',
    name: 'Prison Ministry',
    logo: '/logos/prison-ministry-logo.png',
    image: '/hero/hero-14.jpg',
    shortDescription: 'Bringing the light of the Gospel to those incarcerated.',
    fullDescription: "Our Prison Ministry is committed to sharing the love, hope, and redemption of Jesus Christ with inmates. Through regular visits, Bible studies, and rehabilitative support, we believe that no one is beyond the transforming power of God's grace.",
    subMinistries: [],
  }
];

export default function MinistriesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white text-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-36 md:py-48 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/hero/hero-2.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/35" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mt-32 md:mt-40">
              <div className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4 flex items-center gap-3">
                <a href="/" className="hover:text-white transition-colors">Home</a>
                <span className="text-white/50">/</span>
                <span className="text-white">Ministries</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold mb-4">Our Ministries</h1>
            </div>
          </div>
        </section>

        {/* Ministries Grid Section */}
        <section className="pt-16 md:pt-24 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold">Get Involved</h2>
              <p className="mt-4 text-black/60 max-w-2xl mx-auto">
                Discover the different groups within PICC where you can grow, serve, and connect with others.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              {ministries.map((ministry) => {
                const isExpanded = expandedId === ministry.id;

                return (
                  <Card key={ministry.id} className="bg-white text-black border-black/10 overflow-hidden transition-all duration-300">
                    {/* Top Image */}
                    <div className="relative h-48 w-full bg-gray-100">
                      <Image 
                        src={ministry.image} 
                        alt={`${ministry.name} cover`} 
                        fill 
                        className="object-cover" 
                      />
                    </div>

                    <div className="p-6">
                      {/* Logo and Title Layout */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full overflow-hidden border border-black/5">
                          <Image 
                            src={ministry.logo} 
                            alt={`${ministry.name} logo`} 
                            fill 
                            className="object-contain p-1" 
                          />
                        </div>
                        <h3 className="text-xl font-semibold">{ministry.name}</h3>
                      </div>

                      {/* Always visible short description */}
                      <p className="text-sm text-black/70">
                        {ministry.shortDescription}
                      </p>

                      {/* Expanded Content Section with Framer Motion */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-black/10">
                              <p className="text-sm text-black/80 leading-relaxed mb-4">
                                {ministry.fullDescription}
                              </p>
                              
                              {/* Render Sub-ministries if they exist */}
                              {ministry.subMinistries.length > 0 && (
                                <div className="mb-2">
                                  <h4 className="text-sm font-semibold mb-2">Sub-Ministries:</h4>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {ministry.subMinistries.map((sub, index) => (
                                      <li key={index} className="text-sm text-black/70">
                                        {sub}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Expand/Collapse Button */}
                      <Button 
                        variant="ghost" 
                        className="w-full mt-6 flex items-center justify-center gap-2 hover:bg-black/5"
                        onClick={() => toggleExpand(ministry.id)}
                      >
                        {isExpanded ? (
                          <>Read Less <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>Read More <ChevronDown className="w-4 h-4" /></>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}