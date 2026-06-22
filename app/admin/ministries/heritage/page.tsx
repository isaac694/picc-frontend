'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import {
  MinistryInfoManager,
  MinistryItemsManager,
  type MinistryInfo,
  type MinistryItem,
} from '@/components/admin/MinistryContentManagers';

type Tab = 'info' | 'focus' | 'highlights' | 'events';

const heritageFallbackInfo: Omit<MinistryInfo, 'id' | 'ministryKey'> = {
  name: 'Heritage Ministry',
  motto: 'Children are a heritage from the Lord...',
  about:
    'Welcome to the Heritage Ministry, the vibrant and energetic children\'s church of Pentecost International Christian Centre! We believe that no child is too young to experience the unconditional love and incredible power of God.\n\nOur mission is to partner with parents in raising a Godly seed for the next generation. We provide a safe, loving, and highly interactive environment where children learn biblical truths through creative storytelling, lively music, arts and crafts, and engaging games.',
  heroImageUrl: '/hero/hero-store.jpg',
  logoImageUrl: '/logo.png',
  liveSessionYoutubeUrl: '',
  partnershipTitle: 'Support Our Children',
  partnershipBody:
    'Our Heritage Ministry continues to grow, and we are always looking for ways to improve our learning environments and resources for our kids. Your support helps us provide better materials, safer facilities, and more engaging activities.',
  partnershipDetails: [],
  partnershipImageUrl: '/images/youth-church/img-6.jpg',
  phone: 'Contact the PICC Main Office',
  email: 'info@picc.org',
  location: 'Children\'s Hall\nCamp of God Cathedral',
  contactIntro:
    'Have questions about our child security check-in policies, weekly curriculum, or how to register your children? We\'re here to help!',
};

const focusAreas: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Safe & Loving Environment',
    description:
      'A nurturing, fully secure setup where our youngest children encounter God’s love through interactive care, attention, and playful songs of worship.',
  },
  {
    title: 'Creative Scripture Discovery',
    description:
      'Bringing the scriptures to life! Our kids explore core Bible lessons using colorful crafts, vibrant visual illustrations, activities, and drama.',
  },
  {
    title: 'Spiritual Foundation',
    description:
      'Equipping pre-teens to drop anchor into God\'s Word, understand practical prayer, and develop structural character as they prepare for the Youth & Teens Ministry.',
  },
];

const highlights: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Learning', description: 'Interactive and fun Bible lessons.', imageUrl: '/images/youth-church/img-6.jpg' },
  { title: 'Creativity', description: 'Creative crafts and colorful art projects.', imageUrl: '/hero/hero-store.jpg' },
  { title: 'Worship', description: 'Joyful worship with the Heritage Kids Choir.', imageUrl: '/hero/hero-3.jpg' },
  { title: 'Friendship', description: 'Building friendships that last a lifetime.', imageUrl: '/images/youth-church/img-5.jpg' },
  { title: 'Fun', description: 'Outdoor games and seasonal adventures.', imageUrl: '/hero/hero-1.jpg' },
  { title: 'Environment', description: 'Safe, loving, and nurturing environments.', imageUrl: '/hero/hero-2.jpg' },
];

const events: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Heritage Kids Sunday Service',
    label: 'Every Sunday | 8:30 AM & 10:30 AM',
    description:
      'Join us every Sunday for a fun-filled time of worship, interactive Bible lessons, crafts, and games! We have dedicated activities tailored for all our Heritage Kids from ages 0 to 12.',
    imageUrl: '/hero/hero-store.jpg',
  },
  {
    title: 'Vacation Bible School (VBS) 2026',
    label: 'August 10 - 14, 2026',
    description:
      'Our biggest event of the year! A five-day adventure where Heritage Kids explore the Bible through epic storytelling, team games, upbeat music, and creative arts. Open to ages 0-12.',
    imageUrl: '/images/youth-church/img-6.jpg',
  },
  {
    title: 'Children\'s Sunday Takeover',
    label: 'October 11, 2026',
    description:
      'A special Sunday where the Heritage Kids lead the main church service! Prepare to be blessed by our Kids Choir, junior ushers, and young Bible readers.',
    imageUrl: '/hero/hero-3.jpg',
  },
];

export default function HeritageAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,
  } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<Tab>('info');

  if (!token) {
    return (
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'info', label: 'Page Info' },
    { id: 'focus', label: 'Focus Areas' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'events', label: 'Events' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Heritage Admin</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage children&apos;s ministry content, focus areas, highlights, and upcoming events.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      <div className="border-b border-border/60">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/70 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'info' && (
        <MinistryInfoManager 
          token={token} 
          ministryKey="heritage" 
          ministryName="Heritage Ministry" 
          fallbackInfo={heritageFallbackInfo} 
        />
      )}
      {activeTab === 'focus' && (
        <MinistryItemsManager
          token={token}
          ministryKey="heritage"
          category="focus"
          title="Ministry Focus Areas"
          description="Manage the core pillars of the Heritage Ministry."
          fallbackItems={focusAreas}
          labels={{ title: 'Focus Title', description: 'Description', save: 'Save Area' }}
          showLabel={false}
          showSortOrder={false}
          showImage={false}
        />
      )}
      {activeTab === 'highlights' && (
        <MinistryItemsManager
          token={token}
          ministryKey="heritage"
          category="highlight"
          title="Ministry Highlights"
          description="Manage the image gallery showcasing children's church activities."
          fallbackItems={highlights}
          labels={{ title: 'Image Title', description: 'Caption', image: 'Highlight Image', save: 'Save' }}
          showLabel={false}
          showSortOrder={false}
          maxItems={6}
        />
      )}
      {activeTab === 'events' && (
        <MinistryItemsManager
          token={token}
          ministryKey="heritage"
          category="event"
          title="Kids Events"
          description="Manage upcoming and past activities for kids."
          fallbackItems={events}
          labels={{ title: 'Event Title', description: 'Event Description', label: 'Date/Type', image: 'Event Image' }}
        />
      )}
    </div>
  );
}
