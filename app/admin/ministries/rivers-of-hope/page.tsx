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

type Tab = 'info' | 'programs' | 'highlights' | 'initiatives' | 'events';

const rohFallbackInfo: Omit<MinistryInfo, 'id' | 'ministryKey'> = {
  name: 'Rivers of Hope',
  motto: 'Proclaiming the Gospel of Jesus Christ with power and clarity.',
  about:
    'The Rivers of Hope Crusades are flagship evangelistic outreach programs led by Pastor Esau Banda across Malawi and internationally. These large-scale crusades are designed to proclaim the Gospel of Jesus Christ with power and clarity, reaching diverse communities through open-air gatherings and mass evangelism.\n\nCharacterized by dynamic preaching, worship, healing, and deliverance sessions, we create an environment where individuals encounter genuine spiritual transformation. Beyond evangelism, the initiative also fosters unity among churches and serves as a catalyst for community revival and discipleship.',
  heroImageUrl: '/hero/hero-1.jpg',
  logoImageUrl: '/logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Partner With The Harvest',
  partnershipBody:
    'Taking the Gospel to the masses through open-air crusades and equipping international leaders requires significant resources and dedication.\n\nWhen you partner with Rivers of Hope Crusades, you are directly contributing to soul-winning, community transformation, and raising up the next generation of spiritual leaders on campuses and in high schools.',
  partnershipDetails: [
    { label: 'Email', value: 'roh@piccworldwide.org' },
    { label: 'Office', value: 'Rivers of Hope Desk, PICC Worldwide' },
  ],
  partnershipImageUrl: '/hero/hero-1.jpg',
  phone: 'Check with your local PICC branch for contact details.',
  email: 'roh@piccworldwide.org',
  location: 'PICC Worldwide\nRivers of Hope Desk',
  contactIntro:
    'For crusade invitations, conference details, or partnership inquiries, please contact our ministry desk.',
};

const programs: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Rivers of Hope Crusades',
    description:
      'Our flagship open-air mass evangelism gatherings designed to reach diverse communities with dynamic preaching, worship, healing, and deliverance sessions.',
  },
  {
    title: 'International Leaders Conference',
    description:
      'A global platform equipping pastors and church workers across denominations with spiritual impartation, leadership training, and strategic ministry insights.',
  },
  {
    title: 'Local Leaders Conference',
    description:
      'Organized at regional and district levels, providing a contextualized platform to empower leaders with practical tools and promote unity within the Christian community.',
  },
  {
    title: 'Campus Crusade',
    description:
      'Targeting university and college students to raise spiritually grounded young leaders through evangelism, discipleship, and integrating faith with academics.',
  },
  {
    title: 'Ministry to Youth',
    description:
      'Dedicated to reaching secondary school students with the transformative message of the Gospel, guiding young people in both their spiritual journey and academic development.',
  },
];

const highlights: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Highlight 1', description: 'Mass open-air evangelism and soul-winning.', imageUrl: '/hero/hero-1.jpg' },
  { title: 'Highlight 2', description: 'Equipping global leaders for end-time harvest.', imageUrl: '/hero/hero-2.jpg' },
  { title: 'Highlight 3', description: 'Powerful moments of healing and deliverance.', imageUrl: '/hero/hero-3.jpg' },
  { title: 'Highlight 4', description: 'Campus Crusade: Empowering university students.', imageUrl: '/images/youth-church/img-4.jpg' },
  { title: 'Highlight 5', description: 'Reaching the youth with the message of hope.', imageUrl: '/images/youth-church/img-3.jpg' },
  { title: 'Highlight 6', description: 'Fostering unity among churches and ministries.', imageUrl: '/hero/hero-store.jpg' },
];

