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

type Tab = 'info' | 'pillars' | 'highlights' | 'materials' | 'events';

const wailingWomanFallbackInfo: Omit<MinistryInfo, 'id' | 'ministryKey'> = {
  name: 'Wailing Woman',
  motto: 'Contending for the lives and destinies of our children through intensive warfare midnight prayers.',
  about:
    'The "Wailing Woman - My Seed Must Prosper!" is an interdenominational online warfare prayer ministry. It was founded by Pastor (Mrs.) Loyce Banda, the wife of Pastor Esau Banda, Senior Pastor of the Pentecost International Christian Centre (PICC).\n\nInspired by God, the ministry awakens mothers globally to take up the responsibility of shaping and securing the glorious destinies of their children through corporate intensive midnight prayers. We seek to resist Satan\'s schemes against children and enforce victories over them through word-based warfare prayers and prophetic declarations.',
  heroImageUrl: '/hero/hero-1.jpg',
  logoImageUrl: '/logos/wailing-woman-logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Support the Vision',
  partnershipBody:
    'Launched on the 17th of January, 2025, our outreach has expanded rapidly. We now have over 2,500 members spanning across different countries.\n\nOur goal is to ensure that through this ministry, children accept Jesus Christ, walk in the fear of God, and enjoy success in their education, careers, and marriages.',
  partnershipDetails: [
    { label: 'Bank', value: 'National Bank (Gateway Mall), Account: 1012674801' },
    { label: 'Airtel Money', value: '0986337644 (Catherine Kulemeka)' },
    { label: 'TNM Mpamba', value: '0882550238 (Catherine Kulemeka)' },
  ],
  partnershipImageUrl: '/hero/outreach.jpg',
  phone: '+265 995 46 55 40 / +265 999 31 77 81',
  email: 'wailingwomanprayers@gmail.com',
  location: 'P.O Box 31841, Lilongwe, Malawi',
  contactIntro:
    'If you are a mother or guardian ready to contend for your children, contact us to join our WhatsApp forum.',
};

const pillars: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Prosperity Arrows',
    description:
      'Weekly confessions for our children shared every Monday via WhatsApp, Telegram, and Facebook based on Job 22:28.',
  },
  {
    title: 'Weekly Devotional',
    description:
      '"My Seed Must Prosper" devotional is shared every second and fourth Thursday to empower mothers.',
  },
  {
    title: 'Preparatory Prayers',
    description:
      'Prayers of salvation and repentance are shared mornings before midnight prayers to ensure right standing with God.',
  },
];

const highlightGallery: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Highlight 1', description: 'Deep intercession during the midnight watch.', imageUrl: '/moments/ww-1.jpg' },
  { title: 'Highlight 2', description: 'Mothers standing in the gap for their children.', imageUrl: '/moments/ww-2.jpg' },
  { title: 'Highlight 3', description: 'The Altar of Prayer ablaze.', imageUrl: '/moments/ww-3.jpg' },
  { title: 'Highlight 4', description: 'Prophetic declarations over the next generation.', imageUrl: '/moments/ww-4.jpg' },
  { title: 'Highlight 5', description: 'Tears of travail birthing new destinies.', imageUrl: '/moments/ww-5.jpg' },
  { title: 'Highlight 6', description: 'Corporate worship and warfare.', imageUrl: '/moments/ww-6.jpg' },
];

const materials: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Week 42 Confession', label: 'April 27, 2026', description: 'Prosperity Arrow', imageUrl: '/materials/arrow-current.jpg' },
  { title: 'The Power of the Secret Place', label: 'April 23, 2026', description: 'Weekly Devotional', imageUrl: '/materials/devo-1.jpg' },
  { title: 'Week 41 Confession', label: 'April 20, 2026', description: 'Prosperity Arrow', imageUrl: '/materials/arrow-old1.jpg' },
  { title: 'Birthing Through Prayer', label: 'April 9, 2026', description: 'Weekly Devotional', imageUrl: '/materials/devo-2.jpg' },
  { title: 'Week 40 Confession', label: 'April 13, 2026', description: 'Prosperity Arrow', imageUrl: '/materials/arrow-old2.jpg' },
];

const events: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Midnight for Children Prayer Conference',
    label: 'Consecutive Days',
    description: 'Online midnight prayers running for several consecutive days, standing in the gap for the destinies of our children.',
    imageUrl: '/hero/hero-1.jpg',
  },
  {
    title: 'Ministry Launch',
    label: 'January 17, 2025',
    description: 'The official launch of our midnight prayers, which has now grown to over 2,500 members globally.',
    imageUrl: '/hero/hero-2.jpg',
  },
];

export default function WailingWomanAdminPage() {
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
    { id: 'pillars', label: 'Ministry Pillars' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'materials', label: 'Arrows & Devotionals' },
    { id: 'events', label: 'Events' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Wailing Woman Admin</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage logo, motto, hero picture, about text, prosperity arrows, weekly devotionals, highlights gallery, live YouTube link,
            events, partnership details, phone number, and email.
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
          ministryKey="wailing-woman"
          ministryName="Wailing Woman"
          fallbackInfo={wailingWomanFallbackInfo}
        />
      )}

      {activeTab === 'pillars' && (
        <MinistryItemsManager
          token={token}
          ministryKey="wailing-woman"
          category="pillar"
          title="Ministry Pillars"
          description="Manage the informational cards displayed in the about section."
          fallbackItems={pillars}
          labels={{ title: 'Pillar Title', description: 'Pillar Text', save: 'Save Pillar' }}
          showImage={false}
          showSortOrder={false}
          showLabel={false}
        />
      )}

      {activeTab === 'highlights' && (
        <MinistryItemsManager
          token={token}
          ministryKey="wailing-woman"
          category="highlight"
          title="Highlights Gallery"
          description="Manage the pictures shown in the ministry highlights gallery."
          fallbackItems={highlightGallery}
          labels={{ title: 'Picture Title', description: 'Caption', image: 'Gallery Picture', save: 'Save Picture', formTitle: 'Save Highlight' }}
          showLabel={false}
          showSortOrder={false}
        />
      )}

      {activeTab === 'materials' && (
        <MinistryItemsManager
          token={token}
          ministryKey="wailing-woman"
          category="material"
          title="Arrows & Devotionals"
          description="Manage current and previous Prosperity Arrows and Weekly Devotional pictures."
          fallbackItems={materials}
          labels={{ title: 'Material Title', description: 'Type / Category', label: 'Date', image: 'Material Image' }}
          showSortOrder={false}
        />
      )}

      {activeTab === 'events' && (
        <MinistryItemsManager
          token={token}
          ministryKey="wailing-woman"
          category="event"
          title="Upcoming & Past Events"
          description="Manage upcoming and past Wailing Woman events."
          fallbackItems={events}
          labels={{ title: 'Event Title', description: 'Event Description', label: 'Date / Status', image: 'Event Picture', save: 'Save Event' }}
        />
      )}
    </div>
  );
}
