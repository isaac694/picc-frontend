'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import SiteNewsManager from '@/components/admin/SiteNewsManager';
import { MEN_OF_VALOUR_NEWS_ITEMS, MEN_OF_VALOUR_NEWS_KEY } from '@/components/menOfValourNews';
import {
  MinistryInfoManager,
  MinistryItemsManager,
  type MinistryInfo,
  type MinistryItem,
} from '@/components/admin/MinistryContentManagers';

type Tab = 'info' | 'cards' | 'brotherhood' | 'initiatives' | 'events' | 'news';

const menOfValourFallbackInfo: Omit<MinistryInfo, 'id' | 'ministryKey'> = {
  name: 'Men of Valour',
  motto: 'Leading with Faith, Courage, and Integrity.',
  about:
    'PICC Men of Valour Ministry was birthed on the premise that every man has potential to make maximum impact in life and ministry. This is inspired by Gideon in Judges 6 to 8, who emerged as a powerful leader after being called a Mighty Man of Valour by God.\n\nThe overarching objective of the ministry is to create a platform where men can be supported to break forth as mighty Men of Valour. Every man who is a member of PICC automatically becomes a member of this ministry.',
  heroImageUrl: '/hero/hero-7-mov.jpg',
  logoImageUrl: '/logos/men-of-valour-logo.png',
  liveSessionYoutubeUrl: 'https://www.youtube.com/watch?v=ydTADwZRquA',
  partnershipTitle: 'Ministry Membership & Support',
  partnershipBody:
    'Every man who is a member of PICC automatically becomes a member of PICC Men of Valour. This membership comes with a monthly subscription fee.\n\nAll members are expected to be involved in all activities initiated by the ministry, including purchasing at least one MoV branded t-shirt to be worn during related events.',
  partnershipDetails: [
    { label: 'First Capital Bank', value: 'Account Name: PICC Men of Valour, Account Number: 0004502003491' },
    { label: 'Airtel Money', value: 'Agent Code: 776628' },
  ],
  partnershipImageUrl: '/hero/hero-store.jpg',
  phone: '0999 36 36 77 (Head of Dept)\n0999 35 43 71 (Finance Lead)',
  email: 'info@picc.org',
  location: 'PICC Men of Valour\nCamp of God Cathedral',
  contactIntro:
    'Whether you are a young professional starting your career or a seasoned elder passing down wisdom, there is a place for you.',
};

const cards: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: 'Spiritual Discipline',
    description:
      'Members are totally dedicated to prayer, participating in mountain prayers, fasting programs, and remaining exemplary in conduct.',
  },
  {
    title: 'Business & Empowerment',
    description:
      'We organize quarterly business seminars and empowerment summits to assist men in having clean, multiple streams of income.',
  },
  {
    title: 'Social & Welfare',
    description:
      'We actively participate in social groups, charity works, and support members through welfare programs during sickness, weddings, and funerals.',
  },
];

const brotherhoodPictures: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Brotherhood Picture 1', description: 'Breaking forth as mighty Men of Valour in life and ministry.', imageUrl: '/hero/hero-7-mov.jpg' },
  { title: 'Brotherhood Picture 2', description: 'Total dedication through the Prayer Squad.', imageUrl: '/moments/1.jpg' },
  { title: 'Brotherhood Picture 3', description: 'Empowerment Summits and Business Workshops.', imageUrl: '/moments/2.jpg' },
  { title: 'Brotherhood Picture 4', description: 'Fellowship through social groups and networking.', imageUrl: '/moments/3.jpg' },
  { title: 'Brotherhood Picture 5', description: 'Charity works and community mobilization.', imageUrl: '/moments/4.jpg' },
  { title: 'Brotherhood Picture 6', description: 'Annual Conferences for vision and alignment.', imageUrl: '/moments/5.jpg' },
];

const initiatives: Array<Partial<MinistryItem> & { title: string }> = [
  { title: 'Monthly Empowerment Summits', label: 'Current Initiative', description: 'Ongoing', imageUrl: '/moments/1.jpg' },
  { title: 'Quarterly Business Workshops', label: 'Current Initiative', description: 'Ongoing', imageUrl: '/moments/2.jpg' },
  { title: 'MoV Social Groups', label: 'Current Initiative', description: 'Active', imageUrl: '/moments/3.jpg' },
  { title: 'Charity Works & Outreach', label: 'Welfare Project', description: 'Ongoing', imageUrl: '/moments/4.jpg' },
  { title: 'Men of Valour Conference', label: 'Annual Event', description: 'November 2026', imageUrl: '/hero/hero-2.jpg' },
];

