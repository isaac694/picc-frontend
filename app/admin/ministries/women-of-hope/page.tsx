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

type Tab = 'info' | 'pillars' | 'highlights' | 'projects' | 'events';

const womenOfHopeFallbackInfo: Omit<MinistryInfo, 'id' | 'ministryKey'> = {
  name: 'Women of Hope',
  motto: 'Building Women of faith, purpose and impact.',
  about:
    'PICC respects women as those who have a special place in God’s heart and are very important in the work of God. The Garden of Eden was not complete until God created the woman.\n\nIt was a woman, Mary Magdalene, who first witnessed the risen Jesus, and women equally supported the ministry of Jesus in the early church. Building on this biblical foundation, Women of Hope was established to equip women for their divine assignments.',
  heroImageUrl: '/hero/hero-8-woh.jpg',
  logoImageUrl: '/logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Support Our Projects',
  partnershipBody:
    'You can support our ongoing "500+ mattress" procurement, skills training, or borehole planting initiatives.\n\nContact the national office for official banking and mobile money details.',
  partnershipDetails: [],
  partnershipImageUrl: '/hero/hero-store.jpg',
  phone: 'Check with your local PICC branch for contact details.',
  email: 'info@picc.org',
  location: 'PICC Women of Hope\nCamp of God Cathedral',
  contactIntro:
    'Whether you are seeking spiritual liberation, emotional healing, or simply a sisterhood to walk alongside you, you are welcome here.',
};

const pillars: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Empowerment Meetings',
    description:
      'Through conferences, summits, workshops, and panel discussions, women are built up and established both in life and in spirit to take on leadership.',
  },
  {
    title: 'Work-Life Balance',
    description:
      'Scheduled meetings and teachings ensure the observance of time, allowing women to assume other roles and responsibilities without hindrances.',
  },
  {
    title: 'Community Service',
    description:
      'We actively contribute to society through hospital visitations, the giving of alms, and the preaching of the gospel to the surrounding communities.',
  },
];

const highlightGallery: Array<Partial<MinistryItem> & { title: string }> = [
  { id: '1', title: 'Highlight 1', description: 'Empowerment meetings building women in life and spirit.', imageUrl: '/hero/hero-8-woh.jpg' },
  { id: '2', title: 'Highlight 2', description: 'Taking on family and societal leadership.', imageUrl: '/moments/6.jpg' },
  { id: '3', title: 'Highlight 3', description: 'Hospital visitations and community service.', imageUrl: '/moments/7.jpg' },
  { id: '4', title: 'Highlight 4', description: 'Preaching the gospel to communities around us.', imageUrl: '/moments/8.jpg' },
  { id: '5', title: 'Highlight 5', description: 'Summits, workshops, and panel discussions.', imageUrl: '/moments/9.jpg' },
  { id: '6', title: 'Highlight 6', description: 'Supporting the ministry of the church.', imageUrl: '/hero/hero-2.jpg' },
];

const projects: Array<Partial<MinistryItem> & { title: string }> = [
  { title: '500+ Mattress Procurement', label: 'Ongoing', description: 'Current Project', imageUrl: '/moments/6.jpg' },
  { title: 'Skills Training Initiative', label: 'Ongoing', description: 'Current Project', imageUrl: '/moments/7.jpg' },
  { title: 'Borehole Planting', label: 'Ongoing', description: 'Current Project', imageUrl: '/moments/8.jpg' },
  { title: 'Orphanage Establishment', label: 'Upcoming', description: 'Future Project', imageUrl: '/moments/9.jpg' },
  { title: 'Bus Procurement', label: 'Upcoming', description: 'Future Project', imageUrl: '/hero/hero-2.jpg' },
];

const events: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Daughters of the King Conference',
    label: 'March 10-12, 2025',
    description: 'A transformative three-day summit focused on spiritual identity, emotional healing, and empowering women for leadership.',
    imageUrl: '/hero/hero-2.jpg',
  },
  {
    title: 'Annual Mother\'s Day Luncheon',
    label: 'May 14, 2025',
    description: 'A beautiful afternoon celebrating the mothers and maternal figures in our congregation with worship, food, and fellowship.',
    imageUrl: '/moments/7.jpg',
  },
  {
    title: 'Hospital Maternity Outreach',
    label: 'September 22, 2025',
    description: 'Women of Hope visited the local maternity wards, praying for new mothers and providing care packages with essential baby supplies.',
    imageUrl: '/moments/8.jpg',
  },
];

export default function WomenOfHopeAdminPage() {
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
    { id: 'projects', label: 'Projects' },
    { id: 'events', label: 'Events' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Women of Hope Admin</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage logo, motto, hero picture, about text, ministry pillars, highlights gallery,
            projects, events, partnership details, phone number, and email.
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
          ministryKey="women-of-hope"
          ministryName="Women of Hope"
          fallbackInfo={womenOfHopeFallbackInfo}
          fieldLabels={{
            partnershipTitle: 'Global Vision Title',
            partnershipBody: 'Global Vision Text',
            partnershipDetails: 'Global Vision Details',
            partnershipImageUrl: 'Global Vision Picture',
          }}
        />
      )}

      {activeTab === 'pillars' && (
        <MinistryItemsManager
          token={token}
          ministryKey="women-of-hope"
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
          ministryKey="women-of-hope"
          category="highlight"
          title="Highlights Gallery"
          description="Manage the pictures shown in the ministry highlights gallery."
          fallbackItems={highlightGallery}
          labels={{ title: 'Picture Title', description: 'Caption', image: 'Gallery Picture', save: 'Save Picture', formTitle: 'Save Highlight' }}
          showLabel={false}
          showSortOrder={false}
          maxItems={6}
        />
      )}

      {activeTab === 'projects' && (
        <MinistryItemsManager
          token={token}
          ministryKey="women-of-hope"
          category="initiative"
          title="Ministry Projects"
          description="Manage current and future Women of Hope projects."
          fallbackItems={projects}
          labels={{ title: 'Project Title', description: 'Type / Category', label: 'Status', image: 'Project Image' }}
          showSortOrder={false}
        />
      )}

      {activeTab === 'events' && (
        <MinistryItemsManager
          token={token}
          ministryKey="women-of-hope"
          category="event"
          title="Upcoming & Past Events"
          description="Manage upcoming and past Women of Hope events."
          fallbackItems={events}
          labels={{ title: 'Event Title', description: 'Event Description', label: 'Date / Time', image: 'Event Picture', save: 'Save Event' }}
        />
      )}
    </div>
  );
}