const initiatives: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Mzuzu Outreach Mobilization', label: 'Crusade Preparation', description: 'Active', imageUrl: '/hero/hero-1.jpg' },
  { title: 'Pastors Empowerment Manuals', label: 'Leadership Training', description: 'Ongoing', imageUrl: '/hero/hero-2.jpg' },
  { title: 'University Fellowship Networks', label: 'Campus Discipleship', description: 'Active', imageUrl: '/images/youth-church/img-4.jpg' },
  { title: 'Secondary School Scripture Union Support', label: 'Youth Mentorship', description: 'Ongoing', imageUrl: '/images/youth-church/img-3.jpg' },
  { title: 'Post-Crusade Discipleship Centers', label: 'Community Impact', description: 'Planning', imageUrl: '/hero/hero-store.jpg' },
];

const events: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Mzuzu Rivers of Hope Crusade',
    label: 'August 14 - 17, 2026',
    description:
      'Join Pastor Esau Banda for four days of dynamic preaching, worship, healing, and deliverance. Experience the power of the Gospel of Jesus Christ in an open-air gathering designed to bring spiritual transformation to the city.',
    imageUrl: '/hero/hero-1.jpg',
  },
  {
    title: 'Global Pastors & Leaders Summit',
    label: 'October 5 - 8, 2026',
    description:
      'A global platform equipping church leaders across denominations. Receive spiritual impartation, leadership training, and strategic ministry insights to strengthen the Body of Christ in a rapidly changing world.',
    imageUrl: '/hero/hero-2.jpg',
  },
  {
    title: 'UNIMA Campus Crusade',
    label: 'November 12 - 14, 2026',
    description:
      'Raising a generation of spiritually grounded and purpose-driven young leaders. Three days of evangelism, mentorship, and empowerment for university students to integrate faith with academic excellence.',
    imageUrl: '/images/youth-church/img-4.jpg',
  },
];

export default function RiversOfHopeAdminPage() {
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
    { id: 'programs', label: 'Programs' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'initiatives', label: 'Strategic Projects' },
    { id: 'events', label: 'Events' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Rivers of Hope Admin</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage Rivers of Hope content, outreach programs, highlights, events, and partnership details.
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
          ministryKey="rivers-of-hope" 
          ministryName="Rivers of Hope" 
          fallbackInfo={rohFallbackInfo} 
        />
      )}
      {activeTab === 'programs' && (
        <MinistryItemsManager
          token={token}
          ministryKey="rivers-of-hope"
          category="program"
          title="Outreach Programs"
          description="Manage the different programs and initiatives of the ministry."
          fallbackItems={programs}
          labels={{ title: 'Program Title', description: 'Program Description', save: 'Save Program' }}
          showLabel={false}
          showSortOrder={false}
          showImage={false}
        />
      )}
      {activeTab === 'highlights' && (
        <MinistryItemsManager
          token={token}
          ministryKey="rivers-of-hope"
          category="highlight"
          title="Outreach Highlights"
          description="Manage the image gallery showcasing crusade and conference highlights."
          fallbackItems={highlights}
          labels={{ title: 'Image Title', description: 'Caption', image: 'Highlight Image', save: 'Save' }}
          showLabel={false}
          showSortOrder={false}
        />
      )}
      {activeTab === 'initiatives' && (
        <MinistryItemsManager
          token={token}
          ministryKey="rivers-of-hope"
          category="initiative"
          title="Strategic Discipleship Projects"
          description="Manage strategic projects and discipleship initiatives."
          fallbackItems={initiatives}
          labels={{ title: 'Project Title', description: 'Status', label: 'Category', image: 'Project Image' }}
          showLabel={true}
          showSortOrder={false}
        />
      )}
      {activeTab === 'events' && (
        <MinistryItemsManager
          token={token}
          ministryKey="rivers-of-hope"
          category="event"
          title="Crusades & Conferences"
          description="Manage upcoming and past crusades and conferences."
          fallbackItems={events}
          labels={{ title: 'Event Title', description: 'Event Description', label: 'Date', image: 'Event Image' }}
        />
      )}
    </div>
  );
}
