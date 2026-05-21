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

type Tab = 'info' | 'cards' | 'learning' | 'initiatives' | 'events';

const icdFallbackInfo: Omit<MinistryInfo, 'id' | 'ministryKey'> = {
  name: 'ICD',
  motto: 'Raising leaders and disciples through intentional Christian development.',
  about:
    'ICD is an intercessory and developmental ministry arm of PICC. Our goal is to move believers from being mere spectators to becoming active, effective disciples of Jesus Christ who are capable of leading and guiding others.\n\nWe provide structured modules covering biblical foundations, leadership development, and practical ministry skills. By combining sound doctrine with practical application, ICD ensures that every member is thoroughly equipped for every good work in the Kingdom.',
  heroImageUrl: '/hero/hero-icd.jpg',
  logoImageUrl: '/logos/icd-logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Partner With Us',
  partnershipBody:
    'The work of building disciples, ministering deliverance, and reaching out to our community through initiatives like our hospital visits is vast.\n\nBy partnering with the ICD Ministry financially, you ensure that we can continue bringing hope to the hopeless and life to the dying.',
  partnershipDetails: [
    { label: 'Bank', value: 'National Bank' },
    { label: 'Account Name', value: 'PICC ICD MINISTRY' },
    { label: 'Account Number', value: '1010850537' },
    { label: 'Branch', value: 'Gateway Mall' },
  ],
  partnershipImageUrl: '/images/icd/ICD-MAY-26.png',
  phone: 'Check with your local PICC branch for contact details.',
  email: 'info@picc.org',
  location: 'PICC ICD Department\nCamp of God Cathedral',
  contactIntro:
    'Whether you need counselling, deliverance, or wish to grow as an active disciple, we are here to walk alongside you.',
};

const icdCards: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Intercession',
    description:
      "Standing in the gap through fervent, strategic prayer to birth God's purposes in the church, our families, and the nations.",
  },
  {
    title: 'Counselling',
    description:
      "Providing biblical guidance, wisdom, and a listening ear to help believers navigate life's challenges with spiritual clarity.",
  },
  {
    title: 'Deliverance',
    description:
      'Ministering spiritual freedom and healing to those bound by chains, ensuring total liberty through the power of Christ.',
  },
];

const learningPictures: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Learning Experience 1', description: 'Moving believers from spectators to active disciples.', imageUrl: '/hero/hero-icd.jpg' },
  { title: 'Learning Experience 2', description: 'Structured modules covering biblical foundations.', imageUrl: '/moments/icd-1.jpg' },
  { title: 'Learning Experience 3', description: 'Leadership development and practical ministry skills.', imageUrl: '/moments/icd-2.jpg' },
  { title: 'Learning Experience 4', description: 'Intercession, Counselling, and Deliverance in action.', imageUrl: '/moments/icd-3.jpg' },
  { title: 'Learning Experience 5', description: 'Combining sound doctrine with practical application.', imageUrl: '/moments/icd-4.jpg' },
  { title: 'Learning Experience 6', description: 'Equipping every member for good works.', imageUrl: '/moments/icd-5.jpg' },
];

const initiatives: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Hospital Visitation Ministry', label: 'Current Initiative', description: 'Kamuzu Central Hospital visit and prayer outreach.', imageUrl: '/images/icd/ICD-MAY-26.png' },
  { title: 'Hospital Visitation Ministry', label: 'Upcoming Event', description: '17 May 2026', imageUrl: '/images/icd/ICD-MAY-26.png' },
  { title: 'Counselling Programs', label: 'Active', description: 'Biblical counselling and member support programs.', imageUrl: '/moments/icd-2.jpg' },
  { title: 'School of Ministry', label: 'Ongoing', description: 'Training and discipleship development pathway.', imageUrl: '/moments/icd-3.jpg' },
  { title: 'Deliverance Workshops', label: 'Upcoming', description: 'Spiritual freedom and healing workshops.', imageUrl: '/moments/icd-4.jpg' },
];

const events: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Kamuzu Central Hospital Visit',
    label: 'May 3 & 17, 2026',
    description:
      'Join us from 8:00 AM at Kamuzu Central Hospital as we visit the sick, pray for healing, and share the love and hope of Christ with Pastor Mrs Loyce Banda.',
    imageUrl: '/hero/hero-icd.jpg',
  },
  {
    title: 'Discipleship Intensive',
    label: 'January 15 - February 20, 2025',
    description:
      'A 6-week foundational course designed to root believers in the core doctrines of faith and effective Christian living.',
    imageUrl: '/hero/hero-1.jpg',
  },
  {
    title: 'Marketplace Apostles Summit',
    label: 'April 22, 2025',
    description:
      'Equipping professionals to take the principles of the Kingdom into their various spheres of influence and industry.',
    imageUrl: '/hero/hero-2.jpg',
  },
  {
    title: 'School of Ministry Graduation',
    label: 'June 30, 2025',
    description:
      'Celebrating the latest cohort of leaders who have successfully completed their intentional development modules.',
    imageUrl: '/hero/hero-3.jpg',
  },
];

export default function IcdAdminPage() {
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
    { id: 'cards', label: 'ICD Cards' },
    { id: 'learning', label: 'Learning Pictures' },
    { id: 'initiatives', label: 'Initiatives' },
    { id: 'events', label: 'Events' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">ICD Ministry Admin</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage ICD page content, images, livestream, initiatives, events, partnership details, and contact information.
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
        <MinistryInfoManager token={token} ministryKey="icd" ministryName="ICD" fallbackInfo={icdFallbackInfo} />
      )}
      {activeTab === 'cards' && (
        <MinistryItemsManager
          token={token}
          ministryKey="icd"
          category="card"
          title="ICD Cards"
          description="Create and update the cards displayed in the about section."
          fallbackItems={icdCards}
          labels={{ title: 'Card Title', description: 'Card Text', save: 'Save Card' }}
          showLabel={false}
          showSortOrder={false}
          showImage={false}
        />
      )}
      {activeTab === 'learning' && (
        <MinistryItemsManager
          token={token}
          ministryKey="icd"
          category="learning"
          title="Learning Pictures"
          description="Manage the image gallery used in the Learning Experience section."
          fallbackItems={learningPictures}
          labels={{ title: 'Image Title', description: 'Caption', image: 'Learning Image', save: 'Save', formTitle: 'Save Learning Pictures' }}
          showLabel={false}
          showSortOrder={false}
        />
      )}
      {activeTab === 'initiatives' && (
        <MinistryItemsManager
          token={token}
          ministryKey="icd"
          category="initiative"
          title="Ministry Initiatives"
          description="Manage current and future ministry initiatives."
          fallbackItems={initiatives}
          labels={{ title: 'Initiative Title', description: 'Description', label: 'Type / Status', image: 'Initiative Image' }}
          showLabel={false}
          showSortOrder={false}
        />
      )}
      {activeTab === 'events' && (
        <MinistryItemsManager
          token={token}
          ministryKey="icd"
          category="event"
          title="Upcoming Events"
          description="Manage upcoming and past ICD events."
          fallbackItems={events}
          labels={{ title: 'Event Title', description: 'Event Description', label: 'Date / Time', image: 'Event Image' }}
        />
      )}
    </div>
  );
}