const events: Array<Partial<MinistryItem> & { title: string }> = [
  {
    title: "Annual Men's Retreat",
    label: 'August 12-14, 2025',
    description: 'A weekend of spiritual renewal, brotherhood, and strategic planning for the year ahead at the lake.',
    imageUrl: '/ministries/mov/event-1.JPG',
  },
  {
    title: 'Leadership Breakfast Seminar',
    label: 'November 5, 2025',
    description: 'Equipping men with the tools to lead effectively in the marketplace and within their homes.',
    imageUrl: '/ministries/mov/event-2.JPG',
  },
  {
    title: 'Community Outreach Drive',
    label: 'December 18, 2025',
    description: 'Men of Valour taking to the streets of Blantyre to distribute resources and pray with the local community.',
    imageUrl: '/ministries/mov/event-1.JPG',
  },
];

export default function MenOfValourAdminPage() {
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
    { id: 'cards', label: 'Cards' },
    { id: 'brotherhood', label: 'Brotherhood Pictures' },
    { id: 'initiatives', label: 'Initiatives' },
    { id: 'events', label: 'Events' },
    { id: 'news', label: 'News' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">Men of Valour Admin</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage logo, motto, hero picture, about text, cards, brotherhood pictures,
            initiatives, events, news, membership payment details, phone number, and email.
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
          ministryKey="men-of-valour"
          ministryName="Men of Valour"
          fallbackInfo={menOfValourFallbackInfo}
          fieldLabels={{
            partnershipTitle: 'Membership Title',
            partnershipBody: 'Membership Text',
            partnershipDetails: 'Payment Details',
            partnershipImageUrl: 'Membership Picture',
          }}
        />
      )}

      {activeTab === 'cards' && (
        <MinistryItemsManager
          token={token}
          ministryKey="men-of-valour"
          category="card"
          title="Cards"
          description="Create and update the cards displayed in the about section."
          fallbackItems={cards}
          labels={{ title: 'Card Title', description: 'Card Text', save: 'Save Card' }}
          showLabel={false}
          showSortOrder={false}
          showImage={false}
        />
      )}

      {activeTab === 'brotherhood' && (
        <MinistryItemsManager
          token={token}
          ministryKey="men-of-valour"
          category="brotherhood-picture"
          title="Brotherhood in Action Pictures"
          description="Manage the pictures shown in the Brotherhood in Action section."
          fallbackItems={brotherhoodPictures}
          labels={{ title: 'Picture Title', description: 'Caption', image: 'Brotherhood Picture', save: 'Save', formTitle: 'Save Brotherhood Picture' }}
          showLabel={false}
          showSortOrder={false}
          maxItems={6}
        />
      )}

      {activeTab === 'initiatives' && (
        <MinistryItemsManager
          token={token}
          ministryKey="men-of-valour"
          category="initiative"
          title="Ministry Initiatives"
          description="Manage current and future Men of Valour initiatives."
          fallbackItems={initiatives}
          labels={{ title: 'Initiative Title', description: 'Status / Details', label: 'Type / Status', image: 'Initiative Image' }}
          showSortOrder={false}
        />
      )}

      {activeTab === 'events' && (
        <MinistryItemsManager
          token={token}
          ministryKey="men-of-valour"
          category="event"
          title="Upcoming & Past Events"
          description="Manage upcoming and past Men of Valour events."
          fallbackItems={events}
          labels={{ title: 'Event Title', description: 'Event Description', label: 'Date / Time', image: 'Event Picture', save: 'Save Event' }}
        />
      )}

      {activeTab === 'news' && (
        <SiteNewsManager
          token={token}
          contentKey={MEN_OF_VALOUR_NEWS_KEY}
          title="Men of Valour News"
          description="Manage the Latest News section shown on the public Men of Valour page."
          fallbackItems={MEN_OF_VALOUR_NEWS_ITEMS}
          imageHelpText="Use the Men of Valour news photos or upload a replacement image."
          imagePlaceholder="/ministries/mov/news-1.JPG"
          maxItems={MEN_OF_VALOUR_NEWS_ITEMS.length}
        />
      )}
    </div>
  );
}
